# Phase 3: Interactivity - Research

**Researched:** 2026-01-24
**Domain:** React state management, command execution, Tauri IPC, UX confirmation patterns
**Confidence:** HIGH

## Summary

Phase 3 adds command execution capabilities to the GSD tree view built in Phase 2. Users will click on tree nodes to execute GSD commands in the terminal, with support for command preview tooltips, click-to-confirm patterns, combo auto-chaining, and a "Next Up" primary action button. The research focused on React patterns for button click handlers, Zustand state management for command state, Tauri command invocation from the frontend, and UX patterns for action confirmation.

The standard approach uses Zustand actions to manage command execution state (running, queued, preview), Radix UI Tooltip/Popover for command previews, React button disabled states during async operations, and Tauri's `invoke()` API to send commands to the terminal. The existing codebase already follows these patterns in ClaudeCodeSession component, providing excellent reference implementations.

**Primary recommendation:** Extend gsdStore with command execution state (isCommandRunning, queuedCommand, nextAction), add click handlers to GSDTreeNode for clickable nodes, use Radix Tooltip for command preview, disable nodes during execution, and create a NextUpButton component that calls Tauri invoke() to send `/clear` + command to terminal.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Zustand | ^5.0.6 | State management | Already used in project for gsdStore, lightweight and hook-based, perfect for command execution state |
| @radix-ui/react-tooltip | ^1.1.5 | Command preview tooltips | Already in dependencies, accessible, controlled visibility for preview pattern |
| @radix-ui/react-popover | ^1.1.4 | Click-to-confirm popovers | Already in dependencies, more feature-rich than tooltip for confirmation flows |
| @radix-ui/react-switch | ^1.1.3 | Combo toggle control | Already in dependencies, accessible toggle for enabling/disabling combo mode |
| @tauri-apps/api | ^2.1.1 | IPC to Rust backend | Required for Tauri apps, invoke() function sends commands to backend |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| framer-motion | ^12.0.0-alpha.1 | Click pulse animation | Already in project, use for brief visual feedback on node clicks |
| lucide-react | ^0.468.0 | Play/action icons | Already in project, use icons for clickable node indicators |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zustand actions | React useState | Zustand better for shared state across components, useState only if command state is purely local |
| Radix Tooltip | Custom tooltip | Radix provides accessibility, keyboard nav, positioning out-of-box |
| Tauri invoke() | Direct Rust commands | invoke() is the standard Tauri IPC pattern, no alternatives in Tauri architecture |

**Installation:**
```bash
# All dependencies already installed in package.json
# No new packages required
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── stores/
│   └── gsdStore.ts           # Extended with command execution state
├── components/gsd/
│   ├── GSDTreeNode.tsx       # Extended with click handlers
│   ├── GSDNextUpButton.tsx   # NEW: Primary action button
│   └── GSDCommandPreview.tsx # NEW: Tooltip/popover for previews
├── lib/gsd/
│   └── commands.ts           # NEW: Command routing logic
└── hooks/
    └── useCommandExecution.ts # NEW: Command execution hook (optional)
```

### Pattern 1: Zustand Command Execution State
**What:** Store command execution state in Zustand with actions for command lifecycle
**When to use:** Managing async command state across multiple components
**Example:**
```typescript
// Source: https://github.com/pmndrs/zustand (verified via Context7)
// Extended from existing gsdStore.ts pattern

interface GSDState {
  // Existing state...

  // Command execution state
  isCommandRunning: boolean;
  currentCommand: string | null;
  nextAction: { command: string; label: string } | null;
  comboMode: boolean;

  // Actions
  setCommandRunning: (command: string | null) => void;
  setNextAction: (action: { command: string; label: string } | null) => void;
  toggleComboMode: () => void;
}

const gsdStore: StateCreator<GSDState> = (set) => ({
  // ...existing state
  isCommandRunning: false,
  currentCommand: null,
  nextAction: null,
  comboMode: false,

  setCommandRunning: (command) => set({
    isCommandRunning: command !== null,
    currentCommand: command
  }),

  setNextAction: (action) => set({ nextAction: action }),

  toggleComboMode: () => set((state) => ({ comboMode: !state.comboMode })),
});
```

### Pattern 2: Tauri Command Invocation
**What:** Use Tauri's invoke() to send commands from React to Rust backend
**When to use:** All terminal command execution from frontend
**Example:**
```typescript
// Source: https://v2.tauri.app/develop/calling-rust/
// Pattern already used in ClaudeCodeSession.tsx

import { invoke } from '@tauri-apps/api/core';

// Execute command in terminal
async function executeGSDCommand(command: string) {
  try {
    await invoke('send_terminal_command', {
      command: `/clear && ${command}`
    });
  } catch (error) {
    console.error('Command execution failed:', error);
  }
}
```

### Pattern 3: Click Handler with Loading State
**What:** Disable button during async operation, re-enable on completion
**When to use:** All clickable nodes that trigger commands
**Example:**
```typescript
// Source: Existing ClaudeCodeSession.tsx pattern +
// https://docs.react-async.com/guide/async-actions

const handleNodeClick = async (command: string) => {
  if (isCommandRunning) return; // Prevent duplicate clicks

  setCommandRunning(command);

  try {
    await executeGSDCommand(command);
  } finally {
    setCommandRunning(null);
  }
};

// In JSX
<button
  onClick={() => handleNodeClick('/gsd:plan-phase 3')}
  disabled={isCommandRunning}
  className={cn(isCommandRunning && 'opacity-50 cursor-not-allowed')}
>
  Execute
</button>
```

### Pattern 4: Command Preview Tooltip
**What:** Show command on hover, execute on click
**When to use:** All clickable tree nodes
**Example:**
```typescript
// Source: https://www.radix-ui.com/docs/primitives (Context7)
// Using existing @radix-ui/react-tooltip

import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <button onClick={handleExecute}>
        <Play className="w-4 h-4" />
      </button>
    </TooltipTrigger>
    <TooltipContent>
      <code>/gsd:plan-phase 3</code>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### Pattern 5: Auto-Chain Combo Execution
**What:** Listen for command completion, auto-execute next command when combo enabled
**When to use:** Combo mode for sequential workflow automation
**Example:**
```typescript
// Source: Pattern from existing ClaudeCodeSession.tsx event listeners
// Combined with https://v2.tauri.app/develop/calling-frontend/

useEffect(() => {
  // Listen for command completion
  const unlisten = listen('command-complete', (event) => {
    if (comboMode && nextAction) {
      // Auto-execute next command immediately
      executeGSDCommand(nextAction.command);
    }
  });

  return () => unlisten.then(fn => fn());
}, [comboMode, nextAction]);
```

### Anti-Patterns to Avoid
- **Don't use multiple state sources:** Keep all command state in gsdStore, not split between useState and Zustand
- **Don't disable all nodes:** Only disable clickable nodes during execution, keep expand/collapse working
- **Don't skip error handling:** Always handle invoke() errors, show user feedback
- **Don't execute without user consent:** Even in combo mode, user must start the first command
- **Don't block UI:** Use async/await properly so UI remains responsive during command execution

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Terminal command execution | Custom IPC, WebSocket to backend | Tauri invoke() | invoke() is battle-tested, handles serialization, error propagation, async properly |
| Tooltip positioning | Manual absolute positioning | Radix Tooltip | Handles edge detection, portal rendering, accessibility, keyboard nav |
| Async state management | Manual Promise tracking | Zustand actions + isPending pattern | Zustand prevents race conditions, provides consistent API |
| Command queuing | Custom queue implementation | Array state in Zustand | Simple, works with React reconciliation |
| Click animations | CSS transitions only | framer-motion (already in project) | Declarative, handles interruptions, better perf |

**Key insight:** The existing codebase (ClaudeCodeSession.tsx, FloatingPromptInput.tsx) already implements most of these patterns for sending prompts to Claude. Command execution for GSD follows the exact same pattern: invoke() to backend, state management for loading, event listeners for completion. Don't reinvent - adapt existing patterns.

## Common Pitfalls

### Pitfall 1: Race Conditions on Rapid Clicks
**What goes wrong:** User clicks multiple nodes rapidly, multiple commands queue/execute simultaneously
**Why it happens:** Async operations don't block UI, onClick fires before first command completes
**How to avoid:** Check `isCommandRunning` at start of click handler, return early if true. Disable clickable nodes visually.
**Warning signs:** Multiple terminal commands executing at once, state becoming inconsistent

### Pitfall 2: Forgetting to Clear Command After Execution
**What goes wrong:** Command finishes but isCommandRunning stays true, all nodes remain disabled forever
**Why it happens:** Error in command execution, forgot finally block, event listener not firing
**How to avoid:** Always use try/finally pattern, set isCommandRunning=false in finally block, add timeout fallback
**Warning signs:** UI stuck in disabled state, buttons unclickable after first command

### Pitfall 3: Combo Mode Infinite Loop
**What goes wrong:** Auto-execution triggers completion event, which triggers next auto-execution, etc.
**Why it happens:** nextAction not cleared after execution, combo logic doesn't check for null
**How to avoid:** Clear nextAction before executing, check nextAction exists before auto-executing
**Warning signs:** Commands executing continuously, terminal flooding with commands

### Pitfall 4: Node Type Confusion
**What goes wrong:** Phase nodes become clickable when only plan nodes should execute commands
**Why it happens:** Click handler on all nodes, not filtering by node type or status
**How to avoid:** Only make current phase plan nodes clickable, check node.type === 'plan' and currentPhase, render play icon conditionally
**Warning signs:** Clicking phase headers tries to execute commands, wrong command routing

### Pitfall 5: /clear Not Executing Before Command
**What goes wrong:** Terminal shows previous output mixed with new command output
**Why it happens:** Sending command without /clear prefix, or /clear and command sent as separate invocations
**How to avoid:** Always combine as single string: `/clear && ${command}`, send as single invoke() call
**Warning signs:** Terminal scrollback contains old output when it should be cleared

## Code Examples

Verified patterns from official sources and existing codebase:

### Click Handler with State Management
```typescript
// Source: Existing ClaudeCodeSession.tsx pattern
// Adapted for GSD tree node clicks

const { isCommandRunning, setCommandRunning } = useGSDStore();

const handleNodeClick = async (node: TreeNode) => {
  // Guard: only current phase plans are clickable
  if (node.type !== 'plan') return;
  if (isCommandRunning) return;

  const command = getCommandForNode(node); // e.g., '/gsd:plan-phase 3'

  setCommandRunning(command);

  try {
    await invoke('send_terminal_command', {
      command: `/clear && ${command}`
    });
  } catch (error) {
    console.error('Command failed:', error);
    // Show error toast
  } finally {
    setCommandRunning(null);
  }
};
```

### Next Up Button Component
```typescript
// Source: Pattern from FloatingPromptInput.tsx
// Combined with Tauri invoke pattern

export function GSDNextUpButton() {
  const { nextAction, isCommandRunning, setCommandRunning, comboMode } = useGSDStore();

  if (!nextAction) return null;

  const handleExecute = async () => {
    if (isCommandRunning) return;

    setCommandRunning(nextAction.command);

    try {
      await invoke('send_terminal_command', {
        command: `/clear && ${nextAction.command}`
      });
    } finally {
      setCommandRunning(null);
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      onClick={handleExecute}
      disabled={isCommandRunning}
      className={cn(
        'px-4 py-2 bg-primary text-primary-foreground rounded-md',
        'hover:bg-primary/90 transition-colors',
        isCommandRunning && 'opacity-50 cursor-not-allowed'
      )}
    >
      {isCommandRunning ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <Play className="w-4 h-4 mr-2" />
          {nextAction.label}
        </>
      )}
    </motion.button>
  );
}
```

### Combo Auto-Chain Logic
```typescript
// Source: Event listener pattern from ClaudeCodeSession.tsx
// Applied to command completion

useEffect(() => {
  if (!comboMode) return;

  const unlisten = listen('gsd-command-complete', async (event: any) => {
    const { nextAction } = useGSDStore.getState();

    if (nextAction && comboMode) {
      // Wait brief moment for terminal to settle
      await new Promise(resolve => setTimeout(resolve, 500));

      setCommandRunning(nextAction.command);

      try {
        await invoke('send_terminal_command', {
          command: `/clear && ${nextAction.command}`
        });
      } finally {
        setCommandRunning(null);
      }
    }
  });

  return () => unlisten.then(fn => fn());
}, [comboMode]);
```

### Command Preview Tooltip
```typescript
// Source: https://www.radix-ui.com/docs/primitives
// Using existing Radix UI components

import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

<TooltipProvider delayDuration={200}>
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        onClick={() => handleNodeClick(node)}
        disabled={isCommandRunning || !isClickable}
        className="p-1 hover:bg-muted rounded"
      >
        <Play className="w-4 h-4" />
      </button>
    </TooltipTrigger>
    <TooltipContent side="right" align="center">
      <code className="text-xs">{command}</code>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### Clickable Node Indicator
```typescript
// Source: Existing GSDTreeNode.tsx pattern
// Extended with action indicator

const isClickable =
  node.type === 'plan' &&
  node.id.startsWith(`plan-${currentPhaseNumber}-`) &&
  !isCommandRunning;

return (
  <div className="flex items-center gap-2">
    {/* ...existing chevron and status icon */}

    <span className="flex-1">{node.label}</span>

    {/* Action indicator for clickable nodes */}
    {isClickable && (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={(e) => {
                e.stopPropagation(); // Don't trigger expand/collapse
                handleNodeClick(node);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Play className="w-4 h-4 text-primary" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            Execute {getCommandLabel(node)}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )}
  </div>
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Props drilling for command state | Zustand global state | Zustand v4+ (2023) | Cleaner component tree, easier testing |
| Manual tooltip positioning | Radix Primitives | Radix stable (2022) | Accessibility built-in, less CSS |
| useEffect for async | React Async patterns | React 18+ (2022) | Better error boundaries, Suspense ready |
| Tauri v1 commands | Tauri v2 invoke() | Tauri v2 (2024) | Better TypeScript support, improved IPC |

**Deprecated/outdated:**
- **Tauri @tauri-apps/api/tauri**: Use @tauri-apps/api/core instead (Tauri v2 migration)
- **Class components for state**: All modern React uses hooks, this codebase is hooks-only
- **Redux for simple UI state**: Zustand is preferred for lightweight state (verified by existing usage)

## Open Questions

1. **Backend Command Endpoint**
   - What we know: Tauri invoke() is standard, ClaudeCodeSession uses it for Claude prompts
   - What's unclear: Does Rust backend already have `send_terminal_command` or do we need to create it?
   - Recommendation: Check src-tauri/src/commands/claude.rs for existing terminal command patterns, likely need new command for GSD

2. **Command Completion Events**
   - What we know: Tauri can emit events from Rust to frontend (pattern used for claude-complete)
   - What's unclear: How to detect GSD command completion in terminal to trigger combo chain?
   - Recommendation: Add Rust-side event emission after command execution completes, listen in React

3. **Command Routing Logic**
   - What we know: Different node states need different commands (discuss → plan → execute)
   - What's unclear: Where does this routing logic live? Component, hook, or lib?
   - Recommendation: Create lib/gsd/commands.ts with getCommandForNode(node, phases) function

4. **Combo Interrupt Mechanism**
   - What we know: Toggle switch should interrupt after current command
   - What's unclear: Cancel in-flight command or just prevent next auto-execution?
   - Recommendation: Just prevent next auto-execution, don't cancel running command (simpler, safer)

## Sources

### Primary (HIGH confidence)
- [/pmndrs/zustand] - Zustand state management patterns (Context7)
- [/websites/radix-ui] - Radix UI Tooltip and Popover components (Context7)
- [Tauri v2 Calling Rust](https://v2.tauri.app/develop/calling-rust/) - Official invoke() documentation
- [Tauri v2 Calling Frontend](https://v2.tauri.app/develop/calling-frontend/) - Event emission from Rust
- Existing codebase: ClaudeCodeSession.tsx, FloatingPromptInput.tsx, gsdStore.ts, GSDTreeNode.tsx

### Secondary (MEDIUM confidence)
- [React Official Docs - Managing State](https://react.dev/learn/managing-state) - React state patterns
- [React Official Docs - Responding to Events](https://react.dev/learn/responding-to-events) - Click handlers
- [React Async Docs](https://docs.react-async.com/guide/async-actions) - Async button patterns
- [LogRocket - React onClick Guide](https://blog.logrocket.com/react-onclick-event-handlers-guide/) - Click handler best practices

### Tertiary (LOW confidence)
- Various WebSearch results on state management trends 2026 - informational only
- Generic confirmation pattern articles - validated against Radix official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in package.json, verified versions
- Architecture: HIGH - Patterns verified in existing codebase and official docs
- Pitfalls: MEDIUM - Based on common React/Tauri issues, not GSD-specific experience

**Research date:** 2026-01-24
**Valid until:** 2026-02-23 (30 days - stable ecosystem)
