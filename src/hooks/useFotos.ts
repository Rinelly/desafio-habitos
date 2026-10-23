import { useCallback, useEffect, useState } from 'react'
import { apagarFoto, buscarFotos, enviarFoto, gerarLinks } from '../lib/api'
import { comprimirImagem } from '../lib/imagem'
import type { Foto } from '../types'

// Links assinados valem 1h; guardamos em memória para não pedir de novo a cada tela
const linksEmCache: Record<string, string> = {}

/** Fotos das duas participantes entre "de" e "ate" (inclusive). */
export function useFotos(de: string, ate: string, userId: string) {
  const [fotos, setFotos] = useState<Foto[]>([])
  const [links, setLinks] = useState<Record<string, string>>(linksEmCache)
  const [carregadoPara, setCarregadoPara] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const chave = `${de}_${ate}`

  const completarLinks = useCallback(async (lista: Foto[]) => {
    const faltando = lista.map((f) => f.caminho).filter((c) => !linksEmCache[c])
    if (!faltando.length) return
    Object.assign(linksEmCache, await gerarLinks(faltando))
    setLinks({ ...linksEmCache })
  }, [])

  const recarregar = useCallback(async () => {
    try {
      const lista = await buscarFotos(de, ate)
      setFotos(lista)
      await completarLinks(lista)
      setErro(null)
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregadoPara(chave)
    }
  }, [de, ate, chave, completarLinks])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    recarregar()
  }, [recarregar])

  useEffect(() => {
    const aoVoltar = () => document.visibilityState === 'visible' && recarregar()
    document.addEventListener('visibilitychange', aoVoltar)
    return () => document.removeEventListener('visibilitychange', aoVoltar)
  }, [recarregar])

  const enviar = useCallback(
    async (dia: string, arquivo: File, legenda: string): Promise<boolean> => {
      setEnviando(true)
      setErro(null)
      try {
        const comprimida = await comprimirImagem(arquivo)
        const nova = await enviarFoto(dia, userId, comprimida, legenda)
        // mostra na hora usando o próprio arquivo, sem esperar o link
        linksEmCache[nova.caminho] = URL.createObjectURL(comprimida)
        setLinks({ ...linksEmCache })
        setFotos((atual) => [nova, ...atual])
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
    [userId],
  )

  const apagar = useCallback(async (foto: Foto) => {
    const anteriores = fotos
    setFotos((atual) => atual.filter((f) => f.id !== foto.id))
    try {
      await apagarFoto(foto)
    } catch (e) {
      setFotos(anteriores)
      setErro(`Não deu para apagar: ${(e as Error).message}`)
    }
  }, [fotos])

  return {
    fotos,
    links,
    carregando: carregadoPara !== chave,
    enviando,
    erro,
    enviar,
    apagar,
  }
}
