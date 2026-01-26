import React from "react";
import { ChevronRight, Settings, Cpu } from "lucide-react";
import type { ClaudeStreamMessage } from "@/components/AgentExecution";
import { ToolBadge } from "./ToolBadge";
import { cn } from "@/lib/utils";

interface ToolInfo {
  name: string;
  count?: number;
  detail?: string;
}

/**
 * Extract tools used from an assistant message.
 * Groups by tool name, counts occurrences, extracts meaningful details.
 */
export function extractToolsUsed(message: ClaudeStreamMessage): ToolInfo[] {
  if (message.type !== "assistant" || !message.message?.content) {
    return [];
  }

  const content = message.message.content;
  if (!Array.isArray(content)) {
    return [];
  }

  // Group tools by name and count
  const toolMap = new Map<string, { count: number; detail?: string }>();

  for (const item of content) {
    if (item.type !== "tool_use") {
      continue;
    }

    const toolName = item.name || "Unknown";
    const existing = toolMap.get(toolName);

    // Extract detail from input
    let detail: string | undefined;
    const input = item.input;

    if (input?.file_path) {
      // Extract filename only from path
      const path = input.file_path as string;
      detail = path.split("/").pop() || path;
    } else if (input?.command) {
      // First 30 chars of command
      const cmd = input.command as string;
      detail = cmd.length > 30 ? cmd.slice(0, 30) + "..." : cmd;
    } else if (input?.pattern) {
      // Glob or grep pattern
      detail = input.pattern as string;
    } else if (input?.path) {
      // LS path
      const path = input.path as string;
      detail = path.split("/").pop() || path;
    }

    if (existing) {
      existing.count += 1;
      // Keep first detail if multiple of same tool
    } else {
      toolMap.set(toolName, { count: 1, detail });
    }
  }

  // Convert to array
  const tools: ToolInfo[] = [];
  for (const [name, { count, detail }] of toolMap) {
    tools.push({
      name,
      count: count > 1 ? count : undefined,
      detail,
    });
  }

  return tools;
}

/**
 * Extract summary text from a message.
 * Returns first 100 chars of first text content block.
 */
export function extractSummary(message: ClaudeStreamMessage): string {
  const content = message.message?.content;

  if (!content || !Array.isArray(content)) {
    return "...";
  }

  for (const item of content) {
    if (item.type === "text" && item.text) {
      const text =
        typeof item.text === "string" ? item.text : item.text?.text || "";
      if (text.length > 100) {
        return text.slice(0, 100) + "...";
      }
      return text || "...";
    }
  }

  return "...";
}

interface CollapsedPreviewProps {
  /** The message to preview */
  message: ClaudeStreamMessage;
  /** Whether the message is expanded */
  isExpanded: boolean;
  /** Optional className for styling */
  className?: string;
}

/**
 * Check if message is a System Initialized message.
 */
function isSystemInitMessage(message: ClaudeStreamMessage): boolean {
  return message.type === "system" && message.subtype === "init";
}

/**
 * Collapsed preview component for messages.
 * Shows tool badges row and summary line in Claude Code style.
 * Special handling for System Initialized messages.
 *
 * @example
 * <CollapsedPreview message={assistantMessage} isExpanded={false} />
 */
const CollapsedPreviewComponent: React.FC<CollapsedPreviewProps> = ({
  message,
  isExpanded,
  className,
}) => {
  // Special case: System Initialized message
  if (isSystemInitMessage(message)) {
    return (
      <div
        className={cn(
          "px-3 py-2 cursor-pointer relative group",
          !isExpanded && "hover:bg-accent/50",
          className
        )}
      >
        {/* System Initialized header */}
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium text-blue-500">System Initialized</span>
          {/* Model name if available */}
          {message.model && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Cpu className="h-3 w-3" />
              <code className="font-mono text-xs">{message.model}</code>
            </div>
          )}
        </div>

        {/* Chevron indicator */}
        <ChevronRight
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-transform",
            isExpanded && "rotate-90"
          )}
        />
      </div>
    );
  }

  // Standard message preview
  const tools = extractToolsUsed(message);
  const summary = extractSummary(message);

  return (
    <div
      className={cn(
        "px-3 py-2 cursor-pointer relative group",
        !isExpanded && "hover:bg-accent/50",
        className
      )}
    >
      {/* Tool badges row */}
      {tools.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {tools.map((tool, idx) => (
            <ToolBadge
              key={`${tool.name}-${idx}`}
              toolName={tool.name}
              count={tool.count}
              detail={tool.detail}
            />
          ))}
        </div>
      )}

      {/* Summary line */}
      <p
        className={cn(
          "text-sm text-muted-foreground pr-6",
          !isExpanded && "line-clamp-1"
        )}
      >
        {summary}
      </p>

      {/* Chevron indicator */}
      <ChevronRight
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-transform",
          isExpanded && "rotate-90"
        )}
      />
    </div>
  );
};

export const CollapsedPreview = React.memo(CollapsedPreviewComponent);
