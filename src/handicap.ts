import type { GameTemplate, Player } from './domain'

export type HandicapDirection = 'RECEIVE' | 'GIVE' | 'NONE'

export interface HandicapResult {
  rtDifference: number
  direction: HandicapDirection
  label: string
  scoreAdjustment: number
}

const ZERO_ONE_TABLE: Record<string, Array<number | null>> = {
  S701: [null,42,84,126,168,210,252,294,336,350,350,350,350,350,350,350,350,null,null,null,null,null,null,null,null,null],
  D501: [null,15,30,45,60,75,90,105,120,135,150,165,180,195,210,225,240,250,250,250,250,250,250,250,250,250],
  D701: [null,21,42,63,84,105,126,147,168,189,210,231,252,273,294,315,336,350,350,350,350,350,350,350,350,350],
  T901: [null,14,27,42,56,69,84,98,111,126,140,153,168,182,195,210,224,237,252,266,279,294,308,321,336,350],
  G1101:[null,16,33,49,66,82,99,115,132,148,175,181,198,214,231,247,264,280,297,313,330,346,363,379,396,412],
}

const S_CRICKET = [
  null,'18×1、+8点','18×2、+16点','18×2・17×1、+24点','18×2・17×2、+32点',
  '18×2・17×2・16×1、+40点','18×2・17×2・16×2、+48点','18×2・17×2・16×2・15×1、+56点',
  '18×2・17×2・16×2・15×2、+64点','18×2・17×2・16×2・15×2、+88点','18×2・17×2・16×2・15×2、+112点',
  '18×2・17×2・16×2・15×2、+136点','18×2・17×2・16×2・15×2、+160点','18×2・17×2・16×2・15×2、+184点',
  '18×2・17×2・16×2・15×2、+208点','18×2・17×2・16×2・15×2、+232点','18×2・17×2・16×2・15×2、+256点',
]

const D_CRICKET = [
  null,'18×1','18×1、+8点','18×2、+16点','18×2、+16点','18×2・17×1、+24点','18×2・17×1、+24点',
  '18×2・17×2、+32点','18×2・17×2、+32点','18×2・17×2・16×1、+40点','18×2・17×2・16×1、+40点',
  '18×2・17×2・16×2、+48点','18×2・17×2・16×2、+48点','18×2・17×2・16×2・15×1、+56点','18×2・17×2・16×2・15×1、+56点',
  '18×2・17×2・16×2・15×2、+64点','18×2・17×2・16×2・15×2、+64点','18×2・17×2・16×2・15×2、+88点','18×2・17×2・16×2・15×2、+88点',
  '18×2・17×2・16×2・15×2、+112点','18×2・17×2・16×2・15×2、+112点','18×2・17×2・16×2・15×2、+136点',
  '18×2・17×2・16×2・15×2、+136点','18×2・17×2・16×2・15×2、+160点','18×2・17×2・16×2・15×2、+160点',
  '18×2・17×2・16×2・15×2、+184点',
]

const T_CRICKET = [
  null,null,'18×1、+8点','18×1、+8点','18×2、+16点','18×2、+16点','18×2、+16点','18×2、+16点',
  '18×2・17×1、+24点','18×2・17×1、+24点','18×2・17×1、+24点','18×2・17×1、+24点',
  '18×2・17×2、+32点','18×2・17×2、+32点','18×2・17×2、+32点','18×2・17×2・16×1、+40点',
  '18×2・17×2・16×1、+40点','18×2・17×2・16×1、+40点','18×2・17×2・16×2、+48点',
  '18×2・17×2・16×2、+48点','18×2・17×2・16×2、+48点','18×2・17×2・16×2・15×1、+56点',
  '18×2・17×2・16×2・15×1、+56点','18×2・17×2・16×2・15×1、+56点','18×2・17×2・16×2・15×2、+64点',
  '18×2・17×2・16×2・15×2、+64点',
]

const CRICKET_TABLE: Record<string, Array<string | null>> = { SCRI: S_CRICKET, DCRI: D_CRICKET, TCRI: T_CRICKET }

function tableKey(game: GameTemplate): string {
  if (game.ruleType === 'CRICKET') return `${game.count === 1 ? 'S' : game.count === 2 ? 'D' : 'T'}CRI`
  return `${game.count === 1 ? 'S' : game.count === 2 ? 'D' : game.count === 3 ? 'T' : 'G'}${game.name}`
}

export function calculateHandicap(game: GameTemplate, playerIds: string[], players: Player[], opponentAverageRating: number): HandicapResult {
  if (!opponentAverageRating || opponentAverageRating < 0) return { rtDifference: 0, direction: 'NONE', label: '相手Rt未設定', scoreAdjustment: 0 }
  const ownRating = playerIds.reduce((sum, id) => sum + (players.find((p) => p.id === id)?.rating ?? 0), 0)
  const opponentRating = opponentAverageRating * game.count
  const signedDifference = opponentRating - ownRating
  const difference = Math.min(25, Math.max(0, Math.round(Math.abs(signedDifference))))
  if (!difference) return { rtDifference: 0, direction: 'NONE', label: 'ハンデなし', scoreAdjustment: 0 }
  const direction: HandicapDirection = signedDifference > 0 ? 'RECEIVE' : 'GIVE'
  const key = tableKey(game)
  if (game.ruleType === 'ZERO_ONE') {
    const points = ZERO_ONE_TABLE[key]?.[difference] ?? null
    if (points == null) return { rtDifference: difference, direction: 'NONE', label: `Rt差${difference}：設定なし`, scoreAdjustment: 0 }
    const base = Number(game.name)
    const impact = Math.min(.18, points / base * .35)
    return { rtDifference: difference, direction, label: `Rt差${difference}：${points}点を${direction === 'RECEIVE' ? '受ける' : '与える'}`, scoreAdjustment: direction === 'RECEIVE' ? impact : -impact }
  }
  const cricket = CRICKET_TABLE[key]
  const label = cricket?.[difference] ?? null
  if (!label) return { rtDifference: difference, direction: 'NONE', label: `Rt差${difference}：設定なし`, scoreAdjustment: 0 }
  const maximumDifference = key === 'SCRI' ? 16 : 25
  const impact = Math.min(.18, difference / maximumDifference * .18)
  return { rtDifference: difference, direction, label: `Rt差${difference}：${label}を${direction === 'RECEIVE' ? '受ける' : '与える'}`, scoreAdjustment: direction === 'RECEIVE' ? impact : -impact }
}
