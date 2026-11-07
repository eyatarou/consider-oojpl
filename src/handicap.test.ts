import { describe, expect, it } from 'vitest'
import { calculateHandicap } from './handicap'
import { GAME_TEMPLATES, type Player } from './domain'

const players: Player[] = [
  { id: 'a', name: 'A', rating: 8, active: true },
  { id: 'b', name: 'B', rating: 9, active: true },
  { id: 'c', name: 'C', rating: 12, active: true },
  { id: 'd', name: 'D', rating: 13, active: true },
]

describe('JAPAN LEAGUE handicap table', () => {
  it('S701のRt差2を84点として計算する', () => {
    const result = calculateHandicap(GAME_TEMPLATES[4]!, ['a'], players, 10)
    expect(result.direction).toBe('RECEIVE')
    expect(result.label).toContain('84点')
  })

  it('D501の合計Rt差3を45点として計算する', () => {
    const result = calculateHandicap(GAME_TEMPLATES[3]!, ['a', 'b'], players, 10)
    expect(result.direction).toBe('RECEIVE')
    expect(result.label).toContain('45点')
  })

  it('高い側のチームはハンデを与える', () => {
    const result = calculateHandicap(GAME_TEMPLATES[2]!, ['c', 'd'], players, 10)
    expect(result.direction).toBe('GIVE')
    expect(result.scoreAdjustment).toBeLessThan(0)
  })

  it('T-CricketのRt差2を表どおり表示する', () => {
    const result = calculateHandicap(GAME_TEMPLATES[1]!, ['a', 'b', 'c'], players, 11)
    expect(result.rtDifference).toBe(4)
    expect(result.label).toContain('18×2')
    expect(result.label).toContain('+16点')
  })

  it('G1101のRt差10を表どおり表示する', () => {
    const result = calculateHandicap(GAME_TEMPLATES[12]!, ['a', 'b', 'c', 'd'], players, 13)
    expect(result.rtDifference).toBe(10)
    expect(result.label).toContain('175点')
  })
})
