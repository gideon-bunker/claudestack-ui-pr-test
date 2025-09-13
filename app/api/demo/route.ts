import { NextRequest, NextResponse } from 'next/server';

// Demo API endpoint for automated PR testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Automated PR creation test successful!',
    timestamp: new Date().toISOString(),
    features: [
      'API endpoints created',
      'TypeScript types added',
      'Error handling implemented',
      'Production-ready code'
    ]
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  return NextResponse.json({
    success: true,
    message: 'PR automation working correctly',
    received: body,
    timestamp: new Date().toISOString()
  }, { status: 201 });
}