export type RuleType = 'ZERO_ONE' | 'CRICKET'
export type GameResultValue = 'WIN' | 'LOSS' | 'DRAW' | 'UNKNOWN'

export interface GameTemplate {
  no: number
  name: string
  ruleType: RuleType
  count: number
  format: string
  variant: 'STANDARD' | 'DIDO_FREEZE'
}

export interface Player {
  id: string
  name: string
  rating: number
  active: boolean
}

export interface Team {
  id: string
  name: string
  players: Player[]
}

export interface GameEntry {
  playerId: string
  stat: number | null
}

export interface GameRecord {
  gameNo: number
  result: GameResultValue
  entries: GameEntry[]
}

export interface MatchRecord {
  id: string
  teamId: string
  playedOn: string
  opponent: string
  result: GameResultValue
  games: GameRecord[]
  note: string
  createdAt: string
}

export interface OrderSlot {
  gameNo: number
  playerIds: string[]
  score: number
  reasons: string[]
}

export interface OrderPlan {
  id: string
  teamId: string
  opponent: string
  plannedOn: string
  slots: OrderSlot[]
  score: number
  confidence: '低' | '中' | '高'
  confirmed: boolean
  createdAt: string
}

export interface AppData {
  schemaVersion: number
  activeTeamId: string
  teams: Team[]
  matches: MatchRecord[]
  orders: OrderPlan[]
}

export const GAME_TEMPLATES: GameTemplate[] = [
  { no: 1, name: '901', ruleType: 'ZERO_ONE', count: 3, format: '3vs3', variant: 'STANDARD' },
  { no: 2, name: 'CR', ruleType: 'CRICKET', count: 3, format: '3vs3', variant: 'STANDARD' },
  { no: 3, name: '701', ruleType: 'ZERO_ONE', count: 2, format: '2vs2', variant: 'STANDARD' },
  { no: 4, name: '501', ruleType: 'ZERO_ONE', count: 2, format: '2vs2', variant: 'DIDO_FREEZE' },
  { no: 5, name: '701', ruleType: 'ZERO_ONE', count: 1, format: '1vs1', variant: 'STANDARD' },
  { no: 6, name: 'CR', ruleType: 'CRICKET', count: 1, format: '1vs1', variant: 'STANDARD' },
  { no: 7, name: '901', ruleType: 'ZERO_ONE', count: 3, format: '3vs3', variant: 'STANDARD' },
  { no: 8, name: 'CR', ruleType: 'CRICKET', count: 3, format: '3vs3', variant: 'STANDARD' },
  { no: 9, name: 'CR', ruleType: 'CRICKET', count: 2, format: '2vs2', variant: 'STANDARD' },
  { no: 10, name: '501', ruleType: 'ZERO_ONE', count: 2, format: '2vs2', variant: 'DIDO_FREEZE' },
  { no: 11, name: '701', ruleType: 'ZERO_ONE', count: 1, format: '1vs1', variant: 'STANDARD' },
  { no: 12, name: 'CR', ruleType: 'CRICKET', count: 1, format: '1vs1', variant: 'STANDARD' },
  { no: 13, name: '1101', ruleType: 'ZERO_ONE', count: 4, format: '4vs4', variant: 'STANDARD' },
]

export const uid = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`

// The persisted app model is JSON-compatible. This also unwraps Vue proxies
// and works on Android WebViews that do not implement structuredClone.
export function cloneData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function emptyGame(template: GameTemplate): GameRecord {
  return { gameNo: template.no, result: 'UNKNOWN', entries: [] }
}

export function gamesFromOrder(order: OrderPlan): GameRecord[] {
  return GAME_TEMPLATES.map((template) => {
    const slot = order.slots.find((item) => item.gameNo === template.no)
    return {
      gameNo: template.no,
      result: 'UNKNOWN',
      entries: (slot?.playerIds ?? []).slice(0, template.count).map((playerId) => ({ playerId, stat: null })),
    }
  })
}

export function formatRule(game: GameTemplate): string {
  if (game.variant === 'DIDO_FREEZE') return `${game.name} ${game.format}・DIDO/フリーズ`
  return `${game.name} ${game.format}`
}
