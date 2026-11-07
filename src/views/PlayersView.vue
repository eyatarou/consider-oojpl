<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useAppStore } from '../store'

const store = useAppStore()
const name = ref('')
const rating = ref(1)
const editing = reactive<Record<string, boolean>>({})
const add = () => { if (!name.value.trim()) return; store.addPlayer(name.value, rating.value); name.value = ''; rating.value = 1 }
</script>

<template>
  <section class="page stack">
    <div class="card form-card">
      <h2>選手を追加</h2>
      <div class="field-row"><label>名前<input v-model="name" placeholder="選手名"></label><label class="short">Rt<input v-model.number="rating" type="number" min="0"></label></div>
      <button class="button primary full" :disabled="!name.trim()" @click="add">追加する</button>
    </div>
    <div class="section-title"><h2>登録選手</h2><span>{{ store.activeTeam.players.filter(p => p.active).length }}名</span></div>
    <article v-for="player in store.activeTeam.players.filter(p => p.active)" :key="player.id" class="player-card">
      <div class="avatar">{{ player.name.slice(0, 1).toUpperCase() }}</div>
      <div class="grow">
        <input v-if="editing[player.id]" v-model="player.name" aria-label="選手名">
        <strong v-else>{{ player.name }}</strong>
        <label class="inline-rating">Rt <input v-model.number="player.rating" type="number" min="0"></label>
      </div>
      <button class="icon-button" @click="editing[player.id] = !editing[player.id]">{{ editing[player.id] ? '✓' : '✎' }}</button>
      <button class="icon-button danger" @click="store.removePlayer(player.id)">×</button>
    </article>
  </section>
</template>
