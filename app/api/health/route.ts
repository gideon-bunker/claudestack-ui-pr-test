import { NextRequest, NextResponse } from 'next/server';
import {
  HealthStatus,
  ServiceHealth,
  SystemMetrics,
  ApiResponse
} from '../../../lib/types/api';

// Environment configuration
const APP_VERSION = process.env.APP_VERSION || '1.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Service start time for uptime calculation
const startTime = Date.now();

// Mock external services for demonstration
const externalServices = [
  { name: 'database', url: 'postgres://localhost:5432' },
  { name: 'redis', url: 'redis://localhost:6379' },
  { name: 'auth-service', url: 'https://auth.example.com' },
  { name: 'storage', url: 'https://storage.example.com' }
];

// Utility functions
function getSystemMetrics(): SystemMetrics {
  // In a real application, you would use actual system monitoring libraries
  // like 'node-os-utils', 'systeminformation', or cloud provider APIs
  
  const memoryUsage = process.memoryUsage();
  const totalMemory = memoryUsage.heapTotal + memoryUsage.external;
  const usedMemory = memoryUsage.heapUsed;

  return {
    memoryUsage: {
      used: Math.round(usedMemory / 1024 / 1024), // MB
      total: Math.round(totalMemory / 1024 / 1024), // MB
      percentage: Math.round((usedMemory / totalMemory) * 100)
    },
    cpuUsage: {
      // Mock CPU usage - in production, use actual system monitoring
      percentage: Math.round(Math.random() * 20 + 5) // 5-25% random usage
    },
    diskUsage: {
      used: 45120, // MB - mock value
      total: 102400, // MB - mock value
      percentage: 44
    },
    activeConnections: Math.floor(Math.random() * 100 + 10), // Mock active connections
    requestsPerMinute: Math.floor(Math.random() * 1000 + 100) // Mock RPM
  };
}

async function checkServiceHealth(service: { name: string; url: string }): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    // In a real application, you would make actual health check requests
    // For demonstration, we'll simulate different service states
    
    let status: 'healthy' | 'unhealthy' | 'degraded';
    let details: string | undefined;
    
    // Simulate different health states
    const random = Math.random();
    if (service.name === 'database') {
      status = random > 0.1 ? 'healthy' : 'degraded';
      details = status === 'degraded' ? 'High connection count' : undefined;
    } else if (service.name === 'redis') {
      status = random > 0.05 ? 'healthy' : 'unhealthy';
      details = status === 'unhealthy' ? 'Connection timeout' : undefined;
    } else if (service.name === 'auth-service') {
      status = random > 0.15 ? 'healthy' : 'degraded';
      details = status === 'degraded' ? 'Slow response times' : undefined;
    } else {
      status = random > 0.02 ? 'healthy' : 'unhealthy';
      details = status === 'unhealthy' ? 'Service unavailable' : undefined;
    }

    const responseTime = Date.now() - startTime + Math.floor(Math.random() * 100); // Add some mock latency

    return {
      name: service.name,
      status,
      responseTime,
      lastChecked: new Date().toISOString(),
      details
    };
  } catch (error) {
    return {
      name: service.name,
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function performHealthChecks(): Promise<ServiceHealth[]> {
  // Run all service health checks in parallel
  const healthChecks = externalServices.map(service => checkServiceHealth(service));
  return Promise.all(healthChecks);
}

function determineOverallStatus(services: ServiceHealth[]): 'healthy' | 'unhealthy' | 'degraded' {
  const unhealthyServices = services.filter(service => service.status === 'unhealthy');
  const degradedServices = services.filter(service => service.status === 'degraded');

  if (unhealthyServices.length > 0) {
    return 'unhealthy';
  } else if (degradedServices.length > 0) {
    return 'degraded';
  } else {
    return 'healthy';
  }
}

function getUptime(): number {
  return Math.floor((Date.now() - startTime) / 1000); // seconds
}

// GET /api/health - Comprehensive health check
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<HealthStatus>>> {
  try {
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';
    const includeMetrics = searchParams.get('metrics') !== 'false'; // default true

    // Perform service health checks
    const serviceHealthChecks = detailed ? await performHealthChecks() : [];
    
    // Get system metrics
    const metrics = includeMetrics ? getSystemMetrics() : {
      memoryUsage: { used: 0, total: 0, percentage: 0 },
      cpuUsage: { percentage: 0 }
    };

    // Determine overall status
    const overallStatus = detailed ? determineOverallStatus(serviceHealthChecks) : 'healthy';

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: getUptime(),
      version: APP_VERSION,
      environment: NODE_ENV,
      services: serviceHealthChecks,
      metrics
    };

    const response: ApiResponse<HealthStatus> = {
      success: true,
      message: `System is ${overallStatus}`,
      data: healthStatus,
      timestamp: new Date().toISOString()
    };

    // Set appropriate HTTP status code based on health
    let statusCode: number;
    switch (overallStatus) {
      case 'healthy':
        statusCode = 200;
        break;
      case 'degraded':
        statusCode = 200; // Still operational
        break;
      case 'unhealthy':
        statusCode = 503; // Service unavailable
        break;
      default:
        statusCode = 200;
    }

    return NextResponse.json(response, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    const errorResponse: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Health check failed',
      message: 'Internal server error during health check',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// HEAD /api/health - Lightweight health check (no body)
export async function HEAD(request: NextRequest): Promise<NextResponse> {
  try {
    // Simple check - just verify the service is responding
    const isHealthy = true; // In production, do minimal checks here
    
    return new NextResponse(null, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Health-Status': isHealthy ? 'healthy' : 'unhealthy',
        'X-Uptime': getUptime().toString(),
        'X-Version': APP_VERSION
      }
    });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}

// POST /api/health - Trigger manual health check (for admin use)
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<HealthStatus>>> {
  try {
    // This could be used for triggering manual health checks or updates
    // In production, you might want to add authentication here
    
    const body = await request.json().catch(() => ({}));
    const forceRefresh = body.forceRefresh === true;

    if (forceRefresh) {
      // Force refresh of all health checks
      const serviceHealthChecks = await performHealthChecks();
      const metrics = getSystemMetrics();
      const overallStatus = determineOverallStatus(serviceHealthChecks);

      const healthStatus: HealthStatus = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: getUptime(),
        version: APP_VERSION,
        environment: NODE_ENV,
        services: serviceHealthChecks,
        metrics
      };

      const response: ApiResponse<HealthStatus> = {
        success: true,
        message: 'Manual health check completed',
        data: healthStatus,
        timestamp: new Date().toISOString()
      };

      return NextResponse.json(response, { status: 200 });
    }

    // Default response for POST without forceRefresh
    const response: ApiResponse = {
      success: true,
      message: 'Health check endpoint is operational',
      data: {
        message: 'Use POST with {"forceRefresh": true} to trigger full health check'
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const errorResponse: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Manual health check failed',
      message: 'Internal server error',
      timestamp: new Date().toISOString()
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
      'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}