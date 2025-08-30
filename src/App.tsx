import { Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import { Toaster } from 'react-hot-toast'

import { store } from '@/store'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { MainLayout } from '@/components/layouts/MainLayout'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'

// Lazy load pages for code splitting
import { lazyImport } from '@/utils/lazyImport'

const { Dashboard } = lazyImport(() => import('@/pages/Dashboard'), 'Dashboard')
const { HomePage } = lazyImport(() => import('@/pages/HomePage'), 'HomePage')
const { CommunityPulse } = lazyImport(() => import('@/pages/CommunityPulse'), 'CommunityPulse')
const { BusinessIntelligence } = lazyImport(
  () => import('@/pages/BusinessIntelligence'),
  'BusinessIntelligence'
)
const { AIAssistant } = lazyImport(() => import('@/pages/AIAssistant'), 'AIAssistant')
const { CompanyDetails } = lazyImport(() => import('@/pages/CompanyDetails'), 'CompanyDetails')
const { BusinessProfile } = lazyImport(() => import('@/pages/BusinessProfile'), 'BusinessProfile')
const { Settings } = lazyImport(() => import('@/pages/Settings'), 'Settings')
const { NotFound } = lazyImport(() => import('@/pages/NotFound'), 'NotFound')

function App() {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <Router>
          <ThemeProvider>
            <AuthProvider>
              <div className='min-h-screen transition-all duration-300'>
                <Routes>
                  {/* Main application routes */}
                  <Route
                    path='/'
                    element={
                      <MainLayout>
                        <Suspense
                          fallback={
                            <div className='flex h-96 items-center justify-center'>
                              <LoadingSpinner size='lg' />
                            </div>
                          }
                        >
                          <Routes>
                            <Route index element={<Dashboard />} />
                            <Route path='home' element={<HomePage />} />
                            <Route path='community' element={<CommunityPulse />} />
                            <Route path='business-intelligence' element={<BusinessIntelligence />} />
                            <Route path='ai-assistant' element={<AIAssistant />} />
                            <Route path='company/:id' element={<CompanyDetails />} />
                            <Route path='business/:id' element={<BusinessProfile />} />
                            <Route path='settings' element={<Settings />} />
                          </Routes>
                        </Suspense>
                      </MainLayout>
                    }
                  />

                  {/* Redirect old routes */}
                  <Route path='/dashboard' element={<Navigate to='/' replace />} />
                  <Route path='/companies/:id' element={<Navigate to='/company/$1' replace />} />

                  {/* 404 page */}
                  <Route
                    path='*'
                    element={
                      <Suspense fallback={<LoadingSpinner size='lg' />}>
                        <NotFound />
                      </Suspense>
                    }
                  />
                </Routes>

                {/* Global toast notifications */}
                <Toaster
                  position='top-right'
                  toastOptions={{
                    duration: 5000,
                    style: {
                      background: 'hsl(var(--background))',
                      color: 'hsl(var(--foreground))',
                      border: '1px solid hsl(var(--border))',
                    },
                    success: {
                      iconTheme: {
                        primary: 'hsl(var(--success))',
                        secondary: 'hsl(var(--success-foreground))',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: 'hsl(var(--destructive))',
                        secondary: 'hsl(var(--destructive-foreground))',
                      },
                    },
                  }}
                />
              </div>
            </AuthProvider>
          </ThemeProvider>
        </Router>
      </ErrorBoundary>
    </Provider>
  )
}

export default App