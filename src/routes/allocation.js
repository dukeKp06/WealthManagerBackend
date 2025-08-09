import { Router } from 'express'
import { db } from '../services/dataLoader.js'
import { computeHolding, sumBy, groupBy } from '../utils/math.js'
import { getLatestPrice } from '../services/priceService.js'

const router = Router()

router.get('/', (req, res) => {
  const { groupBy: g = 'assetClass', topN = '10' } = req.query
  const groupKey = ['assetClass', 'sector', 'type'].includes(String(g)) ? String(g) : 'assetClass'
  const top = Math.max(1, Number(topN) || 10)

  const computed = db.holdings.map((h) => {
    const inst = db.instruments.find((i) => i.symbol === h.symbol)
    const ltp = getLatestPrice(h.symbol) ?? h.avg
    const ch = computeHolding(h, ltp)
    return {
      ...ch,
      name: inst?.name || h.symbol,
      assetClass: inst?.assetClass || 'Unknown',
      sector: inst?.sector || 'Unknown',
      type: inst?.type || 'Unknown',
    }
  })

  const totalValue = sumBy(computed, 'value') || 1
  const grouped = groupBy(computed, groupKey)

  let rows = Object.entries(grouped).map(([label, arr]) => ({
    label,
    value: sumBy(arr, 'value'),
  }))

  rows.sort((a, b) => b.value - a.value)

  if (rows.length > top) {
    const head = rows.slice(0, top)
    const othersValue = sumBy(rows.slice(top), 'value')
    rows = [...head, { label: 'Others', value: othersValue }]
  }

  const items = rows.map((r) => ({ ...r, percent: (r.value / totalValue) * 100 }))

  res.json({ totalValue, items })
})

export default router 