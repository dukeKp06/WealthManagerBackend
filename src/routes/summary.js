import { Router } from 'express'
import { db } from '../services/dataLoader.js'
import { computeHolding, sumBy } from '../utils/math.js'
import { getLatestPrice } from '../services/priceService.js'

const router = Router()

router.get('/', (req, res) => {
  const computed = db.holdings.map((h) => {
    const ltp = getLatestPrice(h.symbol) ?? h.avg
    return computeHolding(h, ltp)
  })

  const totalValue = sumBy(computed, 'value')
  const invested = db.holdings.reduce((acc, x) => acc + x.qty * x.avg, 0)
  const pnl = sumBy(computed, 'pnl')
  const absReturnPct = invested > 0 ? (pnl / invested) * 100 : 0

  const sortedByPnl = [...computed].sort((a, b) => b.pnl - a.pnl)
  const best = sortedByPnl[0] || null
  const worst = sortedByPnl[sortedByPnl.length - 1] || null

  res.json({
    totalValue,
    invested,
    pnl,
    absoluteReturnPct: absReturnPct,
    best,
    worst,
  })
})

export default router 