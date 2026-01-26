# Phase 6: Conversation View - Research

**Researched:** 2026-01-25
**Domain:** React chat UI, collapsible components, message layout patterns
**Confidence:** HIGH

## Summary

This phase focuses on redesigning the conversation view to implement WhatsApp-style message positioning (AI left, human right), collapsible messages with Claude Code-style previews, and improved visual hierarchy. The research validates that all required patterns can be implemented using existing stack components.

The project already has `@radix-ui/react-collapsible` installed and working (used in `GSDCommandCategory.tsx`), Framer Motion for animations, and a comprehensive Tailwind CSS theme with cyan accent colors. The primary work involves restructuring the existing `StreamMessage` component into a new message architecture that separates layout (positioning, collapse state) from content rendering.

**Primary recommendation:** Build a new `ConversationMessage` wrapper component that handles positioning and collapse state, wrapping the existing `StreamMessage` for content rendering. Use Radix Collapsible with Framer Motion for smooth expand/collapse animations.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @radix-ui/react-collapsible | ^1.1.12 | Collapse/expand behavior | Already installed, accessibility-first, controlled state support |
| framer-motion | ^12.0.0-alpha.1 | Animation | Already installed, height: "auto" animation support |
| @tanstack/react-virtual | ^3.13.10 | Virtual scrolling | Already used in MessageList, needed for performance |
| Tailwind CSS | ^4.1.8 | Styling | Already configured with cyan theme |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^0.468.0 | Icons | Tool badges, expand/collapse indicators |
| clsx + tailwind-merge | via cn() | Class merging | Conditional styling |
| zustand | ^5.0.6 | State management | If needing shared collapse state (not recommended) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Radix Collapsible | react-collapsed | More control, but Radix already installed |
| Manual collapse | Accordion component | Accordion implies mutual exclusion, not needed |
| CSS animations | Framer Motion | Framer already in stack, better height: auto |

**Installation:** No new packages needed.

## Architecture Patterns

### Recommended Project Structure
```
src/components/
├── conversation/              # NEW: Conversation-specific components
│   ├── ConversationMessage.tsx    # Wrapper: positioning + collapse
│   ├── MessageBubble.tsx          # Visual bubble container
│   ├── CollapsedPreview.tsx       # Collapsed state preview (tools + summary)
│   ├── MessageMetadata.tsx        # Cost, tokens, duration, turns
│   └── ToolBadge.tsx              # Individual tool badge
├── claude-code-session/
│   └── MessageList.tsx        # UPDATE: Use ConversationMessage
└── StreamMessage.tsx          # KEEP: Content rendering logic
```

### Pattern 1: Message Wrapper Component
**What:** Separate layout/state from content rendering
**When to use:** When you need different behaviors (collapse, position) but same content
**Example:**
```typescript
// Source: Derived from existing GSDCommandCategory.tsx pattern
import * as Collapsible from '@radix-ui/react-collapsible';
import { motion, AnimatePresence } from 'framer-motion';

interface ConversationMessageProps {
  message: ClaudeStreamMessage;
  isExpanded: boolean;
  onToggle: () => void;
  isLatest: boolean;
}

export function ConversationMessage({ message, isExpanded, onToggle, isLatest }: ConversationMessageProps) {
  const isAI = message.type === 'assistant' || message.type === 'system';

  return (
    <Collapsible.Root open={isExpanded} onOpenChange={onToggle}>
      <div className={cn(
        "flex",
        isAI ? "justify-start" : "justify-end"
      )}>
        <div className={cn(
          "max-w-[75%]",
          isAI ? "bg-muted/30" : "bg-primary/10"
        )}>
          {/* Collapsed preview is clickable */}
          <Collapsible.Trigger className="w-full text-left">
            <CollapsedPreview message={message} isExpanded={isExpanded} />
          </Collapsible.Trigger>

          {/* Expanded content with animation */}
          <Collapsible.Content asChild forceMount>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <StreamMessage message={message} />
                  <MessageMetadata message={message} />
                </motion.div>
              )}
            </AnimatePresence>
          </Collapsible.Content>
        </div>
      </div>
    </Collapsible.Root>
  );
}
```

### Pattern 2: WhatsApp-Style Positioning with Flexbox
**What:** Left/right alignment using flexbox justify
**When to use:** All message containers
**Example:**
```typescript
// Source: https://samuelkraft.com/blog/ios-chat-bubbles-css (verified)
// AI messages: left
<div className="flex justify-start">
  <div className="max-w-[75%] rounded-lg p-3 bg-muted/30">
    {content}
  </div>
</div>

// Human messages: right
<div className="flex justify-end">
  <div className="max-w-[75%] rounded-lg p-3 bg-primary/10">
    {content}
  </div>
</div>
```

### Pattern 3: Tool Badge with Count
**What:** Claude Code style tool indicators
**When to use:** In collapsed preview and expanded view
**Example:**
```typescript
// Source: Derived from existing Badge component
interface ToolBadgeProps {
  toolName: string;
  count?: number;
  detail?: string; // e.g., file path or line count
}

export function ToolBadge({ toolName, count, detail }: ToolBadgeProps) {
  return (
    <Badge variant="secondary" className="text-xs gap-1">
      <span className="font-medium">{toolName}</span>
      {count && <span className="text-muted-foreground">({count})</span>}
      {detail && <span className="text-muted-foreground truncate max-w-[100px]">{detail}</span>}
    </Badge>
  );
}
```

### Pattern 4: Collapsed Preview
**What:** Shows tool list with counts, then summary line
**When to use:** When message is collapsed
**Example:**
```typescript
export function CollapsedPreview({ message, isExpanded }: { message: ClaudeStreamMessage; isExpanded: boolean }) {
  const tools = extractToolsUsed(message);
  const summary = extractSummary(message);

  return (
    <div className={cn(
      "px-3 py-2 cursor-pointer",
      !isExpanded && "hover:bg-muted/50"
    )}>
      {/* Tool badges row */}
      <div className="flex flex-wrap gap-1 mb-1">
        {tools.map(tool => (
          <ToolBadge key={tool.name} {...tool} />
        ))}
      </div>

      {/* Summary line - truncated when collapsed */}
      <p className={cn(
        "text-sm text-muted-foreground",
        !isExpanded && "line-clamp-1"
      )}>
        {summary}
      </p>

      {/* Expand indicator */}
      <ChevronRight className={cn(
        "h-4 w-4 transition-transform",
        isExpanded && "rotate-90"
      )} />
    </div>
  );
}
```

### Pattern 5: Metadata Display
**What:** Compact inline metadata
**When to use:** Bottom of expanded messages
**Example:**
```typescript
// Source: CONTEXT.md decision
export function MessageMetadata({ message }: { message: ClaudeStreamMessage }) {
  const cost = message.cost_usd || message.total_cost_usd;
  const tokens = message.usage
    ? message.usage.input_tokens + message.usage.output_tokens
    : null;
  const duration = message.duration_ms;
  const turns = message.num_turns;

  if (!cost && !tokens && !duration && !turns) return null;

  // Format: $0.02 · 1.2k tokens · 3.5s · 2 turns
  return (
    <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
      {cost && <span>${cost.toFixed(2)}</span>}
      {cost && tokens && <span>·</span>}
      {tokens && <span>{formatTokens(tokens)} tokens</span>}
      {tokens && duration && <span>·</span>}
      {duration && <span>{(duration / 1000).toFixed(1)}s</span>}
      {duration && turns && <span>·</span>}
      {turns && <span>{turns} turns</span>}
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Deep nesting of collapsibles:** Don't nest collapse inside collapse; keep flat
- **Storing collapse state in global store:** Use local state in MessageList, reset on mount
- **Animating with CSS alone:** Use Framer Motion for height: "auto" animations
- **Double-wrapping in Cards:** Current StreamMessage wraps in Card; new bubble styling replaces this

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Collapse animation | CSS transitions | Framer Motion + Radix | height: auto is hard in pure CSS |
| Accessibility | Custom keyboard handling | Radix Collapsible | Built-in ARIA, keyboard support |
| Tool extraction | Manual parsing per message | Centralized utility function | Multiple message types have tools |
| Token formatting | Inline math | formatTokens() utility | Consistent 1.2k, 10k formatting |
| Virtual scrolling | Manual windowing | @tanstack/react-virtual | Already in use, proven |

**Key insight:** The existing codebase already has these primitives. The work is composition, not creation.

## Common Pitfalls

### Pitfall 1: Virtual Scrolling + Dynamic Heights
**What goes wrong:** Virtualizer expects consistent row heights; collapsed vs expanded changes height dramatically
**Why it happens:** estimateSize() returns fixed value, but actual heights vary
**How to avoid:** Use virtualizer's `measureElement` for dynamic measurement; or consider removing virtualization if message count is reasonable (<500)
**Warning signs:** Scroll jumping, items overlapping, incorrect scroll position

### Pitfall 2: Animation + Unmounting
**What goes wrong:** Exit animations don't play because React unmounts immediately
**Why it happens:** Collapsible.Content removes DOM when closed
**How to avoid:** Use `forceMount` on Collapsible.Content, wrap in AnimatePresence
**Warning signs:** Content disappears abruptly, no exit animation

### Pitfall 3: Collapse State Not Resetting
**What goes wrong:** Previous collapse states persist when navigating between sessions
**Why it happens:** State stored in parent component that doesn't unmount
**How to avoid:** Use message index or ID as key, initialize state on messages change
**Warning signs:** Opening new conversation shows old collapse states

### Pitfall 4: Double Card/Box Styling
**What goes wrong:** Messages have nested borders/shadows (requirement explicitly calls this out)
**Why it happens:** StreamMessage already wraps in Card, new bubble also has border
**How to avoid:** Remove Card from StreamMessage when wrapped by ConversationMessage, or pass prop to disable outer styling
**Warning signs:** Visual: double borders, nested rounded corners

### Pitfall 5: Click Target Confusion
**What goes wrong:** Only part of collapsed message is clickable
**Why it happens:** Trigger wraps only some content, not entire row
**How to avoid:** Make Collapsible.Trigger wrap the entire collapsed preview div
**Warning signs:** User feedback that expand doesn't work consistently

## Code Examples

Verified patterns from official sources:

### Radix Collapsible with Animation
```typescript
// Source: @radix-ui/react-collapsible docs + project GSDCommandCategory.tsx
import * as Collapsible from '@radix-ui/react-collapsible';
import { motion, AnimatePresence } from 'framer-motion';

<Collapsible.Root open={isExpanded} onOpenChange={setIsExpanded}>
  <Collapsible.Trigger className="w-full">
    {/* Entire trigger area clickable */}
  </Collapsible.Trigger>

  <Collapsible.Content forceMount asChild>
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  </Collapsible.Content>
</Collapsible.Root>
```

### Tool Extraction from Message
```typescript
// Source: Derived from existing StreamMessage.tsx logic
interface ExtractedTool {
  name: string;
  count?: number;
  detail?: string;
}

function extractToolsUsed(message: ClaudeStreamMessage): ExtractedTool[] {
  if (message.type !== 'assistant' || !message.message?.content) {
    return [];
  }

  const tools: ExtractedTool[] = [];
  const toolCounts = new Map<string, { count: number; details: string[] }>();

  for (const content of message.message.content) {
    if (content.type === 'tool_use') {
      const name = content.name;
      const existing = toolCounts.get(name) || { count: 0, details: [] };
      existing.count++;

      // Extract detail based on tool type
      if (content.input?.file_path) {
        existing.details.push(content.input.file_path.split('/').pop() || '');
      } else if (content.input?.command) {
        existing.details.push(content.input.command.slice(0, 30));
      }

      toolCounts.set(name, existing);
    }
  }

  for (const [name, { count, details }] of toolCounts) {
    tools.push({
      name: formatToolName(name),
      count: count > 1 ? count : undefined,
      detail: details[0],
    });
  }

  return tools;
}
```

### Collapse State Management
```typescript
// Source: Best practice for list with collapse
function useCollapseState(messages: ClaudeStreamMessage[]) {
  // Key: message index, Value: isExpanded
  const [expandedSet, setExpandedSet] = useState<Set<number>>(new Set());

  // Reset when messages change (new session)
  useEffect(() => {
    // Auto-expand only the latest message
    if (messages.length > 0) {
      setExpandedSet(new Set([messages.length - 1]));
    }
  }, [messages.length]);

  const toggleMessage = useCallback((index: number) => {
    setExpandedSet(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const isExpanded = useCallback((index: number) => {
    return expandedSet.has(index);
  }, [expandedSet]);

  return { isExpanded, toggleMessage };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSS height transitions | Framer Motion height: "auto" | 2023 | Smooth expand without fixed heights |
| Custom collapse logic | Radix Collapsible | Already in use | Accessibility, keyboard nav built-in |
| Static message lists | Virtual scrolling | Already in use | Performance with many messages |
| Inline metadata | Compact format | This phase | Cleaner visual hierarchy |

**Deprecated/outdated:**
- `react-collapse`: Superseded by react-collapsed and Radix Collapsible
- CSS-only height transitions: Cannot animate to `auto`

## Open Questions

Things that couldn't be fully resolved:

1. **Virtual scrolling with variable heights**
   - What we know: Virtualizer supports dynamic heights via measureElement
   - What's unclear: Performance impact of frequent re-measurement during animations
   - Recommendation: Start without virtualization, add back if performance issues arise with >500 messages

2. **System Initialized collapse by default**
   - What we know: User wants it collapsed by default
   - What's unclear: Should it be collapsible at all, or just minimized styling?
   - Recommendation: Make it collapsible, start collapsed, use subtle styling

## Sources

### Primary (HIGH confidence)
- Project codebase: `/src/components/gsd/GSDCommandCategory.tsx` - Working Radix Collapsible example
- Project codebase: `/src/components/StreamMessage.tsx` - Existing message rendering
- Project codebase: `/src/styles.css` - Theme variables and cyan colors
- Radix UI docs: Collapsible component API

### Secondary (MEDIUM confidence)
- [Flowbite Chat Bubble](https://flowbite.com/docs/components/chat-bubble/) - Tailwind chat patterns
- [iOS Chat Bubbles CSS](https://samuelkraft.com/blog/ios-chat-bubbles-css) - Flexbox alignment patterns
- [Framer Motion Layout Animations](https://motion.dev/docs/react-layout-animations) - Animation patterns

### Tertiary (LOW confidence)
- WebSearch results on WhatsApp UI patterns - General inspiration only

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Already installed and working in codebase
- Architecture: HIGH - Based on existing patterns in codebase
- Pitfalls: MEDIUM - Based on common React patterns, not verified with this specific codebase
- Animation: MEDIUM - Framer Motion height: auto verified, but integration with Radix needs testing

**Research date:** 2026-01-25
**Valid until:** 2026-02-25 (30 days - stable patterns)
