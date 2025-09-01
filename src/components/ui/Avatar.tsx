import { cva, type VariantProps } from 'class-variance-authority';
import { User } from 'lucide-react';
import { forwardRef, useState } from 'react';

import { cn } from '@/utils';

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
        secondary: 'bg-secondary text-secondary-foreground',
        glass: 'bg-glass backdrop-blur-md border-glass-border shadow-glow',
        midnight: 'bg-midnight-800 border-midnight-600 text-white',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
);

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  fallback?: string;
  initials?: string;
}

const sizeToClassMap = {
  sm: 'text-xs',
  default: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
  '2xl': 'text-xl',
};

const sizeToIconClassMap = {
    sm: 'h-4 w-4',
    default: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8',
    '2xl': 'h-10 w-10',
};

const AvatarFallback = ({ initials, fallback, size }: Pick<AvatarProps, 'initials' | 'fallback' | 'size'>) => {
  const sizeClass = size ? sizeToClassMap[size] : sizeToClassMap.default;
  const iconSizeClass = size ? sizeToIconClassMap[size] : sizeToIconClassMap.default;

  if (initials) {
    return <span className={cn('font-medium uppercase', sizeClass)}>{initials}</span>;
  }
  if (fallback) {
    return <span className={cn('text-xs font-medium', sizeClass)}>{fallback}</span>;
  }
  return <User className={cn(iconSizeClass)} />;
};

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, variant, src, alt, fallback, initials, ...props }, ref) => {
    const [hasError, setHasError] = useState(false);

    return (
      <div
        ref={ref}
        className={cn(avatarVariants({ size, variant }), className)}
        {...props}
      >
        {src && !hasError ? (
          <img
            className='aspect-square h-full w-full object-cover'
            src={src}
            alt={alt || 'Avatar'}
            onError={() => setHasError(true)}
          />
        ) : (
          <div className='flex h-full w-full items-center justify-center bg-muted text-muted-foreground'>
            <AvatarFallback initials={initials} fallback={fallback} size={size} />
          </div>
        )}
      </div>
    );
  }
);

// Avatar group component for showing multiple avatars
interface AvatarGroupProps {
  avatars: Array<{
    src?: string;
    alt?: string;
    initials?: string;
    fallback?: string;
  }>;
  max?: number;
  size?: VariantProps<typeof avatarVariants>['size'];
  variant?: VariantProps<typeof avatarVariants>['variant'];
  className?: string;
}

export function AvatarGroup({ 
  avatars, 
  max = 5, 
  size = 'default', 
  variant = 'default',
  className 
}: AvatarGroupProps) {
  const displayedAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

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
  );
}

Avatar.displayName = 'Avatar';

export { Avatar, avatarVariants };