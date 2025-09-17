export type UUID = string;

export interface PaginatedRequest {
  skip?: number;
  take?: number;
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
