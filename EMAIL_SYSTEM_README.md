# Vale Equipment Management Email System

## Overview

The Vale Equipment Management System includes a comprehensive email notification system that automatically sends professional email notifications with Excel attachments whenever equipment inspection forms are submitted.

## Features

- ✅ **Gmail SMTP Integration** - Uses Gmail's secure SMTP for reliable email delivery
- ✅ **Excel Attachments** - Automatically generates and attaches professional Excel reports
- ✅ **Professional Templates** - HTML and text email templates for all form types
- ✅ **Recipient Management** - Flexible recipient configuration for different equipment types
- ✅ **Error Handling** - Robust error handling that doesn't block form submissions
- ✅ **Vale Team Integration** - Pre-configured for Ahmed and Abdullah from Vale team

## Supported Form Types

1. **Winding Resistance** - Motor electrical testing with detailed measurements
2. **Carbon Brush** - Brush inspection and measurements
3. **Thermography** - Temperature monitoring and thermal analysis
4. **General Forms** - Configurable for any equipment type

## Configuration

### Environment Variables

```bash
# Gmail Configuration (Required)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password-here

# Email Recipients - Vale Equipment Team
MAINTENANCE_EMAIL_RECIPIENTS=ahmedsf100@gmail.com,Abdullah.Hamadani@vale.com

# Equipment Type Specific Recipients (Optional)
WINDING_RESISTANCE_RECIPIENTS=ahmedsf100@gmail.com,Abdullah.Hamadani@vale.com
CARBON_BRUSH_RECIPIENTS=ahmedsf100@gmail.com,Abdullah.Hamadani@vale.com
THERMOGRAPHY_RECIPIENTS=ahmedsf100@gmail.com,Abdullah.Hamadani@vale.com
```

### Gmail Setup

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Vale Equipment System"
3. **Add to Environment**: Use the generated password as `GMAIL_APP_PASSWORD`

## Recipient Configuration

### Default Recipients

The system comes pre-configured with Vale team recipients:
- **Ahmed**: ahmedsf100@gmail.com
- **Abdullah**: Abdullah.Hamadani@vale.com

### Flexible Recipient System

```typescript
// Get recipients for specific equipment type
const recipients = getRecipients('winding-resistance')

// Custom recipients for specific notification
const customRecipients = ['engineer@vale.com', 'supervisor@vale.com']
await sendWindingResistanceEmail(data, customRecipients)

// Emergency notifications
const emergencyRecipients = getRecipients('emergency')
```

### Equipment-Specific Recipients

Configure different recipients for different equipment types using environment variables:

- `WINDING_RESISTANCE_RECIPIENTS` - Motor winding resistance tests
- `CARBON_BRUSH_RECIPIENTS` - Carbon brush inspections
- `THERMOGRAPHY_RECIPIENTS` - Thermal imaging inspections
- `MOTOR_INSPECTION_RECIPIENTS` - General motor inspections
- `TRANSFORMER_INSPECTION_RECIPIENTS` - Transformer inspections
- `ESP_INSPECTION_RECIPIENTS` - ESP equipment inspections

## Email Templates

### Professional HTML Templates

Each form type has a professional HTML template with:
- Vale branding colors
- Organized data sections
- Status indicators
- Professional styling
- Mobile-responsive design

### Excel Attachments

Automatically generated Excel reports include:
- **Detailed Data Tables** - All form data in professional format
- **Professional Styling** - Headers, borders, formatting
- **Comprehensive Information** - Equipment details, measurements, analysis
- **Multiple Formats** - Horizontal and vertical layouts available

## API Integration

### Automatic Notifications

All API routes automatically send email notifications:

```typescript
// In API route after saving data
try {
  await sendWindingResistanceEmail(record)
  console.log("Email notification sent successfully")
} catch (emailError) {
  console.error("Failed to send email notification:", emailError)
  // API continues - email failure doesn't block form submission
}
```

### Error Handling

- Email failures don't block form submissions
- Comprehensive error logging
- Graceful fallbacks
- User-friendly error messages

## Usage Examples

### Winding Resistance Email

```typescript
import { sendWindingResistanceEmail } from '@/lib/email'

// Use default recipients from configuration
await sendWindingResistanceEmail(windingData)

// Use custom recipients
await sendWindingResistanceEmail(windingData, ['specific@vale.com'])

// Include/exclude Excel attachment
await sendWindingResistanceEmail(windingData, undefined, false) // No Excel
```

### Carbon Brush Email

```typescript
import { sendCarbonBrushEmail } from '@/lib/email'

await sendCarbonBrushEmail(carbonBrushData)
```

### Thermography Email

```typescript
import { sendThermographyEmail } from '@/lib/email'

await sendThermographyEmail(thermographyData)
```

### Generic Form Notification

```typescript
import { sendFormNotification } from '@/lib/email'

await sendFormNotification({
  formType: 'Custom Equipment Inspection',
  formData: inspectionData,
  customRecipients: ['inspector@vale.com'],
  includeExcel: true,
  excelData: {
    headers: ['Field', 'Value', 'Status'],
    data: [['Equipment', 'Motor-001', 'Active']],
    sheetName: 'Inspection Data'
  }
})
```

## Testing

### Email Test Script

Run the test script to verify email configuration:

```bash
node test-email.js
```

This will:
- ✅ Check environment variables
- ✅ Test recipient configuration
- ✅ Send a test email to Vale team
- ✅ Verify Gmail connectivity

### Manual Testing

Test email system in development:

```typescript
// In a test API route or component
import { sendEmail } from '@/lib/email'

await sendEmail({
  to: ['test@vale.com'],
  subject: 'Test Email',
  html: '<h1>Test</h1>',
  text: 'Test email'
})
```

## Security Features

- **App Password Authentication** - No regular passwords stored
- **Environment Variable Protection** - Sensitive data in env files
- **Email Validation** - Validates email addresses before sending
- **Error Logging** - Comprehensive logging without exposing credentials
- **Secure SMTP** - Uses Gmail's secure SMTP servers

## Troubleshooting

### Common Issues

1. **Email Not Sending**
   - Check Gmail credentials in .env file
   - Verify App Password is generated correctly
   - Ensure 2FA is enabled on Gmail account

2. **Recipients Not Receiving**
   - Check MAINTENANCE_EMAIL_RECIPIENTS configuration
   - Verify email addresses are valid
   - Check spam folders

3. **Excel Attachments Missing**
   - Check XLSX library installation: `pnpm install xlsx`
   - Verify createDetailedExcelReport function
   - Check file permissions in /tmp directory

### Debug Logging

Enable detailed logging:

```typescript
console.log('Email recipients:', getRecipients('winding-resistance'))
console.log('Gmail user:', process.env.GMAIL_USER)
console.log('App password set:', !!process.env.GMAIL_APP_PASSWORD)
```

## Vale Team Contact

For email system support, contact:
- **Ahmed**: ahmedsf100@gmail.com
- **Abdullah**: Abdullah.Hamadani@vale.com

## Dependencies

```json
{
  "nodemailer": "^6.9.8",
  "xlsx": "^0.18.5"
}
```

Install dependencies:
```bash
pnpm install nodemailer xlsx
pnpm install -D @types/nodemailer
```
