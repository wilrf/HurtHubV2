import { Badge } from '@/components/ui/Badge'
import { Settings as SettingsIcon } from 'lucide-react'

export function Settings() {
  return (
    <div className='p-6'>
      <div className='text-center py-20'>
        <SettingsIcon className='h-16 w-16 mx-auto mb-6 text-muted-foreground' />
        <h1 className='text-3xl font-bold mb-4'>Settings</h1>
        <p className='text-muted-foreground max-w-md mx-auto'>
          User preferences and application settings coming soon.
        </p>
        <Badge variant='outline' className='mt-4'>
          Coming Soon
        </Badge>
      </div>
    </div>
  )
}