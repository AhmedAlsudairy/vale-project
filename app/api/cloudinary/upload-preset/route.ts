import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    console.log('🔧 DEBUG - Environment Variables:', {
      cloudName: cloudName || 'MISSING',
      apiKey: apiKey ? `${apiKey.substring(0, 4)}...` : 'MISSING',
      apiSecret: apiSecret ? 'SET' : 'MISSING'
    })

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { 
          error: 'Missing Cloudinary configuration',
          debug: {
            cloudName: !!cloudName,
            apiKey: !!apiKey,
            apiSecret: !!apiSecret
          }
        },
        { status: 400 }
      )
    }

    // Create upload preset via Cloudinary Admin API
    const presetData = {
      name: 'lrs-thermography-preset',
      unsigned: true,
      folder: 'lrs-thermography',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      max_file_size: 5000000,
      use_filename: true,
      unique_filename: true,
      overwrite: false
    }

    console.log('🔧 DEBUG - Creating preset:', presetData)

    const authHeader = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`
    console.log('🔧 DEBUG - Auth header created:', authHeader.substring(0, 20) + '...')

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/upload_presets`,
      {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(presetData)
      }
    )

    console.log('🔧 DEBUG - Cloudinary response status:', response.status)

    if (response.ok) {
      const result = await response.json()
      console.log('🔧 DEBUG - Preset created successfully:', result)
      return NextResponse.json({ 
        message: 'Upload preset created successfully',
        preset: result,
        debug: { status: response.status }
      })
    } else {
      const errorText = await response.text()
      console.error('🔧 DEBUG - Cloudinary error:', errorText)
      return NextResponse.json(
        { 
          error: `Failed to create preset: ${errorText}`,
          debug: { status: response.status, cloudName, presetName: presetData.name }
        },
        { status: response.status }
      )
    }
  } catch (error) {
    console.error('🔧 DEBUG - Full error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        debug: { message: error instanceof Error ? error.message : 'Unknown error' }
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    console.log('🔧 DEBUG - GET Environment Variables:', {
      cloudName: cloudName || 'MISSING',
      apiKey: apiKey ? `${apiKey.substring(0, 4)}...` : 'MISSING',
      apiSecret: apiSecret ? 'SET' : 'MISSING'
    })

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { 
          error: 'Missing Cloudinary configuration',
          debug: {
            cloudName: !!cloudName,
            apiKey: !!apiKey,
            apiSecret: !!apiSecret
          }
        },
        { status: 400 }
      )
    }

    const authHeader = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`
    console.log('🔧 DEBUG - GET Auth header created:', authHeader.substring(0, 20) + '...')

    // Check if upload preset exists
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/upload_presets`,
      {
        headers: {
          'Authorization': authHeader
        }
      }
    )

    console.log('🔧 DEBUG - GET Cloudinary response status:', response.status)

    if (response.ok) {
      const presets = await response.json()
      console.log('🔧 DEBUG - Available presets:', presets.presets?.map((p: any) => p.name) || 'None')
      
      const lrsPreset = presets.presets?.find((p: any) => p.name === 'lrs-thermography-preset')
      
      return NextResponse.json({
        cloudName,
        hasPreset: !!lrsPreset,
        preset: lrsPreset,
        totalPresets: presets.presets?.length || 0,
        allPresets: presets.presets?.map((p: any) => ({ name: p.name, unsigned: p.unsigned })) || [],
        debug: { status: response.status }
      })
    } else {
      const errorText = await response.text()
      console.error('🔧 DEBUG - GET Cloudinary error:', errorText)
      return NextResponse.json(
        { 
          error: 'Failed to fetch presets',
          debug: { status: response.status, error: errorText, cloudName }
        },
        { status: response.status }
      )
    }
  } catch (error) {
    console.error('🔧 DEBUG - GET Full error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        debug: { message: error instanceof Error ? error.message : 'Unknown error' }
      },
      { status: 500 }
    )
  }
}
