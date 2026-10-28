import { useCallback, useEffect, useRef, useState } from 'react'
import { apagarFoto, buscarFotos, enviarFoto, salvarMiniatura } from '../lib/api'
import { comprimirImagem, gerarMiniatura } from '../lib/imagem'
import { linksEmCache, obterLinks, registrarPreviaLocal } from '../lib/links'
import { useDadosEmCache } from './useDadosEmCache'
import type { Foto } from '../types'

/** Fotos das duas participantes entre "de" e "ate" (inclusive). */
export function useFotos(de: string, ate: string, userId: string) {
  const buscar = useCallback(() => buscarFotos(de, ate), [de, ate])
  const { dados, erro, setErro, definir } = useDadosEmCache(`fotos:${de}_${ate}`, buscar)
  const fotos = dados ?? []
  // Nas grades usamos a miniatura; a foto grande só é pedida ao ampliar (Visualizador)
  const [links, setLinks] = useState<Record<string, string>>(() =>
    linksEmCache(fotos.map((f) => f.miniatura ?? f.caminho)),
  )
  const [enviando, setEnviando] = useState(false)

  // Garante os links das miniaturas da lista (reaproveita os que estão em cache)
  const caminhos = fotos.map((f) => f.miniatura ?? f.caminho).join('|')
  useEffect(() => {
    if (!caminhos) return
    let cancelado = false
    obterLinks(caminhos.split('|'))
      .then((l) => !cancelado && setLinks((atual) => ({ ...atual, ...l })))
      .catch(() => {})
    return () => {
      cancelado = true
    }
  }, [caminhos])

  const enviar = useCallback(
    async (dia: string, arquivo: File, legenda: string): Promise<boolean> => {
      setEnviando(true)
      setErro(null)
      try {
        const [comprimida, miniatura] = await Promise.all([comprimirImagem(arquivo), gerarMiniatura(arquivo)])
        const nova = await enviarFoto(dia, userId, comprimida, miniatura, legenda)
        // mostra na hora usando os próprios arquivos, sem esperar o link
        const previa = URL.createObjectURL(comprimida)
        registrarPreviaLocal(nova.caminho, previa)
        const novosLinks: Record<string, string> = { [nova.caminho]: previa }
        if (nova.miniatura && miniatura) {
          const previaMini = URL.createObjectURL(miniatura)
          registrarPreviaLocal(nova.miniatura, previaMini)
          novosLinks[nova.miniatura] = previaMini
        }
        setLinks((atual) => ({ ...atual, ...novosLinks }))
        definir((atual = []) => [nova, ...atual])
        return true
      } catch (e) {
        const msg = (e as Error).message
        setErro(
          msg.toLowerCase().includes('exceeded') || msg.includes('413')
            ? 'Foto muito grande (máx. 5 MB).'
            : msg.toLowerCase().includes('mime')
              ? 'Formato não aceito. Use JPG, PNG ou WEBP.'
              : `Não deu para enviar: ${msg}`,
        )
        return false
      } finally {
        setEnviando(false)
      }
    },
    [userId, definir, setErro],
  )

  const apagar = useCallback(
    async (foto: Foto) => {
      definir((atual = []) => atual.filter((f) => f.id !== foto.id))
      try {
        await apagarFoto(foto)
      } catch (e) {
        definir((atual = []) => [foto, ...atual])
        setErro(`Não deu para apagar: ${(e as Error).message}`)
      }
    },
    [definir, setErro],
  )

  // Fotos antigas (de antes das miniaturas): cada uma gera a miniatura das próprias fotos,
  // uma vez só, aproveitando a foto que a grade já baixou.
  const processadas = useRef(new Set<string>())
  const pendentes = fotos.filter(
    (f) => f.user_id === userId && !f.miniatura && links[f.caminho] && !processadas.current.has(f.id),
  )
  const chavePendentes = pendentes.map((f) => f.id).join('|')
  useEffect(() => {
    if (!chavePendentes) return
    let cancelado = false
    ;(async () => {
      for (const foto of pendentes.slice(0, 5)) {
        if (cancelado) return
        processadas.current.add(foto.id)
        try {
          const original = await fetch(links[foto.caminho]).then((r) => r.blob())
          const mini = await gerarMiniatura(original)
          if (!mini) continue
          const caminho = await salvarMiniatura(foto, mini)
          const previa = URL.createObjectURL(mini)
          registrarPreviaLocal(caminho, previa)
          setLinks((atual) => ({ ...atual, [caminho]: previa }))
          definir((atual = []) => atual.map((f) => (f.id === foto.id ? { ...f, miniatura: caminho } : f)))
        } catch (e) {
          // Sem a coluna "miniatura" no banco (script 05 não rodado): para de tentar
          if ((e as Error).message.includes('miniatura')) return
        }
      }
    })()
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chavePendentes])

  /** Atualiza o contador de comentários de uma foto (sem ir ao servidor). */
  const ajustarContagem = useCallback(
    (fotoId: string, delta: number) =>
      definir((atual = []) =>
        atual.map((f) =>
          f.id === fotoId ? { ...f, n_comentarios: Math.max(0, (f.n_comentarios ?? 0) + delta) } : f,
        ),
      ),
    [definir],
  )

  return {
    fotos,
    links,
    ajustarContagem,
    carregando: dados === undefined,
    enviando,
    erro,
    enviar,
    apagar,
  }
}
