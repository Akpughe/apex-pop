# Apex Predicts — Interactive App (POC)

A real, **playable** proof-of-concept of the Apex Predicts prediction exchange, built
with **TanStack Start** (React 19 + Vite). It looks and behaves like a live betting
app, but everything is **simulated** — no accounts, no payments, no APIs, no real money.

You actually use it: enter a market, watch a crowd of simulated bettors push the odds
around in real time, place your own bet, kick off the match, and see your payout plus
the house's cut.

## Run it

```bash
cd "Apex Predicts/poc-app"
npm install        # already done if node_modules exists
npm run dev        # opens on http://localhost:3000 (or next free port)
```

Then open the printed URL (e.g. http://localhost:3000). Build for production with
`npm run build` then `npm start`.

## What you can do

- **Lobby** — pick one of three markets (NPFL, EPL, CAF Champions League).
- **Live market room:**
  - Big **live odds** tiles for each outcome, updating as money flows in.
  - A **live odds chart** showing how the "scale" moves over the betting window.
  - A **pool split** bar (YES vs NO share + naira in each pool).
  - A streaming **live bet feed** of simulated Naija bettors.
  - A **bet slip** — pick a side, set a stake, see your provisional return, place it.
- **Simulation controls** (this is the "testing" layer you only get because it's a POC):
  - **Sim speed** — fast-forward the 90-minute betting window.
  - **Crowd intensity** — how many simulated bettors arrive per second.
  - **Crowd lean** — bias the crowd toward one side.
  - **House rake** — change the platform fee live and watch the effect.
  - **Force the result** — Real result / Favourite / Upset / a specific outcome.
  - **Kick off & settle**, or **Abandon match** (void & refund).
- **Settlement overlay** — did *you* win? Your stake, your return, your net, the
  winning odds, the full pool breakdown, the house take, and a money-conservation
  proof (Σ payouts + house = total pool, to the kobo).

## How the math works (the same engine as the docs)

Parimutuel: with `P_yes`, `P_no`, total `T`, rake `r`, distributable `D = T(1−r)`:

```
If YES wins:  your payout = your_stake × (D / P_yes)
House keeps:  T × r  +  rounding dust   (never negative — the house never loses)
```

The odds shown while betting are **provisional**; the final odds lock at kickoff and
every winner is paid at the *same* final multiple regardless of when they bet. All
money is integer **kobo**; the books always balance to the kobo.

## Verified

Confirmed working in-browser (see `screenshots/`):
- `lobby.png` — the market lobby
- `market-live.png` — a live market with ~1,150 simulated bets, odds moving
- `result-overlay.png` — a settled round: **YOU WON**, net +₦3,591, house take exactly 8.0%, books balanced ✓

## Architecture

| Path | Role |
|---|---|
| `src/lib/engine.ts` | Pure parimutuel engine (pools, live odds, settlement, void rules) |
| `src/lib/useMarketSim.ts` | The live simulation hook — tick loop, simulated bettors, your bets, settlement |
| `src/lib/fixtures.ts` / `names.ts` / `rng.ts` | Mock fixtures, bettor handles, seeded RNG |
| `src/components/*` | OddsChart, PoolBar, BetSlip, BetFeed, SimControls, ResultOverlay |
| `src/routes/index.tsx` | Lobby |
| `src/routes/market.$id.tsx` | Live market room |

Pure UI + client-side simulation. The same `engine.ts` math is unit-tested in the
sibling `../poc-simulation/` project (12 tests, 635 assertions).
