// Test script to verify email data extraction
// Run with: node test-winding-email.js

require('dotenv').config()

const sampleRecord = {
  id: 1,
  motorNo: "TEST-MOTOR-001",
  inspectionDate: "2024-01-15T10:30:00Z",
  doneBy: "Test Engineer",
  workHolder: "Test Supervisor",
  equipment: {
    equipmentName: "Test Motor Equipment",
    equipmentType: "Motor"
  },
  windingResistance: {
    values: {
      ry: 2.5,
      yb: 2.4, 
      rb: 2.6
    },
    units: {
      ry: "Ω",
      yb: "Ω", 
      rb: "Ω"
    }
  },
  irValues: {
    values: {
      ug_1min: 15.2,
      ug_10min: 18.5,
      vg_1min: 14.8,
      vg_10min: 17.9,
      wg_1min: 15.1,
      wg_10min: 18.2
    },
    units: {
      ug_1min: "GΩ",
      ug_10min: "GΩ",
      vg_1min: "GΩ",
      vg_10min: "GΩ",
      wg_1min: "GΩ",
      wg_10min: "GΩ"
    }
  },
  darValues: {
    values: {
      ug_30sec: 12.1,
      ug_1min: 15.2,
      vg_30sec: 11.8,
      vg_1min: 14.8,
      wg_30sec: 12.0,
      wg_1min: 15.1
    },
    units: {
      ug_30sec: "GΩ",
      ug_1min: "GΩ",
      vg_30sec: "GΩ",
      vg_1min: "GΩ",
      wg_30sec: "GΩ",
      wg_1min: "GΩ"
    },
    results: {
      ug_dar: 1.26,
      vg_dar: 1.25,
      wg_dar: 1.26
    }
  },
  primary5kVPI: {
    pi_result: 1.22
  },
  polarizationIndex: 1.22,
  remarks: "Test data with all measurements included"
}

async function testDataExtraction() {
  console.log('🧪 Testing Winding Resistance Data Extraction...\n')
  
  try {
    const { emailTemplates } = await import('./lib/email.js')
    
    console.log('📧 Testing email template data extraction:')
    const template = emailTemplates.windingResistance(sampleRecord)
    
    console.log('Subject:', template.subject)
    console.log('\nHTML Content Preview:')
    console.log(template.html.substring(0, 500) + '...')
    
    console.log('\nText Content:')
    console.log(template.text)
    
    // Test Excel generation manually
    console.log('\n📊 Testing manual data extraction:')
    
    const windingValues = sampleRecord.windingResistance?.values || {}
    const irValues = sampleRecord.irValues?.values || {}
    const darValues = sampleRecord.darValues?.values || {}
    const primaryPI = sampleRecord.primary5kVPI || {}
    
    console.log('Extracted Data:')
    console.log('- Winding Values:', windingValues)
    console.log('- IR Values:', irValues)  
    console.log('- DAR Values:', darValues)
    console.log('- Primary PI:', primaryPI)
    
    console.log('\n✅ Data extraction test completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Full error:', error)
  }
}

// Run the test
testDataExtraction()
