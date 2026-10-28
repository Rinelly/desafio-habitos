import { useCallback, useEffect, useState } from 'react'
import { apagarComentario, buscarComentarios, comentar } from '../lib/api'
import type { Comentario } from '../types'

/** Comentários de uma foto. "onContagem" avisa a lista de fotos quando muda a quantidade. */
export function useComentarios(fotoId: string, meuId: string, onContagem?: (delta: number) => void) {
  const [estado, setEstado] = useState<{ fotoId: string; lista: Comentario[] | null }>({
    fotoId,
    lista: null,
  })
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const lista = estado.fotoId === fotoId ? estado.lista : null

  useEffect(() => {
    let cancelado = false
    buscarComentarios(fotoId)
      .then((l) => !cancelado && (setEstado({ fotoId, lista: l }), setErro(null)))
      .catch((e: Error) => {
        if (cancelado) return
        setEstado({ fotoId, lista: [] })
        setErro(
          e.message.includes('desafio_comentarios')
            ? 'Comentários ainda não ativados: rode o script supabase/04_comentarios.sql.'
            : e.message,
        )
      })
    return () => {
      cancelado = true
    }
  }, [fotoId])

  const enviar = useCallback(
    async (texto: string): Promise<boolean> => {
      if (!texto.trim()) return false
      setEnviando(true)
      try {
        const novo = await comentar(fotoId, texto)
        setEstado((e) => ({ fotoId, lista: [...(e.fotoId === fotoId ? e.lista ?? [] : []), novo] }))
        onContagem?.(1)
        setErro(null)
        return true
      } catch (e) {
        setErro(`Não deu para comentar: ${(e as Error).message}`)
        return false
      } finally {
        setEnviando(false)
      }
    },
    [fotoId, onContagem],
  )

  const apagar = useCallback(
    async (c: Comentario) => {
      if (c.user_id !== meuId) return
      setEstado((e) => ({ fotoId, lista: (e.lista ?? []).filter((x) => x.id !== c.id) }))
      onContagem?.(-1)
      try {
        await apagarComentario(c.id)
      } catch (e) {
        setEstado((s) => ({ fotoId, lista: [...(s.lista ?? []), c] }))
        onContagem?.(1)
        setErro(`Não deu para apagar: ${(e as Error).message}`)
      }
    },
    [fotoId, meuId, onContagem],
  )

  return { comentarios: lista, carregando: lista === null, erro, enviando, enviar, apagar }
}
