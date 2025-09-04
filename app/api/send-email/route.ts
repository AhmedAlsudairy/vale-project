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
          params.recipients // Custom recipients (optional)
        )
        break

      case 'carbon-brush':
        result = await sendCarbonBrushEmail(
          params.data,
          params.recipients // Custom recipients (optional)
        )
        break

      case 'thermography':
        result = await sendThermographyEmail(
          params.data,
          params.recipients // Custom recipients (optional)
        )
        break

      case 'form-notification':
        result = await sendFormNotification({
          formType: params.formType || 'Equipment Form',
          formData: params.formData || {},
          customRecipients: params.recipients,
          customSubject: params.customSubject,
          customTemplate: params.customTemplate,
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
      'basic'
    ]
  })
}
