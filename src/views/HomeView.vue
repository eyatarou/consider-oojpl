<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../store'

const store = useAppStore()
const completed = computed(() => store.teamMatches.filter((m) => m.result !== 'UNKNOWN'))
const wins = computed(() => completed.value.filter((m) => m.result === 'WIN').length)
const rate = computed(() => completed.value.length ? Math.round(wins.value / completed.value.length * 100) : 0)
const latest = computed(() => store.teamMatches.slice(0, 3))
</script>

<template>
  <section class="page stack">
    <div class="hero-card">
      <div><span class="pill light">OFFLINE READY</span><h2>次の勝利につながる<br>オーダーを組もう。</h2></div>
      <router-link class="button accent" to="/order">オーダーを作成</router-link>
    </div>
    <div class="metrics">
      <article><small>登録試合</small><strong>{{ completed.length }}</strong><span>matches</span></article>
      <article><small>チーム勝率</small><strong>{{ rate }}<i>%</i></strong><span>{{ wins }} wins</span></article>
      <article><small>登録選手</small><strong>{{ store.activeTeam.players.filter(p => p.active).length }}</strong><span>players</span></article>
    </div>
    <div class="section-title"><h2>クイック操作</h2></div>
    <div class="quick-grid">
      <router-link to="/matches/new"><b>＋</b><span>試合結果を登録</span><small>PPR / MPR</small></router-link>
      <router-link to="/stats"><b>↗</b><span>成績を見る</span><small>選手別・種目別</small></router-link>
    </div>
    <div class="section-title"><h2>最近の試合</h2><router-link to="/history">すべて見る</router-link></div>
    <div v-if="!latest.length" class="empty">まだ試合がありません。最初の試合結果を登録してください。</div>
    <article v-for="match in latest" :key="match.id" class="match-row">
      <time>{{ match.playedOn.slice(5).replace('-', '/') }}</time>
      <div><strong>vs {{ match.opponent || '対戦相手未設定' }}</strong><small>{{ match.games.filter(g => g.result === 'WIN').length }} - {{ match.games.filter(g => g.result === 'LOSS').length }}</small></div>
      <span :class="['result', match.result.toLowerCase()]">{{ match.result === 'WIN' ? 'WIN' : match.result === 'LOSS' ? 'LOSS' : '—' }}</span>
    </article>
  </section>
</template>
