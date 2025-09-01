/**
 * API-related TypeScript types
 */

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiErrorResponse {
  error: {
    message: string;
    code: string;
    statusCode: number;
    details?: Record<string, unknown>;
  };
  success: false;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface FilterParams {
  [key: string]: string | number | boolean | string[] | number[] | undefined;
}

export interface SearchParams
  extends PaginationParams,
    SortParams,
    FilterParams {
  q?: string;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiRequestConfig {
  method: HttpMethod;
  url: string;
  data?: unknown;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface WebSocketMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp: string;
  id: string;
}

export interface WebSocketEvent {
  event: string;
  data: unknown;
  timestamp: string;
}

// API endpoint types
export interface DashboardStatsResponse {
  totalCompanies: number;
  totalInvestments: number;
  totalEmployees: number;
  recentDevelopments: number;
  growthRate: number;
  marketValue: number;
}

export type TrendDataResponse = {
  date: string;
  value: number;
  change: number;
  changePercent: number;
}[];

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  category: string;
  sentiment: "positive" | "negative" | "neutral";
  relevanceScore: number;
}
