import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Theme, Notification } from '@/types'

interface UIState {
  theme: Theme
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  notifications: Notification[]
  modals: {
    companyDetails: boolean
    settings: boolean
    search: boolean
  }
  loading: {
    global: boolean
    page: boolean
  }
  toast: {
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
    visible: boolean
    duration: number
  } | null
  layout: {
    compactMode: boolean
    gridView: boolean
  }
}

const getInitialTheme = (): Theme => {
  const saved = localStorage.getItem('charlotte-econdev-theme') as Theme
  if (saved && ['light', 'dark', 'system'].includes(saved)) {
    return saved
  }
  return 'system'
}

const initialState: UIState = {
  theme: getInitialTheme(),
  sidebarOpen: true,
  sidebarCollapsed: false,
  notifications: [],
  modals: {
    companyDetails: false,
    settings: false,
    search: false,
  },
  loading: {
    global: false,
    page: false,
  },
  toast: null,
  layout: {
    compactMode: false,
    gridView: true,
  },
}

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Theme
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload
      localStorage.setItem('charlotte-econdev-theme', action.payload)
    },
    toggleTheme: state => {
      const themes: Theme[] = ['light', 'dark', 'system']
      const currentIndex = themes.indexOf(state.theme)
      const nextIndex = (currentIndex + 1) % themes.length
      state.theme = themes[nextIndex]
      localStorage.setItem('charlotte-econdev-theme', state.theme)
    },

    // Sidebar
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload
    },
    toggleSidebar: state => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload
    },
    toggleSidebarCollapsed: state => {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },

    // Notifications
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        read: false,
      }
      state.notifications.unshift(notification)
      // Keep only the latest 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50)
      }
    },
    markNotificationRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload)
      if (notification) {
        notification.read = true
      }
    },
    markAllNotificationsRead: state => {
      state.notifications.forEach(n => {
        n.read = true
      })
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload)
    },
    clearNotifications: state => {
      state.notifications = []
    },

    // Modals
    openModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = true
    },
    closeModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = false
    },
    closeAllModals: state => {
      Object.keys(state.modals).forEach(key => {
        state.modals[key as keyof UIState['modals']] = false
      })
    },

    // Loading states
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.global = action.payload
    },
    setPageLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.page = action.payload
    },

    // Toast notifications
    showToast: (
      state,
      action: PayloadAction<{
        message: string
        type: 'success' | 'error' | 'warning' | 'info'
        duration?: number
      }>
    ) => {
      state.toast = {
        message: action.payload.message,
        type: action.payload.type,
        visible: true,
        duration: action.payload.duration || 5000,
      }
    },
    hideToast: state => {
      if (state.toast) {
        state.toast.visible = false
      }
    },
    clearToast: state => {
      state.toast = null
    },

    // Layout
    setCompactMode: (state, action: PayloadAction<boolean>) => {
      state.layout.compactMode = action.payload
    },
    toggleCompactMode: state => {
      state.layout.compactMode = !state.layout.compactMode
    },
    setGridView: (state, action: PayloadAction<boolean>) => {
      state.layout.gridView = action.payload
    },
    toggleGridView: state => {
      state.layout.gridView = !state.layout.gridView
    },

    // Reset UI state
    resetUI: state => {
      // Preserve theme and layout preferences
      const { theme, layout } = state
      Object.assign(state, initialState, { theme, layout })
    },
  },
})

export const uiActions = uiSlice.actions