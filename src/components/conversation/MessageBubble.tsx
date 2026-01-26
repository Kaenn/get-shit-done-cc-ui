import React from "react";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  /** Content to render inside the bubble */
  children: React.ReactNode;
  /** Whether this is an AI message (affects styling) */
  isAI: boolean;
  /** Optional className for additional styling */
  className?: string;
}

/**
 * Visual bubble container for chat messages.
 * WhatsApp-style with appropriate colors per message type.
 *
 * - AI messages: subtle gray background
 * - Human messages: cyan tint background
 *
 * @example
 * <MessageBubble isAI={true}>
 *   <p>Assistant response content</p>
 * </MessageBubble>
 */
const MessageBubbleComponent: React.FC<MessageBubbleProps> = ({
  children,
  isAI,
  className,
}) => {
  return (
    <div
      className={cn(
        "max-w-[90%] rounded-lg p-3",
        isAI ? "bg-muted/30" : "bg-primary/10",
        className
      )}
    >
      {children}
    </div>
  );
};

export const MessageBubble = React.memo(MessageBubbleComponent);
