import { useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  BarChart3, 
  MessageSquare,
  Settings,
  Bell,
  Search,
  Moon,
  Sun
} from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Toggle } from '@/components/ui/Toggle'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/utils'
import type { RootState } from '@/store'

interface MainLayoutProps {
  children: ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Community Pulse', href: '/community', icon: Users },
  { name: 'Business Intelligence', href: '/business-intelligence', icon: BarChart3 },
  { name: 'AI Assistant', href: '/ai-assistant', icon: MessageSquare },
]

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation()
  const { user } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const notifications = useSelector((state: RootState) => state.ui.notifications)
  
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className={cn(
      'min-h-screen transition-all duration-300',
      isDarkMode ? 'bg-midnight-950' : 'bg-gray-50'
    )}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 z-40 bg-backdrop backdrop-blur-sm lg:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          isDarkMode ? 'bg-midnight-900 border-midnight-700' : 'bg-white border-gray-200',
          'border-r shadow-sleek-lg'
        )}
      >
        {/* Sidebar header */}
        <div className='flex h-16 items-center justify-between px-6 border-b border-border'>
          <div className='flex items-center space-x-3'>
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg',
              isDarkMode ? 'bg-midnight-700' : 'bg-primary'
            )}>
              <BarChart3 className={cn(
                'h-5 w-5',
                isDarkMode ? 'text-white' : 'text-primary-foreground'
              )} />
            </div>
            <h1 className={cn(
              'text-lg font-semibold',
              isDarkMode ? 'text-white' : 'text-midnight-950'
            )}>
              Charlotte EconDev
            </h1>
          </div>
          
          {/* Mobile close button */}
          <Button
            variant='ghost'
            size='icon-sm'
            onClick={() => setSidebarOpen(false)}
            className='lg:hidden'
          >
            <X className='h-4 w-4' />
          </Button>
        </div>

        {/* Navigation */}
        <nav className='flex-1 px-4 py-6 space-y-2'>
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            const Icon = item.icon
            
            return (
              <a
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? isDarkMode
                      ? 'bg-midnight-700 text-white shadow-glow'
                      : 'bg-primary text-primary-foreground shadow-sleek'
                    : isDarkMode
                      ? 'text-midnight-300 hover:bg-midnight-800 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className='h-5 w-5' />
                <span>{item.name}</span>
              </a>
            )
          })}
        </nav>

        {/* Sidebar footer */}
        <div className='border-t border-border p-4'>
          <div className='flex items-center justify-between mb-4'>
            <span className={cn(
              'text-sm font-medium',
              isDarkMode ? 'text-white' : 'text-midnight-950'
            )}>
              Theme
            </span>
            <Button
              variant='ghost'
              size='icon-sm'
              onClick={toggleTheme}
              aria-label='Toggle theme'
            >
              {isDarkMode ? (
                <Sun className='h-4 w-4' />
              ) : (
                <Moon className='h-4 w-4' />
              )}
            </Button>
          </div>
          
          {user && (
            <div className={cn(
              'flex items-center space-x-3 rounded-xl p-3',
              isDarkMode ? 'bg-midnight-800' : 'bg-gray-100'
            )}>
              <Avatar
                src={user.avatar}
                initials={`${user.firstName[0]}${user.lastName[0]}`}
                size='sm'
                variant={isDarkMode ? 'midnight' : 'default'}
              />
              <div className='flex-1 min-w-0'>
                <p className={cn(
                  'text-sm font-medium truncate',
                  isDarkMode ? 'text-white' : 'text-midnight-950'
                )}>
                  {user.firstName} {user.lastName}
                </p>
                <p className={cn(
                  'text-xs truncate',
                  isDarkMode ? 'text-midnight-400' : 'text-gray-600'
                )}>
                  {user.email}
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className='lg:pl-64'>
        {/* Top bar */}
        <header className={cn(
          'sticky top-0 z-30 h-16 border-b transition-all duration-300',
          isDarkMode 
            ? 'bg-midnight-900/80 border-midnight-700 backdrop-blur-xl' 
            : 'bg-white/80 border-gray-200 backdrop-blur-xl',
          'shadow-sleek'
        )}>
          <div className='flex h-full items-center justify-between px-4 sm:px-6 lg:px-8'>
            {/* Mobile menu button */}
            <Button
              variant='ghost'
              size='icon'
              onClick={() => setSidebarOpen(true)}
              className='lg:hidden'
            >
              <Menu className='h-5 w-5' />
            </Button>

            {/* Search bar */}
            <div className='flex-1 max-w-md mx-4'>
              <Input
                type='search'
                placeholder='Search companies, news, developments...'
                variant={isDarkMode ? 'midnight' : 'ghost'}
                leftIcon={<Search className='h-4 w-4' />}
                className='w-full'
              />
            </div>

            {/* Right side actions */}
            <div className='flex items-center space-x-3'>
              {/* Notifications */}
              <Button
                variant='ghost'
                size='icon'
                className='relative'
                aria-label='Notifications'
              >
                <Bell className='h-5 w-5' />
                {unreadCount > 0 && (
                  <Badge 
                    variant='destructive' 
                    className='absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs'
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>

              {/* Settings */}
              <Button
                variant='ghost'
                size='icon'
                aria-label='Settings'
              >
                <Settings className='h-5 w-5' />
              </Button>

              {/* User menu */}
              {user && (
                <Avatar
                  src={user.avatar}
                  initials={`${user.firstName[0]}${user.lastName[0]}`}
                  variant={isDarkMode ? 'midnight' : 'default'}
                  className='cursor-pointer hover:ring-2 hover:ring-ring transition-all duration-200'
                />
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className='flex-1'>
          <div className='h-[calc(100vh-4rem)] overflow-auto'>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default MainLayout