import { useEffect, useState, type FormEvent } from 'react'
import { CAMPOS, POSES, formatarNumero, lerNumero, type CampoMedida, type Pose } from '../../lib/medidas'
import type { FormMedicao, FotoNoForm } from '../../hooks/useMedicoes'
import type { Medicao } from '../../types'
import styles from './FormularioMedidas.module.scss'

interface Props {
  diaInicial: string
  existente: Medicao | null
  links: Record<string, string>
  salvando: boolean
  erro: string | null
  onSalvar: (form: FormMedicao) => Promise<boolean>
  onFechar: () => void
}

const GRUPOS = [
  { chave: 'corpo', titulo: 'Corpo' },
  { chave: 'medidas', titulo: 'Medidas (cm)' },
  { chave: 'bio', titulo: 'Bioimpedância (se tiver)' },
] as const

/** Miniatura de uma pose: mostra a foto atual/nova e permite trocar ou remover. */
function SlotFoto({
  rotulo,
  foto,
  link,
  onMudar,
}: {
  rotulo: string
  foto: FotoNoForm
  link?: string
  onMudar: (f: FotoNoForm) => void
}) {
  const [previa, setPrevia] = useState<string | null>(null)
  useEffect(() => {
    if (!foto.nova) return
    const url = URL.createObjectURL(foto.nova)
    // oxlint-disable-next-line react/set-state-in-effect
    setPrevia(url)
    return () => URL.revokeObjectURL(url)
  }, [foto.nova])

  const src = foto.nova ? previa : !foto.remover && foto.atual ? link : null

  return (
    <div className={styles.slot}>
      <label className={styles.caixaFoto}>
        {src ? <img src={src} alt={`Foto de ${rotulo}`} /> : <span>📷</span>}
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const arquivo = e.target.files?.[0]
            if (arquivo) onMudar({ ...foto, nova: arquivo, remover: false })
            e.target.value = ''
          }}
        />
      </label>
      <span className={styles.rotuloFoto}>{rotulo}</span>
      {src && (
        <button
          type="button"
          className={styles.remover}
          onClick={() => onMudar({ ...foto, nova: null, remover: true })}
        >
          remover
        </button>
      )}
    </div>
  )
}

export function FormularioMedidas({ diaInicial, existente, links, salvando, erro, onSalvar, onFechar }: Props) {
  const [dia, setDia] = useState(existente?.dia ?? diaInicial)
  const [textos, setTextos] = useState<Record<CampoMedida, string>>(
    () =>
      Object.fromEntries(
        CAMPOS.map((c) => [c.chave, existente?.[c.chave] != null ? formatarNumero(existente[c.chave], 2) : '']),
      ) as Record<CampoMedida, string>,
  )
  const [observacao, setObservacao] = useState(existente?.observacao ?? '')
  const [fotos, setFotos] = useState<Record<Pose, FotoNoForm>>(
    () =>
      Object.fromEntries(
        POSES.map((p) => [p.chave, { atual: existente?.[p.chave] ?? null, nova: null, remover: false }]),
      ) as Record<Pose, FotoNoForm>,
  )

  async function enviar(e: FormEvent) {
    e.preventDefault()
    const valores = Object.fromEntries(CAMPOS.map((c) => [c.chave, lerNumero(textos[c.chave])])) as Record<
      CampoMedida,
      number | null
    >
    const ok = await onSalvar({ id: existente?.id, dia, valores, observacao, fotos })
    if (ok) onFechar()
  }

  return (
    <div className={styles.fundo} onClick={onFechar}>
      <form className={styles.janela} onSubmit={enviar} onClick={(e) => e.stopPropagation()}>
        <header className={styles.topo}>
          <h3>{existente ? 'Editar medidas' : 'Novas medidas'}</h3>
          <button type="button" className={styles.fechar} onClick={onFechar} aria-label="Fechar">
            ✕
          </button>
        </header>

        <label className={styles.campoData}>
          Data
          <input
            type="date"
            value={dia}
            min="2026-10-16"
            max="2026-12-31"
            required
            onChange={(e) => setDia(e.target.value)}
          />
        </label>

        {GRUPOS.map((g) => (
          <fieldset key={g.chave} className={styles.grupo}>
            <legend>{g.titulo}</legend>
            <div className={styles.campos}>
              {CAMPOS.filter((c) => c.grupo === g.chave).map((c) => (
                <label key={c.chave}>
                  {c.rotulo}
                  <span className={styles.entrada}>
                    <input
                      inputMode="decimal"
                      placeholder="—"
                      value={textos[c.chave]}
                      onChange={(e) => setTextos({ ...textos, [c.chave]: e.target.value })}
                      pattern="[0-9]+([,.][0-9]+)?"
                      title="Use números, com vírgula ou ponto"
                    />
                    <small>{c.unidade}</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        <fieldset className={styles.grupo}>
          <legend>Fotos</legend>
          <div className={styles.fotos}>
            {POSES.map((p) => (
              <SlotFoto
                key={p.chave}
                rotulo={p.rotulo}
                foto={fotos[p.chave]}
                link={fotos[p.chave].atual ? links[fotos[p.chave].atual!] : undefined}
                onMudar={(f) => setFotos({ ...fotos, [p.chave]: f })}
              />
            ))}
          </div>
          <p className={styles.dica}>Dica: mesma roupa, mesmo lugar e mesma luz deixam a comparação bem melhor.</p>
        </fieldset>

        <label className={styles.obs}>
          Observação (opcional)
          <textarea
            rows={2}
            maxLength={500}
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Ex.: medido em jejum, de manhã"
          />
        </label>

        {erro && <p className={styles.erro}>{erro}</p>}

        <div className={styles.acoes}>
          <button type="button" onClick={onFechar} disabled={salvando}>
            Cancelar
          </button>
          <button type="submit" className={styles.principal} disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  )
}
