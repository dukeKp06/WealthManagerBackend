import { Router } from 'express'
import dayjs from 'dayjs'
import { db } from '../services/dataLoader.js'
import { getBenchmarkSeries } from '../services/priceService.js'

const router = Router()

const PERIOD_TO_DAYS = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365 }

router.get('/', (req, res) => {
  const { period = '6M', benchmarks = '' } = req.query
  const days = PERIOD_TO_DAYS[period] || 3650 // MAX ~ 10y
  const fromDate = dayjs().subtract(days, 'day').format('YYYY-MM-DD')

  let portfolioSeries = db.portfolioSeries
  if (fromDate) portfolioSeries = portfolioSeries.filter((x) => x.date >= fromDate)

  function normalizeTo100(arr) {
    const first = arr.find((x) => x.value > 0)?.value || 1
    return arr.map((x) => ({ date: x.date, value: (x.value / first) * 100 }))
  }

  const portfolio = normalizeTo100(portfolioSeries)

  const benchNames = String(benchmarks)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const benchmarkSeriesMap = getBenchmarkSeries(benchNames, fromDate)
  const benchmarksOut = Object.fromEntries(
    Object.entries(benchmarkSeriesMap).map(([name, rows]) => {
      const list = rows.map((r) => ({ date: r.date, value: r.value }))
      return [name, normalizeTo100(list)]
    }),
  )

  const dates = portfolio.map((p) => p.date)

  res.json({ dates, portfolio, benchmarks: benchmarksOut })
})

export default router 