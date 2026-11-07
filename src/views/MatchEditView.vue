<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { GAME_TEMPLATES, cloneData, emptyGame, formatRule, gamesFromOrder, uid, type GameRecord, type GameResultValue, type MatchRecord } from '../domain'
import { useAppStore } from '../store'

const store = useAppStore()
const route = useRoute()
const router = useRouter()
const today = new Date(); const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
const matchId = typeof route.params.id === 'string' ? route.params.id : ''
const orderId = typeof route.query.orderId === 'string' ? route.query.orderId : ''
const originalMatch = matchId ? store.data.matches.find((match) => match.id === matchId && match.teamId === store.activeTeam.id) : undefined
const sourceOrder = !matchId && orderId ? store.data.orders.find((order) => order.id === orderId && order.teamId === store.activeTeam.id) : undefined
const isEditing = Boolean(originalMatch)
const sourceGames = sourceOrder ? gamesFromOrder(sourceOrder) : undefined
const form = reactive({
  playedOn: originalMatch?.playedOn ?? sourceOrder?.plannedOn ?? localDate,
  opponent: originalMatch?.opponent ?? sourceOrder?.opponent ?? '',
  note: originalMatch?.note ?? '',
  games: GAME_TEMPLATES.map((template) => cloneData(originalMatch?.games.find((game) => game.gameNo === template.no) ?? sourceGames?.find((game) => game.gameNo === template.no) ?? emptyGame(template))),
})
const error = ref('')
const selectablePlayers = computed(() => {
  const selectedIds = new Set(form.games.flatMap((game) => game.entries.map((entry) => entry.playerId)))
  return store.activeTeam.players.filter((player) => player.active || selectedIds.has(player.id))
})

if (matchId && !originalMatch) error.value = '編集対象の試合が見つかりません。履歴画面に戻って選び直してください。'
if (orderId && !sourceOrder) error.value = '反映するオーダーが見つかりません。オーダー画面から選び直してください。'

function togglePlayer(game: GameRecord, playerId: string) {
  const index = game.entries.findIndex((e) => e.playerId === playerId)
  if (index >= 0) game.entries.splice(index, 1)
  else {
    const template = GAME_TEMPLATES[game.gameNo - 1]!
    if (game.entries.length < template.count) game.entries.push({ playerId, stat: null })
  }
}
const selected = (game: GameRecord, id: string) => game.entries.some((e) => e.playerId === id)
const entryFor = (game: GameRecord, id: string) => game.entries.find((e) => e.playerId === id)!

function save() {
  error.value = ''
  const incomplete = form.games.find((game) => game.entries.length > 0 && game.entries.length !== GAME_TEMPLATES[game.gameNo - 1]!.count)
  if (incomplete) { error.value = `G${incomplete.gameNo}の出場人数が不足しています。`; return }
  try {
    const wins = form.games.filter((g) => g.result === 'WIN').length
    const losses = form.games.filter((g) => g.result === 'LOSS').length
    const result: GameResultValue = wins > losses ? 'WIN' : losses > wins ? 'LOSS' : wins || losses ? 'DRAW' : 'UNKNOWN'
    const match: MatchRecord = {
      id: originalMatch?.id ?? uid(),
      teamId: store.activeTeam.id,
      playedOn: form.playedOn,
      opponent: form.opponent.trim(),
      result,
      games: cloneData(form.games),
      note: form.note,
      createdAt: originalMatch?.createdAt ?? new Date().toISOString(),
    }
    if (originalMatch) store.updateMatch(match)
    else store.addMatch(match)
    void router.push('/history')
  } catch (cause) {
    console.error('Failed to save match', cause)
    error.value = '試合結果を保存できませんでした。もう一度お試しください。'
  }
}
</script>

<template>
  <section class="page stack match-edit">
    <div class="card form-card">
      <div class="field-row"><label>試合日<input v-model="form.playedOn" type="date"></label><label>対戦相手<input v-model="form.opponent" placeholder="チーム名"></label></div>
    </div>
    <div v-if="sourceOrder" class="notice"><b>保存済みオーダーを反映しました</b><span>出場選手は設定済みです。各ゲームの勝敗とPPR / MPRを入力してください。</span></div>
    <div class="notice"><b>PPR / MPRを選手ごとに入力</b><span>未計測の場合は空欄のまま保存できます。</span></div>
    <article v-for="(game, index) in form.games" :key="game.gameNo" class="game-card">
      <header><b>G{{ game.gameNo }}</b><div><strong>{{ formatRule(GAME_TEMPLATES[index]!) }}</strong><small v-if="GAME_TEMPLATES[index]!.variant === 'DIDO_FREEZE'">通常01とは別基準で評価</small></div><select v-model="game.result"><option value="UNKNOWN">未確定</option><option value="WIN">勝ち</option><option value="LOSS">負け</option><option value="DRAW">引分</option></select></header>
      <div class="player-pills">
        <button v-for="player in selectablePlayers" :key="player.id" type="button" :class="{ selected: selected(game, player.id) }" @click="togglePlayer(game, player.id)">{{ player.name }}</button>
      </div>
      <div v-if="game.entries.length" class="stat-inputs">
        <label v-for="entry in game.entries" :key="entry.playerId">
          <span>{{ selectablePlayers.find(p => p.id === entry.playerId)?.name }}</span>
          <input v-model.number="entryFor(game, entry.playerId).stat" type="number" min="0" step="0.01" :placeholder="GAME_TEMPLATES[index]!.ruleType === 'CRICKET' ? 'MPR' : 'PPR'">
        </label>
      </div>
      <small class="capacity">{{ game.entries.length }} / {{ GAME_TEMPLATES[index]!.count }}名</small>
    </article>
    <label class="card form-card">メモ<textarea v-model="form.note" rows="3" placeholder="任意"></textarea></label>
    <p v-if="error" class="error">{{ error }}</p>
    <button type="button" class="button primary full sticky-action" :disabled="Boolean((matchId && !originalMatch) || (orderId && !sourceOrder))" @click="save">{{ isEditing ? '変更を保存' : '試合結果を保存' }}</button>
  </section>
</template>
