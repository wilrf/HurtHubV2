import { forwardRef, type InputHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/utils'

const inputVariants = cva(
  'flex w-full rounded-xl border bg-background px-4 py-3 text-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-border shadow-sleek hover:shadow-sleek-lg focus:shadow-sleek-lg',
        ghost: 'border-transparent bg-transparent hover:bg-accent focus:bg-background focus:border-border',
        glass: 'border-glass-border bg-glass backdrop-blur-md shadow-glow',
        midnight: 'border-midnight-700 bg-midnight-800 text-white placeholder:text-midnight-400',
      },
      inputSize: {
        default: 'h-12',
        sm: 'h-10 px-3 py-2 text-xs',
        lg: 'h-14 px-6 py-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'default',
    },
  }
)

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string
  description?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  showPasswordToggle?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      inputSize,
      type,
      label,
      description,
      error,
      leftIcon,
      rightIcon,
      showPasswordToggle = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false)
    const [isFocused, setIsFocused] = useState(false)

    const inputType = showPasswordToggle && type === 'password' ? (showPassword ? 'text' : 'password') : type

    const hasError = Boolean(error)
    const hasIcons = Boolean(leftIcon || rightIcon || showPasswordToggle)

    return (
      <div className='space-y-2'>
        {label && (
          <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
            {label}
          </label>
        )}
        
        <div className='relative'>
          {leftIcon && (
            <div className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>
              {leftIcon}
            </div>
          )}
          
          <input
            type={inputType}
            className={cn(
              inputVariants({ variant, inputSize }),
              hasError && 'border-destructive focus-visible:ring-destructive',
              leftIcon && 'pl-10',
              (rightIcon || showPasswordToggle) && 'pr-10',
              isFocused && 'ring-2 ring-ring ring-offset-0',
              className
            )}
            ref={ref}
            disabled={disabled}
            onFocus={e => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={e => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            {...props}
          />
          
          {showPasswordToggle && type === 'password' && (
            <button
              type='button'
              className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-150'
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
            </button>
          )}
          
          {rightIcon && !showPasswordToggle && (
            <div className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground'>
              {rightIcon}
            </div>
          )}
          
          {hasError && (
            <div className='absolute right-3 top-1/2 -translate-y-1/2 text-destructive'>
              <AlertCircle className='h-4 w-4' />
            </div>
          )}
        </div>
        
        {description && !error && (
          <p className='text-xs text-muted-foreground'>{description}</p>
        )}
        
        {error && (
          <p className='text-xs text-destructive flex items-center gap-1'>
            <AlertCircle className='h-3 w-3' />
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input, inputVariants }