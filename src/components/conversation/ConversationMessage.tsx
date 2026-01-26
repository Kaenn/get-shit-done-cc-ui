import React from "react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Settings, Cpu } from "lucide-react";
import type { ClaudeStreamMessage } from "@/components/AgentExecution";
import { ToolBadge } from "./ToolBadge";
import { MessageBubble } from "./MessageBubble";
import { MessageMetadata } from "./MessageMetadata";
import { cn } from "@/lib/utils";

interface ConversationMessageProps {
  message: ClaudeStreamMessage;
  isExpanded: boolean;
  onToggle: () => void;
  isLatest: boolean;
  children: React.ReactNode;
  streamMessages?: ClaudeStreamMessage[];
}

/**
 * Check if message has tool usage (needs collapse behavior)
 */
function hasTools(message: ClaudeStreamMessage): boolean {
  if (message.type !== "assistant" || !message.message?.content) {
    return false;
  }
  const content = message.message.content;
  if (!Array.isArray(content)) return false;
  return content.some((item) => item.type === "tool_use");
}

/**
 * Extract tools from message for badge display
 */
function extractTools(message: ClaudeStreamMessage): Array<{ name: string; count?: number; detail?: string }> {
  if (!hasTools(message)) return [];

  const content = message.message?.content;
  if (!Array.isArray(content)) return [];

  const toolMap = new Map<string, { count: number; detail?: string }>();

  for (const item of content) {
    if (item.type !== "tool_use") continue;

    const toolName = item.name || "Unknown";
    const existing = toolMap.get(toolName);

    let detail: string | undefined;
    const input = item.input;
    if (input?.file_path) {
      detail = (input.file_path as string).split("/").pop();
    } else if (input?.command) {
      const cmd = input.command as string;
      detail = cmd.length > 30 ? cmd.slice(0, 30) + "..." : cmd;
    } else if (input?.pattern) {
      detail = input.pattern as string;
    }

    if (existing) {
      existing.count += 1;
    } else {
      toolMap.set(toolName, { count: 1, detail });
    }
  }

  return Array.from(toolMap).map(([name, { count, detail }]) => ({
    name,
    count: count > 1 ? count : undefined,
    detail,
  }));
}

/**
 * WhatsApp-style message wrapper.
 *
 * - Text-only messages: show full content, no collapse
 * - Messages with tools: collapsible with tool badges header
 * - System Initialized: always collapsed, expandable
 */
const ConversationMessageComponent: React.FC<ConversationMessageProps> = ({
  message,
  isExpanded,
  onToggle,
  isLatest: _isLatest,
  children,
  streamMessages: _streamMessages,
}) => {
  const isAI = message.type === "assistant" || message.type === "system";
  const isSystemInit = message.type === "system" && message.subtype === "init";
  const messageHasTools = hasTools(message);

  // Only collapsible if has tools OR is system init
  const isCollapsible = messageHasTools || isSystemInit;

  // System init always collapsed, others respect isExpanded
  const effectiveExpanded = isSystemInit ? false : isExpanded;

  // For non-collapsible messages, just render content directly with metadata
  if (!isCollapsible) {
    return (
      <div className={cn("flex w-full py-1", isAI ? "justify-start" : "justify-end")}>
        <MessageBubble isAI={isAI}>
          <div className="p-1">
            {children}
            <MessageMetadata message={message} className="mt-2" />
          </div>
        </MessageBubble>
      </div>
    );
  }

  // System Initialized message
  if (isSystemInit) {
    return (
      <Collapsible.Root open={effectiveExpanded} onOpenChange={onToggle}>
        <div className={cn("flex w-full py-1", isAI ? "justify-start" : "justify-end")}>
          <MessageBubble isAI={isAI}>
            <Collapsible.Trigger asChild>
              <button
                type="button"
                className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-accent/50 rounded cursor-pointer"
              >
                <Settings className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span className="text-sm font-medium text-blue-500">System Initialized</span>
                {message.model && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Cpu className="h-3 w-3" />
                    <code className="font-mono text-xs">{message.model}</code>
                  </div>
                )}
                <ChevronRight
                  className={cn(
                    "h-4 w-4 ml-auto text-muted-foreground transition-transform flex-shrink-0",
                    effectiveExpanded && "rotate-90"
                  )}
                />
              </button>
            </Collapsible.Trigger>

            <Collapsible.Content forceMount asChild>
              <AnimatePresence initial={false}>
                {effectiveExpanded && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    <div className="pt-2 border-t border-border/50">
                      {children}
                      <MessageMetadata message={message} className="mt-2" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Collapsible.Content>
          </MessageBubble>
        </div>
      </Collapsible.Root>
    );
  }

  // Message with tools - collapsible with tool badges
  const tools = extractTools(message);

  return (
    <Collapsible.Root open={effectiveExpanded} onOpenChange={onToggle}>
      <div className={cn("flex w-full py-1", isAI ? "justify-start" : "justify-end")}>
        <MessageBubble isAI={isAI}>
          {/* Tool badges header - always visible, clickable to toggle */}
          <Collapsible.Trigger asChild>
            <button
              type="button"
              className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-accent/50 rounded cursor-pointer"
            >
              <div className="flex flex-wrap gap-1 flex-1">
                {tools.map((tool, idx) => (
                  <ToolBadge
                    key={`${tool.name}-${idx}`}
                    toolName={tool.name}
                    count={tool.count}
                    detail={tool.detail}
                  />
                ))}
              </div>
              <ChevronRight
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform flex-shrink-0",
                  effectiveExpanded && "rotate-90"
                )}
              />
            </button>
          </Collapsible.Trigger>

          {/* Expanded content */}
          <Collapsible.Content forceMount asChild>
            <AnimatePresence initial={false}>
              {effectiveExpanded && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="pt-2 border-t border-border/50">
                  {children}
                  <MessageMetadata message={message} className="mt-2" />
                </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Collapsible.Content>
        </MessageBubble>
      </div>
    </Collapsible.Root>
  );
};

export const ConversationMessage = React.memo(ConversationMessageComponent);
