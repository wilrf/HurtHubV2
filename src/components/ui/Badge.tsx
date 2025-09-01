import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:scale-105 active:scale-100",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-sm hover:shadow-md hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        success:
          "border-transparent bg-sapphire-500 text-white shadow-sm hover:bg-sapphire-400 hover:shadow-md",
        warning:
          "border-transparent bg-sapphire-400 text-white shadow-sm hover:bg-sapphire-300",
        outline:
          "border-border text-foreground bg-background/50 hover:bg-background/80 hover:border-foreground/20",
        glass:
          "border-glass-border bg-glass backdrop-blur-md text-foreground hover:bg-glass/80 hover:shadow-sm",
        midnight:
          "border-midnight-700 bg-midnight-800 text-white hover:bg-midnight-700",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

// Specialized badge components
export function StatusBadge({
  status,
  className,
}: {
  status: "active" | "inactive" | "pending" | "completed" | "failed";
  className?: string;
}) {
  const variants = {
    active: "success",
    completed: "success",
    inactive: "secondary",
    pending: "warning",
    failed: "destructive",
  } as const;

  const labels = {
    active: "Active",
    completed: "Completed",
    inactive: "Inactive",
    pending: "Pending",
    failed: "Failed",
  } as const;

  return (
    <Badge variant={variants[status]} className={className}>
      <div
        className={cn(
          "mr-1.5 h-2 w-2 rounded-full",
          status === "active" && "bg-success-foreground animate-pulse-soft",
          status === "completed" && "bg-success-foreground",
          status === "inactive" && "bg-secondary-foreground",
          status === "pending" && "bg-warning-foreground animate-pulse-soft",
          status === "failed" && "bg-destructive-foreground",
        )}
      />
      {labels[status]}
    </Badge>
  );
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: "low" | "medium" | "high" | "urgent";
  className?: string;
}) {
  const variants = {
    low: "secondary",
    medium: "default",
    high: "warning",
    urgent: "destructive",
  } as const;

  return (
    <Badge variant={variants[priority]} className={className}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
}

export function CountBadge({
  count,
  max = 99,
  className,
}: {
  count: number;
  max?: number;
  className?: string;
}) {
  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <Badge
      variant="destructive"
      size="sm"
      className={cn(
        "rounded-full px-1.5 min-w-[1.25rem] justify-center",
        className,
      )}
    >
      {displayCount}
    </Badge>
  );
}

export { Badge, badgeVariants };
