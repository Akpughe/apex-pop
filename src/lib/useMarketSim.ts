import { useCallback, useEffect, useRef, useState } from 'react'
import {
  addStake,
  emptyPools,
  liveOdds,
  settle,
  totalPool,
  type Bet,
  type Outcome,
  type PoolState,
  type Settlement,
} from './engine'
import type { Fixture } from './fixtures'
import { mulberry32, weighted } from './rng'
import { HANDLES } from './names'

export type WinnerMode = 'TRUE' | 'FAVOURITE' | 'UNDERDOG' | Outcome

export interface SimConfig {
  speed: number // sim-time multiplier
  intensity: number // simulated bettors per sim-second
  crowdBias: number // share to outcomes[0] for binary markets (0..1)
  winnerMode: WinnerMode
  rakeBps: number
}

export type Phase = 'betting' | 'kickoff' | 'settled'

export interface TimelinePoint {
  t: number
  odds: Record<Outcome, number>
  total: number
}

export interface SimView {
  phase: Phase
  clockMs: number
  windowMs: number
  pools: PoolState
  total: number
  betCount: number
  recent: Bet[]
  timeline: TimelinePoint[]
  settlement: Settlement | null
  yourBets: Bet[]
}

const WINDOW_MS = 90 * 60 * 1000 // 90 "match-prep" minutes of sim time
const KICKOFF_HOLD_MS = 1600
const TICK_MS = 110
const STAKE_TIERS = [100, 200, 500, 1000, 2000, 5000, 20000]
const STAKE_WEIGHTS = [30, 25, 20, 12, 7, 4, 2]

function resolveWinner(pools: PoolState, fixture: Fixture, mode: WinnerMode): Outcome {
  if (mode === 'TRUE') return fixture.trueOutcome
  if (mode === 'FAVOURITE' || mode === 'UNDERDOG') {
    const entries = fixture.outcomes.map((o) => [o, pools.pools[o] ?? 0] as const)
    const withMoney = entries.filter(([, v]) => v > 0)
    const pool = withMoney.length ? withMoney : entries
    pool.sort((a, b) => a[1] - b[1])
    return mode === 'UNDERDOG' ? pool[0]![0] : pool[pool.length - 1]![0]
  }
  return mode
}

export function useMarketSim(fixture: Fixture) {
  const initialPools = emptyPools(fixture.outcomes, 800, 5_000_00)

  const [config, setConfigState] = useState<SimConfig>({
    speed: 12,
    intensity: 2.2,
    crowdBias: fixture.crowdBias,
    winnerMode: 'TRUE',
    rakeBps: 800,
  })

  const [view, setView] = useState<SimView>({
    phase: 'betting',
    clockMs: 0,
    windowMs: WINDOW_MS,
    pools: initialPools,
    total: 0,
    betCount: 0,
    recent: [],
    timeline: [],
    settlement: null,
    yourBets: [],
  })

  // Mutable simulation state (kept in refs so the tick loop is cheap).
  const poolsRef = useRef<PoolState>(initialPools)
  const betsRef = useRef<Bet[]>([])
  const yoursRef = useRef<Bet[]>([])
  const recentRef = useRef<Bet[]>([])
  const timelineRef = useRef<TimelinePoint[]>([])
  const clockRef = useRef(0)
  const phaseRef = useRef<Phase>('betting')
  const lastSnapRef = useRef(0)
  const seqRef = useRef(0)
  const rngRef = useRef<() => number>(() => Math.random())
  const cfgRef = useRef(config)
  const abandonRef = useRef(false)
  const fixtureRef = useRef(fixture)

  useEffect(() => {
    cfgRef.current = config
    // keep rake live on the pool
    poolsRef.current = { ...poolsRef.current, rakeBps: config.rakeBps }
  }, [config])

  const snapshotOdds = (): Record<Outcome, number> => {
    const o: Record<Outcome, number> = {}
    for (const out of fixtureRef.current.outcomes) o[out] = liveOdds(poolsRef.current, out)
    return o
  }

  const flush = useCallback((phase: Phase, settlement: Settlement | null = null) => {
    setView({
      phase,
      clockMs: clockRef.current,
      windowMs: WINDOW_MS,
      pools: poolsRef.current,
      total: totalPool(poolsRef.current),
      betCount: betsRef.current.length,
      recent: recentRef.current.slice(-32).reverse(),
      timeline: timelineRef.current,
      settlement,
      yourBets: yoursRef.current.slice(),
    })
  }, [])

  const doSettle = useCallback(() => {
    const f = fixtureRef.current
    const winner = resolveWinner(poolsRef.current, f, cfgRef.current.winnerMode)
    const s = settle(poolsRef.current, betsRef.current, winner, { abandoned: abandonRef.current })
    phaseRef.current = 'settled'
    flush('settled', s)
  }, [flush])

  // Main tick loop (client only).
  useEffect(() => {
    rngRef.current = mulberry32((Date.now() & 0xffffffff) >>> 0)
    let raf = 0
    let acc = 0
    let last = performance.now()

    const id = window.setInterval(() => {
      if (phaseRef.current === 'settled') return
      const now = performance.now()
      const dtReal = now - last
      last = now
      const cfg = cfgRef.current
      const dtSim = dtReal * cfg.speed
      clockRef.current = Math.min(clockRef.current + dtSim, WINDOW_MS + KICKOFF_HOLD_MS)

      // Phase transitions around kickoff.
      if (phaseRef.current === 'betting' && clockRef.current >= WINDOW_MS) {
        phaseRef.current = 'kickoff'
      }
      if (phaseRef.current === 'kickoff' && clockRef.current >= WINDOW_MS + KICKOFF_HOLD_MS) {
        doSettle()
        return
      }

      // Spawn simulated bettors only while betting is open.
      if (phaseRef.current === 'betting') {
        const rng = rngRef.current
        const f = fixtureRef.current
        const expected = cfg.intensity * (dtSim / 1000)
        let n = Math.floor(expected)
        if (rng() < expected - n) n += 1
        n = Math.min(n, 30)
        for (let i = 0; i < n; i++) {
          let outcome: Outcome
          if (f.outcomes.length === 2) {
            outcome = rng() < cfg.crowdBias ? f.outcomes[0]! : f.outcomes[1]!
          } else {
            outcome = weighted(rng, f.outcomes, [45, 25, 30])
          }
          const tier = weighted(rng, STAKE_TIERS, STAKE_WEIGHTS)
          const stakeKobo = Math.max(50, Math.round(tier * (0.5 + rng()))) * 100
          poolsRef.current = addStake(poolsRef.current, outcome, stakeKobo)
          const bet: Bet = {
            id: 'b' + ++seqRef.current,
            userId: 'sim' + seqRef.current,
            display: HANDLES[Math.floor(rng() * HANDLES.length)]!,
            outcome,
            stakeKobo,
            atMs: clockRef.current,
            oddsAtPlacement: liveOdds(poolsRef.current, outcome),
          }
          betsRef.current.push(bet)
          recentRef.current.push(bet)
        }
      }

      // Timeline sampling (~throttled).
      if (clockRef.current - lastSnapRef.current > WINDOW_MS / 90 || phaseRef.current !== 'betting') {
        lastSnapRef.current = clockRef.current
        timelineRef.current = [
          ...timelineRef.current,
          { t: clockRef.current, odds: snapshotOdds(), total: totalPool(poolsRef.current) },
        ].slice(-140)
      }

      flush(phaseRef.current)
    }, TICK_MS)

    return () => {
      window.clearInterval(id)
      cancelAnimationFrame(raf)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- user actions ----
  const placeBet = useCallback(
    (outcome: Outcome, stakeNaira: number) => {
      if (phaseRef.current !== 'betting') return { ok: false, msg: 'Betting is closed.' }
      const kobo = Math.round(stakeNaira) * 100
      if (!Number.isFinite(kobo) || kobo <= 0) return { ok: false, msg: 'Enter a stake.' }
      poolsRef.current = addStake(poolsRef.current, outcome, kobo)
      const bet: Bet = {
        id: 'you' + ++seqRef.current,
        userId: 'you',
        display: 'YOU',
        outcome,
        stakeKobo: kobo,
        atMs: clockRef.current,
        isYou: true,
        oddsAtPlacement: liveOdds(poolsRef.current, outcome),
      }
      betsRef.current.push(bet)
      yoursRef.current.push(bet)
      recentRef.current.push(bet)
      flush(phaseRef.current)
      return { ok: true, msg: `Bet placed: ₦${stakeNaira.toLocaleString()} on ${outcome}` }
    },
    [flush],
  )

  const kickoffNow = useCallback(() => {
    if (phaseRef.current === 'settled') return
    clockRef.current = WINDOW_MS
    phaseRef.current = 'kickoff'
    flush('kickoff')
  }, [flush])

  const abandonMatch = useCallback(() => {
    abandonRef.current = true
    doSettle()
  }, [doSettle])

  const reset = useCallback(() => {
    poolsRef.current = emptyPools(fixtureRef.current.outcomes, cfgRef.current.rakeBps, 5_000_00)
    betsRef.current = []
    yoursRef.current = []
    recentRef.current = []
    timelineRef.current = []
    clockRef.current = 0
    lastSnapRef.current = 0
    seqRef.current = 0
    abandonRef.current = false
    phaseRef.current = 'betting'
    flush('betting')
  }, [flush])

  const setConfig = useCallback((patch: Partial<SimConfig>) => {
    setConfigState((c) => ({ ...c, ...patch }))
  }, [])

  return { view, config, setConfig, placeBet, kickoffNow, abandonMatch, reset }
}
