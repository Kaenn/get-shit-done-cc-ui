# Phase 7: Icon Sidebar - Research

**Researched:** 2026-01-25
**Domain:** Vertical icon navigation (VSCode-style activity bar)
**Confidence:** HIGH

## Summary

Phase 7 implements a VSCode-style vertical icon sidebar (activity bar) for switching between Commands and State views. The research confirms this is a straightforward implementation using Radix UI Toggle Group (already recommended in project research) combined with existing UI patterns from the codebase. The sidebar adds a 48px fixed-width vertical bar on the left edge of the left pane, using single-selection toggle behavior with icon-only buttons.

The existing stack provides all necessary tools: `@radix-ui/react-toggle-group` (already planned for v1.1), `@radix-ui/react-tooltip` (already in dependencies), and `lucide-react` (already used across 76+ files). The implementation extends existing patterns from `gsdStore.ts` for state management and follows the established z-index scale (sidebar: 10, dropdowns: 50, dialogs: 100) to avoid stacking context conflicts.

The critical design decision is matching VSCode's visual language: 2px left border in accent color for active state, 60-70% opacity for inactive icons, subtle hover background, and instant transitions (no animation). Tooltips use the existing Radix Tooltip component with 300-500ms delay. The main integration point is extending the left pane in `GSDPanel.tsx` to include the sidebar as a fixed 48px column before the resizable content area.

**Primary recommendation:** Create a new `IconSidebar.tsx` component using Radix Toggle Group in vertical orientation, add `sidebarActiveView` state to gsdStore, and integrate as a flex container with the existing left pane content.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @radix-ui/react-toggle-group | ^1.1.11 | Single-selection icon navigation | Official Radix primitive for mutually-exclusive buttons, built-in keyboard nav, ARIA compliance |
| @radix-ui/react-tooltip | ^1.1.5 | Icon hover tooltips | Already in project, WCAG 2.1 compliant, portal-based positioning |
| lucide-react | ^0.468.0 | Icon library | Already used in 76+ files, consistent with existing patterns |
| zustand | ^5.0.6 | State management | Already used for gsdStore, persist middleware for cross-session state |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| class-variance-authority | ^0.7.1 | Variant-based styling | Icon button state variants (active/inactive/hover) |
| tailwind-merge | ^2.6.0 | Conditional classes | Dynamic className composition for state-based styling |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Radix Toggle Group | Custom button group | Lose keyboard nav, ARIA support, roving tabindex |
| Radix Tooltip | Custom tooltip | Lose positioning logic, portal management, accessibility |
| Fixed 48px sidebar | Resizable sidebar | VSCode uses fixed width, adds unnecessary complexity |

**Installation:**
```bash
# Already in dependencies
# @radix-ui/react-toggle-group - add to package.json if missing
# All other dependencies already present
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── gsd/
│   │   ├── GSDIconSidebar.tsx      # New: icon navigation bar
│   │   ├── GSDPanel.tsx            # Modified: integrate sidebar
│   │   ├── GSDCommandPanel.tsx     # Existing: commands view
│   │   └── GSDStatePanel.tsx       # New: state tree view (Phase 8+)
│   └── ui/
│       ├── tooltip.tsx             # Existing: reuse
│       └── three-pane.tsx          # Existing: left pane integration
├── stores/
│   └── gsdStore.ts                 # Modified: add sidebarActiveView
└── lib/
    └── utils.ts                     # Existing: cn() for classNames
```

### Pattern 1: Fixed Sidebar with Toggle Group
**What:** 48px vertical bar using Radix Toggle Group with `orientation="vertical"` and `type="single"`
**When to use:** Icon-only navigation with mutually-exclusive selection
**Example:**
```typescript
// Source: Radix UI Toggle Group docs + project CONTEXT.md
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { Terminal, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGSDStore } from "@/stores/gsdStore";

export function GSDIconSidebar() {
  const { sidebarActiveView, setSidebarActiveView } = useGSDStore();

  return (
    <div className="w-12 h-full flex flex-col bg-background border-r border-border">
      <ToggleGroup.Root
        type="single"
        value={sidebarActiveView}
        onValueChange={(value) => value && setSidebarActiveView(value)}
        orientation="vertical"
        className="flex flex-col gap-0 p-0"
      >
        <ToggleGroup.Item
          value="commands"
          aria-label="Commands"
          className={cn(
            "w-12 h-12 flex items-center justify-center",
            "rounded-md transition-colors",
            "data-[state=on]:border-l-2 data-[state=on]:border-primary",
            "data-[state=off]:opacity-60",
            "hover:bg-muted/50"
          )}
        >
          <Terminal className="w-6 h-6" />
        </ToggleGroup.Item>

        <ToggleGroup.Item
          value="state"
          aria-label="State"
          className={cn(
            "w-12 h-12 flex items-center justify-center",
            "rounded-md transition-colors",
            "data-[state=on]:border-l-2 data-[state=on]:border-primary",
            "data-[state=off]:opacity-60",
            "hover:bg-muted/50"
          )}
        >
          <Database className="w-6 h-6" />
        </ToggleGroup.Item>
      </ToggleGroup.Root>
    </div>
  );
}
```

### Pattern 2: Tooltip Integration with Delay
**What:** Radix Tooltip wrapping each toggle item with 300-500ms delay
**When to use:** Icon-only buttons requiring hover hints
**Example:**
```typescript
// Source: Radix UI Tooltip docs + research findings
import * as Tooltip from "@radix-ui/react-tooltip";

// Wrap app in provider (in main.tsx or App.tsx)
<Tooltip.Provider delayDuration={400}>
  <App />
</Tooltip.Provider>

// Per-icon tooltip
<Tooltip.Root>
  <Tooltip.Trigger asChild>
    <ToggleGroup.Item value="commands" aria-label="Commands">
      <Terminal className="w-6 h-6" />
    </ToggleGroup.Item>
  </Tooltip.Trigger>
  <Tooltip.Content side="right" sideOffset={8}>
    Commands
  </Tooltip.Content>
</Tooltip.Root>
```

### Pattern 3: State Management Extension
**What:** Add sidebar view state to existing gsdStore with persistence
**When to use:** When extending existing Zustand store for new UI state
**Example:**
```typescript
// Source: Existing gsdStore.ts pattern
interface GSDState {
  // Add to existing interface
  sidebarActiveView: 'commands' | 'state';

  // Add action
  setSidebarActiveView: (view: 'commands' | 'state') => void;
}

const gsdStore: StateCreator<GSDState> = (set) => ({
  // Add initial state
  sidebarActiveView: 'commands',

  // Add action
  setSidebarActiveView: (view) => set({ sidebarActiveView: view }),
});

// Add to persist partialize
persist(gsdStore, {
  partialize: (state) => ({
    // ... existing
    sidebarActiveView: state.sidebarActiveView,
  }),
})
```

### Pattern 4: Left Pane Integration
**What:** Modify left pane to flex container with fixed sidebar + resizable content
**When to use:** Adding fixed navigation to existing resizable pane
**Example:**
```typescript
// Source: Existing GSDPanel.tsx + ThreePane.tsx pattern
// In GSDPanel.tsx left prop:
left={
  <div className="flex h-full">
    <GSDIconSidebar />
    {sidebarActiveView === 'commands' ? (
      <GSDCommandPanel />
    ) : (
      <GSDStatePanel />
    )}
  </div>
}
```

### Anti-Patterns to Avoid
- **Don't animate state transitions:** CONTEXT.md explicitly requires instant transitions, no CSS transitions on active indicator or view changes
- **Don't use separate z-index for sidebar:** Sidebar is part of left pane flow, not a separate stacking context
- **Don't make icons smaller than 24px:** Accessibility requires minimum touch target, 24px icons in 48px buttons provides adequate padding
- **Don't skip aria-label:** Icon-only buttons require text labels for screen readers

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toggle button group | Custom radio buttons with state | Radix Toggle Group | Built-in keyboard nav (Arrow keys, Home, End), roving tabindex, ARIA roles |
| Tooltip positioning | Manual absolute positioning logic | Radix Tooltip Portal | Handles viewport collision, portal rendering, auto-positioning |
| Hover delay timers | setTimeout/clearTimeout management | Radix Tooltip delayDuration | Handles rapid hover/unhover, shared delay across tooltips |
| Icon library | Custom SVG components | Lucide React (already in project) | 1000+ icons, tree-shakeable, consistent sizing |
| State persistence | localStorage with JSON.parse/stringify | Zustand persist middleware | Type-safe, handles hydration, rehydration callbacks |

**Key insight:** VSCode-style sidebars look simple but keyboard navigation (roving tabindex, arrow key movement, Home/End jumps) is complex to implement correctly. Radix Toggle Group handles all edge cases.

## Common Pitfalls

### Pitfall 1: Z-Index Stacking Context Collision
**What goes wrong:** Adding a fixed sidebar creates a new stacking context that conflicts with Radix portals (tooltips, dialogs, dropdowns)
**Why it happens:** `position: fixed` with `z-index` creates a stacking context, child elements can't escape it to layer properly
**How to avoid:**
- Don't use `position: fixed` on sidebar (it's within the left pane flow)
- Use existing z-index scale: sidebar = 10 (if needed), dropdown = 50, dialog = 100
- Tooltip portals already use z-50, no conflict if sidebar stays in flow
**Warning signs:** Tooltips appearing behind sidebar, dropdowns clipped by sidebar container
**Prevention:**
```typescript
// WRONG: Creates stacking context
<div className="fixed left-0 top-0 h-full w-12 z-10">

// RIGHT: Part of normal flex flow
<div className="w-12 h-full flex flex-col">
```

### Pitfall 2: Tooltip Provider Missing
**What goes wrong:** Tooltips don't render or appear instantly without delay
**Why it happens:** Radix Tooltip requires Provider wrapper, delayDuration only works at Provider level
**How to avoid:** Wrap app (or at minimum the sidebar) in `TooltipProvider` with `delayDuration={400}`
**Warning signs:** Console warning "Tooltip.Trigger must be used within TooltipProvider"
**Prevention:**
```typescript
// In App.tsx or main component
import { TooltipProvider } from "@/components/ui/tooltip";

<TooltipProvider delayDuration={400}>
  {/* Rest of app */}
</TooltipProvider>
```

### Pitfall 3: Toggle Group Value Deselection
**What goes wrong:** User clicks active icon, both icons become inactive, panel disappears
**Why it happens:** Radix Toggle Group allows deselection by default, clicking active item sets value to empty string
**How to avoid:** Check if new value is empty in onValueChange, prevent state update if so
**Warning signs:** Both icons inactive simultaneously, left pane content disappears
**Prevention:**
```typescript
// WRONG: Allows empty selection
<ToggleGroup.Root
  value={sidebarActiveView}
  onValueChange={setSidebarActiveView}
>

// RIGHT: Prevents deselection
<ToggleGroup.Root
  value={sidebarActiveView}
  onValueChange={(value) => value && setSidebarActiveView(value)}
>
```

### Pitfall 4: Opacity Animation Despite Requirement
**What goes wrong:** Icons fade in/out when switching states, violating CONTEXT.md "instant" requirement
**Why it happens:** Tailwind's transition-opacity is added by default or via CVA variants
**How to avoid:** Explicitly avoid transition classes on opacity, only transition background colors
**Warning signs:** Icons fade on hover or state change
**Prevention:**
```typescript
// WRONG: Transitions opacity
className="opacity-60 transition-all"

// RIGHT: Opacity instant, only bg transitions
className="opacity-60 transition-colors"
```

### Pitfall 5: Icon Size Accessibility Violation
**What goes wrong:** Icons too small, hard to click, fails WCAG touch target guidelines
**Why it happens:** 48px container with 24px icon sounds like 24px clickable area (too small)
**How to avoid:** Entire 48x48px button is clickable, icon is just visual (24px is sufficient for visibility)
**Warning signs:** Difficulty clicking icons, especially on touch screens
**Prevention:**
```typescript
// RIGHT: Full button is clickable (48x48), icon is visual (24x24)
<ToggleGroup.Item className="w-12 h-12 flex items-center justify-center">
  <Terminal className="w-6 h-6" /> {/* 24px icon */}
</ToggleGroup.Item>
```

## Code Examples

Verified patterns from official sources:

### Complete Icon Sidebar Component
```typescript
// Source: Radix Toggle Group + Tooltip docs, project patterns
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Terminal, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGSDStore } from "@/stores/gsdStore";

export function GSDIconSidebar() {
  const { sidebarActiveView, setSidebarActiveView } = useGSDStore();

  const views = [
    { value: 'commands', icon: Terminal, label: 'Commands' },
    { value: 'state', icon: Database, label: 'State' },
  ] as const;

  return (
    <div className="w-12 h-full flex flex-col bg-background border-r border-border">
      <ToggleGroup.Root
        type="single"
        value={sidebarActiveView}
        onValueChange={(value) => value && setSidebarActiveView(value as 'commands' | 'state')}
        orientation="vertical"
        className="flex flex-col gap-0 p-0"
      >
        {views.map(({ value, icon: Icon, label }) => (
          <Tooltip key={value}>
            <TooltipTrigger asChild>
              <ToggleGroup.Item
                value={value}
                aria-label={label}
                className={cn(
                  // Base styles
                  "w-12 h-12 flex items-center justify-center",
                  "rounded-md transition-colors",
                  // Active state: 2px left border, full opacity
                  "data-[state=on]:border-l-2 data-[state=on]:border-primary",
                  // Inactive state: 60% opacity
                  "data-[state=off]:opacity-60",
                  // Hover: subtle background
                  "hover:bg-muted/50"
                )}
              >
                <Icon className="w-6 h-6" />
              </ToggleGroup.Item>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {label}
            </TooltipContent>
          </Tooltip>
        ))}
      </ToggleGroup.Root>
    </div>
  );
}
```

### GSDStore Extension
```typescript
// Source: Existing gsdStore.ts pattern
// Add to interface
interface GSDState {
  // ... existing properties
  sidebarActiveView: 'commands' | 'state';
  setSidebarActiveView: (view: 'commands' | 'state') => void;
}

// Add to store creation
const gsdStore: StateCreator<GSDState> = (set) => ({
  // ... existing state
  sidebarActiveView: 'commands',

  // ... existing actions
  setSidebarActiveView: (view) => set({ sidebarActiveView: view }),
});

// Add to persist config
persist(gsdStore, {
  partialize: (state) => ({
    // ... existing persisted state
    sidebarActiveView: state.sidebarActiveView,
  }),
})
```

### GSDPanel Integration
```typescript
// Source: Existing GSDPanel.tsx pattern
export function GSDPanel({ children }: GSDPanelProps) {
  const {
    sidebarActiveView,
    isCommandPanelVisible,
    commandPanelWidth,
    // ... other state
  } = useGSDStore();

  // Render left pane with sidebar + content
  const leftPane = (
    <div className="flex h-full">
      <GSDIconSidebar />
      <div className="flex-1 overflow-hidden">
        {sidebarActiveView === 'commands' ? (
          <GSDCommandPanel />
        ) : (
          <GSDStatePanel /> // Phase 8+
        )}
      </div>
    </div>
  );

  return (
    <ThreePane
      left={leftPane}
      center={children}
      // ... rest of props
    />
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Text labels in sidebar | Icon-only with tooltips | VSCode 1.0 (2015) | 48px vs 200px+ width, more screen space |
| Horizontal tabs | Vertical activity bar | VSCode 1.0 (2015) | Scalable to 10+ views, no horizontal limit |
| Always-visible labels | Hover tooltips with delay | Material Design 3 (2021) | Cleaner UI, progressive disclosure |
| Custom button groups | Radix Toggle Group | Radix v1.0 (2022) | Built-in a11y, keyboard nav, ARIA |
| Manual tooltip positioning | Radix Portal-based tooltips | Radix v1.0 (2022) | Auto collision detection, viewport awareness |

**Deprecated/outdated:**
- **CSS-only tooltip hacks:** position: absolute with ::after pseudo-elements - replaced by Radix Portal system with proper positioning
- **Manual keyboard navigation:** Custom arrow key handlers - replaced by Radix roving tabindex
- **opacity: 0.5 for disabled:** Material Design 2 pattern - MD3 uses 0.38 for disabled, 0.6-0.7 for inactive (different states)

## Open Questions

Things that couldn't be fully resolved:

1. **Icon Choice for State View**
   - What we know: Lucide has Database, Layers, FolderTree, GitBranch icons as candidates
   - What's unclear: Which icon best represents "milestone > phase > plan" hierarchy
   - Recommendation: Use Database for MVP, validate with user feedback (easy to swap)

2. **Settings Icon Position**
   - What we know: Project has Settings, but CONTEXT.md only mentions Commands and State views
   - What's unclear: Is Settings a third sidebar view or just a button/dropdown?
   - Recommendation: Defer to Phase 10 (Commands), add as third view if needed

3. **Badge Indicators**
   - What we know: Project research mentions "badge indicators on sidebar icons (pending task count)"
   - What's unclear: Does Phase 7 include badges or just the sidebar structure?
   - Recommendation: Defer badges to Phase 5 (Polish), Phase 7 focuses on basic navigation

4. **Keyboard Shortcut Integration**
   - What we know: Research mentions Cmd+1/2 for view switching
   - What's unclear: Should Phase 7 implement shortcuts or just the clickable sidebar?
   - Recommendation: Implement Radix keyboard nav (arrows, Enter), defer global shortcuts to Phase 5

## Sources

### Primary (HIGH confidence)
- [Radix UI Toggle Group Documentation](https://www.radix-ui.com/primitives/docs/components/toggle-group) - Official API reference
- [Radix UI Tooltip Documentation](https://www.radix-ui.com/primitives/docs/components/tooltip) - delayDuration and Provider patterns
- Codebase analysis: `gsdStore.ts`, `GSDPanel.tsx`, `GSDCommandPanel.tsx`, `ui/button.tsx`, `ui/tooltip.tsx`
- Phase 7 CONTEXT.md - User decisions on styling, animation, and layout

### Secondary (MEDIUM confidence)
- [VSCode Activity Bar UX Guidelines](https://code.visualstudio.com/api/ux-guidelines/activity-bar) - Official Microsoft design patterns
- [NN/g: Left-Side Vertical Navigation](https://www.nngroup.com/articles/vertical-nav/) - Research-backed best practices
- [Josh Comeau: Z-Index Stacking Contexts](https://www.joshwcomeau.com/css/stacking-contexts/) - Stacking context formation rules
- [Button States Explained (2026)](https://www.designrush.com/best-designs/websites/trends/button-states) - Opacity and hover state patterns
- [Material Design: Interaction States](https://m2.material.io/design/interaction/states.html) - 40% opacity for disabled states

### Tertiary (LOW confidence)
- WebSearch results on vertical navigation patterns (multiple sources, cross-verified)
- Community discussions on icon-only navigation (general patterns, not library-specific)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in dependencies or planned, official docs verified
- Architecture: HIGH - Based on existing codebase patterns (gsdStore, GSDPanel, ThreePane)
- Pitfalls: HIGH - Radix GitHub issues with reproduction steps, z-index research from authoritative sources
- Code examples: HIGH - Derived from official Radix docs + existing project patterns

**Research date:** 2026-01-25
**Valid until:** 2026-02-25 (30 days - stable UI patterns, no fast-moving dependencies)
