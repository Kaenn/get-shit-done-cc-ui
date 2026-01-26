# Phase 4: Command Panel - Research

**Researched:** 2026-01-25
**Domain:** Command palette UI, contextual sidebar panels, form-based command execution
**Confidence:** HIGH

## Summary

Phase 4 introduces a left sidebar panel displaying all GSD commands organized by category (Plan, Execute, Settings) with contextual awareness based on project state. Commands show active/inactive states, and clicking any command opens a modal dialog with pre-filled parameters for execution. This research focused on three key areas: (1) collapsible category sections using Radix UI primitives, (2) command state logic determining when commands are active/inactive based on parsed project data, and (3) modal dialog patterns for parameter editing before execution.

The standard approach uses Radix UI Collapsible for category sections (not Accordion, since categories are independent), Zustand state management to derive command eligibility from project state (currentPhase, parsedData, treeData), and Radix UI Dialog with controlled forms for parameter editing. The existing codebase already demonstrates these patterns: GSDPanelContent uses collapsible sections, gsdStore tracks project state, and SlashCommandPicker shows command grouping patterns. The critical insight is that command state is purely derived—never stored. Active/inactive is computed from project state every render, preventing stale command states.

**Primary recommendation:** Create command definition registry with eligibility functions, use Radix Collapsible for category sections (one per category), derive active/inactive state from gsdStore selectors, use Radix Dialog with controlled open state for parameter forms, pre-fill form fields using current project context (phase number, available plans, etc.).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @radix-ui/react-collapsible | Not installed | Collapsible category sections | Official Radix primitive for single-section expand/collapse, accessibility built-in |
| @radix-ui/react-dialog | ^1.1.4 | Modal parameter forms | Already installed, WAI-ARIA compliant, controlled state for async operations |
| Zustand | ^5.0.6 | Command state derivation | Already used for gsdStore, selector pattern perfect for derived command eligibility |
| lucide-react | ^0.468.0 | Command category icons | Already installed, consistent with existing GSD panel icons |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| framer-motion | ^12.0.0-alpha.1 | AnimatePresence for state transitions | Already installed, smooth transitions between loading/error/content states |
| @radix-ui/react-switch | ^1.1.3 | Future combo toggles per category | Already installed if category-level combo control added |
| clsx / tailwind-merge | ^2.6.0 | Conditional styling for active/inactive | Already via cn() utility, essential for dimmed inactive states |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Radix Collapsible | Radix Accordion | Accordion enforces exclusive opening; categories are independent (multiple can be open) |
| Radix Collapsible | Custom expand/collapse | Radix provides accessibility, keyboard nav, data attributes for free |
| Radix Dialog | cmdk command palette | cmdk optimized for search/filter, not parameter editing forms |
| Derived state | Stored command states | Derived state always accurate; stored states can become stale if not updated properly |

**Installation:**
```bash
npm install @radix-ui/react-collapsible
# All other dependencies already in package.json
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/gsd/
│   ├── GSDCommandPanel.tsx          # NEW: Left panel container
│   ├── GSDCommandCategory.tsx       # NEW: Collapsible category section
│   ├── GSDCommandButton.tsx         # NEW: Individual command button
│   ├── GSDCommandDialog.tsx         # NEW: Parameter editing modal
│   └── [existing components...]
├── lib/gsd/
│   ├── command-registry.ts          # NEW: Command definitions with eligibility
│   ├── command-state.ts             # NEW: Eligibility computation logic
│   └── commands.ts                  # EXISTING: Already has getCommandForNode
├── stores/
│   └── gsdStore.ts                  # EXTEND: Add command dialog state
└── hooks/
    └── useGSDCommands.ts            # NEW: Hook for command eligibility
```

### Pattern 1: Command Definition Registry
**What:** Centralized registry defining all GSD commands with metadata and eligibility logic
**When to use:** All command-based UI features
**Example:**
```typescript
// Source: VS Code extension contribution points pattern
// https://code.visualstudio.com/api/references/contribution-points

export interface GSDCommandDefinition {
  id: string;                    // e.g., 'plan-phase'
  fullCommand: string;           // e.g., '/gsd:plan-phase'
  label: string;                 // e.g., 'Plan Phase'
  description: string;
  category: 'plan' | 'execute' | 'settings';
  icon: LucideIcon;

  // Parameters definition
  parameters: {
    name: string;              // e.g., 'phase'
    type: 'number' | 'string' | 'boolean';
    label: string;             // e.g., 'Phase Number'
    required: boolean;
    defaultValue?: (state: StateData) => any;  // Derive from project state
  }[];

  // Eligibility function (pure, no side effects)
  isActive: (state: {
    parsedData: StateData | null;
    treeData: TreeNode[];
    phases: PhaseInfo[];
  }) => boolean;
}

// Example command definition
const PLAN_PHASE: GSDCommandDefinition = {
  id: 'plan-phase',
  fullCommand: '/gsd:plan-phase',
  label: 'Plan Phase',
  description: 'Research and create plans for a phase',
  category: 'plan',
  icon: FileText,
  parameters: [
    {
      name: 'phase',
      type: 'number',
      label: 'Phase Number',
      required: true,
      defaultValue: (state) => state.currentPhase,  // Pre-fill with current
    },
  ],
  isActive: (state) => {
    // Active if current phase exists and has pending plans
    if (!state.parsedData) return false;
    const currentPhase = state.phases.find(p => p.number === state.parsedData!.currentPhase);
    return currentPhase?.status === 'in-progress';
  },
};
```

### Pattern 2: Radix Collapsible Category Sections
**What:** Independent collapsible sections for each command category
**When to use:** Grouping commands into logical categories (Plan, Execute, Settings)
**Example:**
```typescript
// Source: https://www.radix-ui.com/primitives/docs/components/collapsible
// Official Radix pattern for single-section expand/collapse

import * as Collapsible from '@radix-ui/react-collapsible';

interface CommandCategoryProps {
  category: 'plan' | 'execute' | 'settings';
  commands: GSDCommandDefinition[];
  isExpanded: boolean;
  onToggle: () => void;
}

export function GSDCommandCategory({ category, commands, isExpanded, onToggle }: CommandCategoryProps) {
  return (
    <Collapsible.Root open={isExpanded} onOpenChange={onToggle}>
      <Collapsible.Trigger className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted">
        <ChevronRight className={cn(
          "w-4 h-4 transition-transform",
          isExpanded && "rotate-90"
        )} />
        <span className="text-sm font-semibold">{getCategoryLabel(category)}</span>
        <Badge variant="secondary">{commands.length}</Badge>
      </Collapsible.Trigger>

      <Collapsible.Content className="space-y-1 pt-1">
        {commands.map(cmd => (
          <GSDCommandButton key={cmd.id} command={cmd} />
        ))}
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
```

### Pattern 3: Derived Command State (No Storage)
**What:** Compute command active/inactive state from project data every render
**When to use:** All command eligibility determination
**Example:**
```typescript
// Source: Zustand selector pattern + React derived state
// https://github.com/pmndrs/zustand (verified pattern)

// DON'T store command states
// ❌ BAD: commandStates: { 'plan-phase': true, 'execute-phase': false }

// DO derive from project state
// ✅ GOOD: Compute eligibility on every render

function useCommandEligibility(command: GSDCommandDefinition) {
  const { parsedData, treeData, phases } = useGSDStore(
    (state) => ({
      parsedData: state.parsedData,
      treeData: state.treeData,
      phases: state.phases,
    })
  );

  // Pure computation - no side effects
  return command.isActive({ parsedData, treeData, phases });
}

// In component
const isActive = useCommandEligibility(command);

<button
  onClick={() => handleCommandClick(command)}
  disabled={false}  // NOTE: Even inactive commands are clickable per CONTEXT.md
  className={cn(
    "w-full text-left px-3 py-2 rounded hover:bg-muted",
    !isActive && "opacity-50"  // Visual dimming only, still clickable
  )}
>
  {command.label}
</button>
```

### Pattern 4: Controlled Dialog with Pre-filled Forms
**What:** Modal dialog with controlled open state, form fields pre-filled from project context
**When to use:** All command execution from command panel
**Example:**
```typescript
// Source: https://www.radix-ui.com/primitives/docs/components/dialog
// Controlled pattern required for async operations

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function GSDCommandDialog({ command, open, onOpenChange }: {
  command: GSDCommandDefinition;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const parsedData = useGSDStore(state => state.parsedData);
  const projectPath = useGSDStore(state => state.projectPath);

  // Pre-fill form values from project context
  const [formValues, setFormValues] = useState(() =>
    command.parameters.reduce((acc, param) => {
      acc[param.name] = param.defaultValue?.(parsedData!) ?? '';
      return acc;
    }, {} as Record<string, any>)
  );

  const [advancedFlags, setAdvancedFlags] = useState('');

  const handleExecute = async () => {
    // Build command string from form values
    const paramStr = command.parameters
      .map(p => formValues[p.name])
      .filter(Boolean)
      .join(' ');

    const finalCommand = `${command.fullCommand} ${paramStr} ${advancedFlags}`.trim();

    try {
      await api.executeClaudeCode(projectPath!, `/clear\n${finalCommand}`, 'sonnet');
      onOpenChange(false);  // Close dialog on success
    } catch (error) {
      console.error('Command execution failed:', error);
      // Keep dialog open, show error
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{command.label}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Render form fields for each parameter */}
          {command.parameters.map(param => (
            <div key={param.name} className="space-y-2">
              <Label htmlFor={param.name}>{param.label}</Label>
              <Input
                id={param.name}
                type={param.type === 'number' ? 'number' : 'text'}
                value={formValues[param.name]}
                onChange={(e) => setFormValues(prev => ({
                  ...prev,
                  [param.name]: param.type === 'number'
                    ? parseInt(e.target.value)
                    : e.target.value
                }))}
                required={param.required}
              />
            </div>
          ))}

          {/* Advanced flags text input */}
          <div className="space-y-2">
            <Label htmlFor="advanced">Advanced Flags (optional)</Label>
            <Input
              id="advanced"
              placeholder="--flag value --other-flag"
              value={advancedFlags}
              onChange={(e) => setAdvancedFlags(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExecute}>Execute</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Pattern 5: Category Expansion State Management
**What:** Track which categories are expanded using Set or boolean flags
**When to use:** Managing multiple independent collapsible sections
**Example:**
```typescript
// Source: Similar to existing expandedNodes pattern in gsdStore
// Adapted for category sections instead of tree nodes

interface GSDState {
  // ...existing state

  // Category expansion state (persisted for UX)
  expandedCategories: Set<string>;  // e.g., Set(['plan', 'execute'])
  toggleCategory: (category: string) => void;

  // Command dialog state (runtime only)
  commandDialogOpen: boolean;
  selectedCommand: GSDCommandDefinition | null;
  openCommandDialog: (command: GSDCommandDefinition) => void;
  closeCommandDialog: () => void;
}

// In store implementation
toggleCategory: (category: string) => set((state) => {
  const newExpanded = new Set(state.expandedCategories);
  if (newExpanded.has(category)) {
    newExpanded.delete(category);
  } else {
    newExpanded.add(category);
  }
  return { expandedCategories: newExpanded };
}),

// Usage in component
const { expandedCategories, toggleCategory } = useGSDStore();

<Collapsible.Root
  open={expandedCategories.has('plan')}
  onOpenChange={() => toggleCategory('plan')}
>
  {/* Category content */}
</Collapsible.Root>
```

### Pattern 6: File Watcher for Real-Time Command State Updates
**What:** Reuse existing useGSDFileWatcher to trigger command state re-computation
**When to use:** When .planning/ files change, command eligibility may change
**Example:**
```typescript
// Source: Existing watcher.ts pattern
// Already implemented in GSDPanelContent

// Watcher already updates parsedData and treeData
// Command eligibility re-computes automatically because it's derived

export function GSDCommandPanel() {
  const { parsedData, treeData } = useGSDStore();

  // No special watcher needed - useGSDFileWatcher already running
  // in GSDPanelContent updates parsedData, which triggers re-renders
  // and re-computation of command.isActive() functions

  const commands = COMMAND_REGISTRY.map(cmd => ({
    ...cmd,
    isActive: cmd.isActive({ parsedData, treeData, phases }),
  }));

  return <>{/* Render commands */}</>;
}
```

### Anti-Patterns to Avoid
- **Don't use Radix Accordion:** Categories are independent, not mutually exclusive. Use Collapsible instead.
- **Don't store command active/inactive states:** Always derive from project state to prevent staleness.
- **Don't disable inactive commands:** Per CONTEXT.md, inactive commands are clickable (grayed visually, still executable).
- **Don't show explanations for inactive state:** User learns through experience, no tooltips explaining "why inactive".
- **Don't skip modal dialog:** Always show dialog for parameter editing, even if all defaults are fine.
- **Don't use react-hook-form for simple forms:** Native controlled inputs sufficient for 1-3 parameters. RHF adds complexity.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Collapsible sections with accessibility | Custom expand/collapse with CSS | Radix Collapsible | WAI-ARIA disclosure pattern, keyboard nav (Space/Enter), data attributes for styling, focus management |
| Modal dialog with focus trap | Custom overlay + z-index | Radix Dialog | Focus trap, Esc handling, scroll lock, overlay click-outside, WAI-ARIA dialog pattern |
| Command eligibility logic | Complex if/else in components | Eligibility functions in registry | Centralized logic, testable, reusable across UI and API |
| Form state for parameters | Manual useState per field | Single form object state | Cleaner, easier validation, simpler submit handler |
| Command parameter parsing | String splitting/regex | Structured parameter definitions | Type-safe, pre-filled defaults, validation built-in |

**Key insight:** The command panel is essentially a categorized list of buttons that open dialogs. Radix provides all primitives needed (Collapsible, Dialog, controlled inputs). Don't build custom solutions for problems Radix already solved with accessibility and keyboard nav.

## Common Pitfalls

### Pitfall 1: Storing Command States Instead of Deriving
**What goes wrong:** Command active/inactive state stored in Zustand becomes stale when project state changes, causing wrong commands to appear active/inactive
**Why it happens:** Seems simpler to compute once and store boolean flags than re-compute every render
**How to avoid:** Always derive command eligibility from project state using selector pattern. Eligibility is a pure function of (parsedData, treeData, phases).
**Warning signs:** Commands shown as inactive when they should be active after file changes, "refresh" button needed to update command states

### Pitfall 2: Using Accordion Instead of Collapsible
**What goes wrong:** Only one category can be open at a time, forcing users to close "Plan" to open "Execute"
**Why it happens:** Accordion seems like the right component for grouped sections
**How to avoid:** Use Collapsible for independent sections. Accordion is for mutually exclusive sections (only one open). Command categories are independent (user may want both Plan and Execute visible).
**Warning signs:** Categories auto-close when opening another category, user complaints about "why does it keep closing?"

### Pitfall 3: Complex Form Validation for Simple Parameters
**What goes wrong:** Over-engineering with react-hook-form, Zod schemas, field arrays when parameters are just 1-2 simple inputs
**Why it happens:** Following "best practices" without considering actual complexity
**How to avoid:** Use native controlled inputs for simple forms (1-3 fields, basic types). Only add react-hook-form if validation becomes complex or fields exceed 5.
**Warning signs:** 100+ lines of form setup for a single number input, excessive re-renders on input changes

### Pitfall 4: Dialog Not Closing After Execution
**What goes wrong:** User clicks Execute, command runs, but dialog stays open showing the form
**Why it happens:** Forgot to call onOpenChange(false) after successful execution, or async operation never resolves
**How to avoid:** Use controlled Dialog state, call onOpenChange(false) in try block after api.executeClaudeCode succeeds. Don't close in finally (want to keep open if error occurred).
**Warning signs:** Dialog remains open after command executes successfully, user has to click Cancel/X to close

### Pitfall 5: Missing Panel Switching Updates
**What goes wrong:** Command panel shows state from previous project when switching to different project/terminal
**Why it happens:** Panel doesn't detect projectPath changes, continues showing old parsedData
**How to avoid:** Existing useGSDFileWatcher already handles this via projectPath dependency. Just ensure command panel subscribes to same gsdStore state.
**Warning signs:** Command panel shows wrong phase/plan numbers after switching projects, stale command eligibility

### Pitfall 6: Command Category Organization Mismatch
**What goes wrong:** User can't find commands because categorization doesn't match mental model
**Why it happens:** Arbitrary categorization not aligned with GSD workflow stages
**How to avoid:** Follow GSD's natural workflow: Plan (setup commands), Execute (action commands), Settings (configuration). Map each GSD command to category based on user intent, not technical implementation.
**Warning signs:** Users searching for commands in wrong category, multiple categories have <3 commands (over-categorization)

## Code Examples

Verified patterns from official sources and existing codebase:

### Complete Command Button Component
```typescript
// Source: Combining existing GSDTreeNode patterns with Dialog
// Radix Dialog controlled pattern from official docs

interface GSDCommandButtonProps {
  command: GSDCommandDefinition;
}

export function GSDCommandButton({ command }: GSDCommandButtonProps) {
  const { parsedData, treeData, phases, openCommandDialog } = useGSDStore();

  // Derive active state (re-computed every render)
  const isActive = command.isActive({ parsedData, treeData, phases });

  const Icon = command.icon;

  return (
    <button
      onClick={() => openCommandDialog(command)}
      disabled={false}  // Per CONTEXT: inactive commands still clickable
      className={cn(
        "flex items-center gap-2 w-full px-3 py-1.5 rounded text-sm",
        "hover:bg-muted transition-colors text-left",
        !isActive && "opacity-50"  // Visual dimming only
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1 truncate">{command.label}</span>
    </button>
  );
}
```

### Command Registry with Full GSD Commands
```typescript
// Source: GSD command list from https://github.com/glittercowboy/get-shit-done
// Combined with eligibility logic patterns

export const GSD_COMMANDS: GSDCommandDefinition[] = [
  // Plan Category
  {
    id: 'new-project',
    fullCommand: '/gsd:new-project',
    label: 'New Project',
    description: 'Initialize with questions → research → roadmap',
    category: 'plan',
    icon: FolderPlus,
    parameters: [],
    isActive: (state) => !state.parsedData,  // Only if no .planning/ exists
  },
  {
    id: 'plan-phase',
    fullCommand: '/gsd:plan-phase',
    label: 'Plan Phase',
    description: 'Research + plan + verify for a phase',
    category: 'plan',
    icon: FileText,
    parameters: [
      {
        name: 'phase',
        type: 'number',
        label: 'Phase Number',
        required: true,
        defaultValue: (state) => state.currentPhase,
      },
    ],
    isActive: (state) => !!state.parsedData,  // Has .planning/ directory
  },
  {
    id: 'discuss-phase',
    fullCommand: '/gsd:discuss-phase',
    label: 'Discuss Phase',
    description: 'Capture decisions before planning',
    category: 'plan',
    icon: MessageSquare,
    parameters: [
      {
        name: 'phase',
        type: 'number',
        label: 'Phase Number',
        required: false,
        defaultValue: (state) => state.currentPhase,
      },
    ],
    isActive: (state) => !!state.parsedData,
  },

  // Execute Category
  {
    id: 'execute-phase',
    fullCommand: '/gsd:execute-phase',
    label: 'Execute Phase',
    description: 'Execute all plans in parallel waves',
    category: 'execute',
    icon: Play,
    parameters: [
      {
        name: 'phase',
        type: 'number',
        label: 'Phase Number',
        required: true,
        defaultValue: (state) => state.currentPhase,
      },
    ],
    isActive: (state) => {
      // Active if current phase has at least one pending/in-progress plan
      if (!state.parsedData) return false;
      const hasActionablePlans = state.treeData
        .find(n => n.id === `phase-${state.parsedData!.currentPhase}`)
        ?.children?.some(p => p.status === 'pending' || p.status === 'in-progress');
      return hasActionablePlans ?? false;
    },
  },
  {
    id: 'progress',
    fullCommand: '/gsd:progress',
    label: 'Show Progress',
    description: 'Display current status and next steps',
    category: 'execute',
    icon: Activity,
    parameters: [],
    isActive: (state) => !!state.parsedData,  // Has .planning/ directory
  },

  // Settings Category
  {
    id: 'settings',
    fullCommand: '/gsd:settings',
    label: 'Settings',
    description: 'Configure model profile and workflow',
    category: 'settings',
    icon: Settings,
    parameters: [],
    isActive: () => true,  // Always available
  },
  // ... more commands
];

// Group commands by category
export function getCommandsByCategory() {
  return {
    plan: GSD_COMMANDS.filter(c => c.category === 'plan'),
    execute: GSD_COMMANDS.filter(c => c.category === 'execute'),
    settings: GSD_COMMANDS.filter(c => c.category === 'settings'),
  };
}
```

### File Watcher Integration (Already Exists)
```typescript
// Source: Existing watcher.ts and GSDPanelContent usage
// No changes needed - watcher already updates parsedData

// In GSDCommandPanel component:
export function GSDCommandPanel() {
  const projectPath = useGSDStore(state => state.projectPath);

  // Watcher already running in GSDPanelContent
  // Updates parsedData → triggers re-render → command eligibility re-computed
  // No additional watcher needed

  const commands = useGSDCommands();  // Hook that derives eligibility

  return <>{/* Render command categories */}</>;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom collapsible with useState | Radix Collapsible primitive | Radix stable (2022) | Accessibility, keyboard nav, data attributes free |
| Uncontrolled dialogs | Controlled Dialog for async | React 18+ (2022) | Proper async form handling, programmatic close |
| Props drilling for command state | Zustand selectors | Zustand v4+ (2023) | Cleaner, no prop drilling, optimized re-renders |
| Stored eligibility flags | Derived eligibility from state | Modern React patterns | Always accurate, no stale states |
| Command search with fuzzy match | cmdk library for search | 2023-2024 | Fast, accessible command palette if needed later |

**Deprecated/outdated:**
- **Custom accordion components:** Use Radix primitives for accessibility
- **Redux for UI state:** Zustand is lighter and sufficient for this use case (verified by existing codebase)
- **Uncontrolled forms with refs:** Controlled inputs with useState for better React integration
- **react-hook-form for simple forms:** Only needed for complex validation; overkill for 1-3 parameters

## Open Questions

1. **Exact GSD Command Categorization**
   - What we know: GSD has ~28 commands across workflow stages (Core, Navigation, Phase Management, Session, Utilities)
   - What's unclear: Best mapping to 3 categories (Plan, Execute, Settings) per CONTEXT.md decisions
   - Recommendation:
     - Plan: new-project, discuss-phase, plan-phase, add-phase, insert-phase, list-phase-assumptions
     - Execute: execute-phase, verify-work, progress, map-codebase, audit-milestone, complete-milestone
     - Settings: settings, set-profile, update, help, join-discord
     - Utilities (4th category?): add-todo, check-todos, debug, quick, pause-work, resume-work

2. **Default Category Expansion**
   - What we know: CONTEXT.md says "active category expanded by default, others collapsed"
   - What's unclear: Define "active category" - most recently used? Category with most active commands? Current workflow stage?
   - Recommendation: Category with highest count of active commands expands by default. If tied, use workflow order (Plan > Execute > Settings).

3. **Parameter Form Complexity**
   - What we know: Most GSD commands take 0-1 parameters (phase number, profile name)
   - What's unclear: Do any commands need complex validation (ranges, dependencies between parameters)?
   - Recommendation: Start with simple controlled inputs. All GSD commands have simple parameters (numbers, strings). No complex validation needed.

4. **Advanced Flags Input Format**
   - What we know: CONTEXT.md specifies "raw text input for advanced flags"
   - What's unclear: How to parse free-form flag text into command string? Validation needed?
   - Recommendation: Simple string append. If user types `--flag value`, final command is `/gsd:plan-phase 3 --flag value`. No parsing. Let terminal/backend handle flag validation.

5. **Left vs Right Panel Positioning**
   - What we know: CONTEXT.md says "Left panel", existing GSD panel is on right
   - What's unclear: Do we use same SplitPane component? Same layout patterns?
   - Recommendation: Mirror existing GSD panel patterns but flip layout. Use SplitPane with left={<GSDCommandPanel />} right={<MainContent />}. Same resizable behavior, same compact aesthetic.

## Sources

### Primary (HIGH confidence)
- [Radix UI Collapsible](https://www.radix-ui.com/primitives/docs/components/collapsible) - Official Radix primitive docs
- [Radix UI Dialog](https://www.radix-ui.com/primitives/docs/components/dialog) - Official modal dialog docs
- [Radix UI Accordion](https://www.radix-ui.com/primitives/docs/components/accordion) - Researched but not recommended for this use case
- [GSD Command List](https://github.com/glittercowboy/get-shit-done) - Official GSD repository command reference
- [Zustand GitHub](https://github.com/pmndrs/zustand) - Selector pattern and derived state
- Existing codebase: gsdStore.ts, watcher.ts, GSDPanelContent.tsx, GSDTreeNode.tsx, SlashCommandPicker.tsx, split-pane.tsx

### Secondary (MEDIUM confidence)
- [VS Code Command Palette Guidelines](https://code.visualstudio.com/api/ux-guidelines/command-palette) - Command categorization patterns
- [React Managing State](https://react.dev/learn/managing-state) - Derived state vs stored state
- [Mobbin Sidebar UI Patterns](https://mobbin.com/glossary/sidebar) - Sidebar design best practices
- [UI/UX Design Trends 2026](https://www.index.dev/blog/ui-ux-design-trends) - Contextual minimalism, progressive disclosure
- [Tauri fs-watch Plugin](https://github.com/tauri-apps/tauri-plugin-fs-watch) - Official file watcher (not used, using polling)

### Tertiary (LOW confidence)
- WebSearch results on command palette patterns - verified against official Radix/cmdk docs
- WebSearch results on form state management - general patterns, not GSD-specific
- Command parameter parsing articles - generic approaches, adapted for GSD needs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Radix primitives verified via official docs, Zustand already in project
- Architecture: HIGH - Patterns verified in existing codebase (GSDPanel, gsdStore) and official Radix docs
- Pitfalls: MEDIUM - Based on Radix usage patterns and state management best practices, not GSD-specific experience

**Research date:** 2026-01-25
**Valid until:** 2026-02-24 (30 days - stable ecosystem, Radix UI and Zustand are mature libraries)
