import { NextRequest, NextResponse } from 'next/server'
import { testGmailEmail, testGmailWithExcel } from '@/lib/test-gmail'
import { getEmailConfig } from '@/lib/email'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const testType = searchParams.get('type') || 'basic'

    // Check email configuration first
    const config = getEmailConfig()
    if (!config.configured) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Gmail not configured properly', 
          missing: config.missing,
          instructions: 'Please check GMAIL_SETUP.md for configuration instructions'
        },
        { status: 500 }
      )
    }

    let result

    switch (testType) {
      case 'basic':
        result = await testGmailEmail()
        break
      case 'excel':
        result = await testGmailWithExcel()
        break
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid test type. Use ?type=basic or ?type=excel' },
          { status: 400 }
        )
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Gmail ${testType} test completed successfully`,
        messageId: result.messageId,
        instructions: 'Check your Gmail inbox for the test email'
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Gmail test API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}

export async function POST() {
  return NextResponse.json({
    message: 'Use GET method to test Gmail functionality',
    endpoints: {
      'Basic test': 'GET /api/test-gmail?type=basic',
      'Excel test': 'GET /api/test-gmail?type=excel'
    }
  })
}
