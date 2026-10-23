import styles from './Pagina.module.scss'

/** Placeholder para as telas que serão feitas nas próximas partes. */
export function EmBreve({ titulo, emoji, parte }: { titulo: string; emoji: string; parte: number }) {
  return (
    <section>
      <h2 className={styles.titulo}>{titulo}</h2>
      <div className={styles.cartao}>
        <p className={styles.emoji}>{emoji}</p>
        <p>Essa tela chega na Parte {parte}.</p>
      </div>
    </section>
  )
}
