import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'

import { authSlice } from './slices/authSlice'
import { companiesSlice } from './slices/companiesSlice'
import { dashboardSlice } from './slices/dashboardSlice'
import { uiSlice } from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    companies: companiesSlice.reducer,
    dashboard: dashboardSlice.reducer,
    ui: uiSlice.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: import.meta.env.DEV,
})

// Enable listener behavior for the store
setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Export store actions for easy access
export { authActions } from './slices/authSlice'
export { companiesActions } from './slices/companiesSlice'
export { dashboardActions } from './slices/dashboardSlice'
export { uiActions } from './slices/uiSlice'