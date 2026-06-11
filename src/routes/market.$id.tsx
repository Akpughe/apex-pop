import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { fixtureById, outcomeColor, outcomeLabel } from '../lib/fixtures'
import { useMarketSim } from '../lib/useMarketSim'
import { impliedProb, liveOdds, naira, nairaWhole, oddsStr } from '../lib/engine'
import { OddsChart } from '../components/OddsChart'
import { PoolBar } from '../components/PoolBar'
import { BetSlip } from '../components/BetSlip'
import { BetFeed } from '../components/BetFeed'
import { SimControls } from '../components/SimControls'
import { ResultOverlay } from '../components/ResultOverlay'

export const Route = createFileRoute('/market/$id')({
  loader: ({ params }) => {
    const fixture = fixtureById(params.id)
    if (!fixture) throw notFound()
    return { fixture }
  },
  component: MarketRoom,
  notFoundComponent: () => (
    <main className="wrap" style={{ padding: 60 }}>
      <h1 className="display" style={{ fontSize: 40 }}>Market not found</h1>
      <Link to="/" className="btn" style={{ display: 'inline-block', marginTop: 20 }}>← Back to lobby</Link>
    </main>
  ),
})

function clockLabel(clockMs: number, windowMs: number, phase: string): string {
  if (phase !== 'betting') return 'KICK OFF'
  const remainMin = Math.max(0, Math.ceil((windowMs - clockMs) / 60000))
  return `T‑${remainMin}′ to kickoff`
}

function MarketRoom() {
  const { fixture } = Route.useLoaderData()
  const { view, config, setConfig, placeBet, kickoffNow, abandonMatch, reset } = useMarketSim(fixture)
  const progress = Math.min(1, view.clockMs / view.windowMs)

  return (
    <main className="wrap" style={{ paddingBottom: 60 }}>
      {/* match header */}
      <div className="flex items-center gap-3" style={{ padding: '18px 0 10px' }}>
        <Link to="/" className="mono faint" style={{ fontSize: 12 }}>← LOBBY</Link>
        <span className="tag" style={{ color: fixture.accent, borderColor: `${fixture.accent}55` }}>{fixture.leagueShort}</span>
        <span className="kicker">{fixture.league}</span>
      </div>

      <div className="panel" style={{ padding: '20px 24px', marginBottom: 16 }}>
        <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="display" style={{ fontSize: 'clamp(26px,4vw,40px)' }}>
              {fixture.home} <span className="faint" style={{ fontSize: 18 }}>vs</span> {fixture.away}
            </div>
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{fixture.question}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="mono" style={{ fontSize: 13, color: view.phase === 'betting' ? 'var(--no)' : 'var(--gold)' }}>
              {view.phase === 'betting' && <span className="live-dot" />} &nbsp;{clockLabel(view.clockMs, view.windowMs, view.phase)}
            </div>
            <div className="mono faint" style={{ fontSize: 11, marginTop: 4 }}>
              {nairaWhole(view.total)} pooled · {view.betCount} bets
            </div>
          </div>
        </div>
        {/* kickoff progress */}
        <div style={{ height: 3, background: 'var(--bg-2)', borderRadius: 2, marginTop: 16, overflow: 'hidden' }}>
          <div style={{ width: `${progress * 100}%`, height: '100%', background: fixture.accent, transition: 'width 0.2s linear' }} />
        </div>
      </div>

      {/* main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.7fr) minmax(320px, 1fr)', gap: 16, alignItems: 'start' }}>
        {/* LEFT */}
        <div style={{ display: 'grid', gap: 16 }}>
          {/* odds tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${fixture.outcomes.length}, 1fr)`, gap: 12 }}>
            {fixture.outcomes.map((o) => {
              const c = outcomeColor(o)
              return (
                <div key={o} className="panel" style={{ padding: 16, borderColor: `${c}33` }}>
                  <div className="mono" style={{ fontSize: 10.5, color: c, letterSpacing: '0.1em' }}>{outcomeLabel(fixture, o)}</div>
                  <div className="display" style={{ fontSize: 'clamp(30px,5vw,46px)', marginTop: 4 }}>{oddsStr(liveOdds(view.pools, o))}</div>
                  <div className="mono faint" style={{ fontSize: 11, marginTop: 2 }}>
                    {(impliedProb(view.pools, o) * 100).toFixed(0)}% implied · {naira(view.pools.pools[o] ?? 0)}
                  </div>
                </div>
              )
            })}
          </div>

          {/* chart */}
          <div className="panel" style={{ padding: '16px 14px 10px' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 6, padding: '0 4px' }}>
              <span className="kicker">Live odds — how the scale moves</span>
              <span className="kicker">{fixture.outcomes.map((o) => (
                <span key={o} style={{ color: outcomeColor(o), marginLeft: 10 }}>● {outcomeLabel(fixture, o)}</span>
              ))}</span>
            </div>
            <OddsChart timeline={view.timeline} outcomes={fixture.outcomes} windowMs={view.windowMs} />
          </div>

          {/* pools */}
          <div className="panel" style={{ padding: 18 }}>
            <div className="kicker" style={{ marginBottom: 12 }}>Pool split at this moment</div>
            <PoolBar pools={view.pools} />
          </div>

          {/* feed */}
          <div className="panel" style={{ padding: 18 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
              <span className="kicker">Live bet feed</span>
              <span className="kicker"><span className="live-dot" /> &nbsp;streaming</span>
            </div>
            <BetFeed recent={view.recent} fixture={fixture} />
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'grid', gap: 16, position: 'sticky', top: 16 }}>
          <div className="panel" style={{ padding: 18 }}>
            <BetSlip fixture={fixture} pools={view.pools} phase={view.phase} yourBets={view.yourBets} onPlace={placeBet} />
          </div>
          <div className="panel" style={{ padding: 18 }}>
            <SimControls
              fixture={fixture}
              config={config}
              phase={view.phase}
              setConfig={setConfig}
              onKickoff={kickoffNow}
              onAbandon={abandonMatch}
              onReset={reset}
            />
          </div>
        </div>
      </div>

      {view.phase === 'settled' && view.settlement && (
        <ResultOverlay settlement={view.settlement} fixture={fixture} yourBets={view.yourBets} onReset={reset} />
      )}
    </main>
  )
}
