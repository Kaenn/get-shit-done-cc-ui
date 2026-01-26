import { useState, useEffect, useCallback } from "react";

/**
 * Hook for managing which messages are expanded/collapsed.
 * Uses Set<number> for O(1) lookup performance (per DEV-008 pattern).
 *
 * Auto-expands the latest message when message count changes.
 *
 * @param messageCount - Total number of messages
 * @returns Object with isExpanded check and toggle function
 *
 * @example
 * const { isExpanded, toggleMessage } = useCollapseState(messages.length);
 *
 * messages.map((msg, i) => (
 *   <ConversationMessage
 *     isExpanded={isExpanded(i)}
 *     onToggle={() => toggleMessage(i)}
 *   />
 * ))
 */
export function useCollapseState(messageCount: number): {
  isExpanded: (index: number) => boolean;
  toggleMessage: (index: number) => void;
} {
  // Set<number> for O(1) lookup - stores indices of expanded messages
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(
    () => new Set(messageCount > 0 ? [messageCount - 1] : [])
  );

  // Auto-expand latest message when messageCount changes
  useEffect(() => {
    if (messageCount > 0) {
      setExpandedIndices(new Set([messageCount - 1]));
    } else {
      setExpandedIndices(new Set());
    }
  }, [messageCount]);

  // Check if a message at index is expanded
  const isExpanded = useCallback(
    (index: number): boolean => {
      return expandedIndices.has(index);
    },
    [expandedIndices]
  );

  // Toggle a message's expanded state
  const toggleMessage = useCallback((index: number): void => {
    setExpandedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  return { isExpanded, toggleMessage };
}
