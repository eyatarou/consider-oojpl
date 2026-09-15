import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { loadData, saveData, validateBackup } from './persistence'
import { cloneData, uid, type MatchRecord, type OrderPlan, type Player, type Team } from './domain'

export const useAppStore = defineStore('app', () => {
  const data = ref(loadData())
  const ready = ref(true)
  const activeTeam = computed(() => data.value.teams.find((t) => t.id === data.value.activeTeamId) ?? data.value.teams[0]!)
  const teamMatches = computed(() => data.value.matches.filter((m) => m.teamId === activeTeam.value.id).sort((a, b) => b.playedOn.localeCompare(a.playedOn)))
  const teamOrders = computed(() => data.value.orders.filter((o) => o.teamId === activeTeam.value.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
  watch(data, (value) => saveData(value), { deep: true })

  const addPlayer = (name: string, rating: number) => activeTeam.value.players.push({ id: uid(), name: name.trim(), rating, active: true })
  const removePlayer = (id: string) => { const p = activeTeam.value.players.find((item) => item.id === id); if (p) p.active = false }
  const addTeam = (name: string) => { const team: Team = { id: uid(), name: name.trim(), players: [] }; data.value.teams.push(team); data.value.activeTeamId = team.id }
  const addMatch = (match: MatchRecord) => data.value.matches.push(match)
  const updateMatch = (match: MatchRecord) => {
    const index = data.value.matches.findIndex((item) => item.id === match.id)
    if (index < 0) throw new Error('編集対象の試合が見つかりません。')
    data.value.matches[index] = match
  }
  const removeMatch = (id: string) => { data.value.matches = data.value.matches.filter((m) => m.id !== id) }
  const saveOrder = (order: OrderPlan) => {
    const index = data.value.orders.findIndex((o) => o.id === order.id)
    if (index >= 0) data.value.orders[index] = order
    else data.value.orders.push(order)
  }
  const importBackup = (value: unknown) => {
    if (!validateBackup(value)) throw new Error('対応していないバックアップ形式です。')
    data.value = cloneData(value)
  }
  const exportBackup = () => JSON.stringify(data.value, null, 2)
  const updatePlayer = (player: Player) => Object.assign(activeTeam.value.players.find((p) => p.id === player.id)!, player)

  return { data, ready, activeTeam, teamMatches, teamOrders, addPlayer, removePlayer, updatePlayer, addTeam, addMatch, updateMatch, removeMatch, saveOrder, importBackup, exportBackup }
})
