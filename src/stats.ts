import { GAME_TEMPLATES, type MatchRecord, type Player } from './domain'

export interface PlayerStats {
  player: Player
  games: number
  wins: number
  ppr: number | null
  mpr: number | null
  freezePpr: number | null
}

const mean = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : null

export function aggregateStats(players: Player[], matches: MatchRecord[]): PlayerStats[] {
  return players.map((player) => {
    const ppr: number[] = []
    const mpr: number[] = []
    const freezePpr: number[] = []
    let games = 0
    let wins = 0
    for (const match of matches) {
      for (const game of match.games) {
        const entry = game.entries.find((item) => item.playerId === player.id)
        if (!entry) continue
        games++
        if (game.result === 'WIN') wins++
        if (entry.stat == null) continue
        const template = GAME_TEMPLATES[game.gameNo - 1]
        if (!template) continue
        if (template.ruleType === 'CRICKET') mpr.push(entry.stat)
        else if (template.variant === 'DIDO_FREEZE') freezePpr.push(entry.stat)
        else ppr.push(entry.stat)
      }
    }
    return { player, games, wins, ppr: mean(ppr), mpr: mean(mpr), freezePpr: mean(freezePpr) }
  })
}

export const numberText = (value: number | null, digits = 2) => value == null ? '—' : value.toFixed(digits)
