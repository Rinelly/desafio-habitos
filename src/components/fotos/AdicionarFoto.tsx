import { useEffect, useRef, useState, type FormEvent } from 'react'
import styles from './AdicionarFoto.module.scss'

interface Props {
  enviando: boolean
  /** devolve true se deu certo (aí fecha a janela) */
  onEnviar: (arquivo: File, legenda: string) => Promise<boolean>
}

/** Botão "Adicionar foto" + janelinha de prévia com legenda. */
export function AdicionarFoto({ enviando, onEnviar }: Props) {
  const entrada = useRef<HTMLInputElement>(null)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [previa, setPrevia] = useState<string | null>(null)
  const [legenda, setLegenda] = useState('')

  useEffect(() => {
    if (!arquivo) return
    const url = URL.createObjectURL(arquivo)
    // oxlint-disable-next-line react/set-state-in-effect
    setPrevia(url)
    return () => URL.revokeObjectURL(url)
  }, [arquivo])

  function fechar() {
    setArquivo(null)
    setPrevia(null)
    setLegenda('')
    if (entrada.current) entrada.current.value = ''
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!arquivo) return
    if (await onEnviar(arquivo, legenda)) fechar()
  }

  return (
    <>
      <button type="button" className={styles.botao} onClick={() => entrada.current?.click()}>
        <span aria-hidden>📷</span> Adicionar foto
      </button>
      <input
        ref={entrada}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
      />

      {arquivo && (
        <div className={styles.fundo} onClick={fechar}>
          <form className={styles.janela} onSubmit={enviar} onClick={(e) => e.stopPropagation()}>
            <h3>Nova foto</h3>
            {previa && <img src={previa} alt="Prévia da foto" />}
            <input
              type="text"
              placeholder="Legenda (opcional) — ex.: almoço, treino de perna…"
              maxLength={200}
              value={legenda}
              onChange={(e) => setLegenda(e.target.value)}
              autoFocus
            />
            <div className={styles.acoes}>
              <button type="button" onClick={fechar} disabled={enviando}>
                Cancelar
              </button>
              <button type="submit" className={styles.principal} disabled={enviando}>
                {enviando ? 'Enviando…' : 'Enviar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
