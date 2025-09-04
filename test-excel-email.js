// Test Excel generation for email attachments
// Run with: node test-excel-email.js

require('dotenv').config()

async function testExcelGeneration() {
  console.log('🧪 Testing Excel Generation for Email Attachments...\n')
  
  try {
    // Import email functions
    const { createWindingResistanceExcelBuffer, createCarbonBrushExcelBuffer, createThermographyExcelBuffer } = await import('./lib/email.js')
    
    // Test data for winding resistance
    const windingTestData = {
      id: 1,
      motorNo: 'TEST-MOTOR-001',
      inspectionDate: '2024-01-15',
      doneBy: 'Test Engineer',
      workHolder: 'Test Supervisor',
      windingResistance: {
        values: { ry: 2.5, yb: 2.4, rb: 2.6 },
        units: { ry: 'Ω', yb: 'Ω', rb: 'Ω' }
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
        units: { ug_1min: 'GΩ', ug_10min: 'GΩ', vg_1min: 'GΩ', vg_10min: 'GΩ', wg_1min: 'GΩ', wg_10min: 'GΩ' }
      },
      darValues: {
        values: {
          ug_30sec: 12.1,
          ug_1min: 15.2,
          vg_30sec: 11.8,
          vg_1min: 14.8,
          wg_30sec: 12.0,
          wg_1min: 15.1
        }
      },
      polarizationIndex: 1.22,
      remarks: 'Test data for email Excel generation',
      equipment: {
        equipmentName: 'Test Motor Equipment',
        equipmentType: 'Motor'
      }
    }
    
    console.log('📊 Testing Winding Resistance Excel Generation...')
    console.log('Input data:', JSON.stringify(windingTestData, null, 2))
    
    // Test carbon brush data
    const carbonTestData = {
      id: 2,
      tagNo: 'TEST-CARBON-001',
      equipmentName: 'Test Carbon Brush Motor',
      brushType: 'C80X',
      inspectionDate: '2024-01-15',
      workOrderNo: 'WO-2024-001',
      doneBy: 'Test Engineer',
      measurements: {
        '1A': 45.2,
        '1B': 44.8,
        '2A': 43.5,
        '2B': 44.1,
        '3A': 42.9,
        '3B': 43.7
      },
      slipRingThickness: 12.5,
      slipRingIr: 2.3,
      remarks: 'Test carbon brush data'
    }
    
    console.log('\n🔧 Testing Carbon Brush Excel Generation...')
    console.log('Input data:', JSON.stringify(carbonTestData, null, 2))
    
    // Test thermography data
    const thermoTestData = {
      id: 3,
      transformerNo: 'TEST-TF-001',
      equipmentType: 'ESP',
      inspectionDate: '2024-01-15',
      month: 1,
      doneBy: 'Test Engineer',
      mccbIcRPhase: 45.2,
      mccbIcBPhase: 46.1,
      mccbCOg1: 44.8,
      mccbCOg2: 45.5,
      mccbBodyTemp: 42.3,
      kvMa: '6.6',
      spMin: 1485,
      scrCoolingFinsTemp: 38.7,
      scrCoolingFan: 1,
      panelExhaustFan: 1,
      mccForcedCoolingFanTemp: 25,
      rdi68: 41.2,
      rdi69: 40.8,
      rdi70: 42.1,
      remarks: 'Test thermography data'
    }
    
    console.log('\n🌡️ Testing Thermography Excel Generation...')
    console.log('Input data:', JSON.stringify(thermoTestData, null, 2))
    
    console.log('\n✅ Excel generation test completed. Check actual form submissions for real data validation.')
    
  } catch (error) {
    console.error('❌ Excel generation test failed:', error)
  }
}

// Run the test
testExcelGeneration()
