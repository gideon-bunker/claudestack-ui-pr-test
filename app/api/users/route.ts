import { NextRequest, NextResponse } from 'next/server';
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserListParams,
  UserRole,
  UserStatus,
  ApiResponse,
  PaginatedResponse,
  ValidationErrorResponse,
  ValidationError,
  PaginationMeta
} from '../../../lib/types/api';

// In-memory user storage (replace with database in production)
let users: User[] = [
  {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2024-01-15T10:30:00Z',
    metadata: { department: 'IT' }
  },
  {
    id: '2',
    email: 'user@example.com',
    name: 'Regular User',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    lastLoginAt: '2024-01-14T14:20:00Z'
  },
  {
    id: '3',
    email: 'pending@example.com',
    name: 'Pending User',
    role: UserRole.USER,
    status: UserStatus.PENDING,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z'
  }
];

let nextUserId = 4;

// Utility functions
function generateUserId(): string {
  return (nextUserId++).toString();
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateCreateUserRequest(data: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.email) {
    errors.push({ field: 'email', message: 'Email is required', code: 'REQUIRED' });
  } else if (!validateEmail(data.email)) {
    errors.push({ field: 'email', message: 'Invalid email format', code: 'INVALID_FORMAT' });
  } else if (users.some(user => user.email === data.email)) {
    errors.push({ field: 'email', message: 'Email already exists', code: 'DUPLICATE' });
  }

  if (!data.name || data.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Name is required', code: 'REQUIRED' });
  } else if (data.name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters', code: 'MIN_LENGTH' });
  }

  if (data.role && !Object.values(UserRole).includes(data.role)) {
    errors.push({ field: 'role', message: 'Invalid role', code: 'INVALID_VALUE' });
  }

  return errors;
}

function validateUpdateUserRequest(data: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (data.email !== undefined) {
    if (!validateEmail(data.email)) {
      errors.push({ field: 'email', message: 'Invalid email format', code: 'INVALID_FORMAT' });
    } else if (users.some(user => user.email === data.email)) {
      errors.push({ field: 'email', message: 'Email already exists', code: 'DUPLICATE' });
    }
  }

  if (data.name !== undefined) {
    if (!data.name || data.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Name cannot be empty', code: 'REQUIRED' });
    } else if (data.name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Name must be at least 2 characters', code: 'MIN_LENGTH' });
    }
  }

  if (data.role !== undefined && !Object.values(UserRole).includes(data.role)) {
    errors.push({ field: 'role', message: 'Invalid role', code: 'INVALID_VALUE' });
  }

  if (data.status !== undefined && !Object.values(UserStatus).includes(data.status)) {
    errors.push({ field: 'status', message: 'Invalid status', code: 'INVALID_VALUE' });
  }

  return errors;
}

function applyFilters(userList: User[], params: UserListParams): User[] {
  let filtered = [...userList];

  // Search filter
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filtered = filtered.filter(user =>
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  }

  // Role filter
  if (params.role) {
    filtered = filtered.filter(user => user.role === params.role);
  }

  // Status filter
  if (params.status) {
    filtered = filtered.filter(user => user.status === params.status);
  }

  // Sorting
  if (params.sortBy) {
    const sortOrder = params.sortOrder || 'asc';
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (params.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'lastLoginAt':
          aValue = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
          bValue = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  return filtered;
}

function paginateResults(userList: User[], page: number, limit: number): { users: User[], pagination: PaginationMeta } {
  const offset = (page - 1) * limit;
  const paginatedUsers = userList.slice(offset, offset + limit);
  
  const pagination: PaginationMeta = {
    page,
    limit,
    total: userList.length,
    totalPages: Math.ceil(userList.length / limit),
    hasNext: offset + limit < userList.length,
    hasPrev: page > 1
  };

  return { users: paginatedUsers, pagination };
}

// GET /api/users - List users with pagination and filtering
export async function GET(request: NextRequest): Promise<NextResponse<PaginatedResponse<User> | ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    
    const params: UserListParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '10'), 100), // Max 100 per page
      search: searchParams.get('search') || undefined,
      role: searchParams.get('role') as UserRole || undefined,
      status: searchParams.get('status') as UserStatus || undefined,
      sortBy: searchParams.get('sortBy') as any || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
    };

    // Validate pagination parameters
    if (params.page < 1) {
      return NextResponse.json({
        success: false,
        error: 'Page must be greater than 0',
        message: 'Invalid pagination parameters',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Apply filters and pagination
    const filteredUsers = applyFilters(users, params);
    const { users: paginatedUsers, pagination } = paginateResults(filteredUsers, params.page, params.limit);

    const response: PaginatedResponse<User> = {
      success: true,
      message: `Retrieved ${paginatedUsers.length} users`,
      data: paginatedUsers,
      pagination,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const errorResponse: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve users',
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<User> | ValidationErrorResponse>> {
  try {
    const body: CreateUserRequest = await request.json();

    // Validate request body
    const validationErrors = validateCreateUserRequest(body);
    if (validationErrors.length > 0) {
      const response: ValidationErrorResponse = {
        success: false,
        error: 'Validation failed',
        message: 'Invalid input data',
        validationErrors,
        timestamp: new Date().toISOString()
      };

      return NextResponse.json(response, { status: 400 });
    }

    // Create new user
    const newUser: User = {
      id: generateUserId(),
      email: body.email,
      name: body.name.trim(),
      role: body.role || UserRole.USER,
      status: UserStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: body.metadata
    };

    users.push(newUser);

    const response: ApiResponse<User> = {
      success: true,
      message: 'User created successfully',
      data: newUser,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid JSON in request body',
        message: 'Bad request',
        timestamp: new Date().toISOString()
      };

      return NextResponse.json(response, { status: 400 });
    }

    const errorResponse: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user',
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// PUT /api/users - Update a user (requires ID in query parameter)
export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse<User> | ValidationErrorResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: 'User ID is required',
        message: 'Missing required parameter',
        timestamp: new Date().toISOString()
      };

      return NextResponse.json(response, { status: 400 });
    }

    const userIndex = users.findIndex(user => user.id === userId);
    if (userIndex === -1) {
      const response: ApiResponse = {
        success: false,
        error: 'User not found',
        message: 'User does not exist',
        timestamp: new Date().toISOString()
      };

      return NextResponse.json(response, { status: 404 });
    }

    const body: UpdateUserRequest = await request.json();

    // Validate request body
    const validationErrors = validateUpdateUserRequest(body);
    if (validationErrors.length > 0) {
      const response: ValidationErrorResponse = {
        success: false,
        error: 'Validation failed',
        message: 'Invalid input data',
        validationErrors,
        timestamp: new Date().toISOString()
      };

      return NextResponse.json(response, { status: 400 });
    }

    // Update user
    const currentUser = users[userIndex];
    const updatedUser: User = {
      ...currentUser,
      name: body.name?.trim() ?? currentUser.name,
      role: body.role ?? currentUser.role,
      status: body.status ?? currentUser.status,
      metadata: body.metadata ?? currentUser.metadata,
      updatedAt: new Date().toISOString()
    };

    users[userIndex] = updatedUser;

    const response: ApiResponse<User> = {
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid JSON in request body',
        message: 'Bad request',
        timestamp: new Date().toISOString()
      };

      return NextResponse.json(response, { status: 400 });
    }

    const errorResponse: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user',
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// DELETE /api/users - Delete a user (requires ID in query parameter)
export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: 'User ID is required',
        message: 'Missing required parameter',
        timestamp: new Date().toISOString()
      };

      return NextResponse.json(response, { status: 400 });
    }

    const userIndex = users.findIndex(user => user.id === userId);
    if (userIndex === -1) {
      const response: ApiResponse = {
        success: false,
        error: 'User not found',
        message: 'User does not exist',
        timestamp: new Date().toISOString()
      };

      return NextResponse.json(response, { status: 404 });
    }

    const deletedUser = users[userIndex];
    users.splice(userIndex, 1);

    const response: ApiResponse = {
      success: true,
      message: `User '${deletedUser.name}' deleted successfully`,
      data: { deletedId: userId },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const errorResponse: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete user',
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}