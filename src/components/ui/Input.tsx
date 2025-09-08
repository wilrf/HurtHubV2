import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { forwardRef, type InputHTMLAttributes, useState } from "react";

import { cn } from "@/utils";

const inputVariants = cva(
  "flex w-full rounded-xl border bg-background px-4 py-3 text-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 micro-hover border-pulse",
  {
    variants: {
      variant: {
        default:
          "border-border shadow-sm hover:shadow-md hover:border-sapphire-700/50 focus:shadow-lg focus:shadow-sapphire-500/10 focus:-translate-y-0.5",
        ghost:
          "border-transparent bg-transparent hover:bg-accent focus:bg-background focus:border-border",
        glass:
          "border-glass-border bg-glass backdrop-blur-md hover:border-sapphire-600/30 focus:shadow-lg focus:shadow-sapphire-500/10",
        midnight:
          "border-midnight-700 bg-midnight-800 text-white placeholder:text-midnight-400 hover:border-midnight-600 focus:border-sapphire-600",
        search:
          "border-2 border-red-500 bg-red-900/20 shadow-md hover:shadow-lg hover:border-yellow-500 focus:shadow-xl focus:shadow-sapphire-500/20 focus:border-green-500 focus:-translate-y-0.5",
      },
      inputSize: {
        default: "h-12",
        sm: "h-10 px-3 py-2 text-xs",
        lg: "h-14 px-6 py-4 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  },
);

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  label?: string;
  description?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

const InputAdornment = ({
  position,
  children,
}: {
  position: "left" | "right";
  children: React.ReactNode;
}) => (
  <div
    className={`absolute ${position === "left" ? "left-3" : "right-3"} top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none`}
  >
    {children}
  </div>
);

const RightAdornment = ({
  showPasswordToggle,
  type,
  rightIcon,
  hasError,
  showPassword,
  setShowPassword,
}: {
  showPasswordToggle?: boolean;
  type?: string;
  rightIcon?: React.ReactNode;
  hasError?: boolean;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
}) => {
  if (showPasswordToggle && type === "password") {
    return (
      <InputAdornment position="right">
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground transition-colors duration-150"
          onClick={() => setShowPassword(!showPassword)}
          tabIndex={-1}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </InputAdornment>
    );
  }
  if (rightIcon) {
    return <InputAdornment position="right">{rightIcon}</InputAdornment>;
  }
  if (hasError) {
    return (
      <InputAdornment position="right">
        <AlertCircle className="h-4 w-4 text-destructive" />
      </InputAdornment>
    );
  }
  return null;
};

const InputControl = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      inputSize,
      type,
      leftIcon,
      rightIcon,
      showPasswordToggle = false,
      disabled,
      error,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const inputType =
      showPasswordToggle && type === "password"
        ? showPassword
          ? "text"
          : "password"
        : type;
    const hasError = !!error;

    return (
      <div className="relative">
        {leftIcon && (
          <InputAdornment position="left">{leftIcon}</InputAdornment>
        )}
        <input
          type={inputType}
          className={cn(
            inputVariants({ variant, inputSize }),
            hasError && "border-destructive focus-visible:ring-destructive",
            leftIcon && "pl-10",
            (rightIcon || showPasswordToggle) && "pr-10",
            isFocused && "ring-2 ring-ring ring-offset-0",
            className,
          )}
          ref={ref}
          disabled={disabled}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        <RightAdornment
          {...{
            showPasswordToggle,
            type,
            rightIcon,
            hasError,
            showPassword,
            setShowPassword,
          }}
        />
      </div>
    );
  },
);

const InputWrapper = ({
  label,
  description,
  error,
  children,
}: {
  label?: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    {label && (
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
      </label>
    )}
    {children}
    {description && !error && (
      <p className="text-xs text-muted-foreground">{description}</p>
    )}
    {error && (
      <p className="text-xs text-destructive flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        {error}
      </p>
    )}
  </div>
);

const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => (
  <InputWrapper {...props}>
    <InputControl {...props} ref={ref} />
  </InputWrapper>
));

Input.displayName = "Input";
InputControl.displayName = "InputControl";

export { Input, inputVariants };
