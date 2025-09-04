import { sendEmail, getEmailConfig } from '@/lib/email'

// Test Gmail email functionality
export async function testGmailEmail() {
  try {
    // Check configuration first
    const config = getEmailConfig()
    if (!config.configured) {
      throw new Error(`Missing configuration: ${config.missing.join(', ')}`)
    }

    console.log('Testing Gmail email sending...')

    const result = await sendEmail({
      to: process.env.GMAIL_USER!, // Send to yourself for testing
      subject: 'Vale Equipment System - Gmail Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1F4E79;">Gmail Integration Test</h2>
          
          <div style="background: #e8f6f3; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #16A085; margin-top: 0;">✅ Success!</h3>
            <p>Gmail SMTP is working correctly with the Vale Equipment Management System.</p>
            <p><strong>Test Date:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #666;">
              This is a test email from Vale Equipment Management System
            </p>
          </div>
        </div>
      `,
      text: `
Gmail Integration Test

✅ Success! Gmail SMTP is working correctly with the Vale Equipment Management System.

Test Date: ${new Date().toLocaleString()}

This is a test email from Vale Equipment Management System
      `
    })

    if (result.success && result.result) {
      console.log('✅ Gmail test email sent successfully!')
      console.log('Message ID:', result.result.messageId)
      return { success: true, messageId: result.result.messageId }
    } else {
      console.error('❌ Gmail test email failed:', result.error)
      return { success: false, error: result.error }
    }

  } catch (error) {
    console.error('❌ Gmail test failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Test email with Excel attachment
export async function testGmailWithExcel() {
  try {
    const config = getEmailConfig()
    if (!config.configured) {
      throw new Error(`Missing configuration: ${config.missing.join(', ')}`)
    }

    console.log('Testing Gmail email with Excel attachment...')

    // Create a simple Excel buffer for testing
    const XLSX = require('xlsx')
    const testData = [
      ['Equipment', 'Test Date', 'Status'],
      ['Motor M001', new Date().toLocaleDateString(), 'Test Successful'],
      ['Motor M002', new Date().toLocaleDateString(), 'Test Successful']
    ]
    
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(testData)
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Test Report')
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    const result = await sendEmail({
      to: process.env.GMAIL_USER!,
      subject: 'Vale Equipment System - Gmail + Excel Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1F4E79;">Gmail + Excel Integration Test</h2>
          
          <div style="background: #e8f6f3; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #16A085; margin-top: 0;">✅ Success!</h3>
            <p>Gmail SMTP with Excel attachments is working correctly.</p>
            <p><strong>Test Date:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <div style="background: #e8f4f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #1F4E79;">
              📊 Test Excel report is attached to this email.
            </p>
          </div>

          <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #666;">
              This is a test email from Vale Equipment Management System
            </p>
          </div>
        </div>
      `,
      text: `
Gmail + Excel Integration Test

✅ Success! Gmail SMTP with Excel attachments is working correctly.

Test Date: ${new Date().toLocaleString()}

Test Excel report is attached to this email.

This is a test email from Vale Equipment Management System
      `,
      attachments: [
        {
          filename: `Vale-Test-Report-${new Date().toISOString().split('T')[0]}.xlsx`,
          content: excelBuffer,
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      ]
    })

    if (result.success && result.result) {
      console.log('✅ Gmail + Excel test email sent successfully!')
      console.log('Message ID:', result.result.messageId)
      return { success: true, messageId: result.result.messageId }
    } else {
      console.error('❌ Gmail + Excel test email failed:', result.error)
      return { success: false, error: result.error }
    }

  } catch (error) {
    console.error('❌ Gmail + Excel test failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
