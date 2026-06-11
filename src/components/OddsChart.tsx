import type { TimelinePoint } from '../lib/useMarketSim'
import type { Outcome } from '../lib/engine'
import { outcomeColor } from '../lib/fixtures'

interface Props {
  timeline: TimelinePoint[]
  outcomes: Outcome[]
  windowMs: number
}

/** Lightweight dependency-free SVG line chart of provisional odds over time. */
export function OddsChart({ timeline, outcomes, windowMs }: Props) {
  const W = 720
  const H = 220
  const padL = 38
  const padR = 12
  const padT = 14
  const padB = 22

  // y-domain: 1.0 .. capped max finite odds seen
  let maxOdds = 2
  for (const p of timeline) {
    for (const o of outcomes) {
      const v = p.odds[o]
      if (v !== undefined && isFinite(v) && v < 40) maxOdds = Math.max(maxOdds, v)
    }
  }
  maxOdds = Math.min(Math.ceil(maxOdds + 0.5), 12)

  const x = (t: number) => padL + (Math.min(t, windowMs) / windowMs) * (W - padL - padR)
  const y = (o: number) => {
    const clamped = Math.max(1, Math.min(o, maxOdds))
    return padT + (1 - (clamped - 1) / (maxOdds - 1)) * (H - padT - padB)
  }

  const yTicks: number[] = []
  const step = maxOdds <= 4 ? 1 : 2
  for (let v = 1; v <= maxOdds; v += step) yTicks.push(v)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Odds over time">
      {/* gridlines */}
      {yTicks.map((v) => (
        <g key={v}>
          <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,0.06)" />
          <text x={6} y={y(v) + 3} fill="var(--ink-faint)" fontSize="10" fontFamily="var(--font-mono)">
            {v.toFixed(0)}×
          </text>
        </g>
      ))}

      {outcomes.map((o) => {
        const pts = timeline
          .filter((p) => isFinite(p.odds[o] ?? Infinity))
          .map((p) => `${x(p.t).toFixed(1)},${y(p.odds[o]!).toFixed(1)}`)
        if (pts.length < 2) return null
        const color = outcomeColor(o)
        const last = timeline[timeline.length - 1]
        const lastV = last?.odds[o]
        return (
          <g key={o}>
            <polyline
              points={pts.join(' ')}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={0.95}
            />
            {lastV !== undefined && isFinite(lastV) && (
              <circle cx={x(last!.t)} cy={y(lastV)} r={3.5} fill={color} />
            )}
          </g>
        )
      })}
    </svg>
  )
}
