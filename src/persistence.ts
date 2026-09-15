import type { AppData, Team } from './domain'
import { uid } from './domain'

const KEY = 'jpl_order_maker_v1'

const initialTeam = (): Team => ({
  id: uid(),
  name: 'チーム1',
  players: [
    { id: uid(), name: 'Player A', rating: 10, active: true },
    { id: uid(), name: 'Player B', rating: 8, active: true },
    { id: uid(), name: 'Player C', rating: 12, active: true },
    { id: uid(), name: 'Player D', rating: 6, active: true },
  ],
})

function migrateLegacy(): AppData | null {
  const raw = localStorage.getItem('jpl_teams')
  if (!raw) return null
  try {
    const legacy = JSON.parse(raw) as Array<{ id: number; name: string; members: Array<{ id: number; name: string; rating: number }>; assignments?: Record<string, Record<string, number>> }>
    if (!Array.isArray(legacy) || !legacy.length) return null
    const teams: Team[] = legacy.map((team) => ({
      id: String(team.id),
      name: team.name,
      players: (team.members ?? []).map((member) => ({
        id: String(member.id), name: member.name, rating: Number(member.rating) || 0, active: true,
      })),
    }))
    const savedId = localStorage.getItem('jpl_active_team_id')
    const orders = legacy.flatMap((team) => {
      if (!team.assignments || !Object.keys(team.assignments).length) return []
      return [{
        id: uid(), teamId: String(team.id), opponent: '', plannedOn: '', score: 0,
        confidence: '低' as const, confirmed: false, createdAt: new Date().toISOString(),
        slots: Object.entries(team.assignments).map(([gameNo, slots]) => ({
          gameNo: Number(gameNo),
          playerIds: Object.entries(slots).sort(([a], [b]) => Number(a) - Number(b)).map(([, playerId]) => String(playerId)),
          score: 0, reasons: ['旧Web版から移行'],
        })),
      }]
    })
    return { schemaVersion: 1, activeTeamId: savedId && teams.some((t) => t.id === savedId) ? savedId : teams[0]!.id, teams, matches: [], orders }
  } catch { return null }
}

export function loadData(): AppData {
  const raw = localStorage.getItem(KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as AppData
      if (parsed.schemaVersion === 1 && parsed.teams?.length) return parsed
    } catch { /* fall through */ }
  }
  const migrated = migrateLegacy()
  if (migrated) return migrated
  const team = initialTeam()
  return { schemaVersion: 1, activeTeamId: team.id, teams: [team], matches: [], orders: [] }
}

export function saveData(data: AppData): void {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function validateBackup(value: unknown): value is AppData {
  if (!value || typeof value !== 'object') return false
  const data = value as Partial<AppData>
  return data.schemaVersion === 1 && Array.isArray(data.teams) && data.teams.length > 0 && Array.isArray(data.matches) && Array.isArray(data.orders)
}
