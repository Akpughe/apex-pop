import { createFileRoute, Link } from '@tanstack/react-router'
import { FIXTURES, outcomeColor, outcomeLabel } from '../lib/fixtures'

export const Route = createFileRoute('/')({
  component: Lobby,
})

function Lobby() {
  return (
    <main className="wrap" style={{ paddingBottom: 80 }}>
      {/* hero */}
      <section style={{ padding: '54px 0 30px', maxWidth: 760 }}>
        <div className="kicker rise" style={{ marginBottom: 16 }}>Parimutuel sports exchange · Nigeria</div>
        <h1 className="display rise" style={{ fontSize: 'clamp(40px, 7vw, 78px)', animationDelay: '0.05s' }}>
          BACK YOUR CALL.<br />
          <span className="up">SPLIT THE POOL.</span>
        </h1>
        <p className="muted rise" style={{ fontSize: 17, lineHeight: 1.55, marginTop: 22, maxWidth: 600, animationDelay: '0.12s' }}>
          Pick a side on a real match. Everyone who agrees with you stakes into one pool, everyone
          who disagrees into another. When the final whistle blows, the winning side splits the
          losing side's money — and the house takes a small rake. The odds you see move live as the
          money piles in.
        </p>
        <div className="rise" style={{ display: 'flex', gap: 10, marginTop: 26, flexWrap: 'wrap', animationDelay: '0.18s' }}>
          <span className="tag">◈ Live simulation</span>
          <span className="tag">No real money</span>
          <span className="tag">House never loses</span>
          <span className="tag">Watch the odds move</span>
        </div>
      </section>

      {/* markets */}
      <section style={{ marginTop: 24 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <span className="kicker">Open markets</span>
          <span className="kicker"><span className="live-dot" /> &nbsp;3 live</span>
        </div>

        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))' }}>
          {FIXTURES.map((f, i) => (
            <Link key={f.id} to="/market/$id" params={{ id: f.id }}>
              <article
                className="panel rise"
                style={{
                  padding: 20,
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                  animationDelay: `${0.1 + i * 0.06}s`,
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: -40,
                    right: -40,
                    width: 140,
                    height: 140,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${f.accent}22, transparent 70%)`,
                  }}
                />
                <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
                  <span className="tag" style={{ color: f.accent, borderColor: `${f.accent}55` }}>{f.leagueShort}</span>
                  <span className="kicker">{f.kickoff}</span>
                </div>

                <div className="display" style={{ fontSize: 27, lineHeight: 1.05 }}>
                  {f.home}
                  <span className="faint" style={{ fontSize: 16 }}> vs </span>
                  {f.away}
                </div>
                <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>{f.question}</div>

                <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                  {f.outcomes.map((o) => (
                    <span
                      key={o}
                      className="mono"
                      style={{
                        fontSize: 10.5,
                        padding: '4px 9px',
                        borderRadius: 6,
                        color: outcomeColor(o),
                        border: `1px solid ${outcomeColor(o)}`,
                        opacity: 0.85,
                      }}
                    >
                      {outcomeLabel(f, o)}
                    </span>
                  ))}
                </div>

                <div
                  className="mono"
                  style={{
                    marginTop: 20,
                    fontSize: 11,
                    letterSpacing: '0.12em',
                    color: f.accent,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  ENTER MARKET →
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>

      <footer className="faint" style={{ marginTop: 60, fontSize: 11, lineHeight: 1.6, borderTop: '1px solid var(--line)', paddingTop: 20 }}>
        Apex Predicts — proof-of-concept simulation. All bettors, fixtures, results and money are
        fictional. No accounts, no payments, no APIs. Built to demonstrate the parimutuel mechanics.
      </footer>
    </main>
  )
}
