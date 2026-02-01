import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "h-full flex items-center justify-center border border-dashed rounded-lg",
        className,
      )}
    >
      <div className="text-center p-6 sm:p-12">
        {Icon && (
          <Icon className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4" />
        )}
        <h3 className="text-lg sm:text-xl font-semibold mb-2">{title}</h3>
        <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
          {description}
        </p>
        {action && (
          <Button className="gap-2" onClick={action.onClick}>
            {action.icon && <action.icon className="h-4 w-4" />}
            <span>{action.label}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
