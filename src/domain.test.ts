import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'
import { cloneData, emptyGame, gamesFromOrder, GAME_TEMPLATES, type OrderPlan } from './domain'

describe('cloneData', () => {
  it('creates an independent copy of match input data', () => {
    const source = reactive(GAME_TEMPLATES.map(emptyGame))
    source[0]!.entries.push({ playerId: 'player-1', stat: 72.5 })

    const copy = cloneData(source)
    copy[0]!.entries[0]!.stat = 80

    expect(source[0]!.entries[0]!.stat).toBe(72.5)
    expect(copy[0]!.entries[0]!.stat).toBe(80)
  })
})

describe('gamesFromOrder', () => {
  it('prefills players while leaving results and stats empty', () => {
    const order: OrderPlan = {
      id: 'order-1', teamId: 'team-1', opponent: 'Rivals', plannedOn: '2026-09-20',
      slots: GAME_TEMPLATES.map((template) => ({
        gameNo: template.no,
        playerIds: Array.from({ length: template.count }, (_, index) => `player-${index + 1}`),
        score: 1,
        reasons: [],
      })),
      score: 1, confidence: '高', confirmed: true, createdAt: '2026-09-01T00:00:00.000Z',
    }

    const games = gamesFromOrder(order)

    expect(games).toHaveLength(GAME_TEMPLATES.length)
    expect(games[0]).toEqual({
      gameNo: 1,
      result: 'UNKNOWN',
      entries: [
        { playerId: 'player-1', stat: null },
        { playerId: 'player-2', stat: null },
        { playerId: 'player-3', stat: null },
      ],
    })
    expect(games.every((game) => game.entries.every((entry) => entry.stat === null))).toBe(true)
  })
})
