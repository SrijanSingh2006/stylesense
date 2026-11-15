export function riceScore(reach: number, impact: number, confidence: number, effort: number): number {
  if (![reach, impact, confidence, effort].every(Number.isFinite) || reach < 0 || impact < 0 || confidence < 0 || confidence > 100 || effort <= 0) throw new Error('Invalid RICE inputs')
  return Math.round(((reach * impact * confidence / 100) / effort) * 10) / 10
}
export function discountPercent(price: number, original?: number): number {
  return original && original > price ? Math.round((original - price) / original * 100) : 0
}
