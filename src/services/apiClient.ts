import axios, { 
  type AxiosInstance, 
  type AxiosRequestConfig, 
  type AxiosResponse,
  type AxiosError 
} from 'axios'
import { toast } from 'react-hot-toast'

import { env } from '@/config/env'

import type { ApiResponse, ApiErrorResponse } from '@/types'

class APIClient {
  private client: AxiosInstance
  private requestQueue: Map<string, Promise<any>> = new Map()

  constructor() {
    this.client = axios.create({
      baseURL: env.apiBaseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('charlotte-econdev-token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // Add request ID for tracking
        config.headers['X-Request-ID'] = crypto.randomUUID()

        // Log request in development
        if (env.debugMode) {
          console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`)
        }

        return config
      },
      (error) => {
        console.error('❌ Request interceptor error:', error)
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log response in development
        if (env.debugMode) {
          console.log(`✅ API Response: ${response.status} ${response.config.url}`)
        }

        return response
      },
      (error: AxiosError) => {
        this.handleError(error)
        return Promise.reject(error)
      }
    )
  }

  private handleError(error: AxiosError): void {
    const status = error.response?.status
    const message = this.getErrorMessage(error)

    // Log error
    console.error(`❌ API Error [${status}]:`, message)

    // Handle specific error cases
    switch (status) {
      case 401:
        this.handleUnauthorized()
        break
      case 403:
        toast.error('Access denied. You do not have permission for this action.')
        break
      case 404:
        toast.error('Resource not found.')
        break
      case 429:
        toast.error('Too many requests. Please slow down.')
        break
      case 500:
      case 502:
      case 503:
      case 504:
        toast.error('Server error. Please try again later.')
        break
      default:
        if (!navigator.onLine) {
          toast.error('No internet connection. Please check your network.')
        } else if (error.code === 'ECONNABORTED') {
          toast.error('Request timeout. Please try again.')
        } else {
          toast.error(message || 'An unexpected error occurred.')
        }
    }
  }

  private getErrorMessage(error: AxiosError): string {
    if (error.response?.data) {
      const data = error.response.data as ApiErrorResponse
      return data.error?.message || 'Unknown error occurred'
    }
    return error.message || 'Network error'
  }

  private handleUnauthorized(): void {
    // Clear auth token
    localStorage.removeItem('charlotte-econdev-token')
    
    // Redirect to login or show auth modal
    toast.error('Session expired. Please log in again.')
    
    // Dispatch logout action if store is available
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }

  // Request deduplication
  private getCacheKey(config: AxiosRequestConfig): string {
    return `${config.method}-${config.url}-${JSON.stringify(config.params)}`
  }

  private async executeRequest<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const cacheKey = this.getCacheKey(config)
    
    // Return existing request if in progress
    if (this.requestQueue.has(cacheKey)) {
      return this.requestQueue.get(cacheKey)
    }

    // Create new request
    const request = this.client.request<ApiResponse<T>>(config)
      .then(response => response.data)
      .finally(() => {
        this.requestQueue.delete(cacheKey)
      })

    this.requestQueue.set(cacheKey, request)
    return request
  }

  // HTTP methods
  async get<T = unknown>(
    url: string, 
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.executeRequest<T>({ method: 'GET', url, ...config })
  }

  async post<T = unknown>(
    url: string, 
    data?: unknown, 
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.executeRequest<T>({ method: 'POST', url, data, ...config })
  }

  async put<T = unknown>(
    url: string, 
    data?: unknown, 
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.executeRequest<T>({ method: 'PUT', url, data, ...config })
  }

  async patch<T = unknown>(
    url: string, 
    data?: unknown, 
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.executeRequest<T>({ method: 'PATCH', url, data, ...config })
  }

  async delete<T = unknown>(
    url: string, 
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.executeRequest<T>({ method: 'DELETE', url, ...config })
  }

  // File upload with progress
  async uploadFile<T = unknown>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    const formData = new FormData()
    formData.append('file', file)

    return this.client.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100)
          onProgress(progress)
        }
      },
    }).then(response => response.data)
  }

  // Download file
  async downloadFile(url: string, filename?: string): Promise<void> {
    try {
      const response = await this.client.get(url, {
        responseType: 'blob',
      })

      // Create download link
      const blob = new Blob([response.data])
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      toast.success('File downloaded successfully')
    } catch (error) {
      toast.error('Failed to download file')
      throw error
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health')
      return true
    } catch {
      return false
    }
  }

  // Get client instance for advanced usage
  getClient(): AxiosInstance {
    return this.client
  }

  // Clear request queue (useful for cleanup)
  clearQueue(): void {
    this.requestQueue.clear()
  }
}

// Export singleton instance
export const apiClient = new APIClient()

// Export mock client for development/testing
export class MockAPIClient {
  private delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  async get<T = unknown>(url: string): Promise<ApiResponse<T>> {
    await this.delay(500) // Simulate network delay
    
    // Return mock data based on URL
    const mockData = this.getMockData(url)
    return {
      data: mockData as T,
      success: true,
      message: 'Mock response',
    }
  }

  async post<T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    await this.delay(1000)
    return {
      data: { id: crypto.randomUUID(), ...data } as T,
      success: true,
      message: 'Mock created',
    }
  }

  async put<T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    await this.delay(800)
    return {
      data: data as T,
      success: true,
      message: 'Mock updated',
    }
  }

  async patch<T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    await this.delay(600)
    return {
      data: data as T,
      success: true,
      message: 'Mock patched',
    }
  }

  async delete<T = unknown>(): Promise<ApiResponse<T>> {
    await this.delay(400)
    return {
      data: {} as T,
      success: true,
      message: 'Mock deleted',
    }
  }

  private getMockData(url: string): unknown {
    // Return different mock data based on endpoint
    if (url.includes('/companies')) {
      return []
    }
    if (url.includes('/dashboard')) {
      return {
        totalCompanies: 12543,
        totalInvestments: 1247,
        totalEmployees: 125430,
        recentDevelopments: 23,
        growthRate: 12.5,
        marketValue: 2547000000,
      }
    }
    return {}
  }
}

// Export the appropriate client based on environment
export const api = env.mockApi ? new MockAPIClient() : apiClient