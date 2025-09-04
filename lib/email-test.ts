import { sendCustomEmail, getEmailConfig } from '@/lib/email'

// Test email functionality
export async function testEmailSystem() {
  console.log('Testing Vale Equipment Email System...')
  
  // Check configuration
  const config = getEmailConfig()
  console.log('Email configuration:', config)
  
  if (!config.configured) {
    console.error('❌ Email not configured properly. Missing:', config.missing)
    return false
  }
  
  try {
    // Test basic email
    const result = await sendCustomEmail({
      to: ['test@example.com'],
      subject: 'Vale Equipment System Test',
      message: 'This is a test email from the Vale Equipment Management System.',
      data: {
        systemVersion: '2.0',
        testDate: new Date().toISOString(),
        features: 'Email notifications with Excel attachments'
      },
      template: 'default',
      priority: 'normal'
    })
    
    if (result.success) {
      console.log('✅ Email test successful!')
      return true
    } else {
      console.error('❌ Email test failed:', result.error)
      return false
    }
  } catch (error) {
    console.error('❌ Email test error:', error)
    return false
  }
}

// Test Excel attachment functionality
export async function testExcelAttachment() {
  console.log('Testing Excel attachment functionality...')
  
  try {
    const result = await sendCustomEmail({
      to: ['test@example.com'],
      subject: 'Vale Equipment Excel Test',
      message: 'This email includes a test Excel attachment.',
      includeExcel: true,
      excelData: {
        headers: ['Equipment ID', 'Type', 'Status', 'Last Inspection'],
        data: [
          ['M001', 'Motor', 'Good', '2024-01-15'],
          ['M002', 'Motor', 'Warning', '2024-01-14'],
          ['T001', 'Transformer', 'Good', '2024-01-13']
        ],
        sheetName: 'Test Equipment Report'
      }
    })
    
    if (result.success) {
      console.log('✅ Excel attachment test successful!')
      return true
    } else {
      console.error('❌ Excel attachment test failed:', result.error)
      return false
    }
  } catch (error) {
    console.error('❌ Excel attachment test error:', error)
    return false
  }
}

// Usage in development:
// import { testEmailSystem, testExcelAttachment } from '@/lib/email-test'
// testEmailSystem()
// testExcelAttachment()
