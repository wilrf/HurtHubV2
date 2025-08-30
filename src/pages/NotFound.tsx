import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { useTheme } from '@/contexts/ThemeContext'
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react'

export function NotFound() {
  const { isDarkMode } = useTheme()

  const handleGoHome = () => {
    window.location.href = '/'
  }

  const handleGoBack = () => {
    window.history.back()
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      isDarkMode ? 'bg-midnight-950' : 'bg-gray-50'
    }`}>
      <Card variant={isDarkMode ? 'glass' : 'elevated'} className='w-full max-w-lg'>
        <CardContent className='py-12 text-center'>
          <div className='flex justify-center mb-6'>
            <div className={`p-4 rounded-full ${
              isDarkMode ? 'bg-midnight-800' : 'bg-gray-100'
            }`}>
              <AlertTriangle className={`h-12 w-12 ${
                isDarkMode ? 'text-midnight-400' : 'text-gray-400'
              }`} />
            </div>
          </div>
          
          <h1 className='text-6xl font-bold text-foreground mb-4'>404</h1>
          
          <h2 className='text-2xl font-semibold text-foreground mb-2'>
            Page Not Found
          </h2>
          
          <p className='text-muted-foreground mb-8 max-w-md mx-auto'>
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back on track.
          </p>
          
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button 
              onClick={handleGoHome}
              variant={isDarkMode ? 'glass' : 'default'}
              size='lg'
            >
              <Home className='h-4 w-4 mr-2' />
              Go Home
            </Button>
            
            <Button 
              onClick={handleGoBack}
              variant='outline'
              size='lg'
            >
              <ArrowLeft className='h-4 w-4 mr-2' />
              Go Back
            </Button>
          </div>
          
          <div className='mt-8 text-sm text-muted-foreground'>
            <p>
              If you think this is a mistake, please{' '}
              <a 
                href='mailto:support@charlotte-econdev.com'
                className='text-primary hover:underline'
              >
                contact support
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
export default NotFound
