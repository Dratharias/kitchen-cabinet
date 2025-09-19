export type UUID = string;

export interface PaginatedRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  filter?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ErrorResponse {
  error: string;
}
