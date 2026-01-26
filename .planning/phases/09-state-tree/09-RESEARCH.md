# Phase 9: State Tree - Research

**Researched:** 2026-01-26
**Domain:** React hierarchical tree component with status visualization and interactions
**Confidence:** HIGH

## Summary

Phase 9 implements a hierarchical tree view component for browsing the GSD milestone/phase/plan structure with status indicators and inline actions. The research reveals that while the project already has a basic tree implementation (GSDTreeView/GSDTreeNode), it needs enhancement for:

1. **Milestone-level hierarchy** - Current implementation only shows phase→plan (2 levels), needs milestone→phase→plan (3 levels)
2. **Archived milestones section** - Requires separate UI section for completed milestones with dimmed styling
3. **Status indicator refinement** - Current uses icons (CircleCheck, Loader2, Circle), needs color-dot-only indicators per CONTEXT.md decisions
4. **File viewer integration** - Clicking nodes should open markdown files in Phase 8 viewer

The existing architecture is solid: Zustand store for state management, recursive TreeNode component pattern, connector lines already implemented. Primary work is extending the data model for milestones and refining visual presentation.

**Primary recommendation:** Enhance existing GSDTreeView/GSDTreeNode components rather than introducing new tree libraries. The codebase already follows React best practices with recursive components, Set-based expand/collapse state, and integration with the viewer system.

## Standard Stack

The established libraries/tools for hierarchical tree components in React (2026):

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.3.1 | Component framework | Already in project, tree is recursive component pattern |
| Zustand | 5.0.6 | State management | Already in use for GSD store, handles expanded nodes efficiently |
| Tailwind CSS | 4.1.8 | Styling | Already in project, utility classes for tree indentation/lines |
| Framer Motion | 12.0.0-alpha.1 | Animations | Already in project, ideal for expand/collapse transitions |
| Radix UI | Latest | Accessible primitives | Already in use (@radix-ui/react-collapsible 1.1.12), provides a11y foundation |
| lucide-react | 0.468.0 | Icons | Already in use for chevrons and status indicators |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| class-variance-authority | 0.7.1 | Variant management | For tree node styling variants (status, depth, archived) |
| clsx/tailwind-merge | 2.6.0 | Class merging | Conditional styling of tree nodes based on state |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom tree | react-arborist | Overkill for ~10 milestones × ~10 phases × ~10 plans. Adds 50KB bundle, virtualization not needed |
| Custom tree | react-complex-tree | Adds drag-drop we don't need, 35KB overhead |
| Tailwind | CSS-in-JS | Project uses Tailwind consistently, switching creates style fragmentation |
| Framer Motion | CSS animations | Already in deps, provides better orchestration for expand/collapse |

**Installation:**
No new dependencies required - all libraries already in package.json.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/gsd/
│   ├── GSDTreeView.tsx         # Container (already exists, needs milestone support)
│   ├── GSDTreeNode.tsx         # Recursive node (already exists, needs refinement)
│   ├── GSDStatePanel.tsx       # Panel wrapper (already exists, needs tree integration)
│   └── GSDArchivedSection.tsx  # NEW: Archived milestones section
├── stores/
│   └── gsdStore.ts             # Zustand store (already exists, needs milestone state)
└── lib/gsd/
    ├── tree-transforms.ts      # Data transformations (already exists, needs milestone transform)
    └── parsers.ts              # File parsing (needs milestone parser)
```

### Pattern 1: Recursive Tree Component with Set-Based Expansion

**What:** Each tree node renders itself and recursively renders its children based on expansion state stored in a Set.

**When to use:** Hierarchical data with unknown depth or variable nesting. Already implemented in GSDTreeNode.

**Example:**
```typescript
// Source: Existing codebase src/components/gsd/GSDTreeNode.tsx (lines 22-184)
export const GSDTreeNode = React.memo(
  ({ node, depth, currentPhaseNumber, projectPath }: TreeNodeProps) => {
    const { expandedNodes, toggleNode } = useGSDStore();
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
        {/* Node row with click handlers */}
        <div onClick={() => hasChildren && toggleNode(node.id)}>
          {/* Status, label, actions */}
        </div>

        {/* Recursive children with connector lines */}
        {hasChildren && isExpanded && (
          <div role="group" className="relative">
            {node.children!.map((child) => (
              <GSDTreeNode key={child.id} node={child} depth={depth + 1} {...props} />
            ))}
          </div>
        )}
      </div>
    );
  }
);
```

**Key insight:** Set-based expansion state (`Set<string>`) is more efficient than object-based for toggle operations and serialization.

### Pattern 2: Flat Data to Hierarchical Tree Transform

**What:** Transform flat arrays (milestones[], phases[], plans[]) into nested TreeNode structure for rendering.

**When to use:** When data source is flat (markdown files parsed separately) but UI needs hierarchy.

**Example:**
```typescript
// Source: Existing codebase src/lib/gsd/tree-transforms.ts (lines 34-88)
export function buildTreeData(
  phases: PhaseInfo[],
  plans: PlanInfo[],
  currentPhaseNumber: number
): TreeNode[] {
  return phases.map((phase) => {
    const phasePlans = plans
      .filter((plan) => plan.phaseNumber === phase.number)
      .sort((a, b) => a.planNumber - b.planNumber);

    const children: TreeNode[] = phasePlans.map((plan) => ({
      id: `plan-${plan.phaseNumber}-${plan.planNumber.toString().padStart(2, '0')}`,
      type: 'plan' as const,
      label: `Plan ${plan.planNumber.toString().padStart(2, '0')}`,
      status: plan.status,
      metadata: { description: plan.name },
    }));

    return {
      id: `phase-${phase.number}`,
      type: 'phase' as const,
      label: `Phase ${phase.number}: ${phase.name}`,
      status: computeStatus(phase, phasePlans, currentPhaseNumber),
      progress: { completed: phasePlans.filter(p => p.status === 'complete').length, total: phasePlans.length },
      children,
    };
  });
}
```

**Extension needed:** Add milestone level to create 3-level hierarchy:
```typescript
export function buildMilestoneTree(
  milestones: MilestoneInfo[],
  phases: PhaseInfo[],
  plans: PlanInfo[]
): TreeNode[] {
  return milestones.map(milestone => ({
    id: `milestone-${milestone.number}`,
    type: 'milestone' as const,
    label: milestone.name,
    status: milestone.status,
    archived: milestone.archived,
    children: buildTreeData(
      phases.filter(p => p.milestoneNumber === milestone.number),
      plans,
      milestone.currentPhase
    )
  }));
}
```

### Pattern 3: Connector Lines with Absolute Positioning

**What:** Visual guide lines connecting parent to children using absolute-positioned divs.

**When to use:** VSCode-style tree where visual hierarchy is important. Already implemented in GSDTreeNode.

**Example:**
```typescript
// Source: Existing codebase src/components/gsd/GSDTreeNode.tsx (lines 160-177)
{hasChildren && isExpanded && (
  <div role="group" className="relative">
    {/* Vertical connector line */}
    <div className="absolute left-[11px] top-0 bottom-2 w-px bg-border" />

    {node.children!.map((child) => (
      <div key={child.id} className="relative">
        {/* Horizontal connector line */}
        <div className="absolute left-[11px] top-4 w-4 h-px bg-border" />
        <GSDTreeNode node={child} depth={depth + 1} {...props} />
      </div>
    ))}
  </div>
)}
```

**Key measurements:**
- Vertical line: `left-[11px]` aligns with chevron center (16px / 2 + margin)
- Horizontal line: `w-4` (16px) extends from parent to child indent
- Spacing: `ml-6` (24px) per depth level creates clear visual hierarchy

### Pattern 4: Framer Motion Expand/Collapse Animation

**What:** Smooth height animation for expanding/collapsing tree sections using AnimatePresence and motion.div.

**When to use:** Tree expand/collapse, accordion-style UI, any height-based show/hide.

**Example:**
```typescript
// Source: Framer Motion documentation patterns
import { motion, AnimatePresence } from 'framer-motion';

{hasChildren && (
  <AnimatePresence initial={false}>
    {isExpanded && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        style={{ overflow: "hidden" }}
      >
        {node.children!.map((child) => (
          <GSDTreeNode key={child.id} node={child} depth={depth + 1} {...props} />
        ))}
      </motion.div>
    )}
  </AnimatePresence>
)}
```

**Performance note:** Animating `height: auto` can be janky with >100 children. For this project (~10 plans per phase), performance is not a concern.

### Pattern 5: Status-Based Styling with CVA

**What:** Define status variants using class-variance-authority for consistent, type-safe styling.

**When to use:** Multiple visual variants based on state (status, type, archived). Project already uses CVA for Button component.

**Example:**
```typescript
// Source: Project pattern from src/components/ui/button.tsx
import { cva } from "class-variance-authority";

const treeNodeVariants = cva(
  "flex items-center gap-2 py-1.5 px-2 rounded transition-colors",
  {
    variants: {
      status: {
        pending: "text-muted-foreground",
        "in-progress": "text-primary",
        complete: "opacity-60 text-muted-foreground",
      },
      archived: {
        true: "opacity-50",
        false: "",
      },
      interactive: {
        true: "hover:bg-muted/50 cursor-pointer",
        false: "",
      },
    },
    defaultVariants: {
      status: "pending",
      archived: false,
      interactive: false,
    },
  }
);
```

### Anti-Patterns to Avoid

- **Storing expanded state in component useState:** Creates component-local state that's lost on unmount. Use Zustand store for persistence across navigation.
- **Object-based expansion tracking:** `{[id]: boolean}` is less efficient than `Set<string>` for toggle operations and harder to serialize.
- **Deep recursion without memoization:** GSDTreeNode must use `React.memo` to prevent re-rendering entire tree on expand/collapse. Already implemented.
- **Inline style calculations in render:** Extract styles to CSS or computed values outside render to avoid recalculation.
- **Status icons when specs say color-only:** CONTEXT.md explicitly states "Color-only status (no icons) — colored dot before node name". Current implementation uses icons (violation).

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Accessible tree ARIA attributes | Manual role/aria-* props | Radix Collapsible pattern | Tree WAI-ARIA is complex: aria-expanded, aria-level, aria-setsize, aria-posinset, role=tree/treeitem/group. Radix handles focus management, keyboard navigation (arrow keys, Home/End). Current implementation partially compliant but missing aria-level. |
| Smooth expand/collapse animation | CSS transitions with max-height hack | Framer Motion AnimatePresence | `max-height` transitions require guessing max value (janky if too small, slow if too large). `height: auto` doesn't animate. Framer Motion handles dynamic height correctly. |
| Pulse animation for in-progress status | Custom @keyframes CSS | Tailwind animate-pulse + custom timing | Tailwind includes optimized pulse animation. Customize with theme extension if default (2s) is too slow. Use CSS custom properties for configurability. |
| Virtual scrolling for large trees | Custom windowing logic | @tanstack/react-virtual (already in deps) | Project already has react-virtual 3.13.10 for large lists. But with ~10 milestones max, virtualization is premature optimization. |
| Tree state persistence | localStorage + JSON.stringify | Zustand persist middleware | Already implemented in gsdStore. Handles serialization, rehydration, storage API. Set-based state needs custom storage function. |

**Key insight:** For trees <1000 nodes, simple recursive components outperform virtualized solutions. This project's tree (10 milestones × 10 phases × 10 plans = max 1000 nodes, typically <100 visible) doesn't need react-arborist or virtualization.

## Common Pitfalls

### Pitfall 1: Unnecessary Re-renders of Entire Tree on State Changes

**What goes wrong:** Changing expanded state or status of one node triggers re-render of entire tree (all siblings and ancestors), causing visible lag with >50 nodes.

**Why it happens:** Without memoization, React's default reconciliation re-renders all components nested within the updated component. For recursive trees, this means every node below the root.

**How to avoid:**
1. Wrap tree node component in `React.memo` (already done in GSDTreeNode)
2. Use stable references for callbacks (useCallback for toggleNode, etc.)
3. Store expanded state in Set, not object (Set identity changes less frequently)
4. Avoid inline object/array creation in props

**Warning signs:**
- Slow expand/collapse animations
- Tree feels "laggy" when clicking nodes
- React DevTools Profiler shows entire tree re-rendering on single node toggle

**Example fix:**
```typescript
// BAD: Inline object creation causes re-render
<GSDTreeNode
  node={node}
  metadata={{ currentPhaseNumber }} // New object every render!
/>

// GOOD: Pass primitives directly
<GSDTreeNode
  node={node}
  currentPhaseNumber={currentPhaseNumber}
/>
```

### Pitfall 2: Connector Line Misalignment at Different Depths

**What goes wrong:** Vertical connector lines don't align with chevron icons when tree nodes have different padding or margin at various depths, creating "broken" visual hierarchy.

**Why it happens:** Connector line position (`left-[11px]`) is absolute and doesn't account for depth-based padding (`ml-6` multiplied by depth). Math breaks when depth > 0.

**How to avoid:**
1. Use CSS variables for depth-based positioning: `--depth: 0; left: calc(11px + var(--depth) * 24px)`
2. Or, render connector lines inside the tree node container (relative to current depth, not root)
3. Keep indentation consistent: Always `ml-6` per level, never vary padding

**Warning signs:**
- Guide lines don't connect to parent chevrons at depth > 1
- Lines appear offset or "floating" between nodes
- Horizontal connectors don't reach child nodes

**Example fix:**
```typescript
// BAD: Lines positioned from root, ignore depth
<div className="absolute left-[11px] top-0 bottom-2 w-px bg-border" />

// GOOD: Lines account for depth offset
<div
  className="absolute top-0 bottom-2 w-px bg-border"
  style={{ left: `${11 + depth * 24}px` }}
/>

// BETTER: Use CSS variable in Tailwind config
<div
  className="absolute top-0 bottom-2 w-px bg-border connector-line"
  style={{ '--depth': depth } as React.CSSProperties}
/>
```

### Pitfall 3: Status Icon Animation Performance

**What goes wrong:** Continuous animations (spin, pulse) on every in-progress node cause high CPU usage and jank when many nodes are animating simultaneously.

**Why it happens:** CSS animations run on main thread unless explicitly GPU-accelerated. With 10+ spinning icons, browser struggles to maintain 60fps.

**How to avoid:**
1. Use `will-change: transform` for animated elements
2. Prefer `transform` and `opacity` (GPU-accelerated) over `width`, `height`, `top`, `left` (layout triggers)
3. Limit number of simultaneous animations - consider animating only visible viewport
4. For pulse: Use `@keyframes` with `transform: scale()` instead of changing size properties

**Warning signs:**
- Scrolling feels janky when in-progress nodes are visible
- High CPU usage in dev tools performance tab
- Animations pause or stutter during interactions

**Example fix:**
```typescript
// BAD: Animating non-GPU properties
<div className="animate-pulse" style={{ width: '16px' }} /> // Layout thrash!

// GOOD: GPU-accelerated transform
<motion.div
  animate={{ scale: [1, 1.2, 1] }}
  transition={{ repeat: Infinity, duration: 2 }}
  style={{ willChange: 'transform' }} // Hint to browser
>
  <Circle className="w-4 h-4 text-blue-500" />
</motion.div>

// BETTER: Use Tailwind's optimized animate-pulse (already GPU-accelerated)
<div className="animate-pulse">
  <Circle className="w-4 h-4 text-blue-500" />
</div>
```

### Pitfall 4: Archived Nodes Still Interactive

**What goes wrong:** Clicking archived milestone nodes triggers expand/collapse or commands, confusing users who expect read-only behavior.

**Why it happens:** Event handlers on tree nodes don't check `archived` status before executing actions.

**How to avoid:**
1. Disable expand/collapse for archived nodes: `onClick={() => !node.archived && hasChildren && toggleNode(node.id)}`
2. Hide action buttons (Play, Edit) when `node.archived === true`
3. Show visual feedback: `cursor-not-allowed` or `pointer-events-none` on archived content
4. But still allow clicking to open files in viewer (read-only context)

**Warning signs:**
- Users report executing commands on old milestones
- Archived sections expand/collapse when they should be static
- No visual distinction between active and archived interaction

**Example implementation:**
```typescript
const isInteractive = !node.archived && hasChildren;

<div
  className={cn(
    'flex items-center gap-2 py-1.5 px-2 rounded transition-colors',
    isInteractive && 'hover:bg-muted/50 cursor-pointer',
    node.archived && 'opacity-50 cursor-default'
  )}
  onClick={() => {
    if (node.archived) {
      // Only open file in viewer, don't expand
      openFile(node.filepath);
    } else if (hasChildren) {
      toggleNode(node.id);
    }
  }}
>
```

### Pitfall 5: Forgetting to Handle Empty States

**What goes wrong:** Tree shows nothing when no milestones exist, or crashes when currentPhase is invalid, leaving users confused.

**Why it happens:** Component assumes data always exists and is well-formed, doesn't guard against edge cases.

**How to avoid:**
1. Check for empty data: `if (!treeData || treeData.length === 0) return <EmptyState />`
2. Validate currentPhaseNumber: `const safePhaseNumber = Math.max(1, Math.min(currentPhaseNumber, totalPhases))`
3. Show friendly messages: "No milestones yet. Create your first milestone to get started."
4. Handle missing files gracefully: "ROADMAP.md not found. Initialize GSD to create."

**Warning signs:**
- Blank panel when project first initialized
- Console errors about undefined properties
- Tree doesn't update when STATE.md changes

**Example guard:**
```typescript
export function GSDTreeView({ projectPath }: GSDTreeViewProps) {
  const { treeData, parsedData, isLoading, error } = useGSDStore();

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!treeData || treeData.length === 0) {
    return (
      <EmptyState>
        <p>No milestones found.</p>
        <Button onClick={() => api.executeClaudeCode(projectPath, '/gsd:init', 'sonnet')}>
          Initialize GSD
        </Button>
      </EmptyState>
    );
  }

  // Render tree...
}
```

## Code Examples

Verified patterns from official sources and existing codebase:

### Example 1: Status Dot Indicator (Color-Only, No Icons)

Per CONTEXT.md requirement: "Color-only status (no icons) — colored dot before node name"

```typescript
// Source: CONTEXT.md specification + Tailwind best practices
const StatusDot = ({ status }: { status: 'pending' | 'in-progress' | 'complete' }) => {
  const dotClasses = cn(
    'w-2 h-2 rounded-full flex-shrink-0',
    {
      'bg-gray-400': status === 'pending',
      'bg-blue-500 animate-pulse': status === 'in-progress', // Pulse for attention
      'bg-green-500': status === 'complete',
    }
  );

  return <div className={dotClasses} aria-hidden="true" />;
};

// Usage in GSDTreeNode:
<StatusDot status={node.status} />
<span className="text-sm flex-1 truncate">{node.label}</span>
```

**Note:** Current implementation uses icons (CircleCheck, Loader2, Circle). Must replace with dots.

### Example 2: Archived Milestones Section

```typescript
// Source: CONTEXT.md specification + existing GSDTreeView pattern
export function GSDArchivedSection({ archivedNodes }: { archivedNodes: TreeNode[] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (archivedNodes.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 border-t border-border pt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full py-1.5 px-2 rounded hover:bg-muted/50 transition-colors"
        aria-expanded={isExpanded}
      >
        <ChevronRight
          className={cn(
            'w-4 h-4 transition-transform',
            isExpanded && 'rotate-90'
          )}
        />
        <span className="text-sm text-muted-foreground">
          Archived ({archivedNodes.length})
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div className="mt-1 opacity-60">
              {archivedNodes.map((node) => (
                <GSDTreeNode
                  key={node.id}
                  node={node}
                  depth={0}
                  currentPhaseNumber={0} // Archived, no current phase
                  projectPath={projectPath}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

### Example 3: Progress Counts with Percentage

```typescript
// Source: Existing GSDTreeNode.tsx (lines 141-156), refined for readability
const ProgressIndicator = ({ progress }: { progress: TreeNodeProgress }) => {
  const percentage = progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span>
        {progress.completed}/{progress.total}
      </span>
      <span className="text-primary font-medium">
        ({percentage}%)
      </span>
    </div>
  );
};

// Usage:
{node.progress && <ProgressIndicator progress={node.progress} />}
```

### Example 4: Inline Action Buttons (Show on Hover)

```typescript
// Source: Existing GSDTreeNode.tsx (lines 116-138), pattern already implemented
{isClickable && (
  <TooltipProvider delayDuration={200}>
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleNodeClick}
          disabled={isCommandRunning || node.archived}
          className={cn(
            "p-1 rounded hover:bg-muted",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            isCommandRunning && "opacity-50 cursor-not-allowed",
            node.archived && "hidden" // Don't show actions on archived nodes
          )}
          aria-label={`Execute ${getCommandLabel(command!)}`}
        >
          <Play className="w-4 h-4 text-primary" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" align="center">
        <code className="text-xs">{command}</code>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)}
```

**Key pattern:** `opacity-0 group-hover:opacity-100` on button, parent has `group` class. Actions appear only when hovering over node row.

### Example 5: Opening Files in Phase 8 Viewer

```typescript
// Source: Existing gsdStore.ts (lines 186-207), already implemented
import { useGSDStore } from '@/stores/gsdStore';

const { openFile } = useGSDStore();

// In tree node click handler:
const handleNodeTextClick = () => {
  if (!node.filepath) return;

  // Open file in viewer (Phase 8 integration)
  openFile(node.filepath);
};

// In JSX:
<span
  onClick={handleNodeTextClick}
  className="text-sm flex-1 truncate cursor-pointer hover:underline"
>
  {node.label}
</span>
```

**Integration note:** Phase 8 viewer is already implemented. GSDFileViewer component reads from `openTabs` and `activeTabId` in gsdStore. Tree just needs to call `openFile()` with correct filepath.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Object-based expansion: `{[id]: boolean}` | Set-based expansion: `Set<string>` | Zustand 4.0+ (2023) | Better serialization, faster toggle operations, cleaner API |
| React Context for tree state | Zustand with persist middleware | React 18 era (2022+) | Eliminates prop drilling, automatic persistence, better DevTools |
| CSS animations with max-height | Framer Motion height: "auto" | Framer Motion 10+ (2023) | Accurate dynamic height, no guess-work, smoother animations |
| Custom accessibility implementation | Radix Collapsible pattern | Radix UI stable (2023+) | WAI-ARIA compliant out of box, keyboard nav, focus management |
| Icon-based status (CircleCheck, etc.) | Color-coded dots with animation | Material Design 3 (2024) | Cleaner visual hierarchy, less cognitive load, better at-a-glance status |
| Separate tree libraries (react-arborist) | Simple recursive components | React 18 optimization (2022+) | Smaller bundle, less complexity, React.memo makes recursion fast |

**Deprecated/outdated:**
- **react-sortable-tree**: Unmaintained since 2020, doesn't support React 18
- **rc-tree**: Still maintained but uses legacy class components, poor TypeScript support
- **Object-based expansion state**: Hard to serialize, verbose toggle logic, replaced by Set

**Emerging patterns (2026):**
- **Headless tree libraries**: Provide state management only (logic), UI fully customizable. Good for design systems but overkill for single-use case.
- **Virtual tree with react-virtual**: Only needed for >1000 nodes. This project has ~100 max, premature optimization.

## Open Questions

Things that couldn't be fully resolved:

1. **Milestone data source: Where do milestones live?**
   - What we know: Phases come from ROADMAP.md, plans from PLAN.md files in `.planning/phases/`. STATE.md has currentPhase.
   - What's unclear: Milestone structure not defined in existing files. Need to parse from `.planning/milestones/` directory structure? Or single MILESTONES.md? Or infer from phase folders?
   - Recommendation: During planning, define milestone data schema. Likely need parser for milestone metadata (name, status, archived flag, currentPhase). Extend parsers.ts.

2. **Archived milestone criteria: What makes a milestone "archived"?**
   - What we know: CONTEXT.md says "Separate 'Archived' section at bottom" and "Dimmed/muted styling".
   - What's unclear: Automatic archival when all phases complete? Manual flag in metadata? Date-based?
   - Recommendation: Manual flag in milestone metadata (`archived: true`). Let user decide when to archive, don't assume completion = archived. Some milestones stay active for reference.

3. **Inline action button logic: Which buttons appear on which node types?**
   - What we know: CONTEXT.md says "Claude's Discretion - Which inline actions appear on which node types (plan, execute, discuss based on status/type)".
   - What's unclear: Exact mapping of status/type to available actions. E.g., does "pending" phase show "Plan Phase" button? Does "complete" plan show "Re-execute"?
   - Recommendation: Follow existing pattern in commands.ts `getCommandForNode()` function. Extend logic to milestones. Default: `pending` shows Plan, `in-progress` shows Execute/Next, `complete` shows nothing (dimmed).

4. **Pulse animation timing: How fast should in-progress pulse?**
   - What we know: CONTEXT.md says "In-progress status has subtle pulse animation to draw attention" and "Claude's Discretion - Exact animation timing for pulse effect".
   - What's unclear: Tailwind default is 2s, might be too slow for urgent feeling, too fast feels anxious.
   - Recommendation: Start with Tailwind default (`animate-pulse` = 2s cubic-bezier). User test and adjust if needed. Can configure via theme: `animation: { pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }`.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/components/gsd/GSDTreeView.tsx`, `GSDTreeNode.tsx`, `gsdStore.ts`, `tree-transforms.ts` - Current implementation patterns
- Existing codebase: `package.json` - Confirmed dependencies (React 18.3.1, Zustand 5.0.6, Framer Motion 12.0.0-alpha.1, Radix UI 1.x, Tailwind 4.1.8)
- CONTEXT.md: User decisions for Phase 9 - Visual design, interaction patterns, scope constraints

### Secondary (MEDIUM confidence)
- [React Arborist GitHub](https://github.com/brimdata/react-arborist) - VSCode-style tree reference, features comparison
- [MUI X Tree View](https://mui.com/x/react-tree-view/) - Expansion patterns, state management approach
- [7 Best React Tree View Components (2026)](https://reactscript.com/best-tree-view/) - Ecosystem overview, library comparison
- [Framer Motion AnimatePresence](https://www.framer.com/motion/component/) - Expand/collapse animation patterns
- [Building Tree View in React (DEV Community)](https://dev.to/tobidelly/building-a-simple-tree-view-component-in-react-1lln) - Recursive component pattern tutorial
- [CSS Pulse Animation (GeeksforGeeks)](https://www.geeksforgeeks.org/css/css-pulse-animation/) - Pulse animation techniques

### Tertiary (LOW confidence)
- [React Tree Performance (Medium article)](https://medium.com/@fiffty/things-i-learned-while-trying-to-make-a-fast-treeview-in-react-e3b23cd4ab74) - Performance pitfalls, marked for validation with real metrics
- [Tailwind Tree View (Preline)](https://preline.co/docs/tree-view.html) - Styling patterns, examples not verified in production
- [Radix UI Tree Request (GitHub Issue)](https://github.com/radix-ui/primitives/issues/1456) - Community discussion, no official implementation yet

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project dependencies, versions verified in package.json
- Architecture patterns: HIGH - Recursive tree, Set-based expansion, connector lines already implemented in codebase
- Common pitfalls: MEDIUM - Re-render issues and connector misalignment verified in sources, animation performance based on general React knowledge
- Code examples: HIGH - All examples from existing codebase or official docs, tested patterns
- Open questions: LOW - Milestone data source and action button logic need product decisions during planning

**Research date:** 2026-01-26
**Valid until:** ~30 days (stable React ecosystem, no major library changes expected)

**Notes:**
- Existing tree implementation is solid foundation - extend rather than replace
- Status indicator change (icons → dots) is only visual breaking change needed
- Milestone-level hierarchy is straightforward extension of existing transform pattern
- Performance is not a concern with small dataset (<1000 nodes, typically <100 visible)
