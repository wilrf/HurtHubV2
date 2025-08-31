import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import type { DashboardStatsResponse, TrendDataResponse, NewsItem } from '@/types'

interface DashboardState {
  stats: DashboardStatsResponse | null
  trends: TrendDataResponse | null
  news: NewsItem[]
  isLoading: {
    stats: boolean
    trends: boolean
    news: boolean
  }
  error: {
    stats: string | null
    trends: string | null
    news: string | null
  }
  lastUpdated: {
    stats: string | null
    trends: string | null
    news: string | null
  }
  refreshInterval: number
  autoRefresh: boolean
}

const initialState: DashboardState = {
  stats: null,
  trends: null,
  news: [],
  isLoading: {
    stats: false,
    trends: false,
    news: false,
  },
  error: {
    stats: null,
    trends: null,
    news: null,
  },
  lastUpdated: {
    stats: null,
    trends: null,
    news: null,
  },
  refreshInterval: 5 * 60 * 1000, // 5 minutes
  autoRefresh: true,
}

export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    // Stats
    setStatsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading.stats = action.payload
      if (action.payload) {
        state.error.stats = null
      }
    },
    setStatsSuccess: (state, action: PayloadAction<DashboardStatsResponse>) => {
      state.stats = action.payload
      state.isLoading.stats = false
      state.error.stats = null
      state.lastUpdated.stats = new Date().toISOString()
    },
    setStatsError: (state, action: PayloadAction<string>) => {
      state.error.stats = action.payload
      state.isLoading.stats = false
    },

    // Trends
    setTrendsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading.trends = action.payload
      if (action.payload) {
        state.error.trends = null
      }
    },
    setTrendsSuccess: (state, action: PayloadAction<TrendDataResponse>) => {
      state.trends = action.payload
      state.isLoading.trends = false
      state.error.trends = null
      state.lastUpdated.trends = new Date().toISOString()
    },
    setTrendsError: (state, action: PayloadAction<string>) => {
      state.error.trends = action.payload
      state.isLoading.trends = false
    },

    // News
    setNewsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading.news = action.payload
      if (action.payload) {
        state.error.news = null
      }
    },
    setNewsSuccess: (state, action: PayloadAction<NewsItem[]>) => {
      state.news = action.payload
      state.isLoading.news = false
      state.error.news = null
      state.lastUpdated.news = new Date().toISOString()
    },
    setNewsError: (state, action: PayloadAction<string>) => {
      state.error.news = action.payload
      state.isLoading.news = false
    },
    addNewsItem: (state, action: PayloadAction<NewsItem>) => {
      state.news.unshift(action.payload)
      // Keep only the latest 50 items
      if (state.news.length > 50) {
        state.news = state.news.slice(0, 50)
      }
    },

    // Settings
    setRefreshInterval: (state, action: PayloadAction<number>) => {
      state.refreshInterval = action.payload
    },
    setAutoRefresh: (state, action: PayloadAction<boolean>) => {
      state.autoRefresh = action.payload
    },

    // Clear errors
    clearErrors: state => {
      state.error = {
        stats: null,
        trends: null,
        news: null,
      }
    },
    clearStatsError: state => {
      state.error.stats = null
    },
    clearTrendsError: state => {
      state.error.trends = null
    },
    clearNewsError: state => {
      state.error.news = null
    },

    // Refresh all data
    refreshAllData: state => {
      state.isLoading = {
        stats: true,
        trends: true,
        news: true,
      }
      state.error = {
        stats: null,
        trends: null,
        news: null,
      }
    },

    // Reset state
    resetDashboard: () => initialState,
  },
})

export const dashboardActions = dashboardSlice.actions