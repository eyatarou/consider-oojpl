import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { emptyGame, GAME_TEMPLATES, type MatchRecord, type OrderPlan } from './domain'
import { useAppStore } from './store'

describe('match editing', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('replaces the existing match instead of adding another history item', () => {
    const store = useAppStore()
    const original: MatchRecord = {
      id: 'match-1', teamId: store.activeTeam.id, playedOn: '2026-09-01', opponent: 'Team A',
      result: 'LOSS', games: GAME_TEMPLATES.map(emptyGame), note: '', createdAt: '2026-09-01T00:00:00.000Z',
    }
    store.addMatch(original)

    store.updateMatch({ ...original, opponent: 'Team B', result: 'WIN', note: 'updated' })

    expect(store.data.matches).toHaveLength(1)
    expect(store.data.matches[0]).toMatchObject({ id: 'match-1', opponent: 'Team B', result: 'WIN', note: 'updated' })
  })

  it('rejects an edit when the match no longer exists', () => {
    const store = useAppStore()
    expect(() => store.updateMatch({
      id: 'missing', teamId: store.activeTeam.id, playedOn: '', opponent: '', result: 'UNKNOWN',
      games: [], note: '', createdAt: '',
    })).toThrow('編集対象の試合が見つかりません。')
  })
})

describe('saved order deletion', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('removes only the selected saved order', () => {
    const store = useAppStore()
    const order = (id: string): OrderPlan => ({
      id, teamId: store.activeTeam.id, opponent: '', plannedOn: '', slots: [], score: 0,
      confidence: '低', confirmed: true, createdAt: '2026-09-01T00:00:00.000Z',
    })
    store.saveOrder(order('order-1'))
    store.saveOrder(order('order-2'))

    store.removeOrder('order-1')

    expect(store.data.orders.map((item) => item.id)).toEqual(['order-2'])
  })
})
