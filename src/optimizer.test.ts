import { describe, expect, it } from 'vitest'
import { optimizeOrders } from './optimizer'
import type { Player } from './domain'

const players: Player[] = ['A', 'B', 'C', 'D'].map((name, i) => ({ id: name, name, rating: 12 - i, active: true }))

describe('optimizeOrders', () => {
  it('13ゲームを最大7回の制約内で構成する', () => {
    const orders = optimizeOrders({ teamId: 't', players, matches: [], participantIds: players.map(p => p.id), maxAppearances: Object.fromEntries(players.map(p => [p.id, 7])), opponent: '', opponentAverageRating: 10, plannedOn: '', fairness: .25 })
    expect(orders[0]?.slots).toHaveLength(13)
    const ids = orders[0]!.slots.flatMap(slot => slot.playerIds)
    for (const player of players) expect(ids.filter(id => id === player.id)).toHaveLength(7)
    orders[0]!.slots.forEach(slot => expect(new Set(slot.playerIds).size).toBe(slot.playerIds.length))
  })

  it('成立しない出場上限を拒否する', () => {
    expect(() => optimizeOrders({ teamId: 't', players, matches: [], participantIds: players.map(p => p.id), maxAppearances: Object.fromEntries(players.map(p => [p.id, 6])), opponent: '', opponentAverageRating: 10, plannedOn: '', fairness: 0 })).toThrow(/上限/)
  })
})
