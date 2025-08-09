export function toFixedNumber(num, digits = 2) {
  return Number.parseFloat(Number(num || 0).toFixed(digits))
}

export function computeHolding(h, latestPrice) {
  const ltp = Number(latestPrice || 0)
  const value = h.qty * ltp
  const pnl = (ltp - h.avg) * h.qty
  return { ...h, ltp, value, pnl }
}

export function sumBy(arr, key) {
  return arr.reduce((acc, x) => acc + Number(x[key] || 0), 0)
}

export function groupBy(arr, key) {
  return arr.reduce((acc, x) => {
    const k = x[key] || 'Unknown'
    acc[k] ||= []
    acc[k].push(x)
    return acc
  }, {})
} 