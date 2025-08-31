import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type HTMLAttributes } from 'react'

import { cn } from '@/utils'

const cardVariants = cva(
  'rounded-xl transition-all duration-300 ease-out',
  {
    variants: {
      variant: {
        default: 'glass border border-gray-800/50 hover:border-gray-700/60 hover:shadow-md hover:shadow-sapphire-500/5',
        elevated: 'glass-dark shadow-lg hover:shadow-xl hover:-translate-y-0.5',
        glass: 'glass glass-shimmer hover:shadow-lg hover:shadow-sapphire-500/10',
        midnight: 'glass-dark border-sapphire-900/50 shadow-midnight hover:border-sapphire-800/60',
        flat: 'bg-midnight-900/90 border border-gray-800/30 hover:border-gray-700/40',
        interactive: 'glass hover:shadow-lg hover:-translate-y-1 cursor-pointer active:scale-[0.99] active:translate-y-0',
        outline: 'border border-gray-800/50 hover:border-sapphire-700/50 hover:bg-sapphire-950/20',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
        xl: 'p-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'default',
    },
  }
)

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding }), className)}
      {...props}
    />
  )
)

const CardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 pb-6', className)}
    {...props}
  />
))

const CardTitle = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('font-semibold leading-none tracking-tight text-lg', className)}
    {...props}
  />
))

const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground leading-relaxed', className)}
    {...props}
  />
))

const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('pt-0', className)} {...props} />
))

const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-6', className)}
    {...props}
  />
))

// Specialized card components
const StatsCard = forwardRef<
  HTMLDivElement,
  {
    title: string
    value: string | number
    change?: number
    description?: string
    icon?: React.ReactNode
    variant?: VariantProps<typeof cardVariants>['variant']
    className?: string
  }
>(({ title, value, change, description, icon, variant = 'default', className }, ref) => (
  <Card ref={ref} variant={variant} className={cn('relative overflow-hidden', className)}>
    <CardContent className='p-6'>
      <div className='flex items-center justify-between'>
        <div className='space-y-2'>
          <p className='text-sm font-medium text-muted-foreground uppercase tracking-wide'>
            {title}
          </p>
          <p className='text-3xl font-bold tracking-tight'>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {change !== undefined && (
            <div className='flex items-center gap-1'>
              <span
                className={cn(
                  'text-xs font-medium',
                  change > 0 && 'text-success',
                  change < 0 && 'text-destructive',
                  change === 0 && 'text-muted-foreground'
                )}
              >
                {change > 0 && '+'}
                {change}%
              </span>
              <span className='text-xs text-muted-foreground'>vs last period</span>
            </div>
          )}
          {description && (
            <p className='text-xs text-muted-foreground'>{description}</p>
          )}
        </div>
        {icon && (
          <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary'>
            {icon}
          </div>
        )}
      </div>
    </CardContent>
  </Card>
))

Card.displayName = 'Card'
CardHeader.displayName = 'CardHeader'
CardTitle.displayName = 'CardTitle'
CardDescription.displayName = 'CardDescription'
CardContent.displayName = 'CardContent'
CardFooter.displayName = 'CardFooter'
StatsCard.displayName = 'StatsCard'

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  StatsCard,
  cardVariants,
}