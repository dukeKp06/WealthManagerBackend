import { Router } from 'express'
import { db } from '../services/dataLoader.js'
import { computeHolding, sumBy } from '../utils/math.js'
import { getLatestPrice } from '../services/priceService.js'

const router = Router()

router.get('/', (req, res) => {
  const { q = '', sort = 'symbol', order = 'asc', page = '1', pageSize = '50' } = req.query

  const query = String(q).toLowerCase().trim()
  const sortBy = String(sort)
  const sortDir = String(order) === 'desc' ? -1 : 1
  const pageNum = Math.max(1, Number(page) || 1)
  const size = Math.min(200, Math.max(1, Number(pageSize) || 50))

  const holdings = db.holdings
    .filter((h) => {
      if (!query) return true
      const inst = db.instruments.find((i) => i.symbol === h.symbol)
      return (
        h.symbol.toLowerCase().includes(query) ||
        (inst?.name || '').toLowerCase().includes(query)
      )
    })
    .map((h) => {
      const inst = db.instruments.find((i) => i.symbol === h.symbol)
      const ltp = getLatestPrice(h.symbol) ?? h.avg
      const computed = computeHolding(h, ltp)
      return {
        symbol: h.symbol,
        name: inst?.name || h.symbol,
        assetClass: inst?.assetClass || 'Unknown',
        sector: inst?.sector || 'Unknown',
        qty: h.qty,
        avg: h.avg,
        ltp: computed.ltp,
        value: computed.value,
        pnl: computed.pnl,
      }
    })

  const totals = {
    totalValue: sumBy(holdings, 'value'),
    totalInvested: db.holdings.reduce((acc, x) => acc + x.qty * x.avg, 0),
    totalPnl: sumBy(holdings, 'pnl'),
  }

  holdings.sort((a, b) => {
    const av = a[sortBy]
    const bv = b[sortBy]
    if (typeof av === 'number' && typeof bv === 'number') {
      return (av - bv) * sortDir
    }
    return String(av).localeCompare(String(bv)) * sortDir
  })

  const start = (pageNum - 1) * size
  const items = holdings.slice(start, start + size)

  res.json({
    items,
    page: pageNum,
    pageSize: size,
    total: holdings.length,
    totals,
  })
})

export default router 