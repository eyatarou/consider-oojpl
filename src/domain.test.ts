import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'
import { cloneData, emptyGame, GAME_TEMPLATES } from './domain'

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
