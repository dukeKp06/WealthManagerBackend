import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import path from 'path'
import { loadSampleData } from './services/dataLoader.js'
import holdingsRouter from './routes/holdings.js'
import allocationRouter from './routes/allocation.js'
import performanceRouter from './routes/performance.js'
import summaryRouter from './routes/summary.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 4000
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'https://wealthmanagerbackend-dghr.onrender.com/'

app.use(cors({ origin: FRONTEND_ORIGIN }))
app.use(express.json())

// Health
app.get('/api/health', (req, res) => res.json({ ok: true }))

// API routes
app.use('/api/portfolio/holdings', holdingsRouter)
app.use('/api/portfolio/allocation', allocationRouter)
app.use('/api/portfolio/performance', performanceRouter)
app.use('/api/portfolio/summary', summaryRouter)

// Global error handler
app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({ error: { message: err.message || 'Internal Server Error' } })
})

// Boot
async function start() {
  // Excel file is now placed in the backend folder root
  const datasetPath = path.resolve(__dirname, '../Sample Portfolio Dataset for Assignment.xlsx')
  await loadSampleData(datasetPath)

  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`)
  })
}

start().catch((e) => {
  console.error('Failed to start server', e)
  process.exit(1)
}) 