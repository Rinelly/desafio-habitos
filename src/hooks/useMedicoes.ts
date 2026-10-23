import { useCallback, useEffect, useState } from 'react'
import {
  apagarMedicao,
  buscarMedicoes,
  enviarFotoMedida,
  removerArquivos,
  salvarMedicao,
  type DadosMedicao,
} from '../lib/api'
import { comprimirImagem } from '../lib/imagem'
import { gravarCache, lerCache } from '../lib/cache'
import { linksEmCache, obterLinks } from '../lib/links'
import { POSES, type CampoMedida, type Pose } from '../lib/medidas'
import type { Medicao } from '../types'

/** Como cada foto deve ficar ao salvar o formulário */
export interface FotoNoForm {
  atual: string | null // caminho já salvo
  nova: File | null // arquivo escolhido agora
  remover: boolean
}

export interface FormMedicao {
  id?: string
  dia: string
  valores: Record<CampoMedida, number | null>
  observacao: string
  fotos: Record<Pose, FotoNoForm>
}

export function useMedicoes(userId: string) {
  // começa pelo cache para a tela abrir na hora
  const [medicoes, setMedicoes] = useState<Medicao[] | null>(() => lerCache<Medicao[]>('medicoes') ?? null)
  const [links, setLinks] = useState<Record<string, string>>(() =>
    linksEmCache(
      (lerCache<Medicao[]>('medicoes') ?? [])
        .flatMap((m) => POSES.map((p) => m[p.chave]))
        .filter((c): c is string => !!c),
    ),
  )
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const atualizarLinks = useCallback(async (lista: Medicao[]) => {
    const caminhos = lista.flatMap((m) => POSES.map((p) => m[p.chave])).filter((c): c is string => !!c)
    const novos = await obterLinks(caminhos)
    setLinks((atual) => ({ ...atual, ...novos }))
  }, [])

  const recarregar = useCallback(async () => {
    try {
      const lista = await buscarMedicoes()
      gravarCache('medicoes', lista)
      setMedicoes(lista)
      await atualizarLinks(lista)
      setErro(null)
    } catch (e) {
      const msg = (e as Error).message
      setErro(
        msg.includes('desafio_medicoes')
          ? 'A tabela de medidas ainda não existe: rode o script supabase/02_medidas.sql no Supabase.'
          : msg,
      )
      setMedicoes((m) => m ?? [])
    }
  }, [atualizarLinks])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    recarregar()
  }, [recarregar])

  /** Salva o formulário: sobe as fotos novas, grava a linha e limpa as fotos trocadas. */
  const salvar = useCallback(
    async (form: FormMedicao): Promise<boolean> => {
      setSalvando(true)
      setErro(null)
      const enviadas: string[] = []
      try {
        const caminhos = {} as Record<Pose, string | null>
        const descartar: string[] = []
        for (const { chave } of POSES) {
          const f = form.fotos[chave]
          if (f.nova) {
            const caminho = await enviarFotoMedida(userId, form.dia, chave, await comprimirImagem(f.nova))
            enviadas.push(caminho)
            caminhos[chave] = caminho
            if (f.atual) descartar.push(f.atual)
          } else if (f.remover) {
            caminhos[chave] = null
            if (f.atual) descartar.push(f.atual)
          } else {
            caminhos[chave] = f.atual
          }
        }

        const dados: DadosMedicao = {
          dia: form.dia,
          ...form.valores,
          ...caminhos,
          observacao: form.observacao.trim() || null,
        }
        await salvarMedicao(dados, form.id)
        await removerArquivos(descartar)
        await recarregar()
        return true
      } catch (e) {
        await removerArquivos(enviadas) // não deixa foto órfã
        const msg = (e as Error).message
        setErro(
          msg.includes('duplicate') || msg.includes('unique')
            ? 'Já existe um registro nesse dia. Edite o registro existente.'
            : msg.includes('check constraint')
              ? 'Algum valor está fora do esperado (confira vírgulas e unidades).'
              : `Não deu para salvar: ${msg}`,
        )
        return false
      } finally {
        setSalvando(false)
      }
    },
    [userId, recarregar],
  )

  const apagar = useCallback(
    async (m: Medicao) => {
      try {
        await apagarMedicao(m)
        await recarregar()
      } catch (e) {
        setErro(`Não deu para apagar: ${(e as Error).message}`)
      }
    },
    [recarregar],
  )

  return { medicoes, links, erro, salvando, salvar, apagar }
}
