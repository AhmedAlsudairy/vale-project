import { NextRequest, NextResponse } from 'next/server'
import { 
  sendEmail, 
  sendFormNotification, 
  sendInspectionAlert, 
  sendCustomEmail,
  sendWindingResistanceEmail,
  sendCarbonBrushEmail,
  sendThermographyEmail,
  getEmailConfig 
} from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    // Check email configuration
    const emailConfig = getEmailConfig()
    if (!emailConfig.configured) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email not configured properly', 
          missing: emailConfig.missing 
        },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { type, ...params } = body

    let result

    switch (type) {
      case 'winding-resistance':
        result = await sendWindingResistanceEmail(
          params.data,
          params.recipients || ['maintenance@vale.com'],
          params.includeExcel !== false // Default to true
        )
        break

      case 'carbon-brush':
        result = await sendCarbonBrushEmail(
          params.data,
          params.recipients || ['maintenance@vale.com'],
          params.includeExcel !== false // Default to true
        )
        break

      case 'thermography':
        result = await sendThermographyEmail(
          params.data,
          params.recipients || ['maintenance@vale.com'],
          params.includeExcel !== false // Default to true
        )
        break

      case 'form-notification':
        result = await sendFormNotification({
          formType: params.formType || 'Equipment Form',
          formData: params.formData || {},
          customRecipients: params.recipients || ['maintenance@vale.com'],
          customSubject: params.customSubject,
          customTemplate: params.customTemplate,
          includeExcel: params.includeExcel || false,
          excelData: params.excelData || null
        })
        break

      case 'inspection-alert':
        result = await sendInspectionAlert({
          equipmentInfo: params.equipmentInfo || {},
          alertType: params.alertType || 'Equipment Alert',
          recipients: params.recipients || ['maintenance@vale.com'],
          dueDate: params.dueDate,
          priority: params.priority || 'normal'
        })
        break

      case 'custom':
        result = await sendCustomEmail({
          to: params.to || ['maintenance@vale.com'],
          subject: params.subject || 'Equipment Notification',
          message: params.message || '',
          data: params.data || {},
          template: params.template || 'default',
          priority: params.priority || 'normal',
          attachments: params.attachments || [],
          includeExcel: params.includeExcel || false,
          excelData: params.excelData || null
        })
        break

      case 'basic':
        result = await sendEmail({
          to: params.to || ['maintenance@vale.com'],
          subject: params.subject || 'Equipment Notification',
          html: params.html || `<p>${params.message || 'No message provided'}</p>`,
          text: params.text || params.message || 'No message provided',
          attachments: params.attachments || []
        })
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid email type specified' },
          { status: 400 }
        )
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Email API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check email configuration
export async function GET() {
  const config = getEmailConfig()
  return NextResponse.json({
    configured: config.configured,
    missing: config.missing,
    available_types: [
      'winding-resistance',
      'carbon-brush', 
      'thermography',
      'form-notification',
      'inspection-alert',
      'custom',
      'basic'
    ]
  })
}
