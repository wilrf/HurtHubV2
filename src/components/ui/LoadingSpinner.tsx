import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'

import { cn } from '@/utils'

const spinnerVariants = cva('animate-spin', {
  variants: {
    size: {
      sm: 'h-4 w-4',
      default: 'h-6 w-6',
      lg: 'h-8 w-8',
      xl: 'h-12 w-12',
    },
    variant: {
      default: 'text-primary',
      secondary: 'text-muted-foreground',
      white: 'text-white',
      midnight: 'text-midnight-400',
    },
  },
  defaultVariants: {
    size: 'default',
    variant: 'default',
  },
})

export interface LoadingSpinnerProps
  extends VariantProps<typeof spinnerVariants> {
  className?: string
  text?: string
  centered?: boolean
}

function LoadingSpinner({ 
  className, 
  size, 
  variant, 
  text, 
  centered = false 
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn('flex items-center gap-2', centered && 'justify-center')}>
      <Loader2 className={cn(spinnerVariants({ size, variant }), className)} />
      {text && (
        <span className={cn(
          'text-sm',
          variant === 'white' && 'text-white',
          variant === 'midnight' && 'text-midnight-400',
          variant === 'secondary' && 'text-muted-foreground',
          variant === 'default' && 'text-foreground'
        )}>
          {text}
        </span>
      )}
    </div>
  )

  if (centered) {
    return (
      <div className='flex min-h-[200px] items-center justify-center'>
        {spinner}
      </div>
    )
  }

  return spinner
}

// Page-level loading component
export function PageLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className='flex min-h-screen items-center justify-center bg-background'>
      <div className='text-center space-y-4'>
        <div className='flex justify-center'>
          <Loader2 className='h-12 w-12 animate-spin text-primary' />
        </div>
        <p className='text-lg font-medium text-foreground'>{text}</p>
        <p className='text-sm text-muted-foreground'>Please wait while we load your content</p>
      </div>
    </div>
  )
}

// Inline loading component for buttons and small areas
export function InlineLoader({ 
  size = 'sm', 
  text, 
  className 
}: { 
  size?: 'sm' | 'default' | 'lg'
  text?: string
  className?: string 
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Loader2 className={cn(
        'animate-spin',
        size === 'sm' && 'h-3 w-3',
        size === 'default' && 'h-4 w-4',
        size === 'lg' && 'h-5 w-5'
      )} />
      {text && <span className='text-xs text-muted-foreground'>{text}</span>}
    </div>
  )
}

// Skeleton loader for content placeholders
export function Skeleton({ 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-muted shimmer',
        className
      )}
      {...props}
    />
  )
}

// Card skeleton with sleek design
export function CardSkeleton() {
  return (
    <div className='rounded-xl border bg-card p-6 shadow-sleek'>
      <div className='space-y-4'>
        <Skeleton className='h-6 w-3/4' />
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-2/3' />
        <div className='flex gap-2'>
          <Skeleton className='h-8 w-16' />
          <Skeleton className='h-8 w-20' />
        </div>
      </div>
    </div>
  )
}

export { LoadingSpinner, spinnerVariants }