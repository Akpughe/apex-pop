import type { Outcome } from './engine'

export interface Fixture {
  id: string
  league: string
  leagueShort: string
  home: string
  away: string
  homeShort: string
  awayShort: string
  kickoff: string
  question: string
  outcomes: Outcome[]
  /** crowd's natural lean toward outcomes[0] (e.g. YES / home), 0..1 */
  crowdBias: number
  /** which outcome "really" happens if you let it run to the truth */
  trueOutcome: Outcome
  accent: string
}

export const FIXTURES: Fixture[] = [
  {
    id: 'npfl-enyimba-rivers',
    league: 'Nigeria Premier Football League',
    leagueShort: 'NPFL',
    home: 'Enyimba FC',
    away: 'Rivers United',
    homeShort: 'ENY',
    awayShort: 'RIV',
    kickoff: 'Today · 18:00 WAT',
    question: 'Will Enyimba FC win?',
    outcomes: ['YES', 'NO'],
    crowdBias: 0.62,
    trueOutcome: 'YES',
    accent: '#c6f701',
  },
  {
    id: 'epl-arsenal-chelsea',
    league: 'English Premier League',
    leagueShort: 'EPL',
    home: 'Arsenal',
    away: 'Chelsea',
    homeShort: 'ARS',
    awayShort: 'CHE',
    kickoff: 'Tomorrow · 21:00 WAT',
    question: 'Will Arsenal win?',
    outcomes: ['YES', 'NO'],
    crowdBias: 0.71, // crowd loves Arsenal — but the underdog can land
    trueOutcome: 'NO',
    accent: '#ff3b5c',
  },
  {
    id: 'caf-ahly-sundowns',
    league: 'CAF Champions League',
    leagueShort: 'CAF',
    home: 'Al Ahly',
    away: 'Mamelodi Sundowns',
    homeShort: 'AHL',
    awayShort: 'SUN',
    kickoff: 'Sat · 16:00 WAT',
    question: 'Match result — Al Ahly',
    outcomes: ['WIN', 'DRAW', 'LOSS'],
    crowdBias: 0.5,
    trueOutcome: 'DRAW',
    accent: '#3bc4ff',
  },
]

export const fixtureById = (id: string) => FIXTURES.find((f) => f.id === id)

export const outcomeColor = (o: Outcome): string => {
  switch (o) {
    case 'YES':
    case 'WIN':
      return 'var(--yes)'
    case 'NO':
    case 'LOSS':
      return 'var(--no)'
    case 'DRAW':
      return 'var(--draw)'
    default:
      return 'var(--ink)'
  }
}

export const outcomeLabel = (f: Fixture, o: Outcome): string => {
  if (o === 'YES') return `${f.homeShort} WIN`
  if (o === 'NO') return `NOT ${f.homeShort}`
  if (o === 'WIN') return `${f.homeShort} WIN`
  if (o === 'LOSS') return `${f.awayShort} WIN`
  return o
}
