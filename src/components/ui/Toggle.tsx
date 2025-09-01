import { Switch } from "@headlessui/react";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

import { cn } from "@/utils";

const toggleVariants = cva(
  "relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 micro-hover",
  {
    variants: {
      size: {
        sm: "h-5 w-9",
        default: "h-6 w-11",
        lg: "h-7 w-13",
      },
      variant: {
        default: "bg-muted data-[checked]:bg-primary shadow-sleek",
        glass:
          "bg-glass backdrop-blur-md border-glass-border data-[checked]:bg-primary/80 shadow-glow",
        midnight:
          "bg-midnight-700 data-[checked]:bg-midnight-500 shadow-midnight",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  },
);

const thumbVariants = cva(
  "pointer-events-none inline-block transform rounded-full bg-background shadow-lg ring-0 transition-all duration-200 ease-in-out",
  {
    variants: {
      size: {
        sm: "h-4 w-4 data-[checked]:translate-x-4",
        default: "h-5 w-5 data-[checked]:translate-x-5",
        lg: "h-6 w-6 data-[checked]:translate-x-6",
      },
      variant: {
        default: "bg-white shadow-sleek",
        glass: "bg-white/90 backdrop-blur-sm shadow-glow",
        midnight: "bg-white shadow-midnight",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  },
);

export interface ToggleProps extends VariantProps<typeof toggleVariants> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  className?: string;
  "aria-label"?: string;
}

const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  (
    {
      size,
      variant,
      checked,
      onChange,
      disabled,
      label,
      description,
      className,
      "aria-label": ariaLabel,
    },
    ref,
  ) => {
    return (
      <div className="flex items-center justify-between">
        {(label || description) && (
          <div className="flex-1 mr-4">
            {label && (
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
        )}

        <Switch
          ref={ref}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className={cn(toggleVariants({ size, variant }), className)}
          aria-label={ariaLabel || label}
        >
          <span
            aria-hidden="true"
            className={cn(
              thumbVariants({ size, variant }),
              checked ? "data-[checked]:translate-x-4" : "translate-x-0",
            )}
            data-checked={checked}
          />
        </Switch>
      </div>
    );
  },
);

// Theme toggle component
interface ThemeToggleProps {
  theme: "light" | "dark" | "system";
  onThemeChange: (theme: "light" | "dark" | "system") => void;
  className?: string;
}

export function ThemeToggle({
  theme,
  onThemeChange,
  className,
}: ThemeToggleProps) {
  const isDarkMode = theme === "dark";

  return (
    <Toggle
      size="default"
      variant="glass"
      checked={isDarkMode}
      onChange={(checked) => onThemeChange(checked ? "dark" : "light")}
      label="Dark Mode"
      description="Switch between light and midnight themes"
      className={className}
      aria-label="Toggle dark mode"
    />
  );
}

// Simple on/off toggle
export function SimpleToggle({
  enabled,
  onToggle,
  label,
  size = "default",
  variant = "default",
  className,
}: {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  label?: string;
  size?: VariantProps<typeof toggleVariants>["size"];
  variant?: VariantProps<typeof toggleVariants>["variant"];
  className?: string;
}) {
  return (
    <Toggle
      size={size}
      variant={variant}
      checked={enabled}
      onChange={onToggle}
      label={label}
      className={className}
    />
  );
}

Toggle.displayName = "Toggle";

export { Toggle, toggleVariants };
