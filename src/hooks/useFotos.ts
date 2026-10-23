import { useCallback, useEffect, useState } from 'react'
import { apagarFoto, buscarFotos, enviarFoto } from '../lib/api'
import { comprimirImagem } from '../lib/imagem'
import { linksEmCache, obterLinks, registrarPreviaLocal } from '../lib/links'
import { useDadosEmCache } from './useDadosEmCache'
import type { Foto } from '../types'

/** Fotos das duas participantes entre "de" e "ate" (inclusive). */
export function useFotos(de: string, ate: string, userId: string) {
  const buscar = useCallback(() => buscarFotos(de, ate), [de, ate])
  const { dados, erro, setErro, definir } = useDadosEmCache(`fotos:${de}_${ate}`, buscar)
  const fotos = dados ?? []
  const [links, setLinks] = useState<Record<string, string>>(() =>
    linksEmCache(fotos.map((f) => f.caminho)),
  )
  const [enviando, setEnviando] = useState(false)

  // Garante os links das fotos da lista (reaproveita os que estão em cache)
  const caminhos = fotos.map((f) => f.caminho).join('|')
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
        const comprimida = await comprimirImagem(arquivo)
        const nova = await enviarFoto(dia, userId, comprimida, legenda)
        // mostra na hora usando o próprio arquivo, sem esperar o link
        const previa = URL.createObjectURL(comprimida)
        registrarPreviaLocal(nova.caminho, previa)
        setLinks((atual) => ({ ...atual, [nova.caminho]: previa }))
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

  return {
    fotos,
    links,
    carregando: dados === undefined,
    enviando,
    erro,
    enviar,
    apagar,
  }
}
