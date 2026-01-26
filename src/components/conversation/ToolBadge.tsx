import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ToolBadgeProps {
  /** Tool name to display */
  toolName: string;
  /** Optional count (shown in parentheses if > 1) */
  count?: number;
  /** Optional detail text (file path, command, etc.) */
  detail?: string;
  /** Optional className for styling */
  className?: string;
}

/**
 * Compact badge for displaying tool usage in collapsed message previews.
 * Shows tool name with optional count and truncated detail.
 *
 * @example
 * <ToolBadge toolName="Read" count={3} />
 * <ToolBadge toolName="Edit" detail="utils.ts" />
 */
const ToolBadgeComponent: React.FC<ToolBadgeProps> = ({
  toolName,
  count,
  detail,
  className,
}) => {
  const showCount = count !== undefined && count > 1;

  return (
    <Badge
      variant="secondary"
      className={cn(
        "text-xs gap-1 font-normal",
        className
      )}
    >
      <span className="font-medium">{toolName}</span>
      {showCount && (
        <span className="text-muted-foreground">({count})</span>
      )}
      {detail && (
        <span
          className="text-muted-foreground truncate max-w-[100px]"
          title={detail}
        >
          {detail}
        </span>
      )}
    </Badge>
  );
};

export const ToolBadge = React.memo(ToolBadgeComponent);
