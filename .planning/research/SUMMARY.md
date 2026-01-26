# Project Research Summary

**Project:** GSD-UI v1.1 Context Enhancement
**Domain:** Desktop UI Components (React/Tauri)
**Researched:** 2026-01-25
**Confidence:** HIGH

## Executive Summary

The v1.1 milestone adds four major UI capabilities to an existing, well-structured React/Tauri codebase: a VSCode-style icon sidebar (activity bar), smart command forms with parameter inputs, a three-level state tree (milestones to phases to plans), and a tabbed markdown file viewer. The research confirms this is a relatively low-risk enhancement because the existing stack already contains the necessary libraries (react-markdown, react-hook-form, zod, lucide-react, Radix UI), with only two additions required: `gray-matter` for frontmatter parsing and `@radix-ui/react-toggle-group` for the icon sidebar.

The recommended approach is a phased integration that extends existing patterns rather than introducing new architectural concepts. The current Zustand store (`gsdStore.ts`), custom Tabs component, and tree view patterns provide proven foundations. The main integration challenge is managing z-index stacking contexts when adding the fixed sidebar alongside existing Radix portals (dialogs, dropdowns, tooltips). The architecture research identified a clear build order: foundation (store + sidebar), then state tree, then file viewer, then command forms.

Key risks center on three areas: (1) z-index collisions between the new activity bar and existing Radix portals, (2) XSS vulnerabilities in markdown rendering without proper sanitization, and (3) memory leaks from Zustand subscriptions in the tabbed viewer. All three have documented prevention strategies. The research confidence is HIGH because findings are based on codebase analysis combined with verified library documentation and GitHub issues.

## Key Findings

### Recommended Stack

The existing stack requires minimal additions. The codebase already includes react-markdown 9.1.0, remark-gfm, react-hook-form, zod, lucide-react, and Radix UI components. Two libraries must be added.

**New dependencies:**
- `gray-matter ^4.0.3`: YAML frontmatter parsing — Industry standard (Gatsby, Astro, Vite), 2,400+ npm dependents, handles edge cases the existing regex parser misses
- `@radix-ui/react-toggle-group ^1.1.11`: Icon sidebar toggle buttons — Same ecosystem as existing Radix components, proper keyboard navigation, ARIA compliance

**Existing to reuse:**
- `react-markdown` + `remark-gfm`: Already used in StreamMessage.tsx for markdown rendering
- `react-hook-form` + `zod` + `@hookform/resolvers`: Already used in CreateAgent.tsx, Settings.tsx for form validation
- `lucide-react`: Already used across 76+ files for consistent iconography
- `@radix-ui/react-collapsible`: Already used in GSD tree for expand/collapse

### Expected Features

**Must have (table stakes):**
- Vertical icon sidebar (48px) with single-selection toggle between Commands and State views
- Icon hover tooltips (no text labels, VSCode pattern)
- Active state indicator (left border in accent color)
- 3-level tree hierarchy: Milestone > Phase > Plan with status indicators
- Markdown rendering with YAML frontmatter display
- Syntax highlighting for code blocks
- Basic keyboard navigation (arrow keys, Enter, Escape)

**Should have (differentiators):**
- Tabbed file viewer for multiple open files
- Badge indicators on sidebar icons (pending task count)
- Command preview showing full command string as user fills form
- Progressive disclosure for advanced command options
- Keyboard shortcuts (Cmd+1/2 for view switching, Cmd+B for sidebar toggle)

**Defer to v2+:**
- Mermaid diagram rendering
- Link following between .planning files
- Drag-drop icon reordering
- Diff view for file versions
- Split view for file comparison

### Architecture Approach

The v1.1 UI integrates with the existing three-pane layout by adding an icon sidebar outside `ThreePane` and converting the right pane to a tabbed viewer. All new state extends the existing `gsdStore.ts` with Zustand persist for cross-session continuity. Command forms use schema-driven generation from an enhanced `GSDCommandDefinition` type.

**Major components:**
1. `IconSidebar.tsx`: Vertical bar with lucide icons, toggles `sidebarActiveView` in gsdStore
2. `StateTreeView.tsx`: Milestone/phase/plan tree extending existing GSDTreeNode patterns
3. `FileViewerTabs.tsx`: Tabbed container using existing ui/tabs.tsx component
4. `FileViewerPane.tsx`: Single file renderer with frontmatter extraction
5. `CommandSchemaForm.tsx`: Dynamic form generator using react-hook-form + zod

**Data flow:**
- Icon sidebar state persisted in gsdStore
- File tabs stored in gsdStore (id, filepath, type)
- Tree nodes click triggers addFileTab action
- File content fetched via existing Tauri commands

### Critical Pitfalls

1. **Radix Portal Z-Index Collision** — Adding a fixed sidebar creates stacking context conflicts with existing dialogs/dropdowns. **Avoid by:** Establishing a z-index scale (sidebar: 10, dropdown: 50, dialog: 100), applying z-index to Portal container, testing every Radix component with sidebar visible.

2. **XSS in Markdown Rendering** — Rendering markdown from session files without sanitization allows script injection. **Avoid by:** Always pairing `rehype-raw` with `rehype-sanitize` (order matters), using gray-matter for strict YAML parsing, restricting allowed HTML elements with `allowedElements` prop.

3. **Zustand Subscription Memory Leaks** — Tabs that subscribe to store slices don't unsubscribe on unmount. **Avoid by:** Using selectors to subscribe to minimal state, always returning cleanup function in useEffect, using `destroy()` method in tests.

4. **AnimatePresence Memory Leak** — Rapid tab switching with framer-motion causes stuck animations and memory growth. **Avoid by:** Never wrapping children in Fragments inside AnimatePresence, keeping AnimatePresence mounted (move conditional to children), debouncing rapid tab switches (100-200ms).

5. **Stale Closures in Dynamic Forms** — Form validation callbacks capture stale state when schema changes based on selected command. **Avoid by:** Using refs for latest schema in callbacks, resetting form when commandType changes, separating Zod schemas per command type.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation (Icon Sidebar + Store Extensions)

**Rationale:** All other features depend on the sidebar state and file tab management in gsdStore. Must establish z-index scale before adding fixed positioning.

**Delivers:** Working icon sidebar that switches between Commands (existing) and State (placeholder) views

**Addresses:** Icon sidebar structure, active state indicator, toggle behavior

**Avoids:** Z-index collision pitfall (#1) by establishing scale early

**Uses:** @radix-ui/react-toggle-group, lucide-react

### Phase 2: State Tree View

**Rationale:** Core new visualization feature. Depends on Phase 1 store extensions but not on file viewer.

**Delivers:** Full milestone > phase > plan tree with status indicators, expand/collapse, click-to-view

**Addresses:** 3-level hierarchy, status indicators, current phase highlight, keyboard navigation

**Implements:** StateTreeView component, parseMilestonesMd function, discriminated union types for tree nodes

**Avoids:** Type confusion pitfall (#7) by using discriminated unions from the start

### Phase 3: Tabbed File Viewer

**Rationale:** Builds on Phase 1 tab state and Phase 2 tree integration (click node to open file).

**Delivers:** Tabbed file viewer with frontmatter display, markdown rendering, syntax highlighting

**Addresses:** Markdown rendering, frontmatter parsing, tabbed viewing, syntax highlighting

**Uses:** gray-matter, existing react-markdown + rehype-highlight

**Avoids:** XSS pitfall (#3) with rehype-sanitize, memory leak pitfall (#2) with proper subscription cleanup

### Phase 4: Smart Command Forms

**Rationale:** Most complex feature, depends on stable base UI. Extends existing command registry.

**Delivers:** Schema-driven command forms with parameter inputs, flag toggles, validation feedback

**Addresses:** Parameter inputs, flag toggles, validation feedback, command preview

**Uses:** react-hook-form, zod, existing @hookform/resolvers

**Avoids:** Stale closure pitfall (#6) with ref patterns and form reset on schema change

### Phase 5: Polish and Integration

**Rationale:** UX refinements after core features are stable.

**Delivers:** Keyboard shortcuts, badge indicators, scroll position memory, performance optimization

**Addresses:** Keyboard shortcuts per view, badge indicators, progressive disclosure

**Avoids:** AnimatePresence pitfall (#4) with debouncing and proper mounting

### Phase Ordering Rationale

- **Dependencies flow downward:** Each phase builds on previous phase's output
- **State before views:** Store extensions (Phase 1) before components that consume state
- **Read before write:** File viewer (Phase 3) before command forms (Phase 4) because viewing is simpler
- **Pitfall isolation:** Z-index (Phase 1), XSS (Phase 3), closures (Phase 4) addressed in isolation
- **Complexity escalation:** LOW (Phase 1-2) to MEDIUM (Phase 3) to HIGH (Phase 4)

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 4 (Command Forms):** Complex schema design for 27 commands, needs field type mapping research
- **Phase 3 (File Viewer):** May need Mermaid integration research if diagrams are P1

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Sidebar):** Well-documented Radix ToggleGroup, established z-index patterns
- **Phase 2 (Tree View):** Existing GSDTreeNode patterns, WAI-ARIA tree spec is comprehensive
- **Phase 5 (Polish):** Standard keyboard handling, no novel complexity

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Only 2 new deps, both verified via npm and official docs |
| Features | HIGH | Based on VSCode UX guidelines and W3C WAI patterns |
| Architecture | HIGH | Based on codebase analysis of existing patterns |
| Pitfalls | HIGH | GitHub issues with reproduction steps and verified fixes |

**Overall confidence:** HIGH

### Gaps to Address

- **Command categories:** Milestone mentions 7 categories but research shows 3 in current registry. Clarify additional 4 during Phase 4 planning.
- **Archived milestones display:** Research identified option (collapsible section vs separate view) but no decision made. Clarify during Phase 2.
- **File tab persistence:** Should tabs persist across sessions? Currently session-only assumed. Validate requirement.
- **Settings icon:** Is settings a third sidebar view or just a shortcut? Clarify during Phase 1.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `gsdStore.ts`, `parsers.ts`, `command-registry.ts`, `TabContext.tsx`, `ui/tabs.tsx`
- [VSCode Activity Bar UX Guidelines](https://code.visualstudio.com/api/ux-guidelines/activity-bar)
- [W3C WAI Tree View Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/)
- [Radix UI Toggle Group](https://www.radix-ui.com/primitives/docs/components/toggle-group)
- [gray-matter npm](https://www.npmjs.com/package/gray-matter)

### Secondary (MEDIUM confidence)
- [Radix Primitives z-index issues #1317](https://github.com/radix-ui/primitives/issues/1317)
- [Zustand memory leak discussion #2054](https://github.com/pmndrs/zustand/discussions/2054)
- [AnimatePresence memory leak #625](https://github.com/framer/motion/issues/625)
- [React Markdown Security Guide 2025](https://strapi.io/blog/react-markdown-complete-guide-security-styling)

### Tertiary (LOW confidence)
- NPM package comparisons for gray-matter alternatives
- Community blog posts for form validation patterns

---
*Research completed: 2026-01-25*
*Ready for roadmap: yes*
