# Features Research: v1.1 UI Enhancements

**Domain:** Desktop application UI components for workflow visualization
**Researched:** 2026-01-25
**Milestone:** v1.1 Context Enhancement
**Confidence:** HIGH (based on official documentation and industry standards)

---

## Icon Sidebar (Activity Bar)

VSCode-style vertical icon bar for switching between Commands and State views.

### Table Stakes

| Feature | Description | Complexity | Dependency |
|---------|-------------|------------|------------|
| **Vertical icon strip** | Fixed-width bar (48-56px) on left edge with vertically stacked icons | LOW | None |
| **Icon-only display** | 24x24px icons, no text labels in collapsed state | LOW | Icon library (lucide-react) |
| **Single selection** | Only one view active at a time, clicking switches views | LOW | Panel state management |
| **Active state indicator** | Visual distinction for active icon (left border, background highlight, or both) | LOW | CSS |
| **Hover tooltips** | Icon name/description on hover since no visible labels | LOW | Existing tooltip component |
| **Consistent icon style** | All icons match visual style (stroke weight, size, fill vs outline) | LOW | Design system |
| **Keyboard navigation** | Arrow keys navigate between icons, Enter activates | MEDIUM | Focus management |
| **Toggle behavior** | Clicking active icon toggles sidebar visibility (hide/show) | LOW | Panel collapse state |

### Differentiators

| Feature | Description | Complexity | Value |
|---------|-------------|------------|-------|
| **Badge indicators** | Notification badges on icons (e.g., pending tasks count) | LOW | Status awareness without switching views |
| **Icon reordering** | Drag-drop to customize icon order | MEDIUM | Personalization |
| **Collapsible activity bar** | Hide entire bar for maximum terminal space | LOW | Screen real estate on small displays |
| **Secondary sidebar support** | Icons can open views in left or right sidebar | MEDIUM | Flexible layout (VSCode pattern) |
| **Context-aware icons** | Icons change based on project state (e.g., warning icon when blocked) | MEDIUM | Proactive status communication |
| **Keyboard shortcuts per view** | Cmd/Ctrl+1,2,3 to switch views directly | LOW | Power user efficiency |

### Anti-Features (Do Not Build)

| Feature | Reason |
|---------|--------|
| **Text labels on icons** | Wastes horizontal space, VSCode deliberately uses icon-only |
| **Multi-select views** | Creates UX confusion, keep single-view paradigm |
| **Animated icon transitions** | Distracting, slows interaction, not in VSCode |
| **Custom icon upload** | Over-engineering for v1.1, hard-coded icons sufficient |
| **Drag to external windows** | Desktop window management complexity, out of scope |

### Implementation Notes

- VSCode activity bar width: 48px with 24x24 icons
- Active indicator: 2px left border in accent color
- Icon spacing: 8-12px vertical gap
- Position: Leftmost element, before any sidebars
- Accessibility: Icons need `aria-label` since no visible text

**Sources:**
- [VSCode Activity Bar UX Guidelines](https://code.visualstudio.com/api/ux-guidelines/activity-bar)
- [VSCode UX Guidelines Overview](https://code.visualstudio.com/api/ux-guidelines/overview)

---

## Smart Command Forms

Command palette enhanced with parameter/flag input forms.

### Table Stakes

| Feature | Description | Complexity | Dependency |
|---------|-------------|------------|------------|
| **Command search** | Fuzzy search across command names and descriptions | LOW | Existing SlashCommandPicker |
| **Keyboard navigation** | Up/Down arrows, Enter to select, Escape to close | LOW | Existing implementation |
| **Parameter detection** | Parse command schema to identify required/optional params | MEDIUM | GSD command reference |
| **Inline parameter input** | Text fields for arguments (phase number, description, etc.) | MEDIUM | Form components |
| **Flag toggles** | Boolean switches for flags like `--gaps-only`, `--research` | LOW | Switch component |
| **Validation feedback** | Show errors for invalid inputs before execution | MEDIUM | Validation logic |
| **Clear defaults** | Pre-fill common values where applicable | LOW | Command schema |
| **Submit shortcut** | Cmd/Ctrl+Enter to execute command | LOW | Key binding |

### Differentiators

| Feature | Description | Complexity | Value |
|---------|-------------|------------|-------|
| **Progressive disclosure** | Show basic fields first, expand for advanced options/flags | MEDIUM | Reduces overwhelm for simple commands |
| **Argument suggestions** | Autocomplete for known values (phase numbers from STATE.md) | MEDIUM | Faster input, fewer errors |
| **Command preview** | Show full command string as user fills form | LOW | Transparency, learning tool |
| **Recently used commands** | Quick access to last 5-10 executed commands | LOW | Speed for repetitive workflows |
| **Parameter persistence** | Remember last-used values for each command | LOW | Workflow continuity |
| **Grouped by category** | Commands organized by GSD workflow stage | LOW | Better discoverability |
| **Interactive flag** | Indicate which commands are interactive vs automatic | LOW | Set user expectations |

### Anti-Features (Do Not Build)

| Feature | Reason |
|---------|--------|
| **Custom command creation UI** | GSD commands are defined in system prompts, not user-editable |
| **Command scripting/macros** | Complexity explosion, combos already handle chaining |
| **AI-powered command suggestions** | Adds latency, unclear value for known command set |
| **Voice input for parameters** | Accessibility feature but out of scope for v1.1 |
| **Multi-command forms** | One command at a time, use combos for sequences |

### Command Schema Reference

Based on GSD workflow reference, commands have these parameter patterns:

```
Required argument: /gsd:execute-phase <phase-number>
Optional argument: /gsd:verify-work [phase]
String argument:   /gsd:add-phase <description>
Enum argument:     /gsd:set-profile <quality|balanced|budget>
Multiple args:     /gsd:insert-phase <after> <description>

Flags:
  --gaps-only     Boolean, no value
  --research      Boolean, no value
  --skip-research Boolean, no value
  --gaps          Boolean, no value
  --skip-verify   Boolean, no value
```

### Form Field Types

| Arg Type | Input Component | Example |
|----------|-----------------|---------|
| `<phase-number>` | Number input with up/down | 1, 2, 3.1 |
| `[phase]` | Optional number, show placeholder | "Current phase" |
| `<description>` | Text input | "Add export feature" |
| `<profile>` | Select dropdown | quality, balanced, budget |
| `--flag` | Toggle switch | On/Off |

**Sources:**
- [react-cmdk](https://react-cmdk.com/) - Command palette patterns
- [React Aria Command Palette](https://react-spectrum.adobe.com/react-aria/examples/command-palette.html) - Accessible patterns
- [XState Command Palette](https://franknoirot.co/posts/xstate-command-palette.mdx/) - Parameter forms pattern

---

## State Tree (Full Project Hierarchy)

Tree view showing milestone > phase > plan hierarchy with status.

### Table Stakes

| Feature | Description | Complexity | Dependency |
|---------|-------------|------------|------------|
| **3-level hierarchy** | Milestone > Phase > Plan nesting | LOW | Existing 2-level extended |
| **Expand/collapse** | Chevron icons to show/hide children | LOW | Existing implementation |
| **Status indicators** | Visual badges: pending, in-progress, complete | LOW | Existing implementation |
| **Current phase highlight** | Visual distinction for active phase | LOW | STATE.md parsing |
| **Progress indicators** | Per-phase completion percentage | LOW | Existing implementation |
| **Click to view** | Click node to show details in right pane | LOW | Panel communication |
| **Keyboard navigation** | Arrow keys for tree traversal | MEDIUM | ARIA tree pattern |
| **Archived milestones** | Collapsible section for completed milestones | LOW | MILESTONES.md parsing |

### Differentiators

| Feature | Description | Complexity | Value |
|---------|-------------|------------|-------|
| **Inline actions** | "Next Up" buttons directly on nodes | LOW | Existing, extend to all levels |
| **Phase duration estimates** | Show time/complexity hints per phase | LOW | Metadata display |
| **Plan file preview** | Hover to see plan summary | MEDIUM | Tooltip with content |
| **Blocked indicator** | Visual flag when phase has blockers | LOW | CONTEXT.md parsing |
| **Quick navigation** | Cmd+Click to jump to file in viewer | LOW | Cross-component coordination |
| **Filter by status** | Show only pending/in-progress items | LOW | Filter UI |
| **Search within tree** | Find phases/plans by name | LOW | Local search |

### Anti-Features (Do Not Build)

| Feature | Reason |
|---------|--------|
| **Drag-drop reordering** | GSD phases have fixed order, not user-rearrangeable |
| **Inline editing** | Read-only view; Claude Code manages .planning files |
| **Multi-select** | No batch operations needed on tree items |
| **Virtual scrolling** | Overkill for <100 nodes typical in GSD projects |
| **Tree minimap** | Over-engineered for shallow hierarchies |
| **Node icons by type** | All nodes are same type (workflow state), icons add noise |

### Tree Node Structure

```
v1.1 (Milestone)
  Phase 1: Foundation [complete] [2/2]
    01-01-CONTEXT.md
    01-01-PLAN.md
    01-01-SUMMARY.md
  Phase 2: Visualization [in-progress] [1/3]
    02-01-CONTEXT.md [viewed]
    02-01-PLAN.md [current]
    02-01-SUMMARY.md [pending]
  Phase 3: Interactivity [pending] [0/4]
    ...

Archived
  v1.0 MVP (collapsed by default)
```

### Accessibility Requirements

- `role="tree"` on container
- `role="treeitem"` on each node
- `aria-expanded` for collapsible nodes
- `aria-selected` for current selection
- `aria-level` for nesting depth
- Focus visible on navigation

**Sources:**
- [W3C WAI Tree View Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/) - Accessibility requirements
- [GitHub Primer Tree View](https://primer.style/components/tree-view/) - Design patterns
- [Status Indicator UX Best Practices](https://www.koruux.com/blog/ux-best-practices-designing-status-indicators/) - Visual design

---

## Markdown Viewer (State File Viewer)

Right pane viewer for .planning markdown files with frontmatter.

### Table Stakes

| Feature | Description | Complexity | Dependency |
|---------|-------------|------------|------------|
| **Markdown rendering** | Headers, lists, code blocks, links, emphasis | LOW | react-markdown or similar |
| **YAML frontmatter parsing** | Extract and display metadata separately | LOW | gray-matter library |
| **Frontmatter display** | Structured metadata view (key-value pairs) | LOW | UI component |
| **Syntax highlighting** | Code blocks with language-aware highlighting | LOW | rehype-highlight/prism |
| **File path display** | Show which file is being viewed | LOW | Header UI |
| **Scroll position memory** | Remember scroll position per file | LOW | Local state |
| **Auto-refresh** | Update when file changes on disk | LOW | Polling/file watch |
| **Copy code blocks** | Button to copy code snippets | LOW | Clipboard API |

### Differentiators

| Feature | Description | Complexity | Value |
|---------|-------------|------------|-------|
| **Tabbed viewing** | Multiple files open in tabs | MEDIUM | Compare files, context switching |
| **Status-aware styling** | Different header color based on phase status | LOW | Visual context |
| **Mermaid diagram rendering** | Render flowcharts from markdown | MEDIUM | GSD uses Mermaid in docs |
| **Collapsible sections** | Fold long sections for overview | LOW | Content navigation |
| **Search within file** | Cmd+F to find text in current file | LOW | Standard expectation |
| **Link following** | Click internal links to navigate to referenced files | MEDIUM | .planning file cross-references |
| **Quick actions** | Buttons to run commands mentioned in file | HIGH | Context-aware automation |
| **Diff view** | Compare current vs previous version | HIGH | Change tracking |

### Anti-Features (Do Not Build)

| Feature | Reason |
|---------|--------|
| **Edit mode** | Read-only viewer; Claude Code manages files |
| **Export to PDF** | Out of scope for workflow tool |
| **Comments/annotations** | No collaboration features in v1 |
| **Version history browser** | Git integration is separate concern |
| **Split view** | Complexity for limited value in v1.1 |
| **Custom themes** | Use system theme, no per-file styling |

### Frontmatter Schema (GSD Files)

```yaml
# Typical PLAN.md frontmatter
---
phase: 2
plan: 1
title: "Implement tree view component"
status: in-progress
created: 2026-01-25
wave: 1
depends_on: ["01-01-PLAN.md"]
---
```

Display as structured header:
```
Phase 2 / Plan 1              [in-progress]
"Implement tree view component"
Created: Jan 25, 2026
Wave 1 | Depends on: Phase 1 Plan 1
```

### Markdown Feature Support

| Feature | Support | Notes |
|---------|---------|-------|
| Headers (h1-h6) | YES | Styled with hierarchy |
| Bold/Italic | YES | Standard emphasis |
| Lists (ul/ol) | YES | Nested supported |
| Code blocks | YES | With syntax highlighting |
| Inline code | YES | Monospace styling |
| Links | YES | Open in default browser |
| Images | LIMITED | Local paths only, no external |
| Tables | YES | GSD uses tables in docs |
| Blockquotes | YES | Callout styling |
| Horizontal rules | YES | Section separators |
| Mermaid | OPTIONAL | Flowcharts for GSD diagrams |
| Math/LaTeX | NO | Not used in GSD |
| HTML | NO | Security risk, pure markdown only |

**Sources:**
- [react-markdown](https://github.com/remarkjs/react-markdown) - Markdown rendering
- [remark-frontmatter](https://github.com/remarkjs/remark-frontmatter) - YAML parsing
- [Strapi Markdown Guide](https://strapi.io/blog/react-markdown-complete-guide-security-styling) - Security best practices

---

## Cross-Cutting Concerns

### Keyboard Navigation Strategy

Following [Microsoft Keyboard UI Guidelines](https://learn.microsoft.com/en-us/previous-versions/windows/desktop/dnacc/guidelines-for-keyboard-user-interface-design):

| Shortcut | Action | Component |
|----------|--------|-----------|
| `Cmd/Ctrl+1` | Switch to Commands view | Activity Bar |
| `Cmd/Ctrl+2` | Switch to State view | Activity Bar |
| `Cmd/Ctrl+K` | Open command palette | Command Forms |
| `Cmd/Ctrl+B` | Toggle sidebar | Activity Bar |
| `F6` | Cycle between panes | Global |
| `Arrow Up/Down` | Navigate list/tree | All lists |
| `Enter` | Select/activate | All lists |
| `Escape` | Close overlay/cancel | Modals, forms |
| `Space` | Toggle expand/collapse | Tree View |

### Focus Management

- Tab moves between major regions (activity bar, sidebar, terminal, viewer)
- Arrow keys move within regions
- F6 cycles between panes (VSCode pattern)
- Focus trap in modals/overlays

### Accessibility Checklist

- [ ] All icons have `aria-label`
- [ ] Tree follows WAI-ARIA treeview pattern
- [ ] Color not sole status indicator (icons + color)
- [ ] Focus visible on all interactive elements
- [ ] Keyboard operable without mouse
- [ ] Screen reader tested (VoiceOver/NVDA)

---

## Feature Prioritization

| Feature | Category | Priority | Complexity | Notes |
|---------|----------|----------|------------|-------|
| Icon sidebar structure | Activity Bar | P1 | LOW | Foundation for view switching |
| Active state indicator | Activity Bar | P1 | LOW | Essential feedback |
| Toggle sidebar | Activity Bar | P1 | LOW | Space management |
| Command search | Forms | P1 | LOW | Already exists |
| Parameter inputs | Forms | P1 | MEDIUM | Core v1.1 feature |
| Flag toggles | Forms | P1 | LOW | Simple extension |
| 3-level tree | Tree | P1 | LOW | Extend existing |
| Status indicators | Tree | P1 | LOW | Already exists |
| Markdown rendering | Viewer | P1 | LOW | Standard library |
| Frontmatter display | Viewer | P1 | LOW | gray-matter parsing |
| Syntax highlighting | Viewer | P1 | LOW | rehype plugin |
| Keyboard shortcuts | Global | P2 | MEDIUM | Polish feature |
| Badge indicators | Activity Bar | P2 | LOW | Nice-to-have |
| Argument suggestions | Forms | P2 | MEDIUM | Contextual help |
| Tabbed viewing | Viewer | P2 | MEDIUM | Multi-file workflow |
| Mermaid diagrams | Viewer | P2 | MEDIUM | GSD uses flowcharts |

---

## Dependencies on Existing Features

| New Feature | Depends On (Existing) | Integration Point |
|-------------|----------------------|-------------------|
| Activity Bar | Panel collapse state | Toggle sidebar callback |
| Command Forms | SlashCommandPicker | Extend with forms |
| Command Forms | GSD command schema | Parse for params/flags |
| State Tree | STATE.md parser | Extend for milestones |
| State Tree | ROADMAP.md parser | Current hierarchy |
| Viewer | File reading backend | Rust commands |
| Viewer | Panel system | Right pane integration |

---

## Verification Checklist

- [x] Categories clear (table stakes vs differentiators vs anti-features)
- [x] Complexity noted for each feature
- [x] Dependencies on existing features identified
- [x] Accessibility requirements specified
- [x] Keyboard navigation patterns defined
- [x] Sources cited with URLs

---

*Feature research for: v1.1 UI Enhancements (GSD-UI)*
*Researched: 2026-01-25*
*Confidence: HIGH (based on official documentation: VSCode, W3C WAI, React ecosystem)*
