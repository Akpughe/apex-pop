/**
 * Parimutuel engine (browser port) — same math as the standalone POC.
 * All money is INTEGER KOBO (₦1 = 100 kobo). The house never loses:
 * it redistributes the losing pool, keeps the rake, and sweeps rounding dust.
 */

export type Outcome = string

export interface Bet {
  id: string
  userId: string
  display: string // shown name in the feed
  outcome: Outcome
  stakeKobo: number
  atMs: number
  isYou?: boolean
  oddsAtPlacement: number
}

export interface PoolState {
  outcomes: Outcome[]
  pools: Record<Outcome, number> // kobo per outcome
  rakeBps: number
  minPoolKobo: number
}

export function emptyPools(outcomes: Outcome[], rakeBps: number, minPoolKobo: number): PoolState {
  const pools: Record<Outcome, number> = {}
  for (const o of outcomes) pools[o] = 0
  return { outcomes, pools, rakeBps, minPoolKobo }
}

export function totalPool(p: PoolState): number {
  let t = 0
  for (const o of p.outcomes) t += p.pools[o] ?? 0
  return t
}

/** Live (provisional) decimal odds for an outcome: distributable / poolForOutcome. */
export function liveOdds(p: PoolState, outcome: Outcome): number {
  const pool = p.pools[outcome] ?? 0
  if (pool === 0) return Infinity
  const distributable = totalPool(p) * (1 - p.rakeBps / 10_000)
  return distributable / pool
}

export function impliedProb(p: PoolState, outcome: Outcome): number {
  const t = totalPool(p)
  return t === 0 ? 0 : (p.pools[outcome] ?? 0) / t
}

/** Add a stake to a pool (returns a new PoolState — immutable for React). */
export function addStake(p: PoolState, outcome: Outcome, stakeKobo: number): PoolState {
  return { ...p, pools: { ...p.pools, [outcome]: (p.pools[outcome] ?? 0) + stakeKobo } }
}

export type SettleStatus = 'SETTLED' | 'VOID'

export interface UserResult {
  betId: string
  userId: string
  display: string
  outcome: Outcome
  stakeKobo: number
  payoutKobo: number
  netKobo: number
  won: boolean
  isYou?: boolean
}

export interface Settlement {
  status: SettleStatus
  voidReason?: string
  winningOutcome?: Outcome
  totalPoolKobo: number
  winningPoolKobo: number
  losingPoolKobo: number
  distributableKobo: number
  rakeKobo: number
  dustKobo: number
  houseKobo: number
  winMultiple: number
  results: UserResult[]
}

function voidAll(p: PoolState, bets: Bet[], reason: string): Settlement {
  const results: UserResult[] = bets.map((b) => ({
    betId: b.id,
    userId: b.userId,
    display: b.display,
    outcome: b.outcome,
    stakeKobo: b.stakeKobo,
    payoutKobo: b.stakeKobo, // full refund
    netKobo: 0,
    won: false,
    isYou: b.isYou,
  }))
  return {
    status: 'VOID',
    voidReason: reason,
    totalPoolKobo: totalPool(p),
    winningPoolKobo: 0,
    losingPoolKobo: 0,
    distributableKobo: 0,
    rakeKobo: 0,
    dustKobo: 0,
    houseKobo: 0,
    winMultiple: 0,
    results,
  }
}

export function settle(
  p: PoolState,
  bets: Bet[],
  winningOutcome: Outcome,
  opts: { abandoned?: boolean } = {},
): Settlement {
  const t = totalPool(p)

  if (opts.abandoned) return voidAll(p, bets, 'Match abandoned / cancelled.')
  if (t < p.minPoolKobo)
    return voidAll(p, bets, `Pool ₦${(t / 100).toLocaleString()} below minimum ₦${(p.minPoolKobo / 100).toLocaleString()}.`)

  const winningPool = p.pools[winningOutcome] ?? 0
  const losingPool = t - winningPool
  if (winningPool === 0) return voidAll(p, bets, `Nobody backed "${winningOutcome}".`)
  if (losingPool === 0) return voidAll(p, bets, `Everyone was on "${winningOutcome}" — nothing to redistribute.`)

  const rake = Math.floor((t * p.rakeBps) / 10_000)
  const distributable = t - rake
  let paid = 0
  const results: UserResult[] = bets.map((b) => {
    const won = b.outcome === winningOutcome
    let payout = 0
    if (won) {
      payout = Math.floor((b.stakeKobo * distributable) / winningPool)
      paid += payout
    }
    return {
      betId: b.id,
      userId: b.userId,
      display: b.display,
      outcome: b.outcome,
      stakeKobo: b.stakeKobo,
      payoutKobo: payout,
      netKobo: payout - b.stakeKobo,
      won,
      isYou: b.isYou,
    }
  })
  const dust = distributable - paid
  return {
    status: 'SETTLED',
    winningOutcome,
    totalPoolKobo: t,
    winningPoolKobo: winningPool,
    losingPoolKobo: losingPool,
    distributableKobo: distributable,
    rakeKobo: rake,
    dustKobo: dust,
    houseKobo: rake + dust,
    winMultiple: distributable / winningPool,
    results,
  }
}

export function booksBalance(s: Settlement): boolean {
  const paid = s.results.reduce((a, r) => a + r.payoutKobo, 0)
  return paid + s.houseKobo === s.totalPoolKobo
}

// -------- money formatting helpers --------
export const naira = (kobo: number) =>
  '₦' + (kobo / 100).toLocaleString('en-NG', { maximumFractionDigits: 2 })
export const nairaWhole = (kobo: number) =>
  '₦' + Math.round(kobo / 100).toLocaleString('en-NG')
export const oddsStr = (x: number) => (x === Infinity || !isFinite(x) ? '—' : x.toFixed(2) + '×')
