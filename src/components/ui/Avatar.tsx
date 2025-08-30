import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { User } from 'lucide-react'

import { cn } from '@/utils'

const avatarVariants = cva(
  'relative flex shrink-0 overflow-hidden rounded-full border-2 border-background shadow-sleek',
  {
    variants: {
      size: {
        sm: 'h-8 w-8',
        default: 'h-10 w-10',
        lg: 'h-12 w-12',
        xl: 'h-16 w-16',
        '2xl': 'h-20 w-20',
      },
      variant: {
        default: 'bg-muted',
        primary: 'bg-primary text-primary-foreground',
        glass: 'bg-glass backdrop-blur-md border-glass-border shadow-glow',
        midnight: 'bg-midnight-800 border-midnight-600 text-white',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
)

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string
  alt?: string
  fallback?: string
  initials?: string
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, variant, src, alt, fallback, initials, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(avatarVariants({ size, variant }), className)}
        {...props}
      >
        {src ? (
          <img
            className='aspect-square h-full w-full object-cover'
            src={src}
            alt={alt || 'Avatar'}
            onError={(e) => {
              // Fallback to initials/icon if image fails to load
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
        ) : null}
        
        {/* Fallback content when no image or image fails */}
        {(!src || initials || fallback) && (
          <div className='flex h-full w-full items-center justify-center bg-muted text-muted-foreground'>
            {initials ? (
              <span className={cn(
                'font-medium uppercase',
                size === 'sm' && 'text-xs',
                size === 'default' && 'text-sm',
                size === 'lg' && 'text-base',
                size === 'xl' && 'text-lg',
                size === '2xl' && 'text-xl'
              )}>
                {initials}
              </span>
            ) : fallback ? (
              <span className={cn(
                'text-xs font-medium',
                size === 'sm' && 'text-xs',
                size === 'default' && 'text-sm',
                size === 'lg' && 'text-base',
                size === 'xl' && 'text-lg',
                size === '2xl' && 'text-xl'
              )}>
                {fallback}
              </span>
            ) : (
              <User className={cn(
                size === 'sm' && 'h-4 w-4',
                size === 'default' && 'h-5 w-5',
                size === 'lg' && 'h-6 w-6',
                size === 'xl' && 'h-8 w-8',
                size === '2xl' && 'h-10 w-10'
              )} />
            )}
          </div>
        )}
      </div>
    )
  }
)

// Avatar group component for showing multiple avatars
interface AvatarGroupProps {
  avatars: Array<{
    src?: string
    alt?: string
    initials?: string
    fallback?: string
  }>
  max?: number
  size?: VariantProps<typeof avatarVariants>['size']
  variant?: VariantProps<typeof avatarVariants>['variant']
  className?: string
}

export function AvatarGroup({ 
  avatars, 
  max = 5, 
  size = 'default', 
  variant = 'default',
  className 
}: AvatarGroupProps) {
  const displayedAvatars = avatars.slice(0, max)
  const remainingCount = avatars.length - max

  return (
    <div className={cn('flex -space-x-2', className)}>
      {displayedAvatars.map((avatar, index) => (
        <Avatar
          key={index}
          size={size}
          variant={variant}
          src={avatar.src}
          alt={avatar.alt}
          initials={avatar.initials}
          fallback={avatar.fallback}
          className='ring-2 ring-background'
        />
      ))}
      
      {remainingCount > 0 && (
        <Avatar
          size={size}
          variant='secondary'
          fallback={`+${remainingCount}`}
          className='ring-2 ring-background'
        />
      )}
    </div>
  )
}

Avatar.displayName = 'Avatar'

export { Avatar, avatarVariants }