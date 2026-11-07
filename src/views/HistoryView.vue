<script setup lang="ts">
import { useAppStore } from '../store'
const store = useAppStore()
const remove = (id: string) => { if (confirm('この試合履歴を削除しますか？')) store.removeMatch(id) }
</script>

<template>
  <section class="page stack">
    <router-link class="button primary full" to="/matches/new">＋ 試合結果を登録</router-link>
    <div v-if="!store.teamMatches.length" class="empty">試合履歴はまだありません。</div>
    <article v-for="match in store.teamMatches" :key="match.id" class="history-card">
      <header><div><time>{{ match.playedOn }}</time><h2>vs {{ match.opponent || '対戦相手未設定' }}</h2></div><span :class="['result', match.result.toLowerCase()]">{{ match.result }}</span></header>
      <div class="scoreline"><strong>{{ match.games.filter(g => g.result === 'WIN').length }}</strong><span>WIN</span><i>—</i><strong>{{ match.games.filter(g => g.result === 'LOSS').length }}</strong><span>LOSS</span></div>
      <div class="mini-games"><span v-for="game in match.games" :key="game.gameNo" :class="game.result.toLowerCase()">G{{ game.gameNo }}</span></div>
      <div class="action-grid">
        <router-link class="button secondary" :to="`/matches/${match.id}/edit`">編集</router-link>
        <button class="button secondary danger-text" @click="remove(match.id)">削除</button>
      </div>
    </article>
  </section>
</template>
