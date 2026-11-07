<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '../store'
const store = useAppStore()
const teamName = ref('')
const fileInput = ref<HTMLInputElement>()
const download = () => { const blob = new Blob([store.exportBackup()], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `jpl-backup-${new Date().toLocaleDateString('sv-SE')}.json`; a.click(); URL.revokeObjectURL(url) }
const restore = async (event: Event) => { const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return; try { store.importBackup(JSON.parse(await file.text())); alert('復元しました。') } catch (e) { alert(e instanceof Error ? e.message : '復元できませんでした。') } }
const addTeam = () => { if (!teamName.value.trim()) return; store.addTeam(teamName.value); teamName.value = '' }
</script>

<template>
  <section class="page stack">
    <div class="card form-card"><h2>チーム</h2><div class="field-row"><input v-model="teamName" placeholder="新しいチーム名"><button class="button primary" @click="addTeam">追加</button></div></div>
    <div class="card form-card"><h2>バックアップ</h2><p>選手、試合、オーダーをJSONファイルに保存します。</p><div class="action-grid"><button class="button secondary" @click="download">書き出す</button><button class="button secondary" @click="fileInput?.click()">復元する</button></div><input ref="fileInput" hidden type="file" accept="application/json" @change="restore"></div>
    <div class="card form-card"><h2>ルール</h2><p>全13ゲーム・同一ゲーム重複不可・1選手最大7ゲーム。</p><p><b>501ダブルス：</b>ダブルイン／ダブルアウト、フリーズ方式。PPRは通常01と別集計します。</p></div>
    <div class="card form-card"><h2>このアプリについて</h2><p>JPL Order Maker 1.0.0</p><small>オーダー計算と成績データは端末内で処理されます。</small></div>
  </section>
</template>
