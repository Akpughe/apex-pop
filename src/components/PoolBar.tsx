import { naira, type PoolState, type Outcome, totalPool } from '../lib/engine'
import { outcomeColor } from '../lib/fixtures'

export function PoolBar({ pools }: { pools: PoolState }) {
  const total = totalPool(pools)
  return (
    <div>
      <div
        style={{
          display: 'flex',
          height: 18,
          borderRadius: 6,
          overflow: 'hidden',
          border: '1px solid var(--line-soft)',
          background: 'var(--bg-2)',
        }}
      >
        {pools.outcomes.map((o: Outcome) => {
          const share = total === 0 ? 0 : (pools.pools[o] ?? 0) / total
          return (
            <div
              key={o}
              style={{
                width: `${share * 100}%`,
                background: outcomeColor(o),
                transition: 'width 0.3s ease',
                opacity: 0.85,
              }}
              title={`${o}: ${(share * 100).toFixed(1)}%`}
            />
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        {pools.outcomes.map((o) => {
          const share = total === 0 ? 0 : (pools.pools[o] ?? 0) / total
          return (
            <div key={o} className="mono" style={{ fontSize: 11 }}>
              <span style={{ color: outcomeColor(o) }}>● </span>
              <span className="muted">{o} </span>
              <span>{(share * 100).toFixed(1)}%</span>
              <span className="faint"> · {naira(pools.pools[o] ?? 0)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
