# Architecture Research: v1.1 UI Enhancements

**Researched:** 2026-01-25
**Confidence:** HIGH (based on codebase analysis)

## Executive Summary

The v1.1 UI enhancements integrate cleanly with the existing three-pane architecture. The main structural change is adding an icon sidebar to the left pane that switches between Commands view (existing) and State view (new). The right pane changes from a single view to a tabbed file viewer. Command forms require schema-driven generation from an enhanced registry.

Key architectural decisions:
1. **Icon sidebar state:** Zustand store (extend `gsdStore`) for persistence
2. **Frontmatter parsing:** Simple regex-based approach (already proven in `parsers.ts`)
3. **Tab management:** Reuse existing custom Tabs component (`ui/tabs.tsx`)
4. **Command schemas:** Extend `GSDCommandDefinition` with field schema for dynamic forms

---

## Integration Points

### Existing Component -> New Feature Connection

| Existing Component | New Integration | Impact |
|--------------------|-----------------|--------|
| `GSDPanel.tsx` | Add icon sidebar before `ThreePane` | Wrapper layout change |
| `GSDCommandPanel.tsx` | Becomes one view option in left pane | Component unchanged, conditional rendering |
| `GSDPanelContent.tsx` | Evolves to tabbed file viewer | Major refactor |
| `gsdStore.ts` | Add sidebar state, active view, tabs | Store extension |
| `command-registry.ts` | Add field schemas for form generation | Type extension |
| `parsers.ts` | Add MILESTONES.md parser | New function |
| `useGSDData.ts` | Parse milestones, provide to state tree | Hook extension |

### Data Flow Changes

**Current Flow:**
```
projectPath -> useGSDData -> parsers -> gsdStore -> GSDPanel children
                                                         |
                                       GSDCommandPanel   |   GSDPanelContent
                                            |                    |
                                       Commands tree         Tree view
```

**New Flow:**
```
projectPath -> useGSDData -> parsers (extended) -> gsdStore (extended)
                    |                                    |
                    v                                    v
              MILESTONES.md                     IconSidebar state
              PLAN files                        Active left view
              STATE.md                          File viewer tabs
                    |                                    |
                    v                                    v
              LeftPane (conditional)            RightPane (tabbed)
                    |                                    |
          +--------+--------+                   +-------+-------+
          |                 |                   |               |
     Commands          StateTree           FileViewer      FileViewer
     (existing)        (new)               Tab 1           Tab N
```

---

## New Components Needed

### Core Components

| Component | Purpose | Dependencies | Estimated Complexity |
|-----------|---------|--------------|---------------------|
| `IconSidebar.tsx` | Vertical icon bar switching left pane views | gsdStore, lucide-react | Low |
| `StateTreeView.tsx` | Tree showing milestones + current phases | gsdStore, GSDTreeNode | Medium |
| `MilestoneNode.tsx` | Tree node for milestone display | motion, lucide-react | Low |
| `FileViewerTabs.tsx` | Tabbed container for file viewing | ui/tabs, gsdStore | Medium |
| `FileViewerPane.tsx` | Single file renderer with frontmatter | markdown renderer | Medium |
| `FrontmatterDisplay.tsx` | Renders parsed frontmatter as key-value | Tailwind | Low |
| `CommandSchemaForm.tsx` | Dynamic form generator from schema | react-hook-form, zod | High |

### Extended Types/Schemas

| File | Addition | Purpose |
|------|----------|---------|
| `command-registry.ts` | `CommandFieldSchema` type | Define form field types/validation |
| `parsers.ts` | `parseMilestonesMd()` function | Parse MILESTONES.md structure |
| `parsers.ts` | `parseFrontmatter()` function | Generic frontmatter extraction |
| `gsdStore.ts` | `sidebarView`, `fileViewerTabs` state | UI state management |

---

## Detailed Architecture

### 1. Icon Sidebar State

**Recommendation:** Extend `gsdStore.ts` with persisted state.

```typescript
// Add to gsdStore.ts state
interface GSDState {
  // Existing...

  // NEW: Icon sidebar
  sidebarActiveView: 'commands' | 'state';
  setSidebarView: (view: 'commands' | 'state') => void;

  // NEW: File viewer tabs
  fileViewerTabs: FileTab[];
  activeFileTabId: string | null;
  addFileTab: (file: PlanningFile) => void;
  removeFileTab: (tabId: string) => void;
  setActiveFileTab: (tabId: string) => void;
}

interface FileTab {
  id: string;
  filename: string;
  filepath: string;
  type: 'state' | 'roadmap' | 'plan' | 'milestone' | 'decision';
  content?: string;
}
```

**Why Zustand:** Persists user preference (Commands vs State view), integrates with existing store pattern, avoids prop drilling.

**Alternative considered:** Local React state in `GSDPanel`. Rejected because view preference should persist across sessions.

### 2. Frontmatter Parsing

**Recommendation:** Extend existing regex-based approach in `parsers.ts`.

The codebase already parses frontmatter without external libraries in `parsePlanMd()`:

```typescript
// Existing pattern (parsers.ts:171-174)
const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
```

**New function:**

```typescript
export interface Frontmatter {
  [key: string]: string | number | boolean | string[];
}

export function parseFrontmatter(content: string): {
  frontmatter: Frontmatter | null;
  body: string;
} {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)/);
  if (!match) {
    return { frontmatter: null, body: content };
  }

  const yamlBlock = match[1];
  const body = match[2] || '';
  const frontmatter: Frontmatter = {};

  // Simple YAML parsing (key: value per line)
  for (const line of yamlBlock.split('\n')) {
    const keyValue = line.match(/^(\w+):\s*(.*)$/);
    if (keyValue) {
      const [, key, value] = keyValue;
      frontmatter[key] = inferType(value.trim());
    }
  }

  return { frontmatter, body };
}

function inferType(value: string): string | number | boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^\d+$/.test(value)) return parseInt(value, 10);
  if (/^\d+\.\d+$/.test(value)) return parseFloat(value);
  return value;
}
```

**Why not gray-matter:** Already have working regex approach, avoiding new dependency, sufficient for YAML-like frontmatter.

### 3. Tab Management for File Viewer

**Recommendation:** Reuse existing custom `Tabs` component pattern.

The codebase has a working Tabs implementation in `ui/tabs.tsx` with:
- Context-based value management
- Controlled component pattern
- Accessible ARIA attributes

**File viewer tab structure:**

```typescript
// In FileViewerTabs.tsx
<Tabs value={activeFileTabId} onValueChange={setActiveFileTab}>
  <TabsList className="flex-shrink-0 border-b">
    {fileViewerTabs.map(tab => (
      <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
        <FileTypeIcon type={tab.type} />
        <span>{tab.filename}</span>
        <CloseButton onClick={() => removeFileTab(tab.id)} />
      </TabsTrigger>
    ))}
  </TabsList>
  {fileViewerTabs.map(tab => (
    <TabsContent key={tab.id} value={tab.id}>
      <FileViewerPane file={tab} />
    </TabsContent>
  ))}
</Tabs>
```

**Tab state in Zustand:** Allows persistence and cross-component access (tree node click opens tab).

### 4. Command Schema Definition and Form Generation

**Recommendation:** Extend `GSDCommandDefinition` with Zod-compatible field schemas.

**Current parameter definition (simple):**
```typescript
interface CommandParameter {
  name: string;
  type: 'string' | 'number';
  label: string;
  required: boolean;
  defaultValue?: string | number;
}
```

**Enhanced schema (supports all 27 commands):**

```typescript
// Extended command-registry.ts
import { z } from 'zod';

export type FieldType =
  | 'text'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'textarea'
  | 'phase-select'  // Special: populated from current phases
  | 'plan-select';  // Special: populated from phase plans

export interface CommandFieldSchema {
  name: string;
  type: FieldType;
  label: string;
  description?: string;
  required: boolean;
  defaultValue?: unknown;

  // For select/multiselect
  options?: { value: string; label: string }[];
  dynamicOptions?: 'phases' | 'plans' | 'milestones';

  // Validation
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: unknown) => boolean | string;
  };

  // Dependencies
  showWhen?: {
    field: string;
    equals: unknown;
  };
}

export interface GSDCommandDefinition {
  id: string;
  fullCommand: string;
  label: string;
  description: string;
  category: CommandCategory;
  icon: LucideIcon;

  // Replace simple parameters with schema
  fields: CommandFieldSchema[];

  // Keep existing eligibility function
  isActive: (state: StateContext) => boolean;

  // NEW: Command-specific hints
  hints?: string[];

  // NEW: For multi-phase or custom execution
  executor?: 'terminal' | 'orchestrator' | 'modal';
}
```

**Form generation strategy:**

```typescript
// CommandSchemaForm.tsx
function CommandSchemaForm({ command }: { command: GSDCommandDefinition }) {
  const { phases, plans } = useGSDStore();

  const getDynamicOptions = (field: CommandFieldSchema) => {
    if (field.dynamicOptions === 'phases') {
      return phases.map(p => ({ value: String(p.number), label: p.name }));
    }
    if (field.dynamicOptions === 'plans') {
      return plans.map(p => ({ value: String(p.planNumber), label: p.name }));
    }
    return field.options || [];
  };

  return (
    <form onSubmit={handleSubmit}>
      {command.fields.map(field => (
        <FormField key={field.name} field={field} options={getDynamicOptions(field)} />
      ))}
    </form>
  );
}
```

**Existing dependencies support this:**
- `react-hook-form` (in package.json)
- `zod` (in package.json)
- `@hookform/resolvers` (in package.json)

---

## Component Layout Structure

### New Left Pane Structure

```
+------------------+------------------------+
| IconSidebar (48px)|  Left Pane Content     |
|                   |                        |
| [Commands icon]   |  (Switches based on    |
| [State icon]      |   sidebarActiveView)   |
|                   |                        |
| --- spacer ---    |  Commands: existing    |
|                   |  GSDCommandPanel       |
| [Settings icon?]  |                        |
|                   |  State: new            |
|                   |  StateTreeView         |
+------------------+------------------------+
```

**IconSidebar implementation:**

```typescript
// IconSidebar.tsx
export function IconSidebar() {
  const { sidebarActiveView, setSidebarView } = useGSDStore();

  return (
    <div className="w-12 flex flex-col items-center py-2 border-r border-border bg-muted/30">
      <IconButton
        icon={Terminal}
        tooltip="Commands"
        active={sidebarActiveView === 'commands'}
        onClick={() => setSidebarView('commands')}
      />
      <IconButton
        icon={GitBranch}
        tooltip="State"
        active={sidebarActiveView === 'state'}
        onClick={() => setSidebarView('state')}
      />
      <div className="flex-1" />
      {/* Future: Settings, etc. */}
    </div>
  );
}
```

### New Right Pane Structure

```
+--------------------------------+
| File Tabs (closable)           |
| [STATE.md] [ROADMAP.md] [x]    |
+--------------------------------+
| Frontmatter (collapsible)      |
| phase: 01-foundation           |
| plan: 03                       |
+--------------------------------+
| Markdown Content               |
| (rendered with existing        |
|  markdown components)          |
|                                |
+--------------------------------+
```

---

## Suggested Build Order

Based on dependencies and integration points:

### Phase 1: Foundation (Icon Sidebar + Store Extensions)

1. **Extend gsdStore.ts** - Add sidebar state, file tab state
   - *Rationale:* All other components depend on this state
   - *Risk:* Low - additive change to existing store

2. **Create IconSidebar.tsx** - Simple icon bar component
   - *Rationale:* Minimal dependencies, enables view switching
   - *Dependencies:* gsdStore

3. **Update GSDPanel.tsx** - Integrate icon sidebar with three-pane
   - *Rationale:* Layout wrapper needs sidebar before content
   - *Dependencies:* IconSidebar, gsdStore

### Phase 2: State Tree View

4. **Create StateTreeView.tsx** - Milestone/phase tree
   - *Rationale:* Core new feature for state visualization
   - *Dependencies:* gsdStore, existing GSDTreeNode patterns

5. **Add parseMilestonesMd to parsers.ts** - Parse MILESTONES.md
   - *Rationale:* StateTreeView needs milestone data
   - *Dependencies:* None

6. **Extend useGSDData hook** - Include milestones
   - *Rationale:* Hook orchestrates all parsing
   - *Dependencies:* parseMilestonesMd

### Phase 3: File Viewer Tabs

7. **Create FileViewerTabs.tsx** - Tab container
   - *Rationale:* Wrapper for file viewing
   - *Dependencies:* ui/tabs, gsdStore

8. **Create FileViewerPane.tsx** - Single file renderer
   - *Rationale:* Actual file content display
   - *Dependencies:* parseFrontmatter

9. **Add parseFrontmatter to parsers.ts** - Generic frontmatter parsing
   - *Rationale:* FileViewerPane needs parsed frontmatter
   - *Dependencies:* None

10. **Create FrontmatterDisplay.tsx** - Frontmatter key-value UI
    - *Rationale:* Displays parsed frontmatter
    - *Dependencies:* None

### Phase 4: Command Schema Forms

11. **Extend command-registry.ts** - Add field schemas
    - *Rationale:* Form generation needs schema definitions
    - *Dependencies:* None

12. **Create CommandSchemaForm.tsx** - Dynamic form generator
    - *Rationale:* Replaces simple GSDCommandDialog form
    - *Dependencies:* command-registry, react-hook-form, zod

13. **Update GSDCommandDialog.tsx** - Use schema form
    - *Rationale:* Integration point
    - *Dependencies:* CommandSchemaForm

### Phase 5: Polish & Integration

14. **Tree node -> file tab integration** - Click plan opens in viewer
    - *Rationale:* UX connection between tree and viewer
    - *Dependencies:* StateTreeView, FileViewerTabs, gsdStore

15. **Keyboard navigation** - Tab switching shortcuts
    - *Rationale:* Power user UX
    - *Dependencies:* FileViewerTabs

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Store hydration timing with new state | Medium | Medium | Use partialize pattern (already in gsdStore), ensure hasHydrated check covers new state |
| Three-pane layout with nested icon bar | Low | Low | Icon bar is outside ThreePane, simple flex layout |
| File viewer performance with large files | Low | Medium | Virtualize long markdown content if needed |
| Command schema migration (27 commands) | Medium | Medium | Migrate incrementally, keep isActive pattern unchanged |
| Type safety across form generation | Medium | Medium | Use Zod schemas, test each field type |

---

## Non-Functional Considerations

### Performance
- File viewer should lazy-load content (only when tab active)
- Frontmatter parsing is O(n) on lines, negligible for typical sizes
- Tree expansion state already optimized via Set

### Accessibility
- Icon sidebar needs aria-label on each button
- Tab list needs keyboard navigation (existing TabsList has this)
- Form fields need labels (react-hook-form pattern)

### Persistence
- Sidebar view preference: Persist in localStorage via Zustand
- Open file tabs: Consider persistence (optional, could be session-only)
- Command form state: No persistence needed (transient)

---

## Open Questions for Phase Implementation

1. **Archived milestones display:** Should archived milestones be collapsible or in a separate section?
2. **File tab limit:** Should there be a max tabs limit (like existing 20-tab limit for main tabs)?
3. **Command categories expansion:** The milestone mentions 7 categories but current registry has 3. What are the additional 4?
4. **Settings icon in sidebar:** Is settings a third sidebar view, or just a shortcut to the settings tab?

---

## Sources

- Codebase analysis: `src/stores/gsdStore.ts`, `src/lib/gsd/parsers.ts`, `src/lib/gsd/command-registry.ts`
- Existing patterns: `src/contexts/TabContext.tsx`, `src/components/ui/tabs.tsx`, `src/components/ui/three-pane.tsx`
- UI components: `src/components/gsd/GSDPanel.tsx`, `src/components/gsd/GSDCommandPanel.tsx`, `src/components/gsd/GSDPanelContent.tsx`
- Package dependencies: `react-hook-form`, `zod`, `@hookform/resolvers` (already in package.json)
