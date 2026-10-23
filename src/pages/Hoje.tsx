import { useState, type CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useMetas } from '../hooks/useMetas'
import { useRegistrosDaSemana } from '../hooks/useRegistrosDaSemana'
import { useFotos } from '../hooks/useFotos'
import { INICIO, diaPadrao, hoje } from '../lib/desafio'
import { Carregando } from '../components/Carregando'
import { SeletorDia } from '../components/hoje/SeletorDia'
import { PainelPessoa } from '../components/hoje/PainelPessoa'
import { Visualizador } from '../components/fotos/Visualizador'
import type { Foto } from '../types'
import styles from './Hoje.module.scss'

export function Hoje() {
  const { participantes, eu } = useAuth()
  const meuId = eu!.user_id! // RotaProtegida garante que "eu" existe
  // O dia fica na URL (?dia=2026-10-25) para o Calendário poder abrir um dia específico
  const [params, setParams] = useSearchParams()
  const ultimo = diaPadrao()
  const pedido = params.get('dia')
  const dia = pedido && /^\d{4}-\d{2}-\d{2}$/.test(pedido) && pedido >= INICIO && pedido <= ultimo ? pedido : ultimo
  const setDia = (d: string) => setParams(d === ultimo ? {} : { dia: d })
  const [vendo, setVendo] = useState(eu!.email) // qual pessoa aparece no celular

  const { metas, erro: erroMetas } = useMetas()
  const { registros, carregando, erro, marcar } = useRegistrosDaSemana(dia, meuId)
  const fotosDoDia = useFotos(dia, dia, meuId)
  const [fotoAberta, setFotoAberta] = useState<Foto | null>(null)
  const nomes = Object.fromEntries(participantes.map((p) => [p.user_id ?? '', p.nome]))

  const emAndamento = dia === hoje()

  return (
    <section>
      <SeletorDia dia={dia} onMudar={setDia} />

      {/* Alternador Nelly | Anne — só aparece no celular */}
      <div className={styles.alternador} role="tablist">
        {participantes.map((p) => (
          <button
            key={p.email}
            role="tab"
            aria-selected={vendo === p.email}
            onClick={() => setVendo(p.email)}
            style={{ '--cor': p.cor } as CSSProperties}
          >
            {p === eu ? `${p.nome} (você)` : p.nome}
          </button>
        ))}
      </div>

      {(erro || erroMetas || fotosDoDia.erro) && (
        <p className={styles.erro}>{erro ?? erroMetas ?? fotosDoDia.erro}</p>
      )}

      {!metas || carregando ? (
        <Carregando />
      ) : (
        <div className={styles.colunas}>
          {participantes.map((p) => (
            <PainelPessoa
              key={p.email}
              pessoa={p}
              souEu={p === eu}
              oculto={vendo !== p.email}
              dia={dia}
              emAndamento={emAndamento}
              metas={metas}
              registros={registros.filter((r) => r.user_id === p.user_id)}
              onMarcar={(meta, status, valor) => marcar(dia, meta, status, valor ?? null)}
              fotos={fotosDoDia.fotos.filter((f) => f.user_id === p.user_id)}
              links={fotosDoDia.links}
              enviandoFoto={fotosDoDia.enviando}
              onEnviarFoto={(arquivo, legenda) => fotosDoDia.enviar(dia, arquivo, legenda)}
              onAbrirFoto={setFotoAberta}
            />
          ))}
        </div>
      )}

      {fotoAberta && (
        <Visualizador
          fotos={fotosDoDia.fotos.filter((f) => f.user_id === fotoAberta.user_id)}
          atual={fotoAberta}
          links={fotosDoDia.links}
          nomes={nomes}
          meuId={meuId}
          onTrocar={setFotoAberta}
          onFechar={() => setFotoAberta(null)}
          onApagar={fotosDoDia.apagar}
        />
      )}
    </section>
  )
}
