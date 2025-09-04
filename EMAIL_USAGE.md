# Email Utilities with Excel Attachments Usage Guide

## Environment Setup

First, add these environment variables to your `.env.local` file:

```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
MAINTENANCE_EMAIL_RECIPIENTS=maintenance@vale.com,supervisor@vale.com
```

**Note:** You need to generate an App Password from your Google Account settings. See `GMAIL_SETUP.md` for detailed instructions.

## Features

✅ **Automatic email notifications** for all form submissions  
✅ **Excel report attachments** with professional formatting  
✅ **Multiple email templates** for different equipment types  
✅ **Flexible API** for custom email scenarios  
✅ **Error handling** - form submission succeeds even if email fails  

## Available Email Functions

### 1. Basic Email Sending with Attachments

```typescript
import { sendEmail } from '@/lib/email'

await sendEmail({
  to: 'recipient@example.com',
  subject: 'Test Email',
  html: '<h1>Hello World</h1>',
  text: 'Hello World',
  attachments: [{
    filename: 'report.xlsx',
    content: excelBuffer,
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }]
})
```

### 2. Equipment-Specific Emails (Auto Excel Included)

```typescript
import { 
  sendWindingResistanceEmail, 
  sendCarbonBrushEmail, 
  sendThermographyEmail 
} from '@/lib/email'

// Winding Resistance (includes Excel attachment by default)
await sendWindingResistanceEmail(
  windingResistanceData, 
  ['maintenance@vale.com'], 
  true // includeExcel - optional, defaults to true
)

// Carbon Brush (includes Excel attachment by default)
await sendCarbonBrushEmail(
  carbonBrushData, 
  ['maintenance@vale.com'], 
  true // includeExcel - optional, defaults to true
)

// Thermography (includes Excel attachment by default)
await sendThermographyEmail(
  thermographyData, 
  ['maintenance@vale.com'], 
  true // includeExcel - optional, defaults to true
)
```

### 3. Generic Form Notification with Excel

```typescript
import { sendFormNotification } from '@/lib/email'

await sendFormNotification({
  formType: 'Equipment Inspection',
  formData: {
    equipmentId: 'E001',
    inspector: 'John Doe',
    status: 'Complete'
  },
  recipients: ['supervisor@vale.com'],
  includeExcel: true,
  excelData: {
    headers: ['Equipment ID', 'Inspector', 'Status', 'Date'],
    data: [['E001', 'John Doe', 'Complete', '2024-01-15']],
    sheetName: 'Inspection Report'
  }
})
```

### 4. Custom Email with Excel Data

```typescript
import { sendCustomEmail } from '@/lib/email'

await sendCustomEmail({
  to: ['recipient@example.com'],
  subject: 'Equipment Report',
  message: 'Please find the equipment report attached.',
  data: { equipmentCount: 5, inspectionDate: '2024-01-15' },
  template: 'default',
  priority: 'normal',
  includeExcel: true,
  excelData: {
    headers: ['Item', 'Status', 'Date'],
    data: [
      ['Motor A', 'Good', '2024-01-15'],
      ['Motor B', 'Fair', '2024-01-15']
    ],
    sheetName: 'Equipment Status'
  }
})
```

## API Route Usage

Send a POST request to `/api/send-email` with different types:

### Winding Resistance Email (with Excel)
```json
{
  "type": "winding-resistance",
  "data": {
    "motorNo": "M001",
    "equipment_name": "Main Motor",
    "inspection_date": "2024-01-15",
    "windingResistance": { "ry": 2.5, "yb": 2.4, "rb": 2.6 },
    "irValues": { "ug_1min": 15.2, "vg_1min": 14.8, "wg_1min": 15.1 }
  },
  "recipients": ["maintenance@vale.com"],
  "includeExcel": true
}
```

### Carbon Brush Email (with Excel)
```json
{
  "type": "carbon-brush",
  "data": {
    "tagNo": "CB001",
    "equipmentName": "Fan Motor",
    "brushType": "C80X",
    "inspection_date": "2024-01-15",
    "measurements": { "1A_inner": 45.2, "1A_center": 44.8 },
    "slipRingThickness": 12.5,
    "slipRingIr": 2.3
  },
  "recipients": ["maintenance@vale.com"],
  "includeExcel": true
}
```

### Thermography Email (with Excel)
```json
{
  "type": "thermography",
  "data": {
    "transformerNo": "TF001",
    "equipmentType": "ESP",
    "inspection_date": "2024-01-15",
    "measurements": { "mccbRPhase": 45.2, "mccbBPhase": 46.1 }
  },
  "recipients": ["maintenance@vale.com"],
  "includeExcel": true
}
```

### Custom Form Notification with Excel
```json
{
  "type": "form-notification",
  "formType": "Equipment Inspection",
  "formData": {
    "equipmentId": "E001",
    "inspector": "John Doe",
    "status": "Complete"
  },
  "recipients": ["supervisor@vale.com"],
  "includeExcel": true,
  "excelData": {
    "headers": ["Equipment ID", "Inspector", "Status", "Date"],
    "data": [["E001", "John Doe", "Complete", "2024-01-15"]],
    "sheetName": "Inspection Report"
  }
}
```

### Custom Email with Excel
```json
{
  "type": "custom",
  "to": ["recipient@example.com"],
  "subject": "Equipment Report",
  "message": "Please find the equipment report attached.",
  "data": {
    "equipmentCount": 5,
    "inspectionDate": "2024-01-15"
  },
  "template": "default",
  "priority": "normal",
  "includeExcel": true,
  "excelData": {
    "headers": ["Item", "Status", "Date"],
    "data": [
      ["Motor A", "Good", "2024-01-15"],
      ["Motor B", "Fair", "2024-01-15"]
    ],
    "sheetName": "Equipment Status"
  }
}
```

## Auto-Integration in Forms

All your forms now automatically send email notifications with Excel attachments when submitted:

### ✅ Winding Resistance Form
- **Auto sends:** Email notification with detailed Excel report
- **Recipients:** From `MAINTENANCE_EMAIL_RECIPIENTS` environment variable
- **Excel includes:** All test data, IR values, PI results, status analysis

### ✅ Carbon Brush Form  
- **Auto sends:** Email notification with measurement Excel report
- **Recipients:** From `MAINTENANCE_EMAIL_RECIPIENTS` environment variable
- **Excel includes:** All brush measurements, slip ring data, status analysis

### ✅ Thermography Form
- **Auto sends:** Email notification with temperature Excel report
- **Recipients:** From `MAINTENANCE_EMAIL_RECIPIENTS` environment variable
- **Excel includes:** All temperature readings, status analysis

## Frontend Integration Example

```typescript
// In your form submission handler
const handleSubmit = async (formData) => {
  try {
    // Save form data to database (this will automatically send email)
    const saveResponse = await fetch('/api/winding-resistance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    
    if (saveResponse.ok) {
      // Email with Excel attachment is automatically sent!
      alert('Form submitted and notification sent with Excel report!')
    }
  } catch (error) {
    console.error('Error:', error)
  }
}
```

## Manual Email Sending

You can also manually send emails with Excel attachments:

```typescript
// Manual email with custom Excel data
const sendManualReport = async () => {
  await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'custom',
      to: ['manager@vale.com'],
      subject: 'Weekly Equipment Report',
      message: 'Please find this week\\'s equipment inspection summary.',
      includeExcel: true,
      excelData: {
        headers: ['Equipment', 'Status', 'Last Inspection', 'Next Due'],
        data: [
          ['Motor A', 'Good', '2024-01-15', '2024-02-15'],
          ['Motor B', 'Warning', '2024-01-14', '2024-02-14'],
          ['Motor C', 'Critical', '2024-01-13', '2024-01-20']
        ],
        sheetName: 'Weekly Report'
      }
    })
  })
}
```

## Check Email Configuration

GET request to `/api/send-email` returns:
```json
{
  "configured": true,
  "missing": [],
  "available_types": [
    "winding-resistance",
    "carbon-brush",
    "form-notification", 
    "inspection-alert",
    "custom",
    "basic"
  ]
}
```
