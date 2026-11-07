<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../store'
import { aggregateStats, numberText } from '../stats'
const store = useAppStore()
const stats = computed(() => aggregateStats(store.activeTeam.players.filter(p => p.active), store.teamMatches))
</script>

<template>
  <section class="page stack">
    <div class="notice"><b>ルール別に公平に評価</b><span>フリーズ501のPPRは通常01と分けて集計します。</span></div>
    <article v-for="item in stats" :key="item.player.id" class="stats-card">
      <header><div class="avatar">{{ item.player.name.slice(0, 1) }}</div><div><h2>{{ item.player.name }}</h2><small>Rt {{ item.player.rating }}・{{ item.games }} games</small></div><strong>{{ item.games ? Math.round(item.wins / item.games * 100) : 0 }}<i>%</i></strong></header>
      <div class="stat-grid"><div><small>01 PPR</small><b>{{ numberText(item.ppr) }}</b></div><div><small>CR MPR</small><b>{{ numberText(item.mpr) }}</b></div><div class="freeze"><small>501 FREEZE PPR</small><b>{{ numberText(item.freezePpr) }}</b></div></div>
      <div class="confidence"><span :style="{ width: `${Math.min(100, item.games / 15 * 100)}%` }"></span></div><small>データ信頼度：{{ item.games < 5 ? '低' : item.games < 15 ? '中' : '高' }}</small>
    </article>
  </section>
</template>
