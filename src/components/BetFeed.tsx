import type { Bet } from '../lib/engine'
import { naira } from '../lib/engine'
import { outcomeColor, outcomeLabel, type Fixture } from '../lib/fixtures'

export function BetFeed({ recent, fixture }: { recent: Bet[]; fixture: Fixture }) {
  return (
    <div className="feed">
      {recent.length === 0 && (
        <div className="faint mono" style={{ fontSize: 12, padding: '12px 4px' }}>
          waiting for action…
        </div>
      )}
      {recent.map((b) => (
        <div
          key={b.id}
          className="feed-row"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '7px 8px',
            borderBottom: '1px solid var(--line-soft)',
            background: b.isYou ? 'rgba(198,247,1,0.06)' : 'transparent',
          }}
        >
          <span
            className="mono"
            style={{
              fontSize: 11,
              fontWeight: b.isYou ? 700 : 400,
              color: b.isYou ? 'var(--yes)' : 'var(--ink)',
              width: 130,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {b.isYou ? '★ YOU' : b.display}
          </span>
          <span
            className="mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.08em',
              padding: '2px 7px',
              borderRadius: 5,
              color: outcomeColor(b.outcome),
              border: `1px solid ${outcomeColor(b.outcome)}`,
              opacity: 0.9,
            }}
          >
            {outcomeLabel(fixture, b.outcome)}
          </span>
          <span className="mono muted" style={{ fontSize: 11, marginLeft: 'auto' }}>
            {naira(b.stakeKobo)}
          </span>
        </div>
      ))}
    </div>
  )
}
