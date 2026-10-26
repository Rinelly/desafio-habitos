import type { CSSProperties } from 'react'
import type { Categoria, Foto, Meta, Participante, Registro, Status } from '../../types'
import { LinhaMeta } from './LinhaMeta'
import { ContadorAgua } from './ContadorAgua'
import { Lembrete } from './Lembrete'
import { metasPontuaveis } from '../../lib/resumo'
import { GradeFotos } from '../fotos/GradeFotos'
import { AdicionarFoto } from '../fotos/AdicionarFoto'
import styles from './PainelPessoa.module.scss'

const CATEGORIAS: { chave: Categoria; titulo: string; icone: string }[] = [
  { chave: 'alimentacao', titulo: 'Alimentação', icone: '🥗' },
  { chave: 'agua', titulo: 'Hidratação', icone: '💧' },
  { chave: 'treino', titulo: 'Treino', icone: '💪' },
  { chave: 'lembrete', titulo: 'Lembretes · não contam pontos', icone: '🔔' },
]

interface Props {
  pessoa: Participante
  souEu: boolean
  oculto: boolean
  dia: string
  emAndamento: boolean
  metas: Meta[]
  /** registros desta pessoa na semana inteira */
  registros: Registro[]
  onMarcar: (meta: string, status: Status | null, valor?: number | null) => void
  /** fotos desta pessoa no dia */
  fotos: Foto[]
  links: Record<string, string>
  enviandoFoto: boolean
  onEnviarFoto: (arquivo: File, legenda: string) => Promise<boolean>
  onAbrirFoto: (foto: Foto) => void
}

export function PainelPessoa({
  pessoa,
  souEu,
  oculto,
  dia,
  emAndamento,
  metas,
  registros,
  onMarcar,
  fotos,
  links,
  enviandoFoto,
  onEnviarFoto,
  onAbrirFoto,
}: Props) {
  const doDia = new Map(registros.filter((r) => r.dia === dia).map((r) => [r.meta, r]))
  // o anel conta só as metas do placar (lembretes ficam de fora)
  const pontuaveis = metasPontuaveis(metas)
  const cumpridas = pontuaveis.filter((m) => doDia.get(m.chave)?.status === 'cumpriu').length
  const pct = pontuaveis.length ? Math.round((cumpridas / pontuaveis.length) * 100) : 0

  function detalheSemanal(m: Meta): string | undefined {
    if (m.frequencia !== 'semanal' || !m.meta_semanal) return undefined
    const feitos = registros.filter((r) => r.meta === m.chave && r.status === 'cumpriu').length
    return feitos >= m.meta_semanal
      ? `Semana: ${feitos}/${m.meta_semanal} 🎉 meta batida`
      : `Semana: ${feitos}/${m.meta_semanal} treinos`
  }

  return (
    <section
      className={styles.painel}
      data-oculto={oculto}
      style={{ '--cor': pessoa.cor } as CSSProperties}
      aria-label={`Metas de ${pessoa.nome}`}
    >
      <header className={styles.cabecalho}>
        <div>
          <h3>{pessoa.nome}</h3>
          <p>{souEu ? 'Você' : pessoa.user_id ? 'Só visualização' : 'Ainda não entrou no app'}</p>
        </div>
        <div className={styles.placar} aria-label={`${cumpridas} de ${pontuaveis.length} metas cumpridas`}>
          <strong>
            {cumpridas}/{pontuaveis.length}
          </strong>
          <div className={styles.anel} style={{ '--pct': `${pct}%` } as CSSProperties} />
        </div>
      </header>

      {CATEGORIAS.map((cat) => {
        const daCategoria = metas.filter((m) => m.categoria === cat.chave)
        if (!daCategoria.length) return null
        return (
          <div key={cat.chave} className={styles.grupo}>
            <h4>
              <span aria-hidden>{cat.icone}</span> {cat.titulo}
            </h4>
            {daCategoria.map((m) =>
              m.categoria === 'lembrete' ? (
                <Lembrete
                  key={m.chave}
                  titulo={m.titulo}
                  feito={doDia.get(m.chave)?.status === 'cumpriu'}
                  editavel={souEu}
                  onAlternar={(feito) => onMarcar(m.chave, feito ? 'cumpriu' : null)}
                />
              ) : m.tipo === 'quantidade' ? (
                <ContadorAgua
                  key={`${m.chave}-${dia}`}
                  litros={doDia.get(m.chave)?.valor ?? 0}
                  alvo={m.alvo ?? 3}
                  editavel={souEu}
                  emAndamento={emAndamento}
                  onSalvar={(l) =>
                    l <= 0
                      ? onMarcar(m.chave, null)
                      : onMarcar(m.chave, l >= (m.alvo ?? 3) ? 'cumpriu' : 'falhou', l)
                  }
                />
              ) : (
                <LinhaMeta
                  key={m.chave}
                  titulo={m.titulo}
                  detalhe={detalheSemanal(m)}
                  status={doDia.get(m.chave)?.status ?? null}
                  editavel={souEu}
                  onMarcar={(s) => onMarcar(m.chave, s)}
                />
              ),
            )}
          </div>
        )
      })}

      <div className={styles.grupo}>
        <h4>
          <span aria-hidden>📸</span> Fotos do dia
        </h4>
        {fotos.length > 0 && <GradeFotos fotos={fotos} links={links} onAbrir={onAbrirFoto} />}
        {souEu ? (
          <AdicionarFoto enviando={enviandoFoto} onEnviar={onEnviarFoto} />
        ) : (
          fotos.length === 0 && <p className={styles.vazio}>Nenhuma foto neste dia.</p>
        )}
      </div>
    </section>
  )
}
