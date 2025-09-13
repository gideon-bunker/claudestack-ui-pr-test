import { NextRequest, NextResponse } from 'next/server';

// Define types for request/response data
interface TestRequestBody {
  message?: string;
  data?: Record<string, any>;
}

interface TestResponse {
  success: boolean;
  message: string;
  data?: any;
  timestamp: string;
  method: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  timestamp: string;
  method: string;
}

// GET handler
export async function GET(request: NextRequest): Promise<NextResponse<TestResponse | ErrorResponse>> {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const limit = searchParams.get('limit');

    const response: TestResponse = {
      success: true,
      message: 'Test API endpoint is working correctly',
      data: {
        query: query || null,
        limit: limit ? parseInt(limit) : null,
        url: request.url,
        headers: Object.fromEntries(request.headers.entries()),
      },
      timestamp: new Date().toISOString(),
      method: 'GET',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString(),
      method: 'GET',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// POST handler
export async function POST(request: NextRequest): Promise<NextResponse<TestResponse | ErrorResponse>> {
  try {
    // Parse request body
    const body: TestRequestBody = await request.json();

    // Validate request body
    if (!body || typeof body !== 'object') {
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'Invalid request body. Expected JSON object.',
        timestamp: new Date().toISOString(),
        method: 'POST',
      };

      return NextResponse.json(errorResponse, { status: 400 });
    }

    const response: TestResponse = {
      success: true,
      message: body.message || 'POST request processed successfully',
      data: {
        receivedData: body.data || null,
        bodySize: JSON.stringify(body).length,
        contentType: request.headers.get('content-type'),
      },
      timestamp: new Date().toISOString(),
      method: 'POST',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process POST request',
      timestamp: new Date().toISOString(),
      method: 'POST',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// PUT handler (optional - for completeness)
export async function PUT(request: NextRequest): Promise<NextResponse<TestResponse | ErrorResponse>> {
  try {
    const body: TestRequestBody = await request.json();

    const response: TestResponse = {
      success: true,
      message: 'PUT request processed successfully',
      data: {
        updatedData: body,
      },
      timestamp: new Date().toISOString(),
      method: 'PUT',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process PUT request',
      timestamp: new Date().toISOString(),
      method: 'PUT',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// DELETE handler (optional - for completeness)
export async function DELETE(request: NextRequest): Promise<NextResponse<TestResponse | ErrorResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'ID parameter is required for DELETE requests',
        timestamp: new Date().toISOString(),
        method: 'DELETE',
      };

      return NextResponse.json(errorResponse, { status: 400 });
    }

    const response: TestResponse = {
      success: true,
      message: `Resource with ID ${id} deleted successfully`,
      data: {
        deletedId: id,
      },
      timestamp: new Date().toISOString(),
      method: 'DELETE',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process DELETE request',
      timestamp: new Date().toISOString(),
      method: 'DELETE',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}