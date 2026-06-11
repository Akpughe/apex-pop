import { booksBalance, naira, oddsStr, type Settlement } from '../lib/engine'
import { outcomeColor, outcomeLabel, type Fixture } from '../lib/fixtures'
import type { Bet } from '../lib/engine'

interface Props {
  settlement: Settlement
  fixture: Fixture
  yourBets: Bet[]
  onReset: () => void
}

export function ResultOverlay({ settlement: s, fixture, yourBets, onReset }: Props) {
  const yourStake = yourBets.reduce((a, b) => a + b.stakeKobo, 0)
  const yourPayout = s.results.filter((r) => r.isYou).reduce((a, r) => a + r.payoutKobo, 0)
  const yourNet = yourPayout - yourStake
  const youPlayed = yourBets.length > 0

  const voided = s.status === 'VOID'
  let banner: { text: string; color: string }
  if (voided) banner = { text: 'MARKET VOIDED — REFUNDED', color: 'var(--gold)' }
  else if (!youPlayed) banner = { text: `RESULT: ${outcomeLabel(fixture, s.winningOutcome!)}`, color: outcomeColor(s.winningOutcome!) }
  else if (yourNet > 0) banner = { text: 'YOU WON', color: 'var(--yes)' }
  else banner = { text: 'YOU LOST', color: 'var(--no)' }

  const winners = s.results.filter((r) => r.won).length
  const losers = s.results.filter((r) => !r.won && r.netKobo < 0).length

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(3,6,5,0.74)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 20,
      }}
    >
      <div className="panel rise" style={{ maxWidth: 560, width: '100%', padding: 28, borderColor: banner.color }}>
        <div className="kicker">Full-time · settlement</div>
        <div className="display" style={{ fontSize: 44, color: banner.color, margin: '6px 0 4px' }}>
          {banner.text}
        </div>

        {!voided && (
          <div className="muted" style={{ fontSize: 13, marginBottom: 18 }}>
            <span style={{ color: outcomeColor(s.winningOutcome!) }}>{outcomeLabel(fixture, s.winningOutcome!)}</span>{' '}
            came in · winning odds <b className="mono">{oddsStr(s.winMultiple)}</b> · {winners} winners, {losers} losers
          </div>
        )}
        {voided && (
          <div className="muted" style={{ fontSize: 13, marginBottom: 18 }}>{s.voidReason} Every stake refunded in full.</div>
        )}

        {/* your card */}
        {youPlayed && (
          <div className="panel" style={{ padding: 16, background: 'var(--bg-2)', marginBottom: 16 }}>
            <div className="kicker" style={{ marginBottom: 8 }}>Your ticket</div>
            <Row k="You staked" v={naira(yourStake)} />
            <Row k={voided ? 'Refunded' : 'Returned'} v={naira(yourPayout)} />
            <Row
              k="Net"
              v={(yourNet >= 0 ? '+' : '') + naira(yourNet)}
              color={yourNet > 0 ? 'var(--yes)' : yourNet < 0 ? 'var(--no)' : 'var(--ink)'}
              big
            />
          </div>
        )}

        {/* economics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <Stat label="Total pool" value={naira(s.totalPoolKobo)} />
          <Stat label="House take" value={naira(s.houseKobo)} color="var(--gold)" />
          {!voided && <Stat label="Winning pool" value={naira(s.winningPoolKobo)} />}
          {!voided && <Stat label="Paid to winners" value={naira(s.distributableKobo)} />}
        </div>

        {/* conservation */}
        <div className="mono faint" style={{ fontSize: 10.5, lineHeight: 1.5, marginBottom: 18 }}>
          Σ payouts {naira(s.results.reduce((a, r) => a + r.payoutKobo, 0))} + house {naira(s.houseKobo)} ={' '}
          {naira(s.totalPoolKobo)} &nbsp;·&nbsp; books balance: {booksBalance(s) ? '✓' : '✗'}
        </div>

        <button className="btn btn-primary" style={{ width: '100%', padding: 14 }} onClick={onReset}>
          ↻ Run another round
        </button>
      </div>
    </div>
  )
}

function Row({ k, v, color, big }: { k: string; v: string; color?: string; big?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '4px 0' }}>
      <span className="muted" style={{ fontSize: 12 }}>{k}</span>
      <span className="mono" style={{ fontSize: big ? 22 : 14, color: color ?? 'var(--ink)', fontWeight: big ? 700 : 400 }}>{v}</span>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="panel" style={{ padding: '10px 12px', background: 'var(--bg-2)' }}>
      <div className="kicker">{label}</div>
      <div className="mono" style={{ fontSize: 16, color: color ?? 'var(--ink)', marginTop: 2 }}>{value}</div>
    </div>
  )
}
