/// <reference lib="webworker" />
import { optimizeOrders, type OptimizeInput } from './optimizer'

self.onmessage = (event: MessageEvent<OptimizeInput>) => {
  try { self.postMessage({ orders: optimizeOrders(event.data) }) }
  catch (error) { self.postMessage({ error: error instanceof Error ? error.message : '提案を作成できませんでした。' }) }
}
