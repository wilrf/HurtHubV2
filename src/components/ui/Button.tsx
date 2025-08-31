import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { forwardRef, type ButtonHTMLAttributes } from 'react'

import { cn } from '@/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden micro-hover border-pulse',
  {
    variants: {
      variant: {
        default:
          'bg-sapphire-600 text-white shadow-md hover:bg-sapphire-500 hover:shadow-lg hover:shadow-sapphire-500/20 hover:-translate-y-1 hover:scale-105 active:translate-y-0 active:scale-[0.98] active:shadow-md',
        destructive:
          'bg-gray-600 text-white shadow-md hover:bg-gray-500 hover:shadow-lg hover:shadow-gray-500/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
        outline:
          'border border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800/50 hover:text-white hover:border-gray-600 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
        secondary:
          'glass text-gray-200 hover:bg-sapphire-900/30 hover:text-white hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
        ghost:
          'hover:bg-gray-800/50 hover:text-white hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-150',
        link: 'text-sapphire-400 underline-offset-4 hover:underline hover:text-sapphire-300 hover:-translate-y-0.5 active:translate-y-0',
        glass:
          'glass-card-interactive glass-shimmer text-white hover:shadow-lg hover:shadow-sapphire-500/10 hover:-translate-y-1 hover:scale-105 active:translate-y-0 active:scale-[0.98]',
        midnight:
          'glass-dark text-white shadow-md hover:shadow-lg hover:shadow-sapphire-500/10 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
      },
      size: {
        default: 'h-11 px-6 py-2',
        sm: 'h-9 px-4 text-xs',
        lg: 'h-12 px-8 text-base',
        xl: 'h-14 px-10 text-lg',
        icon: 'h-11 w-11',
        'icon-sm': 'h-9 w-9',
        'icon-lg': 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
  loadingText?: string
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading = false, loadingText, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className='h-4 w-4 animate-spin' />}
        {isLoading ? loadingText || 'Loading...' : children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }