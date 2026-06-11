import { useState } from 'react'
import { liveOdds, naira, oddsStr, type Bet, type Outcome, type PoolState } from '../lib/engine'
import { outcomeColor, outcomeLabel, type Fixture } from '../lib/fixtures'

interface Props {
  fixture: Fixture
  pools: PoolState
  phase: 'betting' | 'kickoff' | 'settled'
  yourBets: Bet[]
  onPlace: (o: Outcome, stakeNaira: number) => { ok: boolean; msg: string }
}

const CHIPS = [100, 500, 1000, 5000]

export function BetSlip({ fixture, pools, phase, yourBets, onPlace }: Props) {
  const [selected, setSelected] = useState<Outcome>(fixture.outcomes[0]!)
  const [stake, setStake] = useState<number>(500)
  const [msg, setMsg] = useState<string>('')

  const odds = liveOdds(pools, selected)
  const potential = isFinite(odds) ? Math.round(stake * odds) : stake
  const open = phase === 'betting'

  const place = () => {
    const r = onPlace(selected, stake)
    setMsg(r.msg)
  }

  const yourStakeOn = (o: Outcome) =>
    yourBets.filter((b) => b.outcome === o).reduce((a, b) => a + b.stakeKobo, 0)

  return (
    <div>
      <div className="kicker" style={{ marginBottom: 10 }}>Your bet slip</div>

      {/* outcome selectors */}
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: `repeat(${fixture.outcomes.length}, 1fr)` }}>
        {fixture.outcomes.map((o) => {
          const active = o === selected
          const c = outcomeColor(o)
          return (
            <button
              key={o}
              onClick={() => setSelected(o)}
              style={{
                padding: '12px 8px',
                borderRadius: 10,
                border: `1px solid ${active ? c : 'var(--line-soft)'}`,
                background: active ? `color-mix(in srgb, ${c} 14%, var(--panel))` : 'var(--panel)',
                boxShadow: active ? `0 0 18px color-mix(in srgb, ${c} 22%, transparent)` : 'none',
                transition: 'all 0.12s ease',
                textAlign: 'left',
              }}
            >
              <div className="mono" style={{ fontSize: 10, color: c, letterSpacing: '0.08em' }}>
                {outcomeLabel(fixture, o)}
              </div>
              <div className="display" style={{ fontSize: 26, color: active ? 'var(--ink)' : 'var(--ink-dim)' }}>
                {oddsStr(liveOdds(pools, o))}
              </div>
            </button>
          )
        })}
      </div>

      {/* stake input */}
      <div style={{ marginTop: 14 }}>
        <div className="kicker" style={{ marginBottom: 6 }}>Stake (₦)</div>
        <input
          className="field-num mono"
          type="number"
          min={50}
          step={50}
          value={stake}
          disabled={!open}
          onChange={(e) => setStake(Math.max(0, Number(e.target.value)))}
        />
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          {CHIPS.map((c) => (
            <button
              key={c}
              className="btn"
              style={{ flex: 1, padding: '8px 0', fontSize: 11 }}
              disabled={!open}
              onClick={() => setStake(c)}
            >
              ₦{c.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* potential return */}
      <div
        className="panel"
        style={{
          marginTop: 14,
          padding: '12px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-2)',
        }}
      >
        <div>
          <div className="kicker">Potential return*</div>
          <div className="display" style={{ fontSize: 28, color: outcomeColor(selected) }}>
            {naira(potential * 100)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="kicker">at</div>
          <div className="mono" style={{ fontSize: 18 }}>{oddsStr(odds)}</div>
        </div>
      </div>
      <div className="faint" style={{ fontSize: 10.5, marginTop: 6, lineHeight: 1.4 }}>
        *Provisional. In parimutuel the final odds are set when betting closes — your payout uses the
        <b> final pool</b>, not the odds shown now.
      </div>

      <button
        className="btn btn-primary"
        style={{ width: '100%', marginTop: 12, padding: '14px' }}
        disabled={!open || stake <= 0}
        onClick={place}
      >
        {open ? `Back ${outcomeLabel(fixture, selected)} · ₦${stake.toLocaleString()}` : 'Betting closed'}
      </button>
      {msg && <div className="mono up" style={{ fontSize: 11, marginTop: 8 }}>{msg}</div>}

      {/* your positions */}
      {yourBets.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="kicker" style={{ marginBottom: 8 }}>Your positions ({yourBets.length})</div>
          {fixture.outcomes
            .filter((o) => yourStakeOn(o) > 0)
            .map((o) => (
              <div key={o} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0' }}>
                <span className="mono" style={{ color: outcomeColor(o) }}>{outcomeLabel(fixture, o)}</span>
                <span className="mono">{naira(yourStakeOn(o))}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
