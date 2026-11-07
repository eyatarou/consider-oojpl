import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import PlayersView from './views/PlayersView.vue'
import MatchEditView from './views/MatchEditView.vue'
import HistoryView from './views/HistoryView.vue'
import StatsView from './views/StatsView.vue'
import OrderView from './views/OrderView.vue'
import SettingsView from './views/SettingsView.vue'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: HomeView, meta: { title: 'ホーム' } },
    { path: '/players', component: PlayersView, meta: { title: '選手' } },
    { path: '/matches/new', component: MatchEditView, meta: { title: '試合登録' } },
    { path: '/matches/:id/edit', component: MatchEditView, meta: { title: '試合編集' } },
    { path: '/history', component: HistoryView, meta: { title: '履歴' } },
    { path: '/stats', component: StatsView, meta: { title: '成績' } },
    { path: '/order', component: OrderView, meta: { title: 'オーダー' } },
    { path: '/settings', component: SettingsView, meta: { title: '設定' } },
  ],
})
