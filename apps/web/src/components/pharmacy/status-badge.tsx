import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_CONFIG } from "@/lib/constants";
import type { OrderStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = ORDER_STATUS_CONFIG[status];

  return (
    <Badge className={`${config.color} ${className}`} variant={config.variant}>
      {config.label}
    </Badge>
  );
}
