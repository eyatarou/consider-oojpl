import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { GAME_TEMPLATES, formatRule, type OrderPlan, type Player } from './domain'

export function orderText(order: OrderPlan, players: Player[]): string {
  const name = (id: string) => players.find((p) => p.id === id)?.name ?? '不明'
  const lines = [`JPL オーダー`, `対戦：${order.opponent || '未設定'}`, `日付：${order.plannedOn || '未設定'}`, '']
  for (const slot of order.slots) {
    const game = GAME_TEMPLATES[slot.gameNo - 1]!
    lines.push(`G${slot.gameNo} ${formatRule(game)}：${slot.playerIds.map(name).join(' / ')}`)
  }
  const counts = new Map<string, number>()
  order.slots.flatMap((s) => s.playerIds).forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1))
  lines.push('', '出場数', ...[...counts].map(([id, count]) => `${name(id)}: ${count}`))
  return lines.join('\n')
}

async function orderPng(order: OrderPlan, players: Player[]): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = 1200; canvas.height = 1740
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#155e75'; ctx.fillRect(0, 0, canvas.width, 180)
  ctx.fillStyle = 'white'; ctx.font = 'bold 54px sans-serif'; ctx.fillText('JPL ORDER', 64, 78)
  ctx.font = '30px sans-serif'; ctx.fillText(`${order.plannedOn || ''}  vs ${order.opponent || '未設定'}`, 64, 132)
  const name = (id: string) => players.find((p) => p.id === id)?.name ?? '不明'
  order.slots.forEach((slot, i) => {
    const y = 230 + i * 104
    ctx.fillStyle = i % 2 ? '#ffffff' : '#eef6f7'; ctx.fillRect(44, y - 48, 1112, 88)
    ctx.fillStyle = '#0f172a'; ctx.font = 'bold 30px sans-serif'; ctx.fillText(`G${slot.gameNo}`, 68, y)
    ctx.fillStyle = '#475569'; ctx.font = '24px sans-serif'; ctx.fillText(formatRule(GAME_TEMPLATES[slot.gameNo - 1]!), 155, y)
    ctx.fillStyle = '#0f172a'; ctx.font = 'bold 27px sans-serif'; ctx.fillText(slot.playerIds.map(name).join(' / '), 500, y)
  })
  return canvas.toDataURL('image/png')
}

export async function shareText(order: OrderPlan, players: Player[]) {
  const text = orderText(order, players)
  try { await Share.share({ title: 'JPL オーダー', text, dialogTitle: 'オーダーを共有' }) }
  catch { await navigator.clipboard.writeText(text); alert('共有を開けなかったため、テキストをコピーしました。') }
}

export async function shareImage(order: OrderPlan, players: Player[]) {
  const dataUrl = await orderPng(order, players)
  if (Capacitor.isNativePlatform()) {
    const result = await Filesystem.writeFile({ path: `jpl-order-${order.id}.png`, data: dataUrl.split(',')[1]!, directory: Directory.Cache })
    await Share.share({ title: 'JPL オーダー', files: [result.uri], dialogTitle: 'オーダー画像を共有' })
    return
  }
  const response = await fetch(dataUrl); const blob = await response.blob(); const file = new File([blob], 'jpl-order.png', { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: 'JPL オーダー' })
  else { const link = document.createElement('a'); link.href = dataUrl; link.download = file.name; link.click() }
}
