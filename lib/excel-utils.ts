import * as XLSX from 'xlsx'

export interface ExcelExportOptions {
  filename: string
  sheetName?: string
  data: any[]
  headers?: string[]
  columnWidths?: number[]
  headerStyle?: boolean
  cellStyles?: boolean
}

export const exportToExcel = ({ 
  filename, 
  sheetName = 'Sheet1', 
  data, 
  headers, 
  columnWidths,
  headerStyle,
  cellStyles 
}: ExcelExportOptions) => {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new()
    
    // If headers are provided, add them as the first row
    let worksheetData = data
    if (headers) {
      worksheetData = [headers, ...data]
    }
    
    // Create worksheet from the data
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    
    // Set column widths
    if (columnWidths) {
      worksheet['!cols'] = columnWidths.map(width => ({ wch: width }))
    }
    
    // Professional styling for headers
    if (headers && headerStyle) {
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
        if (!worksheet[cellAddress]) continue
        
        worksheet[cellAddress].s = {
          font: { 
            bold: true, 
            color: { rgb: "FFFFFF" }, 
            sz: 12,
            name: "Calibri"
          },
          fill: { 
            fgColor: { rgb: "2F5F8F" },
            patternType: "solid"
          },
          alignment: { 
            horizontal: "center", 
            vertical: "center",
            wrapText: true
          },
          border: {
            top: { style: "thick", color: { rgb: "1F4F7F" } },
            bottom: { style: "thick", color: { rgb: "1F4F7F" } },
            left: { style: "medium", color: { rgb: "1F4F7F" } },
            right: { style: "medium", color: { rgb: "1F4F7F" } }
          }
        }
      }
    }
    
    // Professional styling for data cells
    if (cellStyles && headers) {
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
      for (let row = 1; row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
          if (!worksheet[cellAddress]) continue
          
          // Base cell style
          worksheet[cellAddress].s = {
            font: { 
              sz: 10, 
              name: "Calibri",
              color: { rgb: "333333" }
            },
            alignment: { 
              horizontal: col === 0 ? "left" : "center", 
              vertical: "center",
              wrapText: true
            },
            border: {
              top: { style: "thin", color: { rgb: "D0D0D0" } },
              bottom: { style: "thin", color: { rgb: "D0D0D0" } },
              left: { style: "thin", color: { rgb: "D0D0D0" } },
              right: { style: "thin", color: { rgb: "D0D0D0" } }
            }
          }
          
          // Alternating row colors
          if (row % 2 === 0) {
            worksheet[cellAddress].s.fill = { 
              fgColor: { rgb: "F8F9FA" },
              patternType: "solid"
            }
          } else {
            worksheet[cellAddress].s.fill = { 
              fgColor: { rgb: "FFFFFF" },
              patternType: "solid"
            }
          }
          
          // Status column special formatting
          const cellValue = worksheet[cellAddress].v
          if (typeof cellValue === 'string') {
            if (cellValue.includes('Good') || cellValue.includes('Excellent')) {
              worksheet[cellAddress].s.font.color = { rgb: "16A085" }
              worksheet[cellAddress].s.font.bold = true
              worksheet[cellAddress].s.fill = { 
                fgColor: { rgb: "E8F6F3" },
                patternType: "solid"
              }
            } else if (cellValue.includes('Poor') || cellValue.includes('Replace Required')) {
              worksheet[cellAddress].s.font.color = { rgb: "E74C3C" }
              worksheet[cellAddress].s.font.bold = true
              worksheet[cellAddress].s.fill = { 
                fgColor: { rgb: "FADBD8" },
                patternType: "solid"
              }
            } else if (cellValue.includes('Monitor') || cellValue.includes('Acceptable')) {
              worksheet[cellAddress].s.font.color = { rgb: "F39C12" }
              worksheet[cellAddress].s.font.bold = true
              worksheet[cellAddress].s.fill = { 
                fgColor: { rgb: "FEF9E7" },
                patternType: "solid"
              }
            }
          }
        }
      }
    }
    
    // Add freeze panes for headers
    if (headers) {
      worksheet['!freeze'] = { xSplit: 0, ySplit: 1 }
    }
    
    // Add autofilter to headers
    if (headers) {
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
      worksheet['!autofilter'] = { ref: `A1:${XLSX.utils.encode_cell({ r: 0, c: range.e.c })}` }
    }
    
    // Set row heights for better readability
    if (!worksheet['!rows']) worksheet['!rows'] = []
    if (headers) {
      worksheet['!rows'][0] = { hpt: 25 } // Header row height
    }
    for (let i = 1; i < (data.length + (headers ? 1 : 0)); i++) {
      worksheet['!rows'][i] = { hpt: 20 } // Data row height
    }
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    
    // Set workbook properties
    workbook.Props = {
      Title: sheetName,
      Subject: 'Equipment Inspection Data',
      Author: 'Vale Equipment Management System',
      CreatedDate: new Date(),
      Company: 'Vale',
      Category: 'Equipment Management'
    }
    
    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, filename, { 
      bookType: 'xlsx',
      type: 'buffer',
      compression: true
    })
  } catch (error) {
    console.error('Error exporting to Excel:', error)
    throw new Error('Failed to export data to Excel')
  }
}

// Utility function to safely extract nested object values
const safeGet = (obj: any, path: string, defaultValue: any = '') => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : defaultValue
  }, obj)
}

// Utility function to format dates consistently
const formatExcelDate = (dateString: string | Date) => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch {
    return dateString
  }
}

// Winding Resistance export function - Enhanced
export const exportWindingResistanceToExcel = (records: any[], filtered: boolean = false) => {
  const headers = [
    'Motor No',
    'Equipment Name',
    'Equipment Type',
    'Inspection Date',
    'Done By',
    'Winding Resistance R-Y (Ω)',
    'Winding Resistance Y-B (Ω)', 
    'Winding Resistance R-B (Ω)',
    'IR UG 1min (GΩ)',
    'IR UG 10min (GΩ)',
    'IR VG 1min (GΩ)',
    'IR VG 10min (GΩ)',
    'IR WG 1min (GΩ)',
    'IR WG 10min (GΩ)',
    'Primary PI UG 1min (GΩ)',
    'Primary PI UG 10min (GΩ)',
    'Primary PI VG 1min (GΩ)',
    'Primary PI VG 10min (GΩ)',
    'Primary PI WG 1min (GΩ)',
    'Primary PI WG 10min (GΩ)',
    'Primary PI Mode',
    'Primary PI Result',
    'DAR UG 30sec (GΩ)',
    'DAR UG 1min (GΩ)',
    'DAR VG 30sec (GΩ)',
    'DAR VG 1min (GΩ)',
    'DAR WG 30sec (GΩ)',
    'DAR WG 1min (GΩ)',
    'DAR UG Result',
    'DAR VG Result',
    'DAR WG Result',
    'Status',
    'Remarks'
  ]

  const data = records.map(record => {
    const avgIR = (
      safeGet(record, 'irValues.ug_1min', 0) + 
      safeGet(record, 'irValues.vg_1min', 0) + 
      safeGet(record, 'irValues.wg_1min', 0)
    ) / 3
    const status = avgIR >= 10 ? 'Good (≥10 GΩ)' : avgIR >= 1 ? 'Acceptable (1-10 GΩ)' : 'Poor (<1 GΩ)'
    
    // Get Primary PI data
    const primaryPI = safeGet(record, 'primary5kVPI', {}) || safeGet(record, 'primaryPI', {})
    
    return [
      safeGet(record, 'motorNo', ''),
      safeGet(record, 'equipment.equipmentName', ''),
      safeGet(record, 'equipment.equipmentType', 'Motor'),
      formatExcelDate(safeGet(record, 'inspectionDate', '')),
      safeGet(record, 'doneBy', ''),
      `${safeGet(record, 'windingResistance.ry', 0)} Ω`,
      `${safeGet(record, 'windingResistance.yb', 0)} Ω`,
      `${safeGet(record, 'windingResistance.rb', 0)} Ω`,
      `${safeGet(record, 'irValues.ug_1min', 0)} GΩ (Min: ≥1.0)`,
      `${safeGet(record, 'irValues.ug_10min', 0)} GΩ`,
      `${safeGet(record, 'irValues.vg_1min', 0)} GΩ (Min: ≥1.0)`,
      `${safeGet(record, 'irValues.vg_10min', 0)} GΩ`,
      `${safeGet(record, 'irValues.wg_1min', 0)} GΩ (Min: ≥1.0)`,
      `${safeGet(record, 'irValues.wg_10min', 0)} GΩ`,
      `${safeGet(primaryPI, 'ug_1min', 0)} GΩ`,
      `${safeGet(primaryPI, 'ug_10min', 0)} GΩ`,
      `${safeGet(primaryPI, 'vg_1min', 0)} GΩ`,
      `${safeGet(primaryPI, 'vg_10min', 0)} GΩ`,
      `${safeGet(primaryPI, 'wg_1min', 0)} GΩ`,
      `${safeGet(primaryPI, 'wg_10min', 0)} GΩ`,
      safeGet(primaryPI, 'pi_mode', 'manual').charAt(0).toUpperCase() + safeGet(primaryPI, 'pi_mode', 'manual').slice(1),
      `${safeGet(primaryPI, 'pi_result', 0)} (Min: ≥2.0)`,
      `${safeGet(record, 'darValues.ug_30sec', 0)} GΩ`,
      `${safeGet(record, 'darValues.ug_1min', 0)} GΩ`,
      `${safeGet(record, 'darValues.vg_30sec', 0)} GΩ`,
      `${safeGet(record, 'darValues.vg_1min', 0)} GΩ`,
      `${safeGet(record, 'darValues.wg_30sec', 0)} GΩ`,
      `${safeGet(record, 'darValues.wg_1min', 0)} GΩ`,
      `${safeGet(record, 'darValues.results.ug_result', 0)} (Min: ≥1.25)`,
      `${safeGet(record, 'darValues.results.vg_result', 0)} (Min: ≥1.25)`,
      `${safeGet(record, 'darValues.results.wg_result', 0)} (Min: ≥1.25)`,
      status,
      safeGet(record, 'remarks', '')
    ]
  })

  const columnWidths = [15, 25, 15, 15, 15, 18, 18, 18, 20, 20, 20, 20, 20, 20, 18, 18, 18, 18, 18, 18, 15, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 20, 30]
  const filename = `winding-resistance-${filtered ? 'filtered-' : ''}${new Date().toISOString().split('T')[0]}.xlsx`
  
  exportToExcel({
    filename,
    sheetName: 'Winding Resistance Tests',
    data,
    headers,
    columnWidths,
    headerStyle: true,
    cellStyles: true
  })
}

// Carbon Brush export function - Enhanced
export const exportCarbonBrushToExcel = (records: any[], filtered: boolean = false) => {
  const headers = [
    'TAG NO',
    'Equipment Name',
    'Equipment Type',
    'Brush Type',
    'Inspection Date',
    'Work Order No',
    'Done By',
    '1A Inner (mm)',
    '1A Center (mm)',
    '1A Outer (mm)',
    '1B Inner (mm)',
    '1B Center (mm)',
    '1B Outer (mm)',
    '2A Inner (mm)',
    '2A Center (mm)',
    '2A Outer (mm)',
    '2B Inner (mm)',
    '2B Center (mm)',
    '2B Outer (mm)',
    '3A Inner (mm)',
    '3A Center (mm)',
    '3A Outer (mm)',
    '3B Inner (mm)',
    '3B Center (mm)',
    '3B Outer (mm)',
    '4A Inner (mm)',
    '4A Center (mm)',
    '4A Outer (mm)',
    '4B Inner (mm)',
    '4B Center (mm)',
    '4B Outer (mm)',
    '5A Inner (mm)',
    '5A Center (mm)',
    '5A Outer (mm)',
    '5B Inner (mm)',
    '5B Center (mm)',
    '5B Outer (mm)',
    'Slip Ring Thickness (mm)',
    'Slip Ring IR (1 Minute) (GΩ)',
    'Status',
    'Remarks'
  ]

  const data = records.map(record => {
    // Calculate status based on measurements
    const measurements = record.measurements || {}
    const brushValues = Object.values(measurements)
      .filter(val => val !== undefined && val !== null && typeof val === 'number' && val > 0)
      .map(val => val as number)
    
    const minBrush = brushValues.length > 0 ? Math.min(...brushValues) : 0
    const slipRingIr = record.slipRingIr || 0
    
    let status = 'Good'
    if (minBrush < 25) status = 'Replace Required (H<25mm)'
    else if (slipRingIr < 2.0) status = 'IR Below Limit (<2.0 GΩ)'
    else if (minBrush < 30) status = 'Monitor'
    
    return [
      safeGet(record, 'tagNo', ''),
      safeGet(record, 'equipmentName', '') || safeGet(record, 'equipment.equipmentName', ''),
      safeGet(record, 'equipment.equipmentType', 'Motor'),
      safeGet(record, 'brushType', 'C80X'),
      formatExcelDate(safeGet(record, 'inspectionDate', '')),
      safeGet(record, 'workOrderNo', ''),
      safeGet(record, 'doneBy', ''),
      safeGet(record, 'measurements.1A_inner', 0),
      safeGet(record, 'measurements.1A_center', 0),
      safeGet(record, 'measurements.1A_outer', 0),
      safeGet(record, 'measurements.1B_inner', 0),
      safeGet(record, 'measurements.1B_center', 0),
      safeGet(record, 'measurements.1B_outer', 0),
      safeGet(record, 'measurements.2A_inner', 0),
      safeGet(record, 'measurements.2A_center', 0),
      safeGet(record, 'measurements.2A_outer', 0),
      safeGet(record, 'measurements.2B_inner', 0),
      safeGet(record, 'measurements.2B_center', 0),
      safeGet(record, 'measurements.2B_outer', 0),
      safeGet(record, 'measurements.3A_inner', 0),
      safeGet(record, 'measurements.3A_center', 0),
      safeGet(record, 'measurements.3A_outer', 0),
      safeGet(record, 'measurements.3B_inner', 0),
      safeGet(record, 'measurements.3B_center', 0),
      safeGet(record, 'measurements.3B_outer', 0),
      safeGet(record, 'measurements.4A_inner', 0),
      safeGet(record, 'measurements.4A_center', 0),
      safeGet(record, 'measurements.4A_outer', 0),
      safeGet(record, 'measurements.4B_inner', 0),
      safeGet(record, 'measurements.4B_center', 0),
      safeGet(record, 'measurements.4B_outer', 0),
      safeGet(record, 'measurements.5A_inner', 0),
      safeGet(record, 'measurements.5A_center', 0),
      safeGet(record, 'measurements.5A_outer', 0),
      safeGet(record, 'measurements.5B_inner', 0),
      safeGet(record, 'measurements.5B_center', 0),
      safeGet(record, 'measurements.5B_outer', 0),
      `${safeGet(record, 'slipRingThickness', 0)} (Range: 12-15mm)`,
      `${safeGet(record, 'slipRingIr', 0)} (Min: ≥2.0 GΩ)`,
      status,
      safeGet(record, 'remarks', '')
    ]
  })

  const columnWidths = [15, 25, 15, 12, 15, 15, 15, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 25, 25, 20, 30]
  const filename = `carbon-brush-${filtered ? 'filtered-' : ''}${new Date().toISOString().split('T')[0]}.xlsx`
  
  exportToExcel({
    filename,
    sheetName: 'Carbon Brush Inspections',
    data,
    headers,
    columnWidths,
    headerStyle: true,
    cellStyles: true
  })
}

// Equipment export function - Enhanced
export const exportEquipmentToExcel = (equipment: any[], filtered: boolean = false) => {
  const headers = [
    'TAG NO',
    'Equipment Name',
    'Equipment Type',
    'Location',
    'Installation Date',
    'QR Code',
    'Carbon Brush Records',
    'Winding Resistance Records',
    'Total Inspections',
    'Created Date'
  ]

  const data = equipment.map(item => [
    safeGet(item, 'tagNo', ''),
    safeGet(item, 'equipmentName', ''),
    safeGet(item, 'equipmentType', ''),
    safeGet(item, 'location', '') || 'Not specified',
    item.installationDate ? formatExcelDate(item.installationDate) : 'Not specified',
    safeGet(item, 'qrCode', '') || 'Not generated',
    safeGet(item, 'carbonBrushCount', 0),
    safeGet(item, 'windingResistanceCount', 0),
    (safeGet(item, 'carbonBrushCount', 0) + safeGet(item, 'windingResistanceCount', 0)),
    formatExcelDate(safeGet(item, 'createdAt', ''))
  ])

  const columnWidths = [15, 25, 15, 15, 15, 20, 18, 22, 16, 12]
  const filename = `equipment-${filtered ? 'filtered-' : ''}${new Date().toISOString().split('T')[0]}.xlsx`
  
  exportToExcel({
    filename,
    sheetName: 'Equipment List',
    data,
    headers,
    columnWidths,
    headerStyle: true,
    cellStyles: true
  })
}

// Single record detailed export for winding resistance - Enhanced with Ultra Professional Formatting
// Single record detailed export for winding resistance - Standard Table Format
export const exportSingleWindingResistanceToExcel = (record: any) => {
  // Get data safely (handles both legacy and new format)
  const primaryPI = safeGet(record, 'primary5kVPI', {}) || safeGet(record, 'primaryPI', {})
  const irVals = record.irValues?.values || record.irValues || {}
  const windingVals = record.windingResistance?.values || record.windingResistance || {}
  const windingUnits = record.windingResistance?.units || { ry: 'Ω', yb: 'Ω', rb: 'Ω' }
  const darVals = record.darValues?.values || record.darValues || {}
  
  // Create data array in standard Excel table format (exactly like your example)
  const data = [
    // Header Row
    [
      'Motor No', 'Equipment Name', 'Equipment Type', 'Inspection Date', 'Done By', 'Work Holder',
      'Winding Resistance R-Y (Ω)', 'Winding Resistance Y-B (Ω)', 'Winding Resistance R-B (Ω)',
      'IR UG 1min (GΩ)', 'IR UG 10min (GΩ)', 'IR VG 1min (GΩ)', 'IR VG 10min (GΩ)', 'IR WG 1min (GΩ)', 'IR WG 10min (GΩ)',
      'PI UG 1min (GΩ)', 'PI UG 10min (GΩ)', 'PI VG 1min (GΩ)', 'PI VG 10min (GΩ)', 'PI WG 1min (GΩ)', 'PI WG 10min (GΩ)',
      'PI Mode', 'PI Result', 
      'DAR UG 30sec (GΩ)', 'DAR UG 1min (GΩ)', 'DAR VG 30sec (GΩ)', 'DAR VG 1min (GΩ)', 'DAR WG 30sec (GΩ)', 'DAR WG 1min (GΩ)',
      'DAR UG Result', 'DAR VG Result', 'DAR WG Result', 'Status', 'Remarks'
    ],
    
    // Data Row
    [
      safeGet(record, 'motorNo', ''),
      safeGet(record, 'equipment.equipmentName', ''),
      safeGet(record, 'equipment.equipmentType', 'Motor'),
      formatExcelDate(safeGet(record, 'inspectionDate', '')),
      safeGet(record, 'doneBy', ''),
      safeGet(record, 'workHolder', ''),
      
      // Winding Resistance values with units
      `${windingVals.ry || 0} ${windingUnits.ry || 'Ω'}`,
      `${windingVals.yb || 0} ${windingUnits.yb || 'Ω'}`,
      `${windingVals.rb || 0} ${windingUnits.rb || 'Ω'}`,
      
      // IR values with minimum requirements
      `${irVals.ug_1min || 0} GΩ (Min: ≥1.0)`,
      `${irVals.ug_10min || 0} GΩ`,
      `${irVals.vg_1min || 0} GΩ (Min: ≥1.0)`,
      `${irVals.vg_10min || 0} GΩ`,
      `${irVals.wg_1min || 0} GΩ (Min: ≥1.0)`,
      `${irVals.wg_10min || 0} GΩ`,
      
      // PI values
      `${safeGet(primaryPI, 'ug_pi_1min', 0)} GΩ`,
      `${safeGet(primaryPI, 'ug_pi_10min', 0)} GΩ`,
      `${safeGet(primaryPI, 'vg_pi_1min', 0)} GΩ`,
      `${safeGet(primaryPI, 'vg_pi_10min', 0)} GΩ`,
      `${safeGet(primaryPI, 'wg_pi_1min', 0)} GΩ`,
      `${safeGet(primaryPI, 'wg_pi_10min', 0)} GΩ`,
      
      // PI Mode and Result
      safeGet(primaryPI, 'mode', 'Manual'),
      `${safeGet(primaryPI, 'pi_result', 0)} (Min: ≥2.0)`,
      
      // DAR values
      `${darVals.ug_30sec || 0} GΩ`,
      `${darVals.ug_1min || 0} GΩ`,
      `${darVals.vg_30sec || 0} GΩ`,
      `${darVals.vg_1min || 0} GΩ`,
      `${darVals.wg_30sec || 0} GΩ`,
      `${darVals.wg_1min || 0} GΩ`,
      
      // DAR Results
      `${darVals.ug_dar || 0} (Min: ≥1.25)`,
      `${darVals.vg_dar || 0} (Min: ≥1.25)`,
      `${darVals.wg_dar || 0} (Min: ≥1.25)`,
      
      // Overall Status
      (() => {
        const avgIR = ((irVals.ug_1min || 0) + (irVals.vg_1min || 0) + (irVals.wg_1min || 0)) / 3
        if (avgIR >= 10) return 'Good (≥10 GΩ)'
        if (avgIR >= 1) return 'Acceptable (1-10 GΩ)'
        return 'Poor (<1 GΩ)'
      })(),
      
      safeGet(record, 'remarks', '')
    ]
  ]

  // Create workbook with standard table formatting
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet(data)
  
  // Set optimized column widths for all columns
  worksheet['!cols'] = [
    { wch: 15 }, // Motor No
    { wch: 25 }, // Equipment Name
    { wch: 15 }, // Equipment Type
    { wch: 15 }, // Inspection Date
    { wch: 20 }, // Done By
    { wch: 15 }, // Work Holder
    { wch: 18 }, // Winding Resistance R-Y
    { wch: 18 }, // Winding Resistance Y-B
    { wch: 18 }, // Winding Resistance R-B
    { wch: 15 }, // IR UG 1min
    { wch: 15 }, // IR UG 10min
    { wch: 15 }, // IR VG 1min
    { wch: 15 }, // IR VG 10min
    { wch: 15 }, // IR WG 1min
    { wch: 15 }, // IR WG 10min
    { wch: 15 }, // PI UG 1min
    { wch: 15 }, // PI UG 10min
    { wch: 15 }, // PI VG 1min
    { wch: 15 }, // PI VG 10min
    { wch: 15 }, // PI WG 1min
    { wch: 15 }, // PI WG 10min
    { wch: 12 }, // PI Mode
    { wch: 15 }, // PI Result
    { wch: 15 }, // DAR UG 30sec
    { wch: 15 }, // DAR UG 1min
    { wch: 15 }, // DAR VG 30sec
    { wch: 15 }, // DAR VG 1min
    { wch: 15 }, // DAR WG 30sec
    { wch: 15 }, // DAR WG 1min
    { wch: 18 }, // DAR UG Result
    { wch: 18 }, // DAR VG Result
    { wch: 18 }, // DAR WG Result
    { wch: 20 }, // Status
    { wch: 30 }  // Remarks
  ]

  // Professional styling for standard Excel table
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
  for (let row = 0; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
      if (!worksheet[cellAddress]) continue
      
      const cellValue = worksheet[cellAddress].v
      
      // Header row styling
      if (row === 0) {
        worksheet[cellAddress].s = {
          font: { bold: true, sz: 11, color: { rgb: "FFFFFF" }, name: "Calibri" },
          fill: { fgColor: { rgb: "1F4E79" }, patternType: "solid" },
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
          border: {
            top: { style: "thick", color: { rgb: "1F4E79" } },
            bottom: { style: "thick", color: { rgb: "1F4E79" } },
            left: { style: "medium", color: { rgb: "1F4E79" } },
            right: { style: "medium", color: { rgb: "1F4E79" } }
          }
        }
      }
      // Data row styling
      else {
        worksheet[cellAddress].s = {
          font: { sz: 10, name: "Calibri", color: { rgb: "2C3E50" } },
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
          border: {
            top: { style: "thin", color: { rgb: "D5DBDB" } },
            bottom: { style: "thin", color: { rgb: "D5DBDB" } },
            left: { style: "thin", color: { rgb: "D5DBDB" } },
            right: { style: "thin", color: { rgb: "D5DBDB" } }
          }
        }
        
        // Alternating row colors for better readability
        if (row % 2 === 0) {
          worksheet[cellAddress].s.fill = { fgColor: { rgb: "F8F9FA" }, patternType: "solid" }
        } else {
          worksheet[cellAddress].s.fill = { fgColor: { rgb: "FFFFFF" }, patternType: "solid" }
        }
        
        // Status column conditional formatting
        if (typeof cellValue === 'string' && cellValue.includes('Good')) {
          worksheet[cellAddress].s.font = { bold: true, sz: 10, color: { rgb: "16A085" }, name: "Calibri" }
          worksheet[cellAddress].s.fill = { fgColor: { rgb: "E8F6F3" }, patternType: "solid" }
        } else if (typeof cellValue === 'string' && cellValue.includes('Acceptable')) {
          worksheet[cellAddress].s.font = { bold: true, sz: 10, color: { rgb: "F39C12" }, name: "Calibri" }
          worksheet[cellAddress].s.fill = { fgColor: { rgb: "FEF9E7" }, patternType: "solid" }
        } else if (typeof cellValue === 'string' && cellValue.includes('Poor')) {
          worksheet[cellAddress].s.font = { bold: true, sz: 10, color: { rgb: "E74C3C" }, name: "Calibri" }
          worksheet[cellAddress].s.fill = { fgColor: { rgb: "FADBD8" }, patternType: "solid" }
        }
      }
    }
  }
  
  // Set row heights for better appearance
  worksheet['!rows'] = []
  worksheet['!rows'][0] = { hpt: 30 } // Header row height
  worksheet['!rows'][1] = { hpt: 25 } // Data row height
  
  // Add table formatting
  worksheet['!autofilter'] = { ref: `A1:AH2` }
  
  // Set margins
  worksheet['!margins'] = {
    left: 0.7, right: 0.7, top: 1.0, bottom: 1.0, header: 0.3, footer: 0.3
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Winding Resistance Report')
  
  const filename = `VALE-Winding-Resistance-${safeGet(record, 'motorNo', 'unknown')}-${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(workbook, filename)
}

// Single record detailed export for carbon brush - Enhanced with Ultra Professional Formatting
export const exportSingleCarbonBrushToExcel = (record: any) => {
  // Calculate status based on measurements
  const measurements = record.measurements || {}
  const brushValues = Object.values(measurements)
    .filter(val => val !== undefined && val !== null && typeof val === 'number' && val > 0)
    .map(val => val as number)
  
  const minBrush = brushValues.length > 0 ? Math.min(...brushValues) : 0
  const slipRingIr = record.slipRingIr || 0
  
  let status = 'GOOD'
  let statusColor = '16A085' // Green
  let statusBg = 'E8F6F3'
  if (minBrush < 25) {
    status = 'REPLACE REQUIRED (H<25mm)'
    statusColor = 'E74C3C' // Red
    statusBg = 'FADBD8'
  } else if (slipRingIr < 2.0) {
    status = 'IR BELOW LIMIT (<2.0 GΩ)'
    statusColor = 'E74C3C' // Red
    statusBg = 'FADBD8'
  } else if (minBrush < 30) {
    status = 'MONITOR'
    statusColor = 'F39C12' // Orange
    statusBg = 'FEF9E7'
  }
  
  const data = [
    ['CARBON BRUSH INSPECTION REPORT', ''],
    ['Vale Equipment Management System - Professional Report', ''],
    ['═══════════════════════════════════════════════════════════════', ''],
    ['', ''],
    ['📊 EQUIPMENT INFORMATION', ''],
    ['━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', ''],
    ['TAG NO', safeGet(record, 'tagNo', '')],
    ['Equipment Name', safeGet(record, 'equipmentName', '') || safeGet(record, 'equipment.equipmentName', '')],
    ['Equipment Type', safeGet(record, 'equipment.equipmentType', 'Motor')],
    ['Brush Type', safeGet(record, 'brushType', 'C80X')],
    ['', ''],
    ['📋 INSPECTION DETAILS', ''],
    ['━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', ''],
    ['Inspection Date', formatExcelDate(safeGet(record, 'inspectionDate', ''))],
    ['Work Order No', safeGet(record, 'workOrderNo', '') || 'N/A'],
    ['Inspector', safeGet(record, 'doneBy', '') || 'Not specified'],
    ['', ''],
    ['🔧 CARBON BRUSH MEASUREMENTS', ''],
    ['━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', ''],
    ['📏 Reference Standards: H≥25mm, B=32mm, L=50mm', ''],
    ['', ''],
    ['Brush Holder 1A Inner (mm)', `${safeGet(record, 'measurements.1A_inner', 0)} mm`],
    ['Brush Holder 1A Center (mm)', `${safeGet(record, 'measurements.1A_center', 0)} mm`],
    ['Brush Holder 1A Outer (mm)', `${safeGet(record, 'measurements.1A_outer', 0)} mm`],
    ['Brush Holder 1B Inner (mm)', `${safeGet(record, 'measurements.1B_inner', 0)} mm`],
    ['Brush Holder 1B Center (mm)', `${safeGet(record, 'measurements.1B_center', 0)} mm`],
    ['Brush Holder 1B Outer (mm)', `${safeGet(record, 'measurements.1B_outer', 0)} mm`],
    ['Brush Holder 2A Inner (mm)', `${safeGet(record, 'measurements.2A_inner', 0)} mm`],
    ['Brush Holder 2A Center (mm)', `${safeGet(record, 'measurements.2A_center', 0)} mm`],
    ['Brush Holder 2A Outer (mm)', `${safeGet(record, 'measurements.2A_outer', 0)} mm`],
    ['Brush Holder 2B Inner (mm)', `${safeGet(record, 'measurements.2B_inner', 0)} mm`],
    ['Brush Holder 2B Center (mm)', `${safeGet(record, 'measurements.2B_center', 0)} mm`],
    ['Brush Holder 2B Outer (mm)', `${safeGet(record, 'measurements.2B_outer', 0)} mm`],
    ['Brush Holder 3A Inner (mm)', `${safeGet(record, 'measurements.3A_inner', 0)} mm`],
    ['Brush Holder 3A Center (mm)', `${safeGet(record, 'measurements.3A_center', 0)} mm`],
    ['Brush Holder 3A Outer (mm)', `${safeGet(record, 'measurements.3A_outer', 0)} mm`],
    ['Brush Holder 3B Inner (mm)', `${safeGet(record, 'measurements.3B_inner', 0)} mm`],
    ['Brush Holder 3B Center (mm)', `${safeGet(record, 'measurements.3B_center', 0)} mm`],
    ['Brush Holder 3B Outer (mm)', `${safeGet(record, 'measurements.3B_outer', 0)} mm`],
    ['Brush Holder 4A Inner (mm)', `${safeGet(record, 'measurements.4A_inner', 0)} mm`],
    ['Brush Holder 4A Center (mm)', `${safeGet(record, 'measurements.4A_center', 0)} mm`],
    ['Brush Holder 4A Outer (mm)', `${safeGet(record, 'measurements.4A_outer', 0)} mm`],
    ['Brush Holder 4B Inner (mm)', `${safeGet(record, 'measurements.4B_inner', 0)} mm`],
    ['Brush Holder 4B Center (mm)', `${safeGet(record, 'measurements.4B_center', 0)} mm`],
    ['Brush Holder 4B Outer (mm)', `${safeGet(record, 'measurements.4B_outer', 0)} mm`],
    ['Brush Holder 5A Inner (mm)', `${safeGet(record, 'measurements.5A_inner', 0)} mm`],
    ['Brush Holder 5A Center (mm)', `${safeGet(record, 'measurements.5A_center', 0)} mm`],
    ['Brush Holder 5A Outer (mm)', `${safeGet(record, 'measurements.5A_outer', 0)} mm`],
    ['Brush Holder 5B Inner (mm)', `${safeGet(record, 'measurements.5B_inner', 0)} mm`],
    ['Brush Holder 5B Center (mm)', `${safeGet(record, 'measurements.5B_center', 0)} mm`],
    ['Brush Holder 5B Outer (mm)', `${safeGet(record, 'measurements.5B_outer', 0)} mm`],
    ['', ''],
    ['⚡ SLIP RING MEASUREMENTS', ''],
    ['━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', ''],
    ['Slip Ring Thickness', `${safeGet(record, 'slipRingThickness', 0)} mm (Standard: 12-15mm)`],
    ['Slip Ring IR (1 Minute)', `${safeGet(record, 'slipRingIr', 0)} GΩ (Min Required: ≥2.0 GΩ)`],
    ['', ''],
    ['📈 ASSESSMENT RESULTS', ''],
    ['━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', ''],
    ['🔍 Overall Status', status],
    ['📏 Minimum Brush Height', `${minBrush} mm`],
    ['⚠️  Critical Threshold', '25 mm (Replace if below)'],
    ['⚡ IR Threshold', '2.0 GΩ (Minimum acceptable)'],
    ['', ''],
    ['💬 INSPECTOR REMARKS', ''],
    ['━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', ''],
    ['Notes', safeGet(record, 'remarks', 'No specific remarks recorded')],
    ['', ''],
    ['📅 REPORT INFORMATION', ''],
    ['━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', ''],
    ['Report Generated', formatExcelDate(new Date())],
    ['Generated By', 'Vale Equipment Management System v2.0'],
    ['Report Type', 'Carbon Brush Inspection - Detailed Analysis'],
    ['Document Security', 'Internal Use - Equipment Maintenance']
  ]

  // Create workbook with ultra professional styling
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet(data)
  
  // Set optimized column widths
  worksheet['!cols'] = [{ wch: 45 }, { wch: 35 }]
  
  // Ultra professional styling
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
  for (let row = 0; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
      if (!worksheet[cellAddress]) continue
      
      const cellValue = worksheet[cellAddress].v
      
      // Main title (row 0)
      if (row === 0) {
        worksheet[cellAddress].s = {
          font: { bold: true, sz: 18, color: { rgb: "FFFFFF" }, name: "Calibri" },
          fill: { fgColor: { rgb: "1B4F72" }, patternType: "solid" },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thick", color: { rgb: "0B2A42" } },
            bottom: { style: "thick", color: { rgb: "0B2A42" } },
            left: { style: "thick", color: { rgb: "0B2A42" } },
            right: { style: "thick", color: { rgb: "0B2A42" } }
          }
        }
      }
      // Subtitle (row 1)
      else if (row === 1) {
        worksheet[cellAddress].s = {
          font: { italic: true, sz: 12, color: { rgb: "2C3E50" }, name: "Calibri" },
          fill: { fgColor: { rgb: "D5DBDB" }, patternType: "solid" },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "85929E" } },
            bottom: { style: "medium", color: { rgb: "85929E" } },
            left: { style: "medium", color: { rgb: "85929E" } },
            right: { style: "medium", color: { rgb: "85929E" } }
          }
        }
      }
      // Decorative divider (row 2)
      else if (row === 2) {
        worksheet[cellAddress].s = {
          font: { sz: 8, color: { rgb: "5D6D7E" }, name: "Calibri" },
          fill: { fgColor: { rgb: "EBF5FB" }, patternType: "solid" },
          alignment: { horizontal: "center", vertical: "center" }
        }
      }
      // Section headers with emojis
      else if (col === 0 && typeof cellValue === 'string' && cellValue.includes('📊') || cellValue.includes('📋') || cellValue.includes('🔧') || cellValue.includes('⚡') || cellValue.includes('📈') || cellValue.includes('💬') || cellValue.includes('📅')) {
        worksheet[cellAddress].s = {
          font: { bold: true, sz: 14, color: { rgb: "FFFFFF" }, name: "Calibri" },
          fill: { fgColor: { rgb: "2874A6" }, patternType: "solid" },
          alignment: { horizontal: "left", vertical: "center" },
          border: {
            top: { style: "thick", color: { rgb: "1B4F72" } },
            bottom: { style: "thick", color: { rgb: "1B4F72" } },
            left: { style: "thick", color: { rgb: "1B4F72" } },
            right: { style: "thick", color: { rgb: "1B4F72" } }
          }
        }
      }
      // Section dividers
      else if (col === 0 && typeof cellValue === 'string' && cellValue.includes('━')) {
        worksheet[cellAddress].s = {
          font: { sz: 8, color: { rgb: "2874A6" }, name: "Calibri" },
          fill: { fgColor: { rgb: "EBF5FB" }, patternType: "solid" },
          alignment: { horizontal: "left", vertical: "center" }
        }
      }
      // Status row with dynamic coloring
      else if (cellValue === status) {
        worksheet[cellAddress].s = {
          font: { bold: true, sz: 12, color: { rgb: statusColor }, name: "Calibri" },
          fill: { fgColor: { rgb: statusBg }, patternType: "solid" },
          alignment: { horizontal: "left", vertical: "center" },
          border: {
            top: { style: "medium", color: { rgb: statusColor } },
            bottom: { style: "medium", color: { rgb: statusColor } },
            left: { style: "medium", color: { rgb: statusColor } },
            right: { style: "medium", color: { rgb: statusColor } }
          }
        }
      }
      // Reference standards row
      else if (col === 0 && typeof cellValue === 'string' && cellValue.includes('📏 Reference')) {
        worksheet[cellAddress].s = {
          font: { italic: true, sz: 10, color: { rgb: "7D3C98" }, name: "Calibri" },
          fill: { fgColor: { rgb: "F4ECF7" }, patternType: "solid" },
          alignment: { horizontal: "left", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "BB8FCE" } },
            bottom: { style: "thin", color: { rgb: "BB8FCE" } },
            left: { style: "thin", color: { rgb: "BB8FCE" } },
            right: { style: "thin", color: { rgb: "BB8FCE" } }
          }
        }
      }
      // Measurement value highlighting
      else if (col === 1 && typeof cellValue === 'string' && cellValue.includes('mm') && !cellValue.includes('Standard') && !cellValue.includes('Min Required')) {
        const value = parseFloat(cellValue)
        let valueColor = '2ECC71' // Green for good values
        let valueBg = 'E8F8F5'
        
        if (value < 25) {
          valueColor = 'E74C3C' // Red for critical
          valueBg = 'FADBD8'
        } else if (value < 30) {
          valueColor = 'F39C12' // Orange for warning
          valueBg = 'FEF9E7'
        }
        
        worksheet[cellAddress].s = {
          font: { bold: true, sz: 11, color: { rgb: valueColor }, name: "Calibri" },
          fill: { fgColor: { rgb: valueBg }, patternType: "solid" },
          alignment: { horizontal: "left", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: valueColor } },
            bottom: { style: "thin", color: { rgb: valueColor } },
            left: { style: "thin", color: { rgb: valueColor } },
            right: { style: "thin", color: { rgb: valueColor } }
          }
        }
      }
      // Regular data cells
      else {
        worksheet[cellAddress].s = {
          font: { sz: 10, name: "Calibri", color: { rgb: "2C3E50" } },
          alignment: { horizontal: col === 0 ? "left" : "left", vertical: "center", wrapText: true },
          border: {
            top: { style: "thin", color: { rgb: "D5DBDB" } },
            bottom: { style: "thin", color: { rgb: "D5DBDB" } },
            left: { style: "thin", color: { rgb: "D5DBDB" } },
            right: { style: "thin", color: { rgb: "D5DBDB" } }
          }
        }
        
        // Alternating row colors
        if (row % 2 === 0) {
          worksheet[cellAddress].s.fill = { fgColor: { rgb: "FAFAFA" }, patternType: "solid" }
        } else {
          worksheet[cellAddress].s.fill = { fgColor: { rgb: "FFFFFF" }, patternType: "solid" }
        }
      }
    }
  }
  
  // Enhanced row heights
  worksheet['!rows'] = []
  worksheet['!rows'][0] = { hpt: 35 } // Main title
  worksheet['!rows'][1] = { hpt: 25 } // Subtitle
  worksheet['!rows'][2] = { hpt: 15 } // Divider
  for (let i = 3; i < data.length; i++) {
    if (data[i][0]?.includes('📊') || data[i][0]?.includes('📋') || data[i][0]?.includes('🔧') || 
        data[i][0]?.includes('⚡') || data[i][0]?.includes('📈') || data[i][0]?.includes('💬') || data[i][0]?.includes('📅')) {
      worksheet['!rows'][i] = { hpt: 25 } // Section headers
    } else if (data[i][0]?.includes('━')) {
      worksheet['!rows'][i] = { hpt: 10 } // Dividers
    } else {
      worksheet['!rows'][i] = { hpt: 20 } // Regular rows
    }
  }
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Carbon Brush Inspection')
  
  const filename = `VALE-Carbon-Brush-Report-${safeGet(record, 'tagNo', 'unknown')}-${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(workbook, filename)
}

// Thermography export function - Enhanced
export const exportThermographyToExcel = (records: any[], filtered = false) => {
  const headers = [
    'Transformer No',
    'Equipment Type',
    'Month',
    'Inspection Date',
    'MCCB R-Phase (°C)',
    'MCCB B-Phase (°C)',
    'MCCB C O/G-1 (°C)',
    'MCCB C O/G-2 (°C)',
    'MCCB Body Temp (°C)',
    'kV/mA',
    'SP/Min',
    'SCR Cooling Fins (°C)',
    'SCR Cooling Fan (°C)',
    'Panel Exhaust Fan (°C)',
    'MCC Forced Cooling Fan (°C)',
    'RDI68',
    'RDI69',
    'RDI70',
    'Max Temp (°C)',
    'Status',
    'Inspector',
    'Remarks'
  ]

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const data = records.map(record => {
    const measurements = record.measurements || {}
    
    // Calculate max temperature and status
    const temperatures = [
      measurements.mccbRPhase || 0,
      measurements.mccbBPhase || 0,
      measurements.mccbCOG1 || 0,
      measurements.mccbCOG2 || 0,
      measurements.mccbBodyTemp || 0,
      measurements.scrCoolingFinsTemp || 0
    ]
    const maxTemp = Math.max(...temperatures)
    
    let status = 'Normal'
    if (maxTemp > 80) status = 'Critical (>80°C)'
    else if (maxTemp > 60) status = 'Warning (>60°C)'
    else if (maxTemp > 40) status = 'Caution (>40°C)'

    return [
      safeGet(record, 'transformerNo', ''),
      safeGet(record, 'equipmentType', 'ESP'),
      months[safeGet(record, 'month', 1) - 1] || 'Unknown',
      formatExcelDate(safeGet(record, 'inspectionDate', '')),
      measurements.mccbRPhase || 0,
      measurements.mccbBPhase || 0,
      measurements.mccbCOG1 || 0,
      measurements.mccbCOG2 || 0,
      measurements.mccbBodyTemp || 0,
      measurements.kvMa || 0,
      measurements.spMin || 0,
      measurements.scrCoolingFinsTemp || 0,
      measurements.scrCoolingFan || 0,
      measurements.panelExhaustFan || 0,
      measurements.mccForcedCoolingFanTemp || 0,
      measurements.rdi68 || 0,
      measurements.rdi69 || 0,
      measurements.rdi70 || 0,
      maxTemp,
      status,
      safeGet(record, 'doneBy', ''),
      safeGet(record, 'remarks', '')
    ]
  })

  const columnWidths = [
    15, 15, 12, 15, 15, 15, 15, 15, 15, 10, 10, 
    18, 15, 18, 20, 10, 10, 10, 12, 18, 15, 30
  ]

  const filename = `thermography-${filtered ? 'filtered-' : ''}${new Date().toISOString().split('T')[0]}.xlsx`

  exportToExcel({
    filename,
    sheetName: 'ESP Thermography Records',
    data,
    headers,
    columnWidths,
    headerStyle: true,
    cellStyles: true
  })
}

// Single record detailed export for thermography - Enhanced with Professional Formatting
export const exportSingleThermographyToExcel = (record: any) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const measurements = record.measurements || {}
  
  // Calculate temperatures and status
  const temperatures = [
    measurements.mccbRPhase || 0,
    measurements.mccbBPhase || 0,
    measurements.mccbCOG1 || 0,
    measurements.mccbCOG2 || 0,
    measurements.mccbBodyTemp || 0,
    measurements.scrCoolingFinsTemp || 0
  ]
  const maxTemp = Math.max(...temperatures)
  
  let status = 'NORMAL'
  let statusColor = '16A085' // Green
  let statusBg = 'E8F6F3'
  
  if (maxTemp > 80) {
    status = 'CRITICAL (>80°C)'
    statusColor = 'E74C3C' // Red
    statusBg = 'FADBD8'
  } else if (maxTemp > 60) {
    status = 'WARNING (>60°C)'
    statusColor = 'E74C3C' // Red
    statusBg = 'FADBD8'
  } else if (maxTemp > 40) {
    status = 'CAUTION (>40°C)'
    statusColor = 'F39C12' // Orange
    statusBg = 'FEF9E7'
  }

  const data = [
    ['ESP MCC THERMOGRAPHY REPORT', ''],
    ['Vale Equipment Management System - Professional Analysis Report', ''],
    ['═══════════════════════════════════════════════════════════════', ''],
    ['', ''],
    ['🏭 EQUIPMENT INFORMATION', ''],
    ['━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', ''],
    ['Transformer No', safeGet(record, 'transformerNo', '')],
    ['Equipment Type', safeGet(record, 'equipmentType', 'ESP')],
    ['Equipment Name', safeGet(record, 'equipment.equipmentName', '') || `ESP Transformer ${safeGet(record, 'transformerNo', '')}`],
    ['', ''],
    ['📋 INSPECTION DETAILS', ''],
    ['━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', ''],
    ['Test Date', formatExcelDate(safeGet(record, 'inspectionDate', ''))],
    ['Month', months[safeGet(record, 'month', 1) - 1] || 'Unknown'],
    ['Inspector', safeGet(record, 'doneBy', '') || 'Not specified'],
    ['Test Standard', 'IEEE C57.91 / IEC 60076'],
    ['', ''],
    ['🌡️ TEMPERATURE MEASUREMENTS', ''],
    ['━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', ''],
    ['📊 Critical Thresholds: Normal <40°C, Caution 40-60°C, Warning 60-80°C, Critical >80°C', ''],
    ['', ''],
    ['🔌 MCCB Measurements', ''],
    ['MCCB R-Phase', `${measurements.mccbRPhase || 0}°C`],
    ['MCCB B-Phase', `${measurements.mccbBPhase || 0}°C`],
    ['MCCB C O/G-1', `${measurements.mccbCOG1 || 0}°C`],
    ['MCCB C O/G-2', `${measurements.mccbCOG2 || 0}°C`],
    ['MCCB Body Temperature', `${measurements.mccbBodyTemp || 0}°C`],
    ['', ''],
    ['🌀 COOLING SYSTEM MEASUREMENTS', ''],
    ['SCR Cooling Fins Temperature', `${measurements.scrCoolingFinsTemp || 0}°C`],
    ['SCR Cooling Fan', `${measurements.scrCoolingFan || 0}°C`],
    ['Panel Exhaust Fan', `${measurements.panelExhaustFan || 0}°C`],
    ['MCC Forced Cooling Fan', `${measurements.mccForcedCoolingFanTemp || 0}°C`],
    ['', ''],
    ['⚡ ELECTRICAL MEASUREMENTS', ''],
    ['━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', ''],
    ['kV/mA', `${measurements.kvMa || 0}`],
    ['SP/Min', `${measurements.spMin || 0} rpm`],
    ['RDI68', `${measurements.rdi68 || 0}`],
    ['RDI69', `${measurements.rdi69 || 0}`],
    ['RDI70', `${measurements.rdi70 || 0}`],
    ['', ''],
    ['🎯 OVERALL ASSESSMENT', ''],
    ['━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', ''],
    ['🌡️ Temperature Status', status],
    ['📊 Maximum Temperature', `${maxTemp}°C`],
    ['⚠️ Critical Threshold', '80°C (Immediate action required)'],
    ['🎯 Recommended Action', maxTemp > 80 ? 'Immediate shutdown and investigation' : maxTemp > 60 ? 'Schedule maintenance' : maxTemp > 40 ? 'Monitor closely' : 'Continue normal operation'],
    ['', ''],
    ['💬 INSPECTOR REMARKS', ''],
    ['━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', ''],
    ['Notes', safeGet(record, 'remarks', 'No specific remarks recorded')],
    ['', ''],
    ['📅 REPORT INFORMATION', ''],
    ['━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', ''],
    ['Report Generated', formatExcelDate(new Date())],
    ['Generated By', 'Vale Equipment Management System v2.0'],
    ['Report Type', 'ESP MCC Thermography - Comprehensive Analysis'],
    ['Document Security', 'Internal Use - Electrical Maintenance'],
    ['Next Test Due', 'As per maintenance schedule']
  ]

  // Create workbook with professional styling
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet(data)
  
  // Set optimized column widths
  worksheet['!cols'] = [{ wch: 50 }, { wch: 35 }]
  
  // Professional styling
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
  for (let row = 0; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
      if (!worksheet[cellAddress]) continue
      
      const cellValue = worksheet[cellAddress].v
      
      // Main title (row 0)
      if (row === 0) {
        worksheet[cellAddress].s = {
          font: { bold: true, sz: 18, color: { rgb: "FFFFFF" }, name: "Calibri" },
          fill: { fgColor: { rgb: "E67E22" }, patternType: "solid" },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thick", color: { rgb: "D35400" } },
            bottom: { style: "thick", color: { rgb: "D35400" } },
            left: { style: "thick", color: { rgb: "D35400" } },
            right: { style: "thick", color: { rgb: "D35400" } }
          }
        }
      }
      // Subtitle (row 1)
      else if (row === 1) {
        worksheet[cellAddress].s = {
          font: { italic: true, sz: 12, color: { rgb: "2C3E50" }, name: "Calibri" },
          fill: { fgColor: { rgb: "F8C471" }, patternType: "solid" },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "E67E22" } },
            bottom: { style: "medium", color: { rgb: "E67E22" } },
            left: { style: "medium", color: { rgb: "E67E22" } },
            right: { style: "medium", color: { rgb: "E67E22" } }
          }
        }
      }
      // Section headers with emojis
      else if (col === 0 && typeof cellValue === 'string' && (cellValue.includes('🏭') || cellValue.includes('📋') || 
        cellValue.includes('🌡️') || cellValue.includes('⚡') || cellValue.includes('🎯') || cellValue.includes('💬') || cellValue.includes('📅'))) {
        worksheet[cellAddress].s = {
          font: { bold: true, sz: 14, color: { rgb: "FFFFFF" }, name: "Calibri" },
          fill: { fgColor: { rgb: "E67E22" }, patternType: "solid" },
          alignment: { horizontal: "left", vertical: "center" },
          border: {
            top: { style: "thick", color: { rgb: "D35400" } },
            bottom: { style: "thick", color: { rgb: "D35400" } },
            left: { style: "thick", color: { rgb: "D35400" } },
            right: { style: "thick", color: { rgb: "D35400" } }
          }
        }
      }
      // Status row with dynamic coloring
      else if (cellValue === status) {
        worksheet[cellAddress].s = {
          font: { bold: true, sz: 12, color: { rgb: statusColor }, name: "Calibri" },
          fill: { fgColor: { rgb: statusBg }, patternType: "solid" },
          alignment: { horizontal: "left", vertical: "center" },
          border: {
            top: { style: "medium", color: { rgb: statusColor } },
            bottom: { style: "medium", color: { rgb: statusColor } },
            left: { style: "medium", color: { rgb: statusColor } },
            right: { style: "medium", color: { rgb: statusColor } }
          }
        }
      }
      // Temperature value highlighting
      else if (col === 1 && typeof cellValue === 'string' && cellValue.includes('°C')) {
        const tempValue = parseFloat(cellValue)
        let tempColor = '2ECC71' // Green for normal
        let tempBg = 'E8F8F5'
        
        if (tempValue > 80) {
          tempColor = 'E74C3C' // Red for critical
          tempBg = 'FADBD8'
        } else if (tempValue > 60) {
          tempColor = 'E74C3C' // Red for warning
          tempBg = 'FADBD8'
        } else if (tempValue > 40) {
          tempColor = 'F39C12' // Orange for caution
          tempBg = 'FEF9E7'
        }
        
        worksheet[cellAddress].s = {
          font: { bold: true, sz: 11, color: { rgb: tempColor }, name: "Calibri" },
          fill: { fgColor: { rgb: tempBg }, patternType: "solid" },
          alignment: { horizontal: "left", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: tempColor } },
            bottom: { style: "thin", color: { rgb: tempColor } },
            left: { style: "thin", color: { rgb: tempColor } },
            right: { style: "thin", color: { rgb: tempColor } }
          }
        }
      }
      // Regular data cells
      else {
        worksheet[cellAddress].s = {
          font: { sz: 10, name: "Calibri", color: { rgb: "2C3E50" } },
          alignment: { horizontal: col === 0 ? "left" : "left", vertical: "center", wrapText: true },
          border: {
            top: { style: "thin", color: { rgb: "D5DBDB" } },
            bottom: { style: "thin", color: { rgb: "D5DBDB" } },
            left: { style: "thin", color: { rgb: "D5DBDB" } },
            right: { style: "thin", color: { rgb: "D5DBDB" } }
          }
        }
        
        // Alternating row colors
        if (row % 2 === 0) {
          worksheet[cellAddress].s.fill = { fgColor: { rgb: "FAFAFA" }, patternType: "solid" }
        } else {
          worksheet[cellAddress].s.fill = { fgColor: { rgb: "FFFFFF" }, patternType: "solid" }
        }
      }
    }
  }
  
  // Enhanced row heights
  worksheet['!rows'] = []
  worksheet['!rows'][0] = { hpt: 35 } // Main title
  worksheet['!rows'][1] = { hpt: 25 } // Subtitle
  for (let i = 2; i < data.length; i++) {
    if (data[i][0]?.includes('🏭') || data[i][0]?.includes('📋') || data[i][0]?.includes('🌡️') || 
        data[i][0]?.includes('⚡') || data[i][0]?.includes('🎯') || data[i][0]?.includes('💬') || data[i][0]?.includes('📅')) {
      worksheet['!rows'][i] = { hpt: 25 } // Section headers
    } else {
      worksheet['!rows'][i] = { hpt: 20 } // Regular rows
    }
  }
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'ESP Thermography Report')
  
  const filename = `VALE-Thermography-Report-${safeGet(record, 'transformerNo', 'unknown')}-${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(workbook, filename)
}

// LRS Thermography export functions
export const exportLrsThermographyToExcel = (sessions: any[], filtered = false) => {
  try {
    const data = sessions.flatMap((session, sessionIndex) => {
      const baseData = [
        sessionIndex + 1,
        session.tagNumber || '',
        session.equipmentName || '',
        session.location || '',
        session.inspector || '',
        new Date(session.createdAt).toLocaleDateString(),
        session.temperatureRecords?.length || 0,
      ]
      
      if (session.temperatureRecords && session.temperatureRecords.length > 0) {
        return session.temperatureRecords.map((record: any, recordIndex: number) => [
          ...baseData,
          record.point || '',
          record.description || '',
          record.temperature ? `${record.temperature}°C` : '',
          record.status || '',
          record.inspector || '',
          record.remark || '',
          new Date(record.createdAt).toLocaleDateString(),
        ])
      } else {
        return [baseData.concat(['', '', '', '', '', '', ''])]
      }
    })

    const headers = [
      'Session #',
      'Tag Number',
      'Equipment Name',
      'Location',
      'Session Inspector',
      'Session Date',
      'Total Records',
      'Point',
      'Description',
      'Temperature',
      'Status',
      'Record Inspector',
      'Remark',
      'Record Date'
    ]

    const filename = `lrs-thermography-${filtered ? 'filtered-' : ''}${new Date().toISOString().split('T')[0]}.xlsx`
    
    exportToExcel({
      filename,
      sheetName: 'LRS Thermography Records',
      data,
      headers,
      columnWidths: [8, 15, 20, 15, 15, 12, 8, 12, 25, 12, 10, 15, 20, 12],
      headerStyle: true,
      cellStyles: true
    })
  } catch (error) {
    console.error('Error exporting LRS thermography to Excel:', error)
    throw new Error('Failed to export data to Excel')
  }
}

// Single LRS session detailed export
export const exportSingleLrsSessionToExcel = (session: any) => {
  try {
    const safeGet = (obj: any, key: string, defaultValue: string = '') => {
      return obj && obj[key] !== undefined && obj[key] !== null ? obj[key] : defaultValue
    }

    const sessionData = [
      ['LRS THERMOGRAPHY REPORT', ''],
      ['', ''],
      ['EQUIPMENT INFORMATION', ''],
      ['Tag Number', safeGet(session, 'tagNumber')],
      ['Equipment Name', safeGet(session, 'equipmentName')],
      ['Location', safeGet(session, 'location')],
      ['Inspector', safeGet(session, 'inspector')],
      ['Date', new Date(session.createdAt).toLocaleDateString()],
      ['', ''],
      ['TEMPERATURE MEASUREMENTS', ''],
      ['Point', 'Description', 'Temperature (°C)', 'Status', 'Inspector', 'Remark', 'Date']
    ]

    // Add temperature records
    if (session.temperatureRecords && session.temperatureRecords.length > 0) {
      session.temperatureRecords.forEach((record: any) => {
        sessionData.push([
          safeGet(record, 'point'),
          safeGet(record, 'description'),
          record.temperature ? `${record.temperature}°C` : '',
          safeGet(record, 'status'),
          safeGet(record, 'inspector'),
          safeGet(record, 'remark'),
          new Date(record.createdAt).toLocaleDateString()
        ])
      })
    } else {
      sessionData.push(['No temperature records found', '', '', '', '', '', ''])
    }

    // Add summary section
    sessionData.push(
      ['', ''],
      ['SUMMARY', ''],
      ['Total Measurement Points', session.temperatureRecords?.length || 0],
      ['Normal Readings', session.temperatureRecords?.filter((r: any) => r.status === 'Normal').length || 0],
      ['Warning Readings', session.temperatureRecords?.filter((r: any) => r.status === 'Warning').length || 0],
      ['Critical Readings', session.temperatureRecords?.filter((r: any) => r.status === 'Critical').length || 0],
      ['', ''],
      ['Report Generated', new Date().toLocaleDateString()],
      ['Generated By', 'VALE LRS Thermography System']
    )

    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(sessionData)
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 12 }
    ]

    // Style the header cells
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    
    // Style main title
    if (worksheet['A1']) {
      worksheet['A1'].s = {
        font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "1e40af" } },
        alignment: { horizontal: "center" }
      }
    }

    // Style section headers
    const sectionHeaders = ['A3', 'A10', 'A' + (12 + (session.temperatureRecords?.length || 0) + 2)]
    sectionHeaders.forEach(cell => {
      if (worksheet[cell]) {
        worksheet[cell].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "374151" } }
        }
      }
    })

    XLSX.utils.book_append_sheet(workbook, worksheet, 'LRS Thermography Report')
    
    const filename = `VALE-LRS-Thermography-${safeGet(session, 'tagNumber', 'unknown')}-${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(workbook, filename)
  } catch (error) {
    console.error('Error exporting single LRS session to Excel:', error)
    throw new Error('Failed to export data to Excel')
  }
}
