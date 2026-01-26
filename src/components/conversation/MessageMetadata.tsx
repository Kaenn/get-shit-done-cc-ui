import React from "react";
import type { ClaudeStreamMessage } from "@/components/AgentExecution";
import { cn } from "@/lib/utils";

interface MessageMetadataProps {
  /** The message to extract metadata from */
  message: ClaudeStreamMessage;
  /** Optional className for styling */
  className?: string;
}

/**
 * Format token count: < 1000 = "n", >= 1000 = "X.Xk"
 */
function formatTokens(n: number): string {
  if (n < 1000) {
    return String(n);
  }
  return `${(n / 1000).toFixed(1)}k`;
}

/**
 * Format duration in milliseconds to readable string
 */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Format cost to readable string with appropriate precision
 */
function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(2)}`;
}

/**
 * Compact metadata display for message stats.
 * Renders: $X.XX . Xk tokens . X.Xs . X turns
 *
 * @example
 * <MessageMetadata message={resultMessage} />
 * // Renders: $0.02 . 1.2k tokens . 3.5s . 2 turns
 */
const MessageMetadataComponent: React.FC<MessageMetadataProps> = ({
  message,
  className,
}) => {
  // Extract cost
  const cost = message.cost_usd ?? message.total_cost_usd;

  // Extract tokens (from message.usage or top-level usage)
  const usage = message.message?.usage ?? message.usage;
  const totalTokens = usage
    ? usage.input_tokens + usage.output_tokens
    : undefined;

  // Extract duration
  const duration = message.duration_ms;

  // Extract turns
  const turns = message.num_turns;

  // Return null if no metadata present
  if (
    cost === undefined &&
    totalTokens === undefined &&
    duration === undefined &&
    turns === undefined
  ) {
    return null;
  }

  const parts: string[] = [];

  if (cost !== undefined) {
    parts.push(formatCost(cost));
  }

  if (totalTokens !== undefined) {
    parts.push(`${formatTokens(totalTokens)} tokens`);
  }

  if (duration !== undefined) {
    parts.push(formatDuration(duration));
  }

  if (turns !== undefined) {
    parts.push(`${turns} turn${turns !== 1 ? "s" : ""}`);
  }

  return (
    <span className={cn("text-xs text-muted-foreground", className)}>
      {parts.join(" · ")}
    </span>
  );
};

export const MessageMetadata = React.memo(MessageMetadataComponent);
