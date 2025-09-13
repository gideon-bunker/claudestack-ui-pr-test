// Base API Response Types
export interface BaseResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

export interface SuccessResponse<T = any> extends BaseResponse {
  success: true;
  data: T;
}

export interface ErrorResponse extends BaseResponse {
  success: false;
  error: string;
  details?: string;
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// HTTP Method Types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> extends SuccessResponse<T[]> {
  data: T[];
  pagination: PaginationMeta;
}

// User Management Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  metadata?: Record<string, any>;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  role?: UserRole;
  metadata?: Record<string, any>;
}

export interface UpdateUserRequest {
  name?: string;
  role?: UserRole;
  status?: UserStatus;
  metadata?: Record<string, any>;
}

export interface UserListParams extends PaginationParams {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  sortBy?: 'name' | 'email' | 'createdAt' | 'lastLoginAt';
  sortOrder?: 'asc' | 'desc';
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
  VIEWER = 'viewer'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending'
}

// Health Check Types
export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: ServiceHealth[];
  metrics: SystemMetrics;
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  lastChecked: string;
  details?: string;
}

export interface SystemMetrics {
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cpuUsage: {
    percentage: number;
  };
  diskUsage?: {
    used: number;
    total: number;
    percentage: number;
  };
  activeConnections?: number;
  requestsPerMinute?: number;
}

// Request Validation Types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationErrorResponse extends ErrorResponse {
  validationErrors: ValidationError[];
}

// Rate Limiting Types
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// API Key/Auth Types
export interface ApiKeyInfo {
  id: string;
  name: string;
  permissions: string[];
  expiresAt?: string;
  lastUsed?: string;
}

// Generic Query Parameters
export interface QueryParams {
  [key: string]: string | number | boolean | undefined;
}

// File Upload Types (for future use)
export interface FileUploadRequest {
  file: File;
  filename?: string;
  metadata?: Record<string, any>;
}

export interface FileUploadResponse {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  url: string;
  uploadedAt: string;
}

// Webhook Types (for future use)
export interface WebhookEvent {
  id: string;
  type: string;
  data: Record<string, any>;
  timestamp: string;
  source: string;
}

// Generic CRUD Operation Types
export interface CreateRequest<T> {
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
}

export interface UpdateRequest<T> {
  data: Partial<Omit<T, 'id' | 'createdAt'>>;
}

export interface DeleteRequest {
  id: string;
  force?: boolean;
}

// API Configuration Types
export interface ApiConfig {
  baseUrl: string;
  version: string;
  timeout: number;
  retries: number;
  rateLimit: {
    requests: number;
    window: number;
  };
}

// Search and Filter Types
export interface SearchParams {
  query: string;
  fields?: string[];
  exact?: boolean;
  caseSensitive?: boolean;
}

export interface FilterParams {
  [key: string]: any;
}

export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}