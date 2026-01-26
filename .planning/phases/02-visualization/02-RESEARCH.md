# Phase 2: Visualization - Research

**Researched:** 2026-01-24
**Domain:** Hierarchical tree view with expand/collapse, status indicators, and progress visualization in React
**Confidence:** HIGH

## Summary

Phase 2 requires building a hierarchical tree view that displays milestones → phases → plans with expand/collapse functionality, visual status indicators, and inline progress bars. The standard approach for this domain is to build a custom recursive tree component (avoiding external tree libraries) using controlled state management for expansion, CSS pseudo-elements for connector lines, and TailwindCSS utilities for styling.

The project already has Zustand for state management, lucide-react for icons, framer-motion for animations, and TailwindCSS for styling. The main gaps are: (1) hierarchical data structure transformation, (2) expand/collapse state management, (3) recursive tree rendering, and (4) PLAN.md parsing to extract completion status.

Research shows that for small-to-medium tree datasets (< 1000 nodes), custom recursive components outperform external libraries in bundle size and control. For this use case (3 milestones × ~5 phases × ~3 plans = ~45 nodes max), a custom solution is optimal.

**Primary recommendation:** Build a custom tree component with recursive rendering, store expand/collapse state in Zustand (not component state for persistence), use CSS border utilities for connector lines, and leverage existing lucide-react icons for status indicators. Avoid external tree libraries which add unnecessary complexity for small datasets.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| lucide-react | 0.468.0 | Status icons | Already in package.json, tree-shakeable, includes CircleCheck, Circle, Loader2 icons |
| framer-motion | 12.0.0 | Subtle animations | Already in package.json, used for flash highlights on updates |
| zustand | 5.0.6 | State management | Already in use, perfect for expand/collapse state persistence |
| TailwindCSS | 4.1.8 | Styling | Already in use, border utilities ideal for connector lines |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx | 2.1.1 | Conditional classes | Already installed, helps with dynamic status colors |
| Custom recursive component | - | Tree rendering | For datasets < 1000 nodes (this project has ~45 max) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom component | react-complex-tree | External lib adds 50KB+, overkill for 45 nodes, harder to style |
| Custom component | MUI Tree View | Requires @mui/x-tree-view dependency, opinionated styling conflicts with TailwindCSS |
| CSS borders | Treeflex library | Another dependency for simple border styling already achievable with Tailwind |
| Zustand state | Component useState | No persistence across reloads, harder to access from other components |

**Installation:**
```bash
# All dependencies already installed
# No additional packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   └── gsd/
│       ├── GSDPanel.tsx              # Main panel (already exists)
│       ├── GSDPanelContent.tsx       # Panel content (already exists)
│       ├── GSDTreeView.tsx           # NEW: Tree container component
│       ├── GSDTreeNode.tsx           # NEW: Recursive tree node
│       └── GSDProgressBar.tsx        # NEW: Inline progress bar component
├── stores/
│   └── gsdStore.ts                   # Expand state + parsed data (extend existing)
├── lib/
│   └── gsd/
│       ├── parsers.ts                # Add parsePlanMd function (extend existing)
│       └── tree-transforms.ts        # NEW: Transform data to tree structure
```

### Pattern 1: Hierarchical Data Transformation
**What:** Transform flat parsed data into nested tree structure with parent-child relationships
**When to use:** Before rendering tree, convert STATE.md + ROADMAP.md + PLAN.md files into unified hierarchy
**Example:**
```typescript
// Source: React tree data best practices + existing codebase
// src/lib/gsd/tree-transforms.ts

interface TreeNode {
  id: string;              // "milestone-1", "phase-1-2", "plan-1-2-3"
  type: 'milestone' | 'phase' | 'plan';
  label: string;
  status: 'pending' | 'in-progress' | 'complete';
  progress?: number;       // For phases/milestones
  children?: TreeNode[];
  metadata?: {
    goal?: string;
    description?: string;
    planNumber?: string;
  };
}

export function buildTreeData(
  roadmap: RoadmapData,
  phases: PhaseInfo[],
  plans: PlanInfo[]
): TreeNode[] {
  // Build milestone → phases → plans hierarchy
  const milestones: TreeNode[] = roadmap.milestones.map(milestone => ({
    id: `milestone-${milestone.number}`,
    type: 'milestone',
    label: milestone.name,
    status: calculateMilestoneStatus(milestone, phases),
    progress: calculateMilestoneProgress(milestone, phases, plans),
    children: phases
      .filter(phase => phase.milestone === milestone.number)
      .map(phase => ({
        id: `phase-${phase.number}`,
        type: 'phase',
        label: `Phase ${phase.number}: ${phase.name}`,
        status: phase.status,
        progress: calculatePhaseProgress(phase, plans),
        metadata: { goal: phase.goal },
        children: plans
          .filter(plan => plan.phaseNumber === phase.number)
          .map(plan => ({
            id: `plan-${plan.phaseNumber}-${plan.planNumber}`,
            type: 'plan',
            label: `Plan ${plan.planNumber}: ${plan.name}`,
            status: plan.status,
            metadata: {
              description: plan.description,
              planNumber: `${plan.phaseNumber}-${plan.planNumber}`
            }
          }))
      }))
  }));

  return milestones;
}
```

### Pattern 2: Expand/Collapse State Management
**What:** Store expand/collapse state in Zustand for persistence and cross-component access
**When to use:** When tree expand state should survive page reloads and be accessible from multiple components
**Example:**
```typescript
// Source: Zustand persist middleware docs + tree view state patterns
// Extend existing src/stores/gsdStore.ts

interface GSDState {
  // ... existing state

  // NEW: Expand/collapse state
  expandedNodes: Set<string>;        // Set of expanded node IDs

  // NEW: Actions
  toggleNode: (nodeId: string) => void;
  expandNode: (nodeId: string) => void;
  collapseNode: (nodeId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
}

// In store implementation
toggleNode: (nodeId) => set((state) => {
  const newExpanded = new Set(state.expandedNodes);
  if (newExpanded.has(nodeId)) {
    newExpanded.delete(nodeId);
  } else {
    newExpanded.add(nodeId);
  }
  return { expandedNodes: newExpanded };
}),

// Persist expand state
partialize: (state) => ({
  isPanelVisible: state.isPanelVisible,
  panelWidth: state.panelWidth,
  expandedNodes: Array.from(state.expandedNodes), // Convert Set to Array for JSON
}),
```

### Pattern 3: Recursive Tree Node Component
**What:** Self-referencing component that renders children by rendering itself
**When to use:** For hierarchical data with unknown depth levels
**Example:**
```typescript
// Source: React recursive component patterns + DEV Community tutorial
// src/components/gsd/GSDTreeNode.tsx

interface TreeNodeProps {
  node: TreeNode;
  depth: number;
  isExpanded: boolean;
  onToggle: (nodeId: string) => void;
}

export function GSDTreeNode({ node, depth, isExpanded, onToggle }: TreeNodeProps) {
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="relative">
      {/* Node content */}
      <div
        className={cn(
          "flex items-center gap-2 py-1.5 px-2 cursor-pointer rounded",
          "hover:bg-muted/50 transition-colors",
          depth > 0 && "ml-6"  // Indentation for nested levels
        )}
        onClick={() => hasChildren && onToggle(node.id)}
      >
        {/* Expand/collapse icon */}
        {hasChildren && (
          <ChevronRight
            className={cn(
              "w-4 h-4 transition-transform",
              isExpanded && "rotate-90"
            )}
          />
        )}

        {/* Status indicator */}
        <StatusIcon status={node.status} />

        {/* Label */}
        <span className="text-sm">{node.label}</span>

        {/* Progress (for phases/milestones) */}
        {node.progress !== undefined && (
          <GSDProgressBar progress={node.progress} />
        )}
      </div>

      {/* Recursive children */}
      {hasChildren && isExpanded && (
        <div className="relative">
          {node.children.map((child) => (
            <GSDTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              isExpanded={expandedNodes.has(child.id)}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Pattern 4: CSS Connector Lines with Pseudo-Elements
**What:** Use CSS borders and pseudo-elements to draw tree connector lines
**When to use:** For visual hierarchy without external SVG libraries
**Example:**
```typescript
// Source: CSS Tree Views tutorial + TailwindCSS border utilities
// In GSDTreeNode.tsx with TailwindCSS classes

<div className="relative pl-6">
  {/* Vertical connector line */}
  <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />

  {/* Horizontal connector to node */}
  <div className="absolute left-2 top-3 w-4 h-px bg-border" />

  {/* Node content */}
  <div className="relative z-10">
    {/* ... node content ... */}
  </div>
</div>

// Alternative: Using before/after pseudo-elements
// In CSS module or global styles
.tree-node {
  position: relative;
  padding-left: 24px;
}

.tree-node::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--border);
}

.tree-node::after {
  content: '';
  position: absolute;
  left: 0;
  top: 12px;
  width: 16px;
  height: 1px;
  background: var(--border);
}
```

### Pattern 5: Status Indicators with lucide-react
**What:** Use appropriate icons from lucide-react for each status state
**When to use:** For consistent, accessible status visualization
**Example:**
```typescript
// Source: lucide-react documentation + accessibility best practices
// In GSDTreeNode.tsx or separate StatusIcon component

import { Circle, CircleCheck, Loader2 } from 'lucide-react';

function StatusIcon({ status }: { status: 'pending' | 'in-progress' | 'complete' }) {
  switch (status) {
    case 'complete':
      return (
        <CircleCheck
          className="w-4 h-4 text-green-500"
          aria-label="Complete"
        />
      );
    case 'in-progress':
      return (
        <Loader2
          className="w-4 h-4 text-blue-500 animate-spin"
          aria-label="In progress"
        />
      );
    case 'pending':
      return (
        <Circle
          className="w-4 h-4 text-muted-foreground/50"
          aria-label="Pending"
        />
      );
  }
}
```

### Pattern 6: Inline Progress Bar
**What:** Simple progress bar showing fraction and percentage inline
**When to use:** For phase and milestone progress visualization
**Example:**
```typescript
// Source: Flowbite React progress + Material UI progress patterns
// src/components/gsd/GSDProgressBar.tsx

interface ProgressBarProps {
  completed: number;
  total: number;
}

export function GSDProgressBar({ completed, total }: ProgressBarProps) {
  const percentage = Math.round((completed / total) * 100);

  return (
    <div className="flex items-center gap-2 ml-auto">
      {/* Fraction */}
      <span className="text-xs text-muted-foreground">
        {completed}/{total}
      </span>

      {/* Percentage */}
      <span className="text-xs font-medium text-primary">
        ({percentage}%)
      </span>

      {/* Optional: Visual bar (if space permits) */}
      <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
```

### Pattern 7: Subtle Flash Animation on Update
**What:** Flash highlight when tree data updates using framer-motion
**When to use:** To draw user attention to changed content
**Example:**
```typescript
// Source: Framer Motion animation docs + existing GSDPanelContent.tsx pattern
// In GSDTreeView.tsx

import { motion, AnimatePresence } from 'framer-motion';

export function GSDTreeView({ treeData }: { treeData: TreeNode[] }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={treeData.length} // Re-animate when data changes
        initial={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
        animate={{ backgroundColor: 'rgba(0, 0, 0, 0)' }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {treeData.map(node => (
          <GSDTreeNode key={node.id} node={node} depth={0} />
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
```

### Anti-Patterns to Avoid

- **Using array index as key:** Use stable node IDs (`milestone-1`, `phase-1-2`) instead of array indices to prevent re-render issues when tree changes
- **Expand state in component useState:** Store in Zustand for persistence and cross-component access
- **Deep nesting without flattening:** Pre-calculate depth during data transformation to avoid runtime recursion overhead
- **Re-calculating progress on every render:** Memoize progress calculations or compute during data transformation
- **External tree library for small datasets:** 45 max nodes doesn't justify 50KB+ dependency
- **Animated expand/collapse:** User specified instant toggle, animations cause layout jank
- **Context API for expand state:** Zustand is already in use and avoids Context re-render issues

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Status icons | Custom SVG icons | lucide-react (CircleCheck, Circle, Loader2) | Already installed, tree-shakeable, accessible, consistent design |
| Progress percentage calc | Manual math in render | Pre-calculate in data transform | Avoid recalculation on every render, easier to test |
| Conditional class names | String concatenation | clsx/cn utility | Already installed, handles null/undefined safely |
| Flash animation | Custom CSS keyframes | framer-motion | Already in use, easier API, better performance |
| Tree state persistence | Manual localStorage | Zustand persist middleware | Already in use, handles serialization, hydration |

**Key insight:** This phase builds on Phase 1's foundation. The existing Zustand store, lucide-react icons, framer-motion, and TailwindCSS provide all necessary tools. Don't add new dependencies when existing stack covers 100% of requirements.

## Common Pitfalls

### Pitfall 1: Using Array Index as React Key
**What goes wrong:** Tree nodes re-render incorrectly when data changes, losing expand state and causing performance issues
**Why it happens:** Array indices change when items are reordered or filtered, breaking React's reconciliation
**How to avoid:** Use stable, unique IDs composed from node type and number (e.g., `phase-1-2`, `plan-1-2-3`)
**Warning signs:** Tree collapses unexpectedly, nodes flash/re-mount on updates, expand state resets

**Example:**
```typescript
// BAD: Using index as key
{nodes.map((node, index) => (
  <TreeNode key={index} node={node} />
))}

// GOOD: Using stable ID
{nodes.map((node) => (
  <TreeNode key={node.id} node={node} />
))}
```

### Pitfall 2: Infinite Recursion in Tree Rendering
**What goes wrong:** Component renders infinitely, browser crashes with "Maximum call stack exceeded"
**Why it happens:** Circular references in tree data or missing base case in recursive component
**How to avoid:** Always check `hasChildren` before recursing, add max depth guard, validate data structure has no cycles
**Warning signs:** Browser freezes on tree render, stack overflow errors, high CPU usage

**Example:**
```typescript
// BAD: No base case check
function TreeNode({ node }) {
  return (
    <div>
      {node.label}
      {node.children.map(child => <TreeNode node={child} />)} {/* Always recurses */}
    </div>
  );
}

// GOOD: Conditional recursion with safety check
function TreeNode({ node, depth = 0 }) {
  const hasChildren = node.children && node.children.length > 0;
  const MAX_DEPTH = 10;

  if (depth > MAX_DEPTH) {
    console.error('Max tree depth exceeded');
    return null;
  }

  return (
    <div>
      {node.label}
      {hasChildren && node.children.map(child => (
        <TreeNode key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}
```

### Pitfall 3: Expand State as Set Serialization
**What goes wrong:** Zustand persist fails to save expand state because Set is not JSON-serializable
**Why it happens:** Set objects don't have a JSON representation, persist middleware silently drops them
**How to avoid:** Convert Set to Array in `partialize`, convert Array to Set in `onRehydrateStorage`
**Warning signs:** Expand state doesn't persist across reloads, console warnings about serialization

**Example:**
```typescript
// BAD: Persisting Set directly
partialize: (state) => ({
  expandedNodes: state.expandedNodes, // Set not JSON-serializable
}),

// GOOD: Convert Set to Array for persistence
partialize: (state) => ({
  expandedNodes: Array.from(state.expandedNodes),
}),

// In store initialization
onRehydrateStorage: () => (state) => {
  if (state && Array.isArray(state.expandedNodes)) {
    state.expandedNodes = new Set(state.expandedNodes);
  }
},
```

### Pitfall 4: Re-calculating Progress on Every Render
**What goes wrong:** Performance degrades as tree size grows, CPU usage spikes on updates
**Why it happens:** Progress calculations run inside component render for every node on every render
**How to avoid:** Calculate progress once during data transformation, store in node data structure
**Warning signs:** Slow tree rendering, high CPU on expand/collapse, laggy UI

**Example:**
```typescript
// BAD: Calculating in render
function TreeNode({ node, plans }) {
  const progress = plans.filter(p => p.phase === node.id && p.status === 'complete').length; // Runs on every render
  return <div>{node.label} ({progress}%)</div>;
}

// GOOD: Pre-calculated during data transformation
function buildTreeData(phases, plans) {
  return phases.map(phase => ({
    ...phase,
    progress: calculatePhaseProgress(phase, plans), // Calculated once
  }));
}

function TreeNode({ node }) {
  return <div>{node.label} ({node.progress}%)</div>; // Just reads pre-calculated value
}
```

### Pitfall 5: Deep Component Tree Re-renders
**What goes wrong:** Entire tree re-renders when single node expands, causing lag
**Why it happens:** Parent component re-renders trigger all children to re-render
**How to avoid:** Use React.memo on TreeNode component, memoize callbacks, avoid creating new objects in render
**Warning signs:** Lag when expanding nodes, all nodes flicker on single node expand

**Example:**
```typescript
// BAD: Creating new callback on every render
function TreeView() {
  const { expandedNodes, toggleNode } = useGSDStore();

  return (
    <div>
      {nodes.map(node => (
        <TreeNode
          node={node}
          onToggle={() => toggleNode(node.id)} // New function every render
        />
      ))}
    </div>
  );
}

// GOOD: Memoized component with stable props
const TreeNode = React.memo(({ node, isExpanded, onToggle }) => {
  // Component only re-renders when props actually change
  return <div onClick={() => onToggle(node.id)}>{node.label}</div>;
});

function TreeView() {
  const { expandedNodes, toggleNode } = useGSDStore();

  return (
    <div>
      {nodes.map(node => (
        <TreeNode
          key={node.id}
          node={node}
          isExpanded={expandedNodes.has(node.id)}
          onToggle={toggleNode} // Stable reference from Zustand
        />
      ))}
    </div>
  );
}
```

### Pitfall 6: Missing Accessibility Attributes
**What goes wrong:** Screen readers can't navigate tree, keyboard navigation doesn't work
**Why it happens:** Developers forget ARIA attributes and keyboard event handlers
**How to avoid:** Add role="tree", role="treeitem", aria-expanded, aria-label, keyboard handlers
**Warning signs:** Screen reader announces as generic div, can't navigate with keyboard, accessibility audit fails

## Code Examples

Verified patterns from official sources:

### Complete Tree Node with All Patterns
```typescript
// Source: Combines patterns from React docs, accessibility guidelines, and existing codebase
// src/components/gsd/GSDTreeNode.tsx

import React from 'react';
import { ChevronRight, Circle, CircleCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TreeNode } from '@/lib/gsd/tree-transforms';

interface TreeNodeProps {
  node: TreeNode;
  depth: number;
}

export const GSDTreeNode = React.memo(({ node, depth }: TreeNodeProps) => {
  const { expandedNodes, toggleNode } = useGSDStore();
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children && node.children.length > 0;

  // Status icon component
  const StatusIcon = () => {
    switch (node.status) {
      case 'complete':
        return <CircleCheck className="w-4 h-4 text-green-500 flex-shrink-0" />;
      case 'in-progress':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />;
      case 'pending':
        return <Circle className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />;
    }
  };

  return (
    <div
      role="treeitem"
      aria-expanded={hasChildren ? isExpanded : undefined}
      className="relative"
    >
      {/* Connector lines (skip for depth 0) */}
      {depth > 0 && (
        <>
          {/* Vertical line */}
          <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
          {/* Horizontal line */}
          <div className="absolute left-2 top-3 w-4 h-px bg-border" />
        </>
      )}

      {/* Node content */}
      <div
        className={cn(
          "flex items-center gap-2 py-1.5 px-2 rounded relative z-10",
          "hover:bg-muted/50 transition-colors",
          hasChildren && "cursor-pointer",
          depth > 0 && "ml-6"
        )}
        onClick={() => hasChildren && toggleNode(node.id)}
        onKeyDown={(e) => {
          if (hasChildren && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            toggleNode(node.id);
          }
        }}
        tabIndex={0}
      >
        {/* Expand/collapse chevron */}
        {hasChildren && (
          <ChevronRight
            className={cn(
              "w-4 h-4 transition-transform flex-shrink-0",
              isExpanded && "rotate-90"
            )}
          />
        )}
        {!hasChildren && <div className="w-4" />} {/* Spacer for alignment */}

        {/* Status icon */}
        <StatusIcon />

        {/* Label */}
        <span className={cn(
          "text-sm flex-1",
          node.status === 'complete' && "text-muted-foreground"
        )}>
          {node.label}
        </span>

        {/* Progress (phases/milestones only) */}
        {node.progress !== undefined && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">
              {node.progress.completed}/{node.progress.total}
            </span>
            <span className="text-primary font-medium">
              ({Math.round((node.progress.completed / node.progress.total) * 100)}%)
            </span>
          </div>
        )}
      </div>

      {/* Recursive children */}
      {hasChildren && isExpanded && (
        <div role="group">
          {node.children.map((child) => (
            <GSDTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
});

GSDTreeNode.displayName = 'GSDTreeNode';
```

### Data Transformation with Progress Calculation
```typescript
// Source: React performance patterns + tree data structures
// src/lib/gsd/tree-transforms.ts

import type { PhaseInfo } from '@/stores/gsdStore';

export interface PlanInfo {
  phaseNumber: number;
  planNumber: number;
  name: string;
  status: 'pending' | 'in-progress' | 'complete';
  description?: string;
}

export interface TreeNode {
  id: string;
  type: 'phase' | 'plan';
  label: string;
  status: 'pending' | 'in-progress' | 'complete';
  progress?: {
    completed: number;
    total: number;
  };
  metadata?: {
    goal?: string;
    description?: string;
  };
  children?: TreeNode[];
}

function calculatePhaseProgress(
  phaseNumber: number,
  plans: PlanInfo[]
): { completed: number; total: number } {
  const phasePlans = plans.filter(p => p.phaseNumber === phaseNumber);
  const completed = phasePlans.filter(p => p.status === 'complete').length;
  return { completed, total: phasePlans.length };
}

export function buildTreeData(
  phases: PhaseInfo[],
  plans: PlanInfo[]
): TreeNode[] {
  return phases.map(phase => ({
    id: `phase-${phase.number}`,
    type: 'phase' as const,
    label: `Phase ${phase.number}: ${phase.name}`,
    status: phase.status,
    progress: calculatePhaseProgress(phase.number, plans),
    metadata: { goal: phase.goal },
    children: plans
      .filter(plan => plan.phaseNumber === phase.number)
      .map(plan => ({
        id: `plan-${plan.phaseNumber}-${plan.planNumber}`,
        type: 'plan' as const,
        label: `Plan ${plan.planNumber}`,
        status: plan.status,
        metadata: { description: plan.description }
      }))
  }));
}
```

### PLAN.md Parser for Completion Status
```typescript
// Source: Existing parsers.ts pattern + PLAN.md frontmatter format
// Add to src/lib/gsd/parsers.ts

export interface PlanInfo {
  phaseNumber: number;
  planNumber: number;
  status: 'pending' | 'in-progress' | 'complete';
  name: string;
}

export function parsePlanMd(content: string): PlanInfo | null {
  try {
    // Extract YAML frontmatter between --- markers
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return null;

    const frontmatter = frontmatterMatch[1];

    // Parse phase and plan numbers
    const phaseMatch = frontmatter.match(/phase:\s*(\d+)/);
    const planMatch = frontmatter.match(/plan:\s*(\d+)/);

    if (!phaseMatch || !planMatch) return null;

    const phaseNumber = parseInt(phaseMatch[1]);
    const planNumber = parseInt(planMatch[1]);

    // Extract plan name from objective section
    const objectiveMatch = content.match(/<objective>\s*(.*?)\n/);
    const name = objectiveMatch?.[1] || `Plan ${planNumber}`;

    // Determine status from success_criteria or verification section
    // For now, default to 'pending' - status will be determined by file existence and completion markers
    const status = 'pending'; // TODO: Parse from SUMMARY.md or execution status

    return {
      phaseNumber,
      planNumber,
      status,
      name
    };
  } catch (error) {
    console.error('Failed to parse PLAN.md:', error);
    return null;
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| External tree libraries | Custom recursive components | 2024-2025 | Smaller bundles, better control for small datasets |
| Component useState for expand | Zustand/Jotai global state | 2025-2026 | Persistence, cross-component access, better performance |
| CSS-in-JS for styling | TailwindCSS utilities | 2023+ | Better DX, smaller runtime, easier maintenance |
| Complex animation libraries | Framer Motion | 2024+ | Declarative API, better performance, smaller bundle |
| Manual icon SVGs | Icon libraries (lucide-react) | 2023+ | Consistency, tree-shaking, accessibility |

**Deprecated/outdated:**
- **react-treebeard (2018):** Unmaintained, use custom component or react-arborist
- **rc-tree:** Large bundle, opinionated styling, better to build custom for simple cases
- **styled-components for tree styling:** TailwindCSS utilities more performant
- **Context API for tree state:** Zustand avoids re-render issues, better DX

## Open Questions

Things that couldn't be fully resolved:

1. **Plan Status Determination**
   - What we know: PLAN.md has frontmatter with phase/plan numbers, SUMMARY.md might contain status
   - What's unclear: Authoritative source for plan completion status (SUMMARY.md? Execution logs?)
   - Recommendation: Check for SUMMARY.md existence as "complete" indicator, parse PLAN.md for metadata

2. **Milestone Data Source**
   - What we know: ROADMAP.md has phases, STATE.md has current position
   - What's unclear: Where milestone grouping is defined (if at all)
   - Recommendation: If no milestone concept exists in current files, Phase 2 might just be phases → plans (2-level tree)

3. **Default Expand State**
   - What we know: User wants "current phase expanded, others collapsed"
   - What's unclear: How to determine "current" from tree data vs STATE.md current phase
   - Recommendation: Initialize expandedNodes with `phase-${currentPhase}` from STATE.md on first load

4. **Tree Update Flash Scope**
   - What we know: Flash highlight on update, framer-motion available
   - What's unclear: Flash entire tree or only changed nodes
   - Recommendation: Flash only the changed section (current phase node) using AnimatePresence with node key

## Sources

### Primary (HIGH confidence)
- [React Tree View - MUI X](https://mui.com/x/react-tree-view/) - Tree component patterns and accessibility
- [Building a Simple Tree View Component in React](https://dev.to/tobidelly/building-a-simple-tree-view-component-in-react-1lln) - Recursive rendering tutorial
- [react-accessible-treeview](https://www.npmjs.com/package/react-accessible-treeview) - ARIA accessibility patterns
- [Lucide React Icons](https://lucide.dev/guide/packages/lucide-react) - Icon component usage
- [Framer Motion Animation Docs](https://motion.dev/docs/react-animation) - Animation patterns
- [TailwindCSS Tree View - Preline](https://preline.co/docs/tree-view.html) - Connector line patterns
- Existing codebase: src/stores/gsdStore.ts, src/components/gsd/GSDPanelContent.tsx

### Secondary (MEDIUM confidence)
- [GitHub Projects Hierarchy View](https://github.blog/changelog/2026-01-15-hierarchy-view-now-available-in-github-projects/) - Recent PM tool patterns (Jan 2026)
- [State Management in 2026](https://www.nucamp.co/blog/state-management-in-2026-redux-context-api-and-modern-patterns) - Modern state patterns
- [React Performance Anti-Patterns](https://dev.to/myogeshchavan97/react-performance-anti-patterns-5-mistakes-that-kill-your-apps-speed-76j) - Performance pitfalls
- [Tree Data in React Tables](https://www.simple-table.com/blog/react-tree-data-hierarchical-tables) - Hierarchical data patterns
- [React Components Rendering Performance](https://www.uxpin.com/studio/blog/react-components-rendering-performance/) - Optimization strategies

### Tertiary (LOW confidence)
- WebSearch results for "tree view connector lines CSS" - General CSS patterns, needs project-specific adaptation
- WebSearch results for "React tree view performance" - General guidance, not verified for this stack

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified in package.json, no new dependencies needed
- Architecture: HIGH - Patterns match existing codebase (Zustand, lucide-react, framer-motion, TailwindCSS)
- Pitfalls: HIGH - Recursive rendering, Set serialization, and performance issues verified in multiple sources
- Data transformation: MEDIUM - Need to verify actual PLAN.md format and milestone concept

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (30 days - stable React ecosystem)
