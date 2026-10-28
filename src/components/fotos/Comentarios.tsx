import { useState, type CSSProperties, type FormEvent } from 'react'
import { useComentarios } from '../../hooks/useComentarios'
import styles from './Comentarios.module.scss'

interface Props {
  fotoId: string
  meuId: string
  nomes: Record<string, string>
  cores: Record<string, string>
  onContagem?: (delta: number) => void
}

function quando(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 60000
  if (diff < 1) return 'agora'
  if (diff < 60) return `há ${Math.floor(diff)} min`
  if (diff < 24 * 60) return `há ${Math.floor(diff / 60)} h`
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Maceio',
  }).format(new Date(iso))
}

/** Lista de comentários da foto + campo para comentar. */
export function Comentarios({ fotoId, meuId, nomes, cores, onContagem }: Props) {
  const { comentarios, carregando, erro, enviando, enviar, apagar } = useComentarios(fotoId, meuId, onContagem)
  const [texto, setTexto] = useState('')

  async function enviarForm(e: FormEvent) {
    e.preventDefault()
    if (await enviar(texto)) setTexto('')
  }

  return (
    <section className={styles.comentarios} aria-label="Comentários">
      {carregando ? (
        <p className={styles.info}>Carregando comentários…</p>
      ) : comentarios && comentarios.length > 0 ? (
        <ul>
          {comentarios.map((c) => (
            <li key={c.id} style={{ '--cor': cores[c.user_id] ?? '#6c5ce7' } as CSSProperties}>
              <div className={styles.cabeca}>
                <strong>{nomes[c.user_id] ?? 'Alguém'}</strong>
                <span>{quando(c.criado_em)}</span>
                {c.user_id === meuId && (
                  <button
                    type="button"
                    onClick={() => window.confirm('Apagar seu comentário?') && apagar(c)}
                    aria-label="Apagar comentário"
                  >
                    apagar
                  </button>
                )}
              </div>
              <p>{c.texto}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.info}>Nenhum comentário ainda. Manda um incentivo! 💜</p>
      )}

      {erro && <p className={styles.erro}>{erro}</p>}

      <form onSubmit={enviarForm} className={styles.form}>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escreva um comentário…"
          maxLength={500}
          aria-label="Escreva um comentário"
        />
        <button type="submit" disabled={enviando || !texto.trim()}>
          {enviando ? '…' : 'Enviar'}
        </button>
      </form>
    </section>
  )
}
