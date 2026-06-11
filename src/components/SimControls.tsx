import type { SimConfig, WinnerMode } from '../lib/useMarketSim'
import { outcomeLabel, type Fixture } from '../lib/fixtures'

interface Props {
  fixture: Fixture
  config: SimConfig
  phase: 'betting' | 'kickoff' | 'settled'
  setConfig: (p: Partial<SimConfig>) => void
  onKickoff: () => void
  onAbandon: () => void
  onReset: () => void
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  fmt,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  fmt: (v: number) => string
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span className="kicker">{label}</span>
        <span className="mono" style={{ fontSize: 12 }}>{fmt(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  )
}

export function SimControls({ fixture, config, phase, setConfig, onKickoff, onAbandon, onReset }: Props) {
  const winnerOptions: { v: WinnerMode; label: string }[] = [
    { v: 'TRUE', label: 'Real result' },
    { v: 'FAVOURITE', label: 'Favourite' },
    { v: 'UNDERDOG', label: 'Upset' },
    ...fixture.outcomes.map((o) => ({ v: o as WinnerMode, label: outcomeLabel(fixture, o) })),
  ]

  return (
    <div>
      <div className="kicker" style={{ marginBottom: 12 }}>◈ Simulation controls</div>

      <Slider label="Sim speed" value={config.speed} min={1} max={40} step={1} onChange={(v) => setConfig({ speed: v })} fmt={(v) => `${v}×`} />
      <Slider label="Crowd intensity" value={config.intensity} min={0} max={8} step={0.2} onChange={(v) => setConfig({ intensity: v })} fmt={(v) => `${v.toFixed(1)}/s`} />
      {fixture.outcomes.length === 2 && (
        <Slider
          label={`Crowd lean → ${outcomeLabel(fixture, fixture.outcomes[0]!)}`}
          value={config.crowdBias}
          min={0.1}
          max={0.9}
          step={0.01}
          onChange={(v) => setConfig({ crowdBias: v })}
          fmt={(v) => `${(v * 100).toFixed(0)}%`}
        />
      )}
      <Slider label="House rake" value={config.rakeBps} min={0} max={1500} step={50} onChange={(v) => setConfig({ rakeBps: v })} fmt={(v) => `${(v / 100).toFixed(1)}%`} />

      <div style={{ marginBottom: 16 }}>
        <div className="kicker" style={{ marginBottom: 8 }}>Force the result</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {winnerOptions.map((opt) => {
            const active = config.winnerMode === opt.v
            return (
              <button
                key={String(opt.v)}
                className="btn"
                style={{
                  padding: '7px 10px',
                  fontSize: 10.5,
                  borderColor: active ? 'var(--yes)' : 'var(--line-soft)',
                  background: active ? 'rgba(198,247,1,0.12)' : 'var(--panel-2)',
                  color: active ? 'var(--yes)' : 'var(--ink-dim)',
                }}
                onClick={() => setConfig({ winnerMode: opt.v })}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {phase !== 'settled' ? (
          <>
            <button className="btn btn-primary" onClick={onKickoff} disabled={phase === 'kickoff'}>
              ⚽ Kick off &amp; settle now
            </button>
            <button className="btn" style={{ borderColor: 'rgba(255,59,92,0.4)', color: 'var(--no)' }} onClick={onAbandon}>
              ✕ Abandon match (void &amp; refund)
            </button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={onReset}>↻ New round</button>
        )}
      </div>
    </div>
  )
}
