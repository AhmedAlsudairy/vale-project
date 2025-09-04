import nodemailer from 'nodemailer'
import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'
import { 
  exportSingleWindingResistanceToExcel,
  exportSingleCarbonBrushToExcel,
  exportSingleThermographyToExcel
} from './excel-utils'
import { getRecipients, formatRecipientsDisplay, validateEmailList } from './email-recipients'

// Gmail SMTP configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER!,
      pass: process.env.GMAIL_APP_PASSWORD!, // Use App Password, not regular password
    },
  })
}

const sender = {
  email: process.env.GMAIL_USER || 'noreply@vale-equipment.com',
  name: 'Vale Equipment Management System',
}

// Helper function to create Excel buffer for attachments
const createExcelBuffer = (data: any[], headers: string[], sheetName: string = 'Data'): Buffer => {
  const workbook = XLSX.utils.book_new()
  const worksheetData = [headers, ...data]
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
  
  // Set column widths
  worksheet['!cols'] = headers.map(() => ({ wch: 15 }))
  
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
}

// Helper function to create detailed Excel report buffer
const createDetailedExcelReport = (record: any, type: 'winding' | 'carbon' | 'thermography'): Buffer => {
  try {
    console.log(`Creating ${type} Excel report for:`, record.id || record.motorNo || record.tagNo || record.transformerNo)
    
    // Create buffer versions of the existing Excel functions
    switch (type) {
      case 'winding':
        return createWindingResistanceExcelBuffer(record)
        
      case 'carbon':
        return createCarbonBrushExcelBuffer(record)
        
      case 'thermography':
        return createThermographyExcelBuffer(record)
        
      default:
        throw new Error('Unknown report type')
    }
  } catch (error) {
    console.error('Error creating Excel report:', error)
    // Fallback to simple Excel creation
    return createFallbackExcelReport(record, type)
  }
}

// Buffer version of winding resistance Excel export
const createWindingResistanceExcelBuffer = (record: any): Buffer => {
  const workbook = XLSX.utils.book_new()
  
  console.log('🔍 Debug - Full record structure:', JSON.stringify(record, null, 2))
  
  // Get data safely (handles both legacy and new format)
  const primaryPI = record.primary5kVPI || record.primaryPI || {}
  const irVals = record.irValues?.values || record.irValues || {}
  const windingVals = record.windingResistance?.values || record.windingResistance || {}
  const windingUnits = record.windingResistance?.units || { ry: 'Ω', yb: 'Ω', rb: 'Ω' }
  const darVals = record.darValues?.values || record.darValues || {}
  const darResults = record.darValues?.results || {}
  
  console.log('📊 Debug - Extracted values:', {
    motorNo: record.motorNo,
    windingVals,
    irVals,
    darVals,
    darResults,
    windingUnits,
    primaryPI,
    equipment: record.equipment
  })
  
  // Create comprehensive data array with all measurements
  const data = [
    // Header Row - Include ALL measurement fields
    [
      'Motor No', 'Equipment Name', 'Equipment Type', 'Inspection Date', 'Done By', 'Work Holder',
      
      // Winding Resistance
      'R-Y Resistance (Ω)', 'Y-B Resistance (Ω)', 'R-B Resistance (Ω)',
      
      // IR Values - 1 minute
      'IR UG 1min (GΩ)', 'IR VG 1min (GΩ)', 'IR WG 1min (GΩ)',
      
      // IR Values - 10 minute  
      'IR UG 10min (GΩ)', 'IR VG 10min (GΩ)', 'IR WG 10min (GΩ)',
      
      // DAR Values - 30 second
      'DAR UG 30sec (GΩ)', 'DAR VG 30sec (GΩ)', 'DAR WG 30sec (GΩ)',
      
      // DAR Values - 1 minute
      'DAR UG 1min (GΩ)', 'DAR VG 1min (GΩ)', 'DAR WG 1min (GΩ)',
      
      // Calculated Results
      'PI Result', 'DAR UG Ratio', 'DAR VG Ratio', 'DAR WG Ratio',
      
      // Additional Info
      'Overall Status', 'Remarks'
    ],
    
    // Data Row - Include ALL actual values
    [
      record.motorNo || '',
      record.equipment?.equipmentName || record.equipmentName || '',
      record.equipment?.equipmentType || 'Motor',
      record.inspectionDate ? new Date(record.inspectionDate).toLocaleDateString() : '',
      record.doneBy || '',
      record.workHolder || '',
      
      // Winding Resistance values
      Number(windingVals.ry || 0),
      Number(windingVals.yb || 0), 
      Number(windingVals.rb || 0),
      
      // IR values - 1 minute
      Number(irVals.ug_1min || 0),
      Number(irVals.vg_1min || 0),
      Number(irVals.wg_1min || 0),
      
      // IR values - 10 minute
      Number(irVals.ug_10min || 0),
      Number(irVals.vg_10min || 0),
      Number(irVals.wg_10min || 0),
      
      // DAR values - 30 second
      Number(darVals.ug_30sec || 0),
      Number(darVals.vg_30sec || 0),
      Number(darVals.wg_30sec || 0),
      
      // DAR values - 1 minute
      Number(darVals.ug_1min || 0),
      Number(darVals.vg_1min || 0),
      Number(darVals.wg_1min || 0),
      
      // Calculated results
      Number(record.polarizationIndex || primaryPI.pi_result || 0),
      Number(darResults.ug_dar || (darVals.ug_1min && darVals.ug_30sec ? (darVals.ug_1min / darVals.ug_30sec) : 0)),
      Number(darResults.vg_dar || (darVals.vg_1min && darVals.vg_30sec ? (darVals.vg_1min / darVals.vg_30sec) : 0)),
      Number(darResults.wg_dar || (darVals.wg_1min && darVals.wg_30sec ? (darVals.wg_1min / darVals.wg_30sec) : 0)),
      
      // Status and remarks
      'Good',
      record.remarks || ''
    ]
  ]
  
  const worksheet = XLSX.utils.aoa_to_sheet(data)
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 },
    { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
    { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 18 },
    { wch: 18 }, { wch: 20 }, { wch: 30 }
  ]
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Winding Resistance Report')
  
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
}

// Buffer version of carbon brush Excel export
const createCarbonBrushExcelBuffer = (record: any): Buffer => {
  const workbook = XLSX.utils.book_new()
  
  const measurements = record.measurements || {}
  console.log('Debug - Creating carbon brush Excel with data:', {
    tagNo: record.tagNo,
    measurements,
    slipRingThickness: record.slipRingThickness
  })
  
  const data = [
    [
      'TAG NO', 'Equipment Name', 'Brush Type', 'Inspection Date', 'Done By', 'Work Order No',
      'Slip Ring Thickness (mm)', 'Slip Ring IR (GΩ)', 'Status', 'Remarks'
    ],
    [
      record.tagNo || '',
      record.equipmentName || record.equipment?.equipmentName || '',
      record.brushType || 'C80X',
      new Date(record.inspectionDate).toLocaleDateString(),
      record.doneBy || '',
      record.workOrderNo || '',
      record.slipRingThickness || 0,
      record.slipRingIr || 0,
      'Good',
      record.remarks || ''
    ]
  ]
  
  // Add measurement data if available
  if (measurements && typeof measurements === 'object') {
    const measurementEntries = Object.entries(measurements)
    if (measurementEntries.length > 0) {
      const measurementHeaders = measurementEntries.map(([key]) => `Brush ${key} (mm)`)
      const measurementValues = measurementEntries.map(([, value]) => value)
      
      data[0] = [...data[0].slice(0, -2), ...measurementHeaders, ...data[0].slice(-2)]
      data[1] = [...data[1].slice(0, -2), ...measurementValues, ...data[1].slice(-2)]
    }
  }
  
  const worksheet = XLSX.utils.aoa_to_sheet(data)
  
  // Set column widths
  const numCols = data[0].length
  worksheet['!cols'] = Array(numCols).fill({ wch: 15 })
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Carbon Brush Report')
  
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
}

// Buffer version of thermography Excel export
const createThermographyExcelBuffer = (record: any): Buffer => {
  const workbook = XLSX.utils.book_new()
  
  console.log('Debug - Creating thermography Excel with data:', {
    transformerNo: record.transformerNo,
    mccbIcRPhase: record.mccbIcRPhase,
    measurements: record.measurements
  })
  
  const data = [
    [
      'Transformer No', 'Equipment Type', 'Inspection Date', 'Inspector', 'Month',
      'MCCB IC R Phase (°C)', 'MCCB IC B Phase (°C)', 'MCCB C OG1 (°C)', 'MCCB C OG2 (°C)',
      'MCCB Body Temp (°C)', 'kV/mA', 'SP Min', 'SCR Cooling Fins Temp (°C)',
      'SCR Cooling Fan', 'Panel Exhaust Fan', 'MCC Forced Cooling Fan Temp (°C)',
      'RDI 68 (°C)', 'RDI 69 (°C)', 'RDI 70 (°C)', 'Status', 'Remarks'
    ],
    [
      record.transformerNo || '',
      record.equipmentType || 'ESP',
      new Date(record.inspectionDate).toLocaleDateString(),
      record.doneBy || '',
      record.month || '',
      record.mccbIcRPhase || record.measurements?.mccbRPhase || 0,
      record.mccbIcBPhase || record.measurements?.mccbBPhase || 0,
      record.mccbCOg1 || record.measurements?.mccbCOG1 || 0,
      record.mccbCOg2 || record.measurements?.mccbCOG2 || 0,
      record.mccbBodyTemp || record.measurements?.mccbBodyTemp || 0,
      record.kvMa || record.measurements?.kvMa || '',
      record.spMin || record.measurements?.spMin || '',
      record.scrCoolingFinsTemp || record.measurements?.scrCoolingFinsTemp || 0,
      record.scrCoolingFan || record.measurements?.scrCoolingFan || '',
      record.panelExhaustFan || record.measurements?.panelExhaustFan || '',
      record.mccForcedCoolingFanTemp || record.measurements?.mccForcedCoolingFanTemp || 0,
      record.rdi68 || record.measurements?.rdi68 || 0,
      record.rdi69 || record.measurements?.rdi69 || 0,
      record.rdi70 || record.measurements?.rdi70 || 0,
      'Normal',
      record.remarks || ''
    ]
  ]
  
  const worksheet = XLSX.utils.aoa_to_sheet(data)
  
  // Set column widths
  worksheet['!cols'] = Array(data[0].length).fill({ wch: 15 })
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Thermography Report')
  
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
}

// Fallback Excel creation in case the main functions fail
const createFallbackExcelReport = (record: any, type: string): Buffer => {
  const data = [
    ['Field', 'Value'],
    ['Equipment ID', record.motorNo || record.tagNo || record.transformerNo || ''],
    ['Inspection Date', new Date(record.inspectionDate).toLocaleDateString()],
    ['Done By', record.doneBy || ''],
    ['Remarks', record.remarks || '']
  ]
  
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet(data)
  XLSX.utils.book_append_sheet(workbook, worksheet, `${type} Report`)
  
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
}

// Email templates
export const emailTemplates = {
  windingResistance: (data: any) => {
    // Extract values safely from the database record structure
    const windingValues = data.windingResistance?.values || {}
    const irValues = data.irValues?.values || {}
    const darValues = data.darValues?.values || {}
    const primaryPI = data.primary5kVPI || {}
    
    return {
      subject: `New Winding Resistance Test - ${data.motorNo}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1F4E79;">New Winding Resistance Test Submitted</h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2C3E50; margin-top: 0;">Equipment Information</h3>
            <p><strong>Motor No:</strong> ${data.motorNo}</p>
            <p><strong>Equipment Name:</strong> ${data.equipment?.equipmentName || 'N/A'}</p>
            <p><strong>Equipment Type:</strong> ${data.equipment?.equipmentType || 'Motor'}</p>
            <p><strong>Test Date:</strong> ${data.inspectionDate ? new Date(data.inspectionDate).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Done By:</strong> ${data.doneBy || 'N/A'}</p>
            <p><strong>Work Holder:</strong> ${data.workHolder || 'Not specified'}</p>
          </div>

          <div style="background: #e8f6f3; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #16A085; margin-top: 0;">Test Results Summary</h3>
            <p><strong>Winding Resistance:</strong></p>
            <ul>
              <li>R-Y: ${windingValues.ry || 0} Ω</li>
              <li>Y-B: ${windingValues.yb || 0} Ω</li>
              <li>R-B: ${windingValues.rb || 0} Ω</li>
            </ul>
            
            <p><strong>IR Values (1 min):</strong></p>
            <ul>
              <li>U-G: ${irValues.ug_1min || 0} GΩ</li>
              <li>V-G: ${irValues.vg_1min || 0} GΩ</li>
              <li>W-G: ${irValues.wg_1min || 0} GΩ</li>
            </ul>
            
            <p><strong>IR Values (10 min):</strong></p>
            <ul>
              <li>U-G: ${irValues.ug_10min || 0} GΩ</li>
              <li>V-G: ${irValues.vg_10min || 0} GΩ</li>
              <li>W-G: ${irValues.wg_10min || 0} GΩ</li>
            </ul>
            
            <p><strong>DAR Values:</strong></p>
            <ul>
              <li>U-G 30sec: ${darValues.ug_30sec || 0} GΩ</li>
              <li>V-G 30sec: ${darValues.vg_30sec || 0} GΩ</li>
              <li>W-G 30sec: ${darValues.wg_30sec || 0} GΩ</li>
            </ul>
            
            <p><strong>PI Result:</strong> ${data.polarizationIndex || primaryPI.pi_result || 'Not calculated'}</p>
          </div>

          ${data.remarks ? `
          <div style="background: #fef9e7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #F39C12; margin-top: 0;">Remarks</h3>
            <p>${data.remarks}</p>
          </div>
          ` : ''}

          <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #666;">
              This email was automatically generated by Vale Equipment Management System
            </p>
          </div>
        </div>
      `,
      text: `
New Winding Resistance Test Submitted

Equipment Information:
- Motor No: ${data.motorNo}
- Equipment Name: ${data.equipment?.equipmentName || 'N/A'}
- Equipment Type: ${data.equipment?.equipmentType || 'Motor'}
- Test Date: ${data.inspectionDate ? new Date(data.inspectionDate).toLocaleDateString() : 'N/A'}
- Done By: ${data.doneBy || 'N/A'}
- Work Holder: ${data.workHolder || 'Not specified'}

Test Results:
Winding Resistance:
- R-Y: ${windingValues.ry || 0} Ω
- Y-B: ${windingValues.yb || 0} Ω  
- R-B: ${windingValues.rb || 0} Ω

IR Values (1 min):
- U-G: ${irValues.ug_1min || 0} GΩ
- V-G: ${irValues.vg_1min || 0} GΩ
- W-G: ${irValues.wg_1min || 0} GΩ

IR Values (10 min):
- U-G: ${irValues.ug_10min || 0} GΩ
- V-G: ${irValues.vg_10min || 0} GΩ
- W-G: ${irValues.wg_10min || 0} GΩ

DAR Values:
- U-G 30sec: ${darValues.ug_30sec || 0} GΩ
- V-G 30sec: ${darValues.vg_30sec || 0} GΩ
- W-G 30sec: ${darValues.wg_30sec || 0} GΩ

PI Result: ${data.polarizationIndex || primaryPI.pi_result || 'Not calculated'}

${data.remarks ? `Remarks: ${data.remarks}` : ''}

This email was automatically generated by Vale Equipment Management System
      `
    }
  },

  carbonBrush: (data: any) => ({
    subject: `New Carbon Brush Inspection - ${data.tagNo}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1F4E79;">New Carbon Brush Inspection Submitted</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2C3E50; margin-top: 0;">Equipment Information</h3>
          <p><strong>TAG NO:</strong> ${data.tagNo}</p>
          <p><strong>Equipment Name:</strong> ${data.equipmentName}</p>
          <p><strong>Brush Type:</strong> ${data.brushType}</p>
          <p><strong>Inspection Date:</strong> ${data.inspectionDate}</p>
          <p><strong>Done By:</strong> ${data.doneBy}</p>
          <p><strong>Work Order:</strong> ${data.workOrderNo || 'Not specified'}</p>
        </div>

        <div style="background: #e8f6f3; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #16A085; margin-top: 0;">Inspection Results</h3>
          <p><strong>Slip Ring Thickness:</strong> ${data.slipRingThickness || 0} mm</p>
          <p><strong>Slip Ring IR:</strong> ${data.slipRingIr || 0} GΩ</p>
          
          <p><strong>Brush Measurements (Sample):</strong></p>
          <ul>
            <li>1A Inner: ${data.measurements?.['1A_inner'] || 0} mm</li>
            <li>1A Center: ${data.measurements?.['1A_center'] || 0} mm</li>
            <li>1A Outer: ${data.measurements?.['1A_outer'] || 0} mm</li>
          </ul>
        </div>

        ${data.remarks ? `
        <div style="background: #fef9e7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #F39C12; margin-top: 0;">Remarks</h3>
          <p>${data.remarks}</p>
        </div>
        ` : ''}

        <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; color: #666;">
            This email was automatically generated by Vale Equipment Management System
          </p>
        </div>
      </div>
    `,
    text: `
New Carbon Brush Inspection Submitted

Equipment Information:
- TAG NO: ${data.tagNo}
- Equipment Name: ${data.equipmentName}
- Brush Type: ${data.brushType}
- Inspection Date: ${data.inspectionDate}
- Done By: ${data.doneBy}
- Work Order: ${data.workOrderNo || 'Not specified'}

Inspection Results:
- Slip Ring Thickness: ${data.slipRingThickness || 0} mm
- Slip Ring IR: ${data.slipRingIr || 0} GΩ
- 1A Inner: ${data.measurements?.['1A_inner'] || 0} mm
- 1A Center: ${data.measurements?.['1A_center'] || 0} mm
- 1A Outer: ${data.measurements?.['1A_outer'] || 0} mm

${data.remarks ? `Remarks: ${data.remarks}` : ''}

This email was automatically generated by Vale Equipment Management System
    `
  })
}

// Main email sending function with Excel attachment support
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = sender,
  attachments = []
}: {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: { email: string; name: string }
  attachments?: Array<{
    filename: string
    content: Buffer | string
    type?: string
  }>
}) {
  try {
    const transporter = createTransporter()
    
    const recipients = Array.isArray(to) ? to.join(', ') : to

    // Convert attachments to nodemailer format
    const nodemailerAttachments = attachments.map(att => ({
      filename: att.filename,
      content: Buffer.isBuffer(att.content) ? att.content : Buffer.from(att.content),
      contentType: att.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }))

    const mailOptions = {
      from: `${from.name} <${from.email}>`,
      to: recipients,
      subject,
      html,
      text,
      attachments: nodemailerAttachments
    }

    const result = await transporter.sendMail(mailOptions)

    console.log('Email sent successfully:', result.messageId)
    return { success: true, result: { messageId: result.messageId } }
  } catch (error) {
    console.error('Email sending failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Helper function for winding resistance form submission with Excel attachment
export async function sendWindingResistanceEmail(
  data: any, 
  customRecipients?: string[], 
  includeExcel: boolean = true
) {
  console.log('🔍 DEBUG - Raw data received in sendWindingResistanceEmail:', JSON.stringify(data, null, 2))
  
  // Get appropriate recipients
  const recipients = getRecipients('winding-resistance', customRecipients)
  
  // Validate email addresses
  const { valid, invalid } = validateEmailList(recipients)
  if (invalid.length > 0) {
    console.warn('Invalid email addresses found:', invalid)
  }
  if (valid.length === 0) {
    throw new Error('No valid email recipients found')
  }
  
  console.log('📧 Generating email template with data...')
  const template = emailTemplates.windingResistance(data)
  
  console.log('📋 Email subject:', template.subject)
  console.log('📄 Email HTML preview:', template.html.substring(0, 300) + '...')
  
  let attachments: Array<{ filename: string; content: Buffer; type: string }> = []
  
  if (includeExcel) {
    try {
      console.log('📊 Creating Excel attachment...')
      const excelBuffer = createDetailedExcelReport(data, 'winding')
      attachments.push({
        filename: `Winding-Resistance-Report-${data.motorNo || 'Unknown'}-${new Date().toISOString().split('T')[0]}.xlsx`,
        content: excelBuffer,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      console.log('✅ Excel attachment created successfully')
    } catch (error) {
      console.error('❌ Error creating Excel attachment:', error)
    }
  }
  
  console.log(`📤 Sending winding resistance notification to: ${formatRecipientsDisplay(valid)}`)
  
  return await sendEmail({
    to: valid,
    subject: template.subject,
    html: template.html,
    text: template.text,
    attachments
  })
}

// Helper function for carbon brush form submission with Excel attachment
export async function sendCarbonBrushEmail(
  data: any, 
  customRecipients?: string[], 
  includeExcel: boolean = true
) {
  // Get appropriate recipients
  const recipients = getRecipients('carbon-brush', customRecipients)
  
  // Validate email addresses
  const { valid, invalid } = validateEmailList(recipients)
  if (invalid.length > 0) {
    console.warn('Invalid email addresses found:', invalid)
  }
  if (valid.length === 0) {
    throw new Error('No valid email recipients found')
  }
  
  const template = emailTemplates.carbonBrush(data)
  
  let attachments: Array<{ filename: string; content: Buffer; type: string }> = []
  
  if (includeExcel) {
    try {
      const excelBuffer = createDetailedExcelReport(data, 'carbon')
      attachments.push({
        filename: `Carbon-Brush-Report-${data.tagNo || 'Unknown'}-${new Date().toISOString().split('T')[0]}.xlsx`,
        content: excelBuffer,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
    } catch (error) {
      console.error('Error creating Excel attachment:', error)
    }
  }
  
  console.log(`Sending carbon brush notification to: ${formatRecipientsDisplay(valid)}`)
  
  return await sendEmail({
    to: valid,
    subject: template.subject,
    html: template.html,
    text: template.text,
    attachments
  })
}

// Helper function for thermography form submission with Excel attachment
export async function sendThermographyEmail(
  data: any, 
  customRecipients?: string[], 
  includeExcel: boolean = true
) {
  // Get appropriate recipients
  const recipients = getRecipients('thermography', customRecipients)
  
  // Validate email addresses
  const { valid, invalid } = validateEmailList(recipients)
  if (invalid.length > 0) {
    console.warn('Invalid email addresses found:', invalid)
  }
  if (valid.length === 0) {
    throw new Error('No valid email recipients found')
  }
  
  const subject = `New Thermography Test - ${data.transformerNo}`
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1F4E79;">New Thermography Test Submitted</h2>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #2C3E50; margin-top: 0;">Equipment Information</h3>
        <p><strong>Transformer No:</strong> ${data.transformerNo}</p>
        <p><strong>Equipment Type:</strong> ${data.equipmentType || 'ESP'}</p>
        <p><strong>Test Date:</strong> ${data.inspectionDate}</p>
        <p><strong>Done By:</strong> ${data.doneBy}</p>
      </div>

      <div style="background: #e8f6f3; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #16A085; margin-top: 0;">Temperature Summary</h3>
        <p><strong>Test performed successfully</strong></p>
        <p>Detailed measurements and analysis are included in the attached Excel report.</p>
      </div>

      ${data.remarks ? `
      <div style="background: #fef9e7; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #F39C12; margin-top: 0;">Remarks</h3>
        <p>${data.remarks}</p>
      </div>
      ` : ''}

      <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; color: #666;">
          This email was automatically generated by Vale Equipment Management System
        </p>
      </div>
    </div>
  `
  
  const text = `
New Thermography Test Submitted

Equipment Information:
- Transformer No: ${data.transformerNo}
- Equipment Type: ${data.equipmentType || 'ESP'}
- Test Date: ${data.inspectionDate}
- Done By: ${data.doneBy}

${data.remarks ? `Remarks: ${data.remarks}` : ''}

This email was automatically generated by Vale Equipment Management System
  `
  
  let attachments: Array<{ filename: string; content: Buffer; type: string }> = []
  
  if (includeExcel) {
    try {
      const excelBuffer = createDetailedExcelReport(data, 'thermography')
      attachments.push({
        filename: `Thermography-Report-${data.transformerNo || 'Unknown'}-${new Date().toISOString().split('T')[0]}.xlsx`,
        content: excelBuffer,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
    } catch (error) {
      console.error('Error creating Excel attachment:', error)
    }
  }
  
  console.log(`Sending thermography notification to: ${formatRecipientsDisplay(valid)}`)
  
  return await sendEmail({
    to: valid,
    subject,
    html,
    text,
    attachments
  })
}

// Generic form notification email with Excel attachment support
export async function sendFormNotification({
  formType,
  formData,
  customRecipients,
  customSubject,
  customTemplate,
  includeExcel = true,
  excelData = null
}: {
  formType: string
  formData: Record<string, any>
  customRecipients?: string[]
  customSubject?: string
  customTemplate?: { html: string; text: string }
  includeExcel?: boolean
  excelData?: { headers: string[]; data: any[][]; sheetName?: string } | null
}) {
  // Get appropriate recipients based on form type
  const recipients = getRecipients('general', customRecipients)
  
  // Validate email addresses
  const { valid, invalid } = validateEmailList(recipients)
  if (invalid.length > 0) {
    console.warn('Invalid email addresses found:', invalid)
  }
  if (valid.length === 0) {
    throw new Error('No valid email recipients found')
  }
  
  const defaultSubject = `New ${formType} Form Submission - ${formData.equipmentId || formData.motorNo || formData.tagNo || 'Equipment'}`
  
  let emailContent
  
  if (customTemplate) {
    emailContent = customTemplate
  } else {
    // Default template for any form
    emailContent = {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1F4E79;">New ${formType} Submission</h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2C3E50; margin-top: 0;">Form Data</h3>
            ${Object.entries(formData).map(([key, value]) => 
              `<p><strong>${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> ${value || 'Not specified'}</p>`
            ).join('')}
          </div>
          
          ${includeExcel ? `
          <div style="background: #e8f4f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #1F4E79;">
              📊 Detailed Excel report is attached to this email for your records.
            </p>
          </div>
          ` : ''}

          <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #666;">
              This email was automatically generated by Vale Equipment Management System
            </p>
          </div>
        </div>
      `,
      text: `
New ${formType} Submission

Form Data:
${Object.entries(formData).map(([key, value]) => 
  `${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value || 'Not specified'}`
).join('\n')}

${includeExcel ? '\nDetailed Excel report is attached to this email for your records.' : ''}

This email was automatically generated by Vale Equipment Management System
      `
    }
  }
  
  let attachments: Array<{ filename: string; content: Buffer; type: string }> = []
  
  if (includeExcel && excelData) {
    try {
      const excelBuffer = createExcelBuffer(excelData.data, excelData.headers, excelData.sheetName)
      attachments.push({
        filename: `${formType.replace(/\s+/g, '-')}-Report-${new Date().toISOString().split('T')[0]}.xlsx`,
        content: excelBuffer,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
    } catch (error) {
      console.error('Error creating Excel attachment:', error)
    }
  }

  console.log(`Sending ${formType} notification to: ${formatRecipientsDisplay(valid)}`)

  return await sendEmail({
    to: valid,
    subject: customSubject || defaultSubject,
    html: emailContent.html,
    text: emailContent.text,
    attachments
  })
}

// Equipment alert/inspection due notification
export async function sendInspectionAlert({
  equipmentInfo,
  alertType,
  recipients,
  dueDate,
  priority = 'normal'
}: {
  equipmentInfo: Record<string, any>
  alertType: string
  recipients: string[]
  dueDate?: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
}) {
  const priorityColors = {
    low: '#28A745',
    normal: '#17A2B8',
    high: '#FFC107',
    urgent: '#DC3545'
  }

  const priorityColor = priorityColors[priority]

  return await sendEmail({
    to: recipients,
    subject: `${priority === 'urgent' ? '🚨 URGENT: ' : ''}${alertType} - ${equipmentInfo.name || equipmentInfo.motorNo || 'Equipment'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${priorityColor}; color: white; padding: 15px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">${alertType}</h2>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Priority: ${priority.toUpperCase()}</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px;">
          <h3 style="color: #2C3E50; margin-top: 0;">Equipment Information</h3>
          ${Object.entries(equipmentInfo).map(([key, value]) => 
            `<p><strong>${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> ${value || 'Not specified'}</p>`
          ).join('')}
          
          ${dueDate ? `<p style="background: #fff3cd; padding: 10px; border-radius: 5px; border-left: 4px solid #ffc107;"><strong>Due Date:</strong> ${dueDate}</p>` : ''}
        </div>

        <div style="background: #f4f4f4; padding: 15px; text-align: center;">
          <p style="margin: 0; color: #666;">
            This alert was automatically generated by Vale Equipment Management System
          </p>
        </div>
      </div>
    `,
    text: `
${alertType}
Priority: ${priority.toUpperCase()}

Equipment Information:
${Object.entries(equipmentInfo).map(([key, value]) => 
  `${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value || 'Not specified'}`
).join('\n')}

${dueDate ? `Due Date: ${dueDate}` : ''}

This alert was automatically generated by Vale Equipment Management System
    `
  })
}

// Custom email sender with flexible parameters and Excel attachments
export async function sendCustomEmail({
  to,
  subject,
  message,
  data = {},
  template = 'default',
  priority = 'normal',
  attachments = [],
  includeExcel = false,
  excelData = null
}: {
  to: string | string[]
  subject: string
  message: string
  data?: Record<string, any>
  template?: 'default' | 'alert'
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  attachments?: Array<{ filename: string; content: Buffer | string; type?: string }>
  includeExcel?: boolean
  excelData?: { headers: string[]; data: any[][]; sheetName?: string } | null
}) {
  const templates = {
    default: {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1F4E79;">${subject}</h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="white-space: pre-line;">${message}</p>
            ${Object.keys(data).length > 0 ? `
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
              <h4>Additional Information:</h4>
              ${Object.entries(data).map(([key, value]) => 
                `<p><strong>${key}:</strong> ${value}</p>`
              ).join('')}
            ` : ''}
            ${includeExcel ? `
            <div style="background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p style="margin: 0; color: #1F4E79;">
                📊 Excel report is attached to this email.
              </p>
            </div>
            ` : ''}
          </div>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #666;">Vale Equipment Management System</p>
          </div>
        </div>
      `,
      text: `${subject}\n\n${message}${Object.keys(data).length > 0 ? '\n\nAdditional Information:\n' + Object.entries(data).map(([key, value]) => `${key}: ${value}`).join('\n') : ''}${includeExcel ? '\n\nExcel report is attached to this email.' : ''}\n\nVale Equipment Management System`
    },
    alert: {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc3545; color: white; padding: 15px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">🚨 ${subject}</h2>
          </div>
          <div style="background: #f8d7da; padding: 20px; border-radius: 0 0 8px 8px;">
            <p style="color: #721c24; white-space: pre-line;">${message}</p>
            ${includeExcel ? `
            <div style="background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p style="margin: 0; color: #1F4E79;">
                📊 Excel report is attached for immediate review.
              </p>
            </div>
            ` : ''}
          </div>
        </div>
      `,
      text: `🚨 ALERT: ${subject}\n\n${message}${includeExcel ? '\n\nExcel report is attached for immediate review.' : ''}`
    }
  }

  const emailTemplate = templates[template] || templates.default
  
  // Add Excel attachment if requested
  if (includeExcel && excelData) {
    try {
      const excelBuffer = createExcelBuffer(excelData.data, excelData.headers, excelData.sheetName)
      attachments.push({
        filename: `Report-${new Date().toISOString().split('T')[0]}.xlsx`,
        content: excelBuffer,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
    } catch (error) {
      console.error('Error creating Excel attachment:', error)
    }
  }

  return await sendEmail({
    to,
    subject: priority === 'urgent' ? `🚨 URGENT: ${subject}` : subject,
    html: emailTemplate.html,
    text: emailTemplate.text,
    attachments
  })
}

// Configuration helper
export function getEmailConfig() {
  const requiredEnvVars = [
    'GMAIL_USER',
    'GMAIL_APP_PASSWORD'
  ]
  
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar])
  
  if (missing.length > 0) {
    console.warn(`Missing email configuration: ${missing.join(', ')}`)
    return { configured: false, missing }
  }
  
  return { configured: true, missing: [] }
}
