<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from './store'

const store = useAppStore()
const route = useRoute()
const title = computed(() => String(route.meta.title ?? 'JPL Order Maker'))
const nav = [
  { to: '/', icon: '⌂', label: 'ホーム' },
  { to: '/history', icon: '◷', label: '履歴' },
  { to: '/order', icon: '◎', label: 'オーダー' },
  { to: '/stats', icon: '↗', label: '成績' },
  { to: '/players', icon: '♙', label: '選手' },
]
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <div>
        <div class="eyebrow">JPL ORDER MAKER</div>
        <h1>{{ title }}</h1>
      </div>
      <select v-model="store.data.activeTeamId" aria-label="チームを選択">
        <option v-for="team in store.data.teams" :key="team.id" :value="team.id">{{ team.name }}</option>
      </select>
      <router-link class="settings-link" to="/settings" aria-label="設定">⚙</router-link>
    </header>
    <main><router-view /></main>
    <nav class="bottom-nav" aria-label="メインメニュー">
      <router-link v-for="item in nav" :key="item.to" :to="item.to">
        <span>{{ item.icon }}</span><small>{{ item.label }}</small>
      </router-link>
    </nav>
  </div>
</template>
