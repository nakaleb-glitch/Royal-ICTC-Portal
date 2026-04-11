import ExcelJS from 'exceljs'
import fs from 'fs'

async function analyzeTemplate(filePath, name) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`📊 ANALYZING ${name} TEMPLATE`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)

  workbook.eachSheet((sheet, id) => {
    console.log(`\n📄 SHEET: ${sheet.name}`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

    // Find header rows and data start
    let studentStartRow = null
    let columns = {}

    for (let row = 1; row <= 30; row++) {
      const rowData = sheet.getRow(row)
      let hasStudentId = false
      let hasVnName = false
      let hasEngName = false

      rowData.eachCell({ includeEmpty: false }, (cell, col) => {
        const value = cell.text.toLowerCase().trim()
        
        if (value.includes('student') && value.includes('id')) hasStudentId = true
        if (value.includes('vietnamese') || value.includes('vn') || value.includes('name vn')) hasVnName = true
        if (value.includes('english') || value.includes('eng') || value.includes('name eng')) hasEngName = true

        if (value.includes('participation')) columns.participation = col
        if (value.includes('attainment') || value.includes('assignments')) columns.attainment = col
        if (value.includes('progress') || value.includes('test')) columns.progressTest = col
        
        if (value === 'student id' || value === 'student no' || value === 'id') {
          studentStartRow = row + 1
          columns.studentId = col
        }
        if (value === 'vietnamese name' || value === 'name vn') columns.nameVn = col
        if (value === 'english name' || value === 'name eng') columns.nameEng = col
      })
    }

    console.log(`✅ Student data starts at ROW: ${studentStartRow}`)
    console.log('✅ Column mapping:')
    Object.entries(columns).sort().forEach(([key, col]) => {
      console.log(`   ${key.padEnd(18)} → COLUMN ${col}`)
    })

    // Show example first student row
    if (studentStartRow) {
      console.log(`\n✅ First student data row is ROW ${studentStartRow}`)
      console.log(`✅ Max students supported: ${sheet.rowCount - studentStartRow + 1}`)
    }
  })
}

async function run() {
  await analyzeTemplate('src/assets/templates/lms_primary_gradebook_integrated_template.xlsx', 'INTEGRATED')
  await analyzeTemplate('src/assets/templates/lms_primary_gradebook_bilingual_template.xlsx', 'BILINGUAL')
}

run()