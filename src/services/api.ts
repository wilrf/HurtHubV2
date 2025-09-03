/**
 * Centralized API Service for Vercel-Only Deployment
 * 
 * This service automatically constructs API URLs using the current Vercel deployment
 * and provides a consistent interface for all API calls.
 */

import { env } from '@/config/env';

export interface APIResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success?: boolean;
}

export interface APIError {
  message: string;
  status: number;
  endpoint: string;
  timestamp: string;
}

class APIService {
  private readonly baseUrl: string;

  constructor() {
    // Use the environment config to get the dynamic API base URL
    this.baseUrl = env.apiBaseUrl;
  }

  /**
   * Generic request method with error handling
   */
  async request<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = env.apiPath(endpoint);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        const error: APIError = {
          message: errorText || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          endpoint,
          timestamp: new Date().toISOString(),
        };
        
        // Log error for debugging (only in non-production)
        if (!env.isProduction()) {
          console.error(`[API Error] ${endpoint}:`, error);
        }
        
        throw new Error(error.message);
      }
      
      // Handle empty responses
      const text = await response.text();
      if (!text) {
        return {} as T;
      }
      
      try {
        return JSON.parse(text);
      } catch {
        // Return text response if not JSON
        return text as unknown as T;
      }
      
    } catch (error) {
      // Network or other errors
      const apiError: APIError = {
        message: error instanceof Error ? error.message : 'Unknown API error',
        status: 0,
        endpoint,
        timestamp: new Date().toISOString(),
      };
      
      if (!env.isProduction()) {
        console.error(`[API Network Error] ${endpoint}:`, apiError);
      }
      
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, options?: Omit<RequestInit, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, data?: any, options?: Omit<RequestInit, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, data?: any, options?: Omit<RequestInit, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, data?: any, options?: Omit<RequestInit, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, options?: Omit<RequestInit, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }

  /**
   * Upload file (multipart/form-data)
   */
  async upload<T = any>(endpoint: string, formData: FormData, options?: Omit<RequestInit, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData - browser will set it with boundary
        ...options?.headers,
      },
    });
  }

  /**
   * GET request with query parameters
   */
  async getWithParams<T = any>(
    endpoint: string, 
    params?: Record<string, string | number | boolean | undefined>,
    options?: Omit<RequestInit, 'method' | 'body'>
  ): Promise<T> {
    let url = endpoint;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }
    
    return this.get<T>(url, options);
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{ status: 'ok' | 'error'; timestamp: string; environment: string }> {
    try {
      const result = await this.get<{ status: 'ok'; timestamp: string }>('/health-check');
      return {
        ...result,
        environment: env.vercelEnvironment,
      };
    } catch (_error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        environment: env.vercelEnvironment,
      };
    }
  }

  /**
   * Get current deployment info
   */
  get deploymentInfo() {
    return {
      baseUrl: this.baseUrl,
      environment: env.vercelEnvironment,
      isProduction: env.isProduction(),
      isPreview: env.isVercelPreview,
    };
  }

  /**
   * Debug method to get constructed URL for an endpoint
   */
  getUrl(endpoint: string): string {
    return env.apiPath(endpoint);
  }
}

/**
 * Global API service instance
 * 
 * Usage:
 * - api.get('/businesses') → GET https://your-deployment.vercel.app/api/businesses
 * - api.post('/ai-chat-simple', { messages: [...] }) → POST with JSON body
 * - api.getWithParams('/search', { q: 'tech', limit: 20 }) → GET with query params
 */
export const api = new APIService();

