import dayjs from 'dayjs'
import { db } from './dataLoader.js'

export function getLatestPrice(symbol) {
  if (db.latestPrices && db.latestPrices[symbol] != null) return db.latestPrices[symbol]
  const rows = db.prices.filter((p) => p.symbol === symbol)
  if (rows.length === 0) return undefined
  const latest = rows.reduce((a, b) => (a.date > b.date ? a : b))
  return latest.close
}

export function getSeriesForSymbol(symbol, fromDate) {
  // If we do not have per-symbol time series, return empty; portfolio-series is global
  const sorted = db.prices
    .filter((p) => p.symbol === symbol && (!fromDate || p.date >= fromDate))
    .sort((a, b) => (a.date < b.date ? -1 : 1))
  return sorted
}

export function getBenchmarkSeries(names = [], fromDate) {
  const result = {}
  names.forEach((n) => {
    const series = db.benchmarks
      .filter((b) => b.name === n && (!fromDate || b.date >= fromDate))
      .sort((a, b) => (a.date < b.date ? -1 : 1))
    result[n] = series
  })
  return result
} 