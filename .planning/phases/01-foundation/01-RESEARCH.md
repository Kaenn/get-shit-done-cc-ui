# Phase 1: Foundation - Research

**Researched:** 2026-01-24
**Domain:** Resizable side panel with markdown parsing and file watching in Tauri + React
**Confidence:** HIGH

## Summary

Phase 1 requires building a resizable, collapsible side panel in a Tauri + React application that parses markdown files from `.planning/` directory and auto-refreshes on file changes. The project already has a working SplitPane component, react-markdown for rendering, and Zustand for state management. The main gaps are: (1) Tauri file watcher plugin integration, (2) markdown content parsing (not just rendering), and (3) panel state persistence.

The standard approach is to use the existing SplitPane component for layout, add Tauri's fs-watch plugin for file monitoring, parse markdown with gray-matter for frontmatter extraction and string manipulation for content sections, and persist panel state with Zustand's persist middleware to localStorage.

**Primary recommendation:** Leverage existing codebase patterns (SplitPane, Zustand stores, react-markdown) and add only the missing pieces (fs-watch plugin, gray-matter parser, persist middleware). Avoid rebuilding what already exists.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-markdown | 9.0.3 | Markdown rendering | Already in package.json, battle-tested, supports plugins |
| zustand | 5.0.6 | State management | Already in use (sessionStore, agentStore), lightweight |
| @tauri-apps/plugin-global-shortcut | 2.0.0 | Keyboard shortcuts | Already in package.json, cross-platform Cmd/Ctrl support |
| Existing SplitPane component | - | Resizable layout | Already implemented at src/components/ui/split-pane.tsx |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tauri-plugin-fs-watch | 2.x (git) | File system watching | For auto-refresh on .planning/ file changes |
| gray-matter | 4.0.3 | Frontmatter parsing | Extract metadata from STATE.md, ROADMAP.md, PLAN.md |
| zustand persist middleware | Built-in | State persistence | Save panel width/visibility to localStorage |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SplitPane (custom) | react-resizable-panels | Custom SplitPane already exists, well-tested, avoid dependency bloat |
| gray-matter | Manual regex parsing | gray-matter handles edge cases (YAML/JSON/TOML), 2.9M weekly downloads |
| Tauri fs-watch | Rust notify crate directly | fs-watch provides Tauri-specific integration, easier API |

**Installation:**
```bash
# Frontend (already installed)
pnpm add gray-matter

# Tauri backend (add to src-tauri/Cargo.toml)
[dependencies]
tauri-plugin-fs-watch = { git = "https://github.com/tauri-apps/plugins-workspace", branch = "v2" }
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── gsd/
│   │   ├── GSDPanel.tsx           # Main panel container
│   │   ├── GSDPanelContent.tsx    # Displays parsed data
│   │   └── GSDToggleButton.tsx    # Edge tab for collapsed state
│   ├── ui/
│   │   └── split-pane.tsx         # Existing resizable component
├── stores/
│   └── gsdStore.ts                # Panel state + parsed data
├── lib/
│   ├── gsd/
│   │   ├── parsers.ts             # STATE.md, ROADMAP.md parsers
│   │   └── watcher.ts             # File watcher setup
└── hooks/
    └── useGSDData.ts              # Hook to load/refresh data
```

### Pattern 1: Split Pane Layout with Integrated Panel
**What:** Use existing SplitPane component to create terminal (left) + GSD panel (right) layout
**When to use:** When adding side panel to existing terminal-centric UI
**Example:**
```typescript
// Source: Existing pattern from src/components/ui/split-pane.tsx
import { SplitPane } from '@/components/ui/split-pane';

function MainLayout() {
  const { panelWidth, setPanelWidth, isPanelVisible } = useGSDStore();

  return (
    <SplitPane
      left={<TerminalContent />}
      right={isPanelVisible ? <GSDPanel /> : null}
      initialSplit={panelWidth}
      minLeftWidth={400}
      minRightWidth={150}
      onSplitChange={setPanelWidth}
    />
  );
}
```

### Pattern 2: Zustand Store with Persist Middleware
**What:** Create GSD store with persist middleware to save panel state across sessions
**When to use:** When panel width/visibility needs to survive page reloads
**Example:**
```typescript
// Source: Zustand docs + existing sessionStore pattern
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GSDState {
  isPanelVisible: boolean;
  panelWidth: number;
  parsedData: {
    currentPhase: string | null;
    milestone: string | null;
  };
  togglePanel: () => void;
  setPanelWidth: (width: number) => void;
  updateParsedData: (data: Partial<GSDState['parsedData']>) => void;
}

export const useGSDStore = create<GSDState>()(
  persist(
    (set) => ({
      isPanelVisible: true,
      panelWidth: 75, // Initial percentage
      parsedData: { currentPhase: null, milestone: null },
      togglePanel: () => set((state) => ({ isPanelVisible: !state.isPanelVisible })),
      setPanelWidth: (width) => set({ panelWidth: width }),
      updateParsedData: (data) => set((state) => ({
        parsedData: { ...state.parsedData, ...data }
      })),
    }),
    {
      name: 'gsd-panel-storage',
      partialize: (state) => ({
        isPanelVisible: state.isPanelVisible,
        panelWidth: state.panelWidth
      }),
    }
  )
);
```

### Pattern 3: Tauri File Watcher Integration
**What:** Set up fs-watch plugin to monitor .planning/ directory and trigger React state updates
**When to use:** When files outside the app need to trigger UI updates
**Example:**
```typescript
// Source: Tauri fs-watch plugin docs
// Frontend (src/lib/gsd/watcher.ts)
import { watch } from '@tauri-apps/plugin-fs-watch';

export async function setupPlanningWatcher(
  projectPath: string,
  onUpdate: () => void
) {
  const planningDir = `${projectPath}/.planning`;

  const unwatch = await watch(
    planningDir,
    (event) => {
      if (event.kind === 'modify' || event.kind === 'create') {
        // User wants immediate updates, no debounce
        onUpdate();
      }
    },
    { recursive: true }
  );

  return unwatch; // Call this to stop watching
}

// Backend (src-tauri/src/main.rs)
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs_watch::init())
        // ... other plugins
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Pattern 4: Markdown Parsing with gray-matter
**What:** Extract structured data from markdown files using gray-matter for frontmatter and string methods for content
**When to use:** When markdown files have YAML frontmatter and specific content sections
**Example:**
```typescript
// Source: gray-matter npm docs
import matter from 'gray-matter';

interface ParsedState {
  currentPhase: string;
  currentPlan: string;
  progress: number;
}

export function parseStateMd(content: string): ParsedState {
  const { data, content: markdown } = matter(content);

  // Extract current position from markdown content
  const currentPositionMatch = markdown.match(/Phase: (\d+) of (\d+)/);
  const progressMatch = markdown.match(/Progress: \[.*\] (\d+)%/);

  return {
    currentPhase: currentPositionMatch?.[1] || 'Unknown',
    currentPlan: data.currentPlan || 'None',
    progress: progressMatch ? parseInt(progressMatch[1]) : 0,
  };
}

interface ParsedRoadmap {
  phases: Array<{
    number: number;
    name: string;
    goal: string;
    requirements: string[];
  }>;
}

export function parseRoadmapMd(content: string): ParsedRoadmap {
  // ROADMAP.md doesn't have frontmatter, parse content directly
  const phaseRegex = /###\s+Phase\s+(\d+):\s+(.+?)\n\*\*Goal\*\*:\s+(.+?)\n\*\*Requirements\*\*:\s+(.+?)(?=\n###|\n\n|$)/gs;
  const phases = [];

  let match;
  while ((match = phaseRegex.exec(content)) !== null) {
    phases.push({
      number: parseInt(match[1]),
      name: match[2],
      goal: match[3],
      requirements: match[4].split(',').map(r => r.trim()),
    });
  }

  return { phases };
}
```

### Pattern 5: Global Keyboard Shortcut (Cmd/Ctrl + B)
**What:** Register cross-platform keyboard shortcut to toggle panel visibility
**When to use:** When providing OS-level shortcut for panel toggle
**Example:**
```typescript
// Source: Tauri global-shortcut plugin docs (already installed)
// In main React component or dedicated hook
import { register } from '@tauri-apps/plugin-global-shortcut';
import { useEffect } from 'react';
import { useGSDStore } from '@/stores/gsdStore';

export function useGSDShortcuts() {
  const togglePanel = useGSDStore((state) => state.togglePanel);

  useEffect(() => {
    // CommandOrControl maps to Cmd on macOS, Ctrl on Windows/Linux
    const unregister = register('CommandOrControl+B', (event) => {
      if (event.state === 'Pressed') {
        togglePanel();
      }
    });

    return () => {
      unregister.then(fn => fn());
    };
  }, [togglePanel]);
}
```

### Anti-Patterns to Avoid

- **Re-parsing on every render:** Parse markdown only when file changes, not on component render
- **Blocking file reads in render:** Use async data loading in useEffect/hooks, not synchronous fs calls
- **Over-debouncing file watcher:** User wants immediate updates, don't add debounce delay
- **Rebuilding SplitPane:** Existing component is tested and works, use it instead of new library
- **Storing parsed data in component state:** Use Zustand store for global access and persistence

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Resizable divider | Custom mouse drag handler | Existing SplitPane component | Already handles edge cases (min/max constraints, keyboard nav, accessibility) |
| Markdown frontmatter | Regex extraction | gray-matter | Handles YAML/JSON/TOML, escaping, multi-line values, 2.9M weekly downloads |
| File watching | setInterval polling | Tauri fs-watch plugin | Native OS events, performant, handles renames/deletes properly |
| State persistence | Manual localStorage | Zustand persist middleware | Handles serialization, hydration, migration, SSR edge cases |
| Keyboard shortcuts | window.addEventListener('keydown') | @tauri-apps/plugin-global-shortcut | Already installed, cross-platform, handles modifier keys correctly |

**Key insight:** This codebase already has robust solutions for 80% of Phase 1 requirements. New code should integrate existing patterns rather than introduce new dependencies or custom solutions.

## Common Pitfalls

### Pitfall 1: File Watcher Memory Leaks
**What goes wrong:** Not unregistering file watcher when component unmounts causes memory leaks
**Why it happens:** File watchers create persistent OS-level handles that survive component lifecycle
**How to avoid:** Always return cleanup function from useEffect that calls the unwatch function
**Warning signs:** Increasing memory usage over time, multiple watchers registered for same path

**Example:**
```typescript
// BAD: No cleanup
useEffect(() => {
  setupPlanningWatcher(projectPath, handleUpdate);
}, [projectPath]);

// GOOD: Cleanup on unmount
useEffect(() => {
  let unwatch: (() => void) | null = null;

  setupPlanningWatcher(projectPath, handleUpdate).then(fn => {
    unwatch = fn;
  });

  return () => {
    unwatch?.();
  };
}, [projectPath]);
```

### Pitfall 2: Zustand Persist Hydration Timing
**What goes wrong:** Reading persisted state before hydration completes returns undefined/default values
**Why it happens:** localStorage is synchronous but Zustand persist is designed for async storage compatibility
**How to avoid:** Wait for hydration to complete or use hasHydrated state flag
**Warning signs:** Panel flashes to default state then corrects, width resets on first render

**Example:**
```typescript
// Add hydration check to store
export const useGSDStore = create<GSDState>()(
  persist(
    (set) => ({ /* state */ }),
    {
      name: 'gsd-panel-storage',
      onRehydrateStorage: () => (state) => {
        // Mark hydration complete
        state?.setHasHydrated(true);
      },
    }
  )
);

// Use in component
function GSDPanel() {
  const hasHydrated = useGSDStore((state) => state.hasHydrated);

  if (!hasHydrated) {
    return <div>Loading panel state...</div>;
  }

  return <PanelContent />;
}
```

### Pitfall 3: File Reading on Render Path
**What goes wrong:** Using Tauri fs.readTextFile() synchronously in render causes blocking/errors
**Why it happens:** Tauri APIs are async but developers try to use them like synchronous fs.readFileSync
**How to avoid:** Always use async/await in useEffect or data loading hooks, never in render
**Warning signs:** "Cannot read file" errors, frozen UI, TypeScript async/sync mismatch errors

**Example:**
```typescript
// BAD: Trying to read file synchronously
function GSDPanel() {
  const data = readTextFile('.planning/STATE.md'); // ERROR: async function in sync context
  return <div>{data}</div>;
}

// GOOD: Async loading in effect
function GSDPanel() {
  const [data, setData] = useState<string | null>(null);

  useEffect(() => {
    readTextFile('.planning/STATE.md').then(setData);
  }, []);

  if (!data) return <div>Loading...</div>;
  return <div>{data}</div>;
}
```

### Pitfall 4: Regex Parsing Complexity
**What goes wrong:** Custom regex for markdown parsing breaks on edge cases (escaped characters, nested lists, code blocks)
**Why it happens:** Markdown syntax is more complex than it appears, especially with GFM extensions
**How to avoid:** Use gray-matter for frontmatter, use simple string.split() for section extraction, avoid complex regex
**Warning signs:** Parser fails on valid markdown, incorrect data extraction, maintenance burden

### Pitfall 5: Over-Engineering Panel Collapse Animation
**What goes wrong:** Adding slide animations to panel toggle causes layout jank and performance issues
**Why it happens:** Animating width changes forces layout recalculation on every frame
**How to avoid:** User specified instant toggle (no animation), use display:none or conditional render
**Warning signs:** Laggy panel toggle, terminal content jumps during animation, high CPU during toggle

## Code Examples

Verified patterns from official sources:

### File Watcher Setup with Cleanup
```typescript
// Source: Tauri fs-watch plugin README + React hooks best practices
import { watch } from '@tauri-apps/plugin-fs-watch';
import { useEffect } from 'react';

export function useGSDFileWatcher(
  planningPath: string,
  onUpdate: () => void
) {
  useEffect(() => {
    let unwatch: (() => void) | null = null;

    watch(
      planningPath,
      (event) => {
        // Immediate updates, no debounce (per user requirement)
        if (event.kind === 'modify' || event.kind === 'create') {
          onUpdate();
        }
      },
      { recursive: true }
    ).then(unwatchFn => {
      unwatch = unwatchFn;
    }).catch(err => {
      console.error('Failed to setup file watcher:', err);
    });

    return () => {
      unwatch?.();
    };
  }, [planningPath, onUpdate]);
}
```

### Zustand Store with Persist
```typescript
// Source: Zustand persist middleware docs + existing sessionStore.ts pattern
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GSDState {
  // Persisted state
  isPanelVisible: boolean;
  panelWidth: number;

  // Runtime state (not persisted)
  parsedData: {
    currentPhase: string | null;
    milestone: string | null;
    progress: number;
  };
  hasHydrated: boolean;

  // Actions
  togglePanel: () => void;
  setPanelWidth: (width: number) => void;
  updateParsedData: (data: Partial<GSDState['parsedData']>) => void;
  setHasHydrated: (value: boolean) => void;
}

export const useGSDStore = create<GSDState>()(
  persist(
    (set) => ({
      isPanelVisible: true,
      panelWidth: 75,
      parsedData: { currentPhase: null, milestone: null, progress: 0 },
      hasHydrated: false,

      togglePanel: () => set((state) => ({
        isPanelVisible: !state.isPanelVisible
      })),

      setPanelWidth: (width: number) => set({ panelWidth: width }),

      updateParsedData: (data) => set((state) => ({
        parsedData: { ...state.parsedData, ...data }
      })),

      setHasHydrated: (value: boolean) => set({ hasHydrated: value }),
    }),
    {
      name: 'gsd-panel-storage',
      partialize: (state) => ({
        isPanelVisible: state.isPanelVisible,
        panelWidth: state.panelWidth,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
```

### Markdown Parsing Functions
```typescript
// Source: gray-matter npm package + manual parsing for structure
import matter from 'gray-matter';

export interface StateData {
  currentPhase: number;
  totalPhases: number;
  currentPlan: number;
  totalPlans: number;
  progress: number;
}

export function parseStateMd(content: string): StateData {
  const { content: markdown } = matter(content);

  // Parse "Phase: 1 of 3 (Foundation)"
  const phaseMatch = markdown.match(/Phase:\s*(\d+)\s+of\s+(\d+)/);

  // Parse "Plan: 0 of ?"
  const planMatch = markdown.match(/Plan:\s*(\d+)\s+of\s+(\d+|\?)/);

  // Parse "Progress: [░░░░░░░░░░] 0%"
  const progressMatch = markdown.match(/Progress:.*?(\d+)%/);

  return {
    currentPhase: phaseMatch ? parseInt(phaseMatch[1]) : 0,
    totalPhases: phaseMatch ? parseInt(phaseMatch[2]) : 0,
    currentPlan: planMatch ? parseInt(planMatch[1]) : 0,
    totalPlans: planMatch && planMatch[2] !== '?' ? parseInt(planMatch[2]) : 0,
    progress: progressMatch ? parseInt(progressMatch[1]) : 0,
  };
}

export interface PhaseInfo {
  number: number;
  name: string;
  goal: string;
}

export function parseRoadmapMd(content: string): PhaseInfo[] {
  const phaseRegex = /###\s+Phase\s+(\d+):\s+(.+?)\n\*\*Goal\*\*:\s+(.+?)(?=\n)/g;
  const phases: PhaseInfo[] = [];

  let match;
  while ((match = phaseRegex.exec(content)) !== null) {
    phases.push({
      number: parseInt(match[1]),
      name: match[2].trim(),
      goal: match[3].trim(),
    });
  }

  return phases;
}
```

### Flash Highlight Animation (Subtle)
```typescript
// Source: Framer Motion (already in package.json)
import { motion } from 'framer-motion';

function GSDPanelContent({ data }: { data: StateData }) {
  return (
    <motion.div
      key={data.currentPhase} // Re-mount on phase change
      initial={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
      animate={{ backgroundColor: 'rgba(0, 0, 0, 0)' }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="p-4"
    >
      <div>Phase {data.currentPhase}: {data.progress}%</div>
    </motion.div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Polling fs every 1s | Native file watcher events | Tauri 2.0 (2024) | Lower CPU, instant updates |
| react-resizable-panels | Custom SplitPane component | Already in codebase | Less bundle size, more control |
| remark pipeline | gray-matter + string parsing | Project setup | Faster parsing, simpler for structured markdown |
| Context API | Zustand with persist | Project setup | Better persistence, less boilerplate |

**Deprecated/outdated:**
- **Tauri v1 globalShortcut module:** Replaced by @tauri-apps/plugin-global-shortcut in v2
- **tauri-plugin-fs-watch on npm:** Use git version from plugins-workspace for Tauri 2
- **react-resizable (old library):** Modern alternatives like react-resizable-panels exist, but codebase has custom solution

## Open Questions

Things that couldn't be fully resolved:

1. **Project Path Resolution**
   - What we know: Tauri provides path APIs, existing code uses api.getHomeDirectory()
   - What's unclear: How to get current project's .planning/ directory path reliably
   - Recommendation: Check if Session/Project model includes project path, or use Tauri's app.appDataDir() + relative path

2. **Error State for Malformed Markdown**
   - What we know: User wants friendly error state if files malformed or missing
   - What's unclear: Exact error messages and recovery strategy
   - Recommendation: Try/catch around parsers, show "Unable to parse STATE.md - check format" with link to docs

3. **Flash Highlight Implementation**
   - What we know: Subtle flash on content change, framer-motion available
   - What's unclear: Exact element to highlight (whole panel vs specific changed field)
   - Recommendation: Highlight the changed content section only (phase number, progress bar), not entire panel

## Sources

### Primary (HIGH confidence)
- [Tauri v2 File System Plugin](https://v2.tauri.app/plugin/file-system/) - Official Tauri documentation
- [Tauri fs-watch Plugin README](https://github.com/tauri-apps/tauri-plugin-fs-watch/blob/dev/README.md) - Official plugin repository
- [Zustand Persist Middleware](https://zustand.docs.pmnd.rs/middlewares/persist) - Official Zustand documentation
- [gray-matter on npm](https://www.npmjs.com/package/gray-matter) - Official package documentation
- [Tauri Global Shortcut Plugin](https://v2.tauri.app/plugin/global-shortcut/) - Official Tauri plugin docs
- Existing codebase: src/components/ui/split-pane.tsx, src/stores/sessionStore.ts

### Secondary (MEDIUM confidence)
- [react-markdown documentation](https://remarkjs.github.io/react-markdown/) - Official react-markdown docs
- [react-hotkeys-hook](https://react-hotkeys-hook.vercel.app/) - Alternative keyboard shortcut library
- [LogRocket: React Panel Layouts](https://blog.logrocket.com/essential-tools-implementing-react-panel-layouts/) - Community guide
- [CSS-Tricks: Flexbox Guide](https://css-tricks.com/snippets/css/a-guide-to-flexbox/) - Reference for SplitPane understanding

### Tertiary (LOW confidence)
- WebSearch results for "common pitfalls file watcher performance" - General patterns, not Tauri-specific
- WebSearch results for "markdown parsing anti-patterns" - General guidance, needs project-specific validation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified in package.json or official docs
- Architecture: HIGH - Patterns match existing codebase (SplitPane, Zustand stores)
- Pitfalls: MEDIUM - File watcher pitfalls verified in docs, others from general React/TS experience

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (30 days - stable ecosystem, Tauri 2 mature)
