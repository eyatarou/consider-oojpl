import { describe, expect, it } from 'vitest'
import { aggregateStats } from './stats'
import type { MatchRecord, Player } from './domain'

const players: Player[] = [
  { id: 'a', name: 'A', rating: 10, active: true },
  { id: 'b', name: 'B', rating: 8, active: true },
]

const match: MatchRecord = {
  id: 'm', teamId: 't', playedOn: '2026-09-01', opponent: 'X', result: 'WIN', note: '', createdAt: '',
  games: [
    { gameNo: 3, result: 'WIN', entries: [{ playerId: 'a', stat: 72 }, { playerId: 'b', stat: 60 }] },
    { gameNo: 4, result: 'LOSS', entries: [{ playerId: 'a', stat: 42 }, { playerId: 'b', stat: 38 }] },
    { gameNo: 9, result: 'WIN', entries: [{ playerId: 'a', stat: 2.8 }, { playerId: 'b', stat: 2.5 }] },
  ],
}

describe('aggregateStats', () => {
  it('通常01、フリーズ501、CRを別々に集計する', () => {
    const [a] = aggregateStats(players, [match])
    expect(a?.ppr).toBe(72)
    expect(a?.freezePpr).toBe(42)
    expect(a?.mpr).toBe(2.8)
    expect(a?.games).toBe(3)
    expect(a?.wins).toBe(2)
  })
})
