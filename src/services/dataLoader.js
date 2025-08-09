import xlsx from 'xlsx'

export const db = {
  instruments: [], // { symbol, name, assetClass, sector, type }
  holdings: [],   // { symbol, qty, avg }
  prices: [],     // { symbol, date, close } (may be empty in this dataset)
  benchmarks: [], // { name, date, value }
  latestPrices: {}, // { [symbol]: ltp }
  portfolioSeries: [], // [{ date, value }]
}

export function resetDb() {
  db.instruments = []
  db.holdings = []
  db.prices = []
  db.benchmarks = []
  db.latestPrices = {}
  db.portfolioSeries = []
}

function excelDateToISO(d) {
  if (!d) return ''
  if (typeof d === 'string') {
    // Try to parse directly
    return d.slice(0, 10)
  }
  const parsed = xlsx.SSF?.parse_date_code?.(d)
  if (parsed && parsed.y) {
    const mm = String(parsed.m).padStart(2, '0')
    const dd = String(parsed.d).padStart(2, '0')
    return `${parsed.y}-${mm}-${dd}`
  }
  return ''
}

export async function loadSampleData(filePath) {
  resetDb()
  const wb = xlsx.readFile(filePath)

  // Actual sheets in dataset:
  // Holdings, Historical_Performance, Summary, Sector_Allocation, Market_Cap, Top_Performers
  const holdingsSheet = wb.Sheets['Holdings']
  const histSheet = wb.Sheets['Historical_Performance']

  if (holdingsSheet) {
    const rows = xlsx.utils.sheet_to_json(holdingsSheet)
    rows.forEach((r) => {
      const symbol = String(r.Symbol || '').trim()
      if (!symbol) return
      const name = String(r['Company Name'] || '').trim()
      const qty = Number(r.Quantity || 0)
      const avg = Number(r['Avg Price ₹'] || r['Avg Price'] || r['Avg'] || 0)
      const ltp = Number(r['Current Price (₹)'] || r['LTP'] || r['Current Price'] || 0)
      const sector = String(r.Sector || '').trim()
      const mcap = String(r['Market Cap'] || '').trim()

      db.instruments.push({ symbol, name, assetClass: 'Equity', sector, type: mcap })
      if (qty > 0) {
        db.holdings.push({ symbol, qty, avg })
      }
      if (ltp > 0) {
        db.latestPrices[symbol] = ltp
      }
    })
  }

  if (histSheet) {
    const rows = xlsx.utils.sheet_to_json(histSheet)
    // Portfolio series
    db.portfolioSeries = rows
      .map((r) => ({
        date: excelDateToISO(r.Date),
        value: Number(r['Portfolio Value (₹)'] || r['Portfolio Value'] || 0),
      }))
      .filter((x) => x.date && x.value)

    // Known benchmarks present: Nifty 50, Gold (₹/10g)
    const benchDefs = [
      { key: 'Nifty 50', name: 'Nifty 50' },
      { key: 'Gold (₹/10g)', name: 'Gold' },
    ]
    benchDefs.forEach(({ key, name }) => {
      rows.forEach((r) => {
        const date = excelDateToISO(r.Date)
        const val = Number(r[key] || 0)
        if (date && val) {
          db.benchmarks.push({ name, date, value: val })
        }
      })
    })
  }

  console.log(
    `Loaded sample data: holdings=${db.holdings.length}, instruments=${db.instruments.length}, latestPrices=${Object.keys(db.latestPrices).length}, portfolioPoints=${db.portfolioSeries.length}, benchmarks=${db.benchmarks.length}`,
  )
} 