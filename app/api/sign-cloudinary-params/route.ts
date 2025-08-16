import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 DEBUG - Signature endpoint called');
    console.log('🔧 DEBUG - Environment check:', {
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'MISSING',
      apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY ? 'SET' : 'MISSING',
      apiSecret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'MISSING'
    });

    const body = await request.json();
    const { paramsToSign } = body;
    
    console.log('🔧 DEBUG - Params to sign:', paramsToSign);

    if (!process.env.CLOUDINARY_API_SECRET) {
      console.error('🔧 DEBUG - Missing CLOUDINARY_API_SECRET');
      return NextResponse.json(
        { error: 'Missing CLOUDINARY_API_SECRET environment variable' },
        { status: 500 }
      );
    }

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    console.log('🔧 DEBUG - Signature generated successfully');
    
    return NextResponse.json({ signature });
  } catch (error) {
    console.error('🔧 DEBUG - Signature generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate signature' },
      { status: 500 }
    );
  }
}
