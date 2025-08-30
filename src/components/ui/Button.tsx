import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'

import { cn } from '@/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-sleek hover:bg-primary/90 hover:shadow-sleek-lg active:scale-[0.98]',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sleek hover:bg-destructive/90 hover:shadow-sleek-lg active:scale-[0.98]',
        outline:
          'border border-border bg-background shadow-sleek hover:bg-accent hover:text-accent-foreground hover:shadow-sleek-lg active:scale-[0.98]',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sleek hover:bg-secondary/80 hover:shadow-sleek-lg active:scale-[0.98]',
        ghost:
          'hover:bg-accent hover:text-accent-foreground active:scale-[0.98] transition-all duration-150',
        link: 'text-primary underline-offset-4 hover:underline active:scale-[0.98]',
        glass:
          'bg-glass backdrop-blur-md border border-glass-border text-foreground shadow-glow hover:bg-glass hover:shadow-sleek-lg active:scale-[0.98]',
        midnight:
          'bg-midnight-900 text-white shadow-midnight hover:bg-midnight-800 hover:shadow-glow active:scale-[0.98]',
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