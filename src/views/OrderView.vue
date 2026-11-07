<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { GAME_TEMPLATES, cloneData, formatRule, type OrderPlan } from '../domain'
import { shareImage, shareText } from '../share'
import { useAppStore } from '../store'

const store = useAppStore()
const participants = reactive<Record<string, boolean>>(Object.fromEntries(store.activeTeam.players.filter(p => p.active).map(p => [p.id, true])))
const maxes = reactive<Record<string, number>>(Object.fromEntries(store.activeTeam.players.map(p => [p.id, 7])))
const opponent = ref('')
const opponentAverageRating = ref(0)
const date = ref(new Date().toLocaleDateString('sv-SE'))
const fairness = ref(.25)
const proposals = ref<OrderPlan[]>([])
const activeProposal = ref(0)
const error = ref('')
const working = ref(false)
const order = computed(() => proposals.value[activeProposal.value] ?? null)
const players = computed(() => store.activeTeam.players.filter(p => p.active))
const name = (id: string) => players.value.find(p => p.id === id)?.name ?? '不明'
const count = (id: string) => order.value?.slots.reduce((n, slot) => n + Number(slot.playerIds.includes(id)), 0) ?? 0
const overLimit = (id: string) => count(id) > (maxes[id] ?? 7)
const duplicated = (ids: string[], id: string) => ids.filter((item) => item === id).length > 1
const orderWarnings = computed(() => {
  if (!order.value) return []
  const warnings = players.value.filter((player) => overLimit(player.id)).map((player) => `${player.name}：出場${count(player.id)}回 / 上限${maxes[player.id] ?? 7}回`)
  for (const slot of order.value.slots) {
    if (new Set(slot.playerIds).size !== slot.playerIds.length) warnings.push(`G${slot.gameNo}：同じ選手が重複しています。`)
  }
  return warnings
})

async function generate() {
  error.value = ''; working.value = true
  try {
    const input = { teamId: store.activeTeam.id, players: players.value, matches: store.teamMatches, participantIds: players.value.filter(p => participants[p.id]).map(p => p.id), maxAppearances: maxes, opponent: opponent.value, opponentAverageRating: opponentAverageRating.value, plannedOn: date.value, fairness: fairness.value }
    proposals.value = await new Promise<OrderPlan[]>((resolve, reject) => {
      const worker = new Worker(new URL('../order-optimizer.worker.ts', import.meta.url), { type: 'module' })
      worker.onmessage = (event: MessageEvent<{ orders?: OrderPlan[]; error?: string }>) => {
        worker.terminate()
        if (event.data.error) reject(new Error(event.data.error))
        else resolve(event.data.orders ?? [])
      }
      worker.onerror = () => { worker.terminate(); reject(new Error('端末内の計算処理を開始できませんでした。')) }
      worker.postMessage(JSON.parse(JSON.stringify(input)))
    })
    activeProposal.value = 0
  } catch (e) { error.value = e instanceof Error ? e.message : '提案を作成できませんでした。' }
  finally { working.value = false }
}

function replacePlayer(plan: OrderPlan, gameNo: number, index: number, event: Event) {
  const select = event.target as HTMLSelectElement
  const next = select.value
  const slot = plan.slots.find(s => s.gameNo === gameNo)!
  slot.playerIds[index] = next
}

function confirmOrder() {
  if (!order.value) return
  order.value.confirmed = true; store.saveOrder(cloneData(order.value)); alert('オーダーを保存しました。')
}
function openSaved(saved: OrderPlan) { proposals.value = [cloneData(saved)]; activeProposal.value = 0 }
function removeSaved(id: string) {
  if (!confirm('この保存済みオーダーを削除しますか？')) return
  store.removeOrder(id)
  if (order.value?.id === id) proposals.value = []
}
</script>

<template>
  <section class="page stack">
    <template v-if="!order">
    <div class="card form-card">
      <h2>オーダー条件</h2>
      <div class="field-row"><label>試合日<input v-model="date" type="date"></label><label>対戦相手<input v-model="opponent" placeholder="任意"></label></div>
      <label>相手の想定平均Rt<input v-model.number="opponentAverageRating" type="number" min="0" max="25" step="0.1" placeholder="例：10.5"><small>各ゲームの相手合計Rtは、平均Rt×人数で推定します。</small></label>
      <h3>参加選手・出場上限</h3>
      <div class="participant-list">
        <label v-for="player in players" :key="player.id"><input v-model="participants[player.id]" type="checkbox"><span>{{ player.name }}<small>Rt {{ player.rating }}</small></span><input v-model.number="maxes[player.id]" type="number" min="0" max="7" aria-label="最大出場数"><em>回</em></label>
      </div>
      <label>公平性 <input v-model.number="fairness" type="range" min="0" max="1" step="0.25"><small>{{ fairness === 0 ? '勝率優先' : fairness === 1 ? '出場数優先' : 'バランス' }}</small></label>
      <p v-if="error" class="error">{{ error }}</p>
      <button class="button accent full" :disabled="working" @click="generate">{{ working ? '計算中…' : '最適オーダーを提案' }}</button>
      <p class="helper">計算はこの端末内だけで行われます。</p>
    </div>
    <template v-if="store.teamOrders.length">
      <div class="section-title"><h2>保存済みオーダー</h2><span>{{ store.teamOrders.length }}件</span></div>
      <article v-for="saved in store.teamOrders" :key="saved.id" class="history-card">
        <header><div><time>{{ saved.plannedOn || '日付なし' }}</time><h2>vs {{ saved.opponent || '対戦相手未設定' }}</h2></div><span class="result win">信頼度 {{ saved.confidence }}</span></header>
        <div class="action-grid">
          <button class="button secondary" @click="openSaved(saved)">表示</button>
          <router-link class="button secondary" :to="{ path: '/matches/new', query: { orderId: saved.id } }">結果入力</router-link>
          <button class="button secondary danger-text" @click="removeSaved(saved.id)">削除</button>
        </div>
      </article>
    </template>
    </template>

    <template v-else>
      <div class="proposal-head"><div><span class="pill">提案 {{ activeProposal + 1 }}</span><h2>推奨オーダー</h2><small>信頼度 {{ order.confidence }}・評価 {{ order.score.toFixed(2) }}</small></div><button class="text-button" @click="proposals = []">条件を変更</button></div>
      <div v-if="proposals.length > 1" class="proposal-tabs"><button v-for="(_, i) in proposals" :key="i" :class="{ active: activeProposal === i }" @click="activeProposal = i">候補{{ i + 1 }}</button></div>
      <div v-if="orderWarnings.length" class="error" role="status" aria-live="polite"><strong>オーダーを確認してください（入れ替えは続けられます）</strong><ul><li v-for="warning in orderWarnings" :key="warning">{{ warning }}</li></ul></div>
      <article v-for="slot in order.slots" :key="slot.gameNo" class="order-game">
        <header><b>G{{ slot.gameNo }}</b><div><strong>{{ formatRule(GAME_TEMPLATES[slot.gameNo - 1]!) }}</strong><small>{{ slot.reasons[0] }}</small></div><span>{{ Math.round(slot.score * 100) }}</span></header>
        <div class="order-players"><select v-for="(id, i) in slot.playerIds" :key="i" :value="id" :class="{ 'invalid-player': overLimit(id) || duplicated(slot.playerIds, id) }" :aria-invalid="overLimit(id) || duplicated(slot.playerIds, id)" :aria-label="`G${slot.gameNo} 選手${i + 1}`" @change="replacePlayer(order, slot.gameNo, i, $event)"><option v-for="player in players.filter(p => participants[p.id])" :key="player.id" :value="player.id">{{ player.name }}</option></select></div>
        <p v-if="new Set(slot.playerIds).size !== slot.playerIds.length" class="order-warning">同じ選手が重複しています。</p>
        <p v-if="slot.playerIds.some(overLimit)" class="order-warning">赤枠の選手は出場上限を超えています。</p>
      </article>
      <div class="appearance-summary"><span v-for="player in players.filter(p => participants[p.id])" :key="player.id" :class="{ 'invalid-player': overLimit(player.id) }">{{ name(player.id) }} <b>{{ count(player.id) }} / {{ maxes[player.id] ?? 7 }}回</b></span></div>
      <div class="action-grid"><button class="button primary" @click="confirmOrder">保存</button><router-link v-if="order.confirmed" class="button secondary" :to="{ path: '/matches/new', query: { orderId: order.id } }">結果入力</router-link><button class="button secondary" @click="shareText(order, players)">テキスト共有</button><button class="button secondary" @click="shareImage(order, players)">画像共有</button><button v-if="order.confirmed" class="button secondary danger-text" @click="removeSaved(order.id)">削除</button></div>
    </template>
  </section>
</template>

<style scoped>
.order-players .invalid-player,.appearance-summary .invalid-player{border:2px solid #b42318;background:#fff0ef;color:#b42318}
.appearance-summary .invalid-player b{color:#b42318}
.order-warning{margin:8px 0 0;color:#b42318;font-size:12px}
</style>
