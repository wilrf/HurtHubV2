/**
 * Common TypeScript types used throughout the application
 */

export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

export interface ApiError {
  message: string
  code: string
  statusCode: number
  details?: Record<string, unknown>
}

export interface LoadingState {
  isLoading: boolean
  error: string | null
}

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SearchFilters {
  query?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface Coordinates {
  lat: number
  lng: number
}

export interface Address {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
  coordinates?: Coordinates
}

export interface SocialLinks {
  linkedin?: string
  twitter?: string
  facebook?: string
  website?: string
}

export interface ContactInfo {
  email?: string
  phone?: string
  website?: string
  socialMedia?: SocialLinks
}

export type Theme = 'light' | 'dark' | 'system'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: string
  read: boolean
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  role: string
  permissions: string[]
  preferences: UserPreferences
}

export interface UserPreferences {
  theme: Theme
  notifications: {
    email: boolean
    push: boolean
    inApp: boolean
  }
  dashboard: {
    layout: 'grid' | 'list'
    compactMode: boolean
  }
}