import { GAME_TEMPLATES, uid, type GameTemplate, type MatchRecord, type OrderPlan, type Player } from './domain'
import { aggregateStats, type PlayerStats } from './stats'
import { calculateHandicap } from './handicap'

export interface OptimizeInput {
  teamId: string
  players: Player[]
  matches: MatchRecord[]
  participantIds: string[]
  maxAppearances: Record<string, number>
  opponent: string
  opponentAverageRating: number
  plannedOn: string
  fairness: number
}

interface Candidate { ids: string[]; score: number; reasons: string[] }

const combinations = (items: string[], size: number): string[][] => {
  const result: string[][] = []
  const walk = (start: number, picked: string[]) => {
    if (picked.length === size) { result.push([...picked]); return }
    for (let i = start; i <= items.length - (size - picked.length); i++) walk(i + 1, [...picked, items[i]!])
  }
  walk(0, [])
  return result
}

const clamp = (value: number) => Math.max(0, Math.min(1, value))

function normalized(value: number | null, values: Array<number | null>, fallback: number): number {
  if (value == null) return fallback
  const present = values.filter((v): v is number => v != null)
  if (present.length < 2) return .55
  const min = Math.min(...present)
  const max = Math.max(...present)
  return max === min ? .55 : clamp((value - min) / (max - min))
}

function playerScore(stat: PlayerStats, all: PlayerStats[], game: GameTemplate): { value: number; reason: string } {
  const ratingMax = Math.max(1, ...all.map((item) => item.player.rating))
  const rating = stat.player.rating / ratingMax
  const winRate = (stat.wins + 2) / (stat.games + 4)
  const field = game.ruleType === 'CRICKET' ? 'mpr' : game.variant === 'DIDO_FREEZE' ? 'freezePpr' : 'ppr'
  const direct = stat[field]
  let performance = normalized(direct, all.map((item) => item[field]), .5)
  let reason: string
  if (direct != null) {
    reason = game.variant === 'DIDO_FREEZE' ? `フリーズ501補正PPR ${direct.toFixed(1)}` : `${game.ruleType === 'CRICKET' ? 'MPR' : 'PPR'} ${direct.toFixed(2)}`
  } else if (game.variant === 'DIDO_FREEZE' && stat.ppr != null) {
    // 通常01は補助情報に限定し、フリーズ方式でPPRが低くなることを不利に扱わない。
    performance = .5 + (normalized(stat.ppr, all.map((item) => item.ppr), .5) - .5) * .35
    reason = 'フリーズ実績不足・通常01を補助利用'
  } else {
    reason = '実績不足・レーティングを主に使用'
  }
  return { value: performance * .48 + winRate * .27 + rating * .25, reason }
}

function candidateList(players: Player[], stats: PlayerStats[], game: GameTemplate, opponentAverageRating: number): Candidate[] {
  return combinations(players.map((p) => p.id), game.count).map((ids) => {
    const scores = ids.map((id) => playerScore(stats.find((s) => s.player.id === id)!, stats, game))
    const handicap = calculateHandicap(game, ids, players, opponentAverageRating)
    return {
      ids,
      score: clamp(scores.reduce((sum, item) => sum + item.value, 0) / scores.length + handicap.scoreAdjustment),
      reasons: [...new Set([...(opponentAverageRating > 0 ? [handicap.label] : []), ...scores.map((item) => item.reason)])].slice(0, 3),
    }
  }).sort((a, b) => b.score - a.score)
}

export function optimizeOrders(input: OptimizeInput): OrderPlan[] {
  const participants = input.players.filter((p) => input.participantIds.includes(p.id))
  if (participants.length < Math.max(...GAME_TEMPLATES.map((g) => g.count))) throw new Error('参加人数が不足しています。4人以上を選択してください。')
  const stats = aggregateStats(participants, input.matches)
  const lists = GAME_TEMPLATES.map((game) => candidateList(participants, stats, game, input.opponentAverageRating))
  const suffixBest = Array(GAME_TEMPLATES.length + 1).fill(0) as number[]
  for (let i = GAME_TEMPLATES.length - 1; i >= 0; i--) suffixBest[i] = suffixBest[i + 1]! + (lists[i]?.[0]?.score ?? 0)
  const counts: Record<string, number> = Object.fromEntries(participants.map((p) => [p.id, 0]))
  const picked: Candidate[] = []
  const best: Array<{ score: number; candidates: Candidate[] }> = []
  const deadline = performance.now() + 4500

  const save = (rawScore: number) => {
    const values = Object.values(counts)
    const spread = Math.max(...values) - Math.min(...values)
    const score = rawScore - spread * input.fairness * .08
    const signature = picked.map((p) => p.ids.join(',')).join('|')
    if (best.some((item) => item.candidates.map((p) => p.ids.join(',')).join('|') === signature)) return
    best.push({ score, candidates: picked.map((p) => ({ ...p, ids: [...p.ids] })) })
    best.sort((a, b) => b.score - a.score)
    best.splice(3)
  }

  const walk = (index: number, score: number) => {
    if (performance.now() > deadline) return
    if (index === GAME_TEMPLATES.length) { save(score); return }
    if (best.length === 3 && score + suffixBest[index]! <= best[2]!.score) return
    for (const candidate of lists[index]!) {
      if (candidate.ids.some((id) => counts[id]! >= (input.maxAppearances[id] ?? 7))) continue
      for (const id of candidate.ids) counts[id]!++
      picked.push(candidate)
      walk(index + 1, score + candidate.score)
      picked.pop()
      for (const id of candidate.ids) counts[id]!--
    }
  }
  walk(0, 0)
  if (!best.length) throw new Error('出場上限の条件では全ゲームを埋められません。上限または参加者を見直してください。')

  const totalSamples = stats.reduce((sum, s) => sum + s.games, 0)
  const confidence: OrderPlan['confidence'] = totalSamples < participants.length * 5 ? '低' : totalSamples < participants.length * 15 ? '中' : '高'
  return best.map((answer) => ({
    id: uid(), teamId: input.teamId, opponent: input.opponent, plannedOn: input.plannedOn,
    score: answer.score, confidence, confirmed: false, createdAt: new Date().toISOString(),
    slots: answer.candidates.map((candidate, index) => ({
      gameNo: index + 1, playerIds: candidate.ids, score: candidate.score, reasons: candidate.reasons,
    })),
  }))
}
