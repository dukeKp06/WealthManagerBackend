import path from 'path'
import { fileURLToPath } from 'url'
import xlsx from 'xlsx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Excel file is now placed in the backend folder root
const datasetPath = path.resolve(__dirname, '../Sample Portfolio Dataset for Assignment.xlsx')
console.log('Dataset:', datasetPath)

const wb = xlsx.readFile(datasetPath)
console.log('SheetNames:', wb.SheetNames)

wb.SheetNames.forEach((name) => {
  const sheet = wb.Sheets[name]
  const rows = xlsx.utils.sheet_to_json(sheet)
  console.log(`\n=== ${name} (${rows.length} rows) ===`)
  console.log(rows.slice(0, 5))
}) 