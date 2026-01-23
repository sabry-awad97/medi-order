import * as React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  message?: string;
}

export function Loading({
  className,
  icon: Icon,
  message = "جاري التحميل...",
  ...props
}: LoadingProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center min-h-[calc(100vh-3.5rem)] py-16",
        className,
      )}
      {...props}
    >
      <div className="text-center border border-dashed rounded-lg p-12">
        {Icon && (
          <Icon className="h-16 w-16 mx-auto text-muted-foreground mb-4 animate-pulse" />
        )}
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
