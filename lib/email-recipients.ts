// Email Recipients Configuration for Vale Equipment Management System

export interface RecipientConfig {
  primary: string[]
  specific: {
    ahmed: string
    abdullah: string
  }
  byEquipmentType: {
    windingResistance: string[]
    carbonBrush: string[]
    thermography: string[]
    motor: string[]
    transformer: string[]
    esp: string[]
  }
  emergency: string[]
}

// Default Vale Equipment Team Recipients
export const VALE_RECIPIENTS: RecipientConfig = {
  primary: ['ahmedsf100@gmail.com', 'Abdullah.Hamadani@vale.com'],
  
  specific: {
    ahmed: 'ahmedsf100@gmail.com',
    abdullah: 'Abdullah.Hamadani@vale.com'
  },
  
  byEquipmentType: {
    windingResistance: ['ahmedsf100@gmail.com', 'Abdullah.Hamadani@vale.com'],
    carbonBrush: ['ahmedsf100@gmail.com', 'Abdullah.Hamadani@vale.com'],
    thermography: ['ahmedsf100@gmail.com', 'Abdullah.Hamadani@vale.com'],
    motor: ['ahmedsf100@gmail.com', 'Abdullah.Hamadani@vale.com'],
    transformer: ['ahmedsf100@gmail.com', 'Abdullah.Hamadani@vale.com'],
    esp: ['ahmedsf100@gmail.com', 'Abdullah.Hamadani@vale.com']
  },
  
  emergency: ['ahmedsf100@gmail.com', 'Abdullah.Hamadani@vale.com']
}

// Get recipients based on equipment type and notification type
export function getRecipients(
  type: 'winding-resistance' | 'carbon-brush' | 'thermography' | 'motor' | 'transformer' | 'esp' | 'general' | 'emergency' = 'general',
  customRecipients?: string[]
): string[] {
  // If custom recipients provided, use them
  if (customRecipients && customRecipients.length > 0) {
    return customRecipients
  }

  // Check environment variables first
  const envKey = getEnvKey(type)
  const envRecipients = process.env[envKey]
  if (envRecipients) {
    return envRecipients.split(',').map(email => email.trim())
  }

  // Fallback to default recipients based on type
  switch (type) {
    case 'winding-resistance':
      return VALE_RECIPIENTS.byEquipmentType.windingResistance
    case 'carbon-brush':
      return VALE_RECIPIENTS.byEquipmentType.carbonBrush
    case 'thermography':
      return VALE_RECIPIENTS.byEquipmentType.thermography
    case 'motor':
      return VALE_RECIPIENTS.byEquipmentType.motor
    case 'transformer':
      return VALE_RECIPIENTS.byEquipmentType.transformer
    case 'esp':
      return VALE_RECIPIENTS.byEquipmentType.esp
    case 'emergency':
      return VALE_RECIPIENTS.emergency
    default:
      return VALE_RECIPIENTS.primary
  }
}

// Get environment variable key for recipient type
function getEnvKey(type: string): string {
  const envKeyMap: Record<string, string> = {
    'winding-resistance': 'WINDING_RESISTANCE_RECIPIENTS',
    'carbon-brush': 'CARBON_BRUSH_RECIPIENTS',
    'thermography': 'THERMOGRAPHY_RECIPIENTS',
    'motor': 'MOTOR_INSPECTION_RECIPIENTS',
    'transformer': 'TRANSFORMER_INSPECTION_RECIPIENTS',
    'esp': 'ESP_INSPECTION_RECIPIENTS',
    'emergency': 'URGENT_NOTIFICATION_RECIPIENTS',
    'general': 'MAINTENANCE_EMAIL_RECIPIENTS'
  }
  
  return envKeyMap[type] || 'MAINTENANCE_EMAIL_RECIPIENTS'
}

// Get all Vale team members
export function getAllValeRecipients(): string[] {
  return VALE_RECIPIENTS.primary
}

// Get specific team member email
export function getTeamMemberEmail(member: 'ahmed' | 'abdullah'): string {
  return VALE_RECIPIENTS.specific[member]
}

// Validate email addresses
export function validateEmailList(emails: string[]): { valid: string[], invalid: string[] } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const valid: string[] = []
  const invalid: string[] = []
  
  emails.forEach(email => {
    const trimmedEmail = email.trim()
    if (emailRegex.test(trimmedEmail)) {
      valid.push(trimmedEmail)
    } else {
      invalid.push(trimmedEmail)
    }
  })
  
  return { valid, invalid }
}

// Format recipients for display
export function formatRecipientsDisplay(emails: string[]): string {
  if (emails.length === 0) return 'No recipients'
  if (emails.length === 1) return emails[0]
  if (emails.length === 2) return `${emails[0]} and ${emails[1]}`
  
  const lastEmail = emails[emails.length - 1]
  const otherEmails = emails.slice(0, -1).join(', ')
  return `${otherEmails}, and ${lastEmail}`
}
