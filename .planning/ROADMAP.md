# Roadmap: GSD-UI

## Milestones

- **v1.0 MVP** — Phases 1-6 (shipped 2026-01-25) — [Archive](.planning/milestones/v1.0-ROADMAP.md)
- **v1.1 Context Enhancement** — Phases 7-10 (in progress)

## Phases

<details>
<summary> v1.0 MVP (Phases 1-6) — SHIPPED 2026-01-25</summary>

- [x] Phase 1: Foundation (2/2 plans) — completed 2026-01-24
- [x] Phase 2: Visualization (2/2 plans) — completed 2026-01-25
- [x] Phase 3: Interactivity (4/4 plans) — completed 2026-01-25
- [x] Phase 4: Command Panel (3/3 plans) — completed 2026-01-25
- [x] Phase 5: Rebranding (3/3 plans) — completed 2026-01-25
- [x] Phase 6: Conversation View (4/4 plans) — completed 2026-01-25

See [v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md) for full details.

</details>

### v1.1 Context Enhancement (In Progress)

**Milestone Goal:** Enhance GSD-UI with better project visualization and smarter command interaction via VSCode-style icon sidebar, state tree, markdown viewer, and command forms.

- [x] **Phase 7: Icon Sidebar** - VSCode-style vertical icon bar for view switching (completed 2026-01-25)
- [x] **Phase 8: Markdown Viewer** - Tabbed file viewer with frontmatter and syntax highlighting (completed 2026-01-26)
- [x] **Phase 9: State Tree** - Hierarchical milestone/phase/plan tree with actions (completed 2026-01-26)
- [ ] **Phase 10: Command Forms** - Smart forms with parameters and flags for GSD commands
- [ ] **Phase 11: npx Installation** - Cross-platform binary distribution via npm for `npx opcode`

## Phase Details

### Phase 7: Icon Sidebar

**Goal:** User can switch between Commands and State views using a VSCode-style icon sidebar
**Depends on:** Phase 6 (v1.0 complete)
**Requirements:** SIDE-01, SIDE-02, SIDE-03, SIDE-04, SIDE-05
**Success Criteria** (what must be TRUE):
  1. User sees a 48px vertical icon bar on the left edge of the left pane
  2. User can click Commands or State icons to switch the panel content
  3. User sees a 2px accent-colored left border on the active view icon
  4. User sees tooltip with view name when hovering over icons
**Plans:** 2 plans

Plans:
- [x] 07-01-PLAN.md — Core infrastructure: toggle-group dependency, store extension, sidebar component
- [x] 07-02-PLAN.md — Integration: wire sidebar into GSDPanel, create state panel placeholder

### Phase 8: Markdown Viewer

**Goal:** User can view state files with frontmatter display, markdown rendering, and syntax highlighting
**Depends on:** Phase 7 (sidebar provides navigation context)
**Requirements:** VIEW-01, VIEW-02, VIEW-03, VIEW-04, VIEW-05, VIEW-06
**Success Criteria** (what must be TRUE):
  1. User sees a tabbed file viewer in the right pane instead of the status panel
  2. User can open multiple files in tabs and switch between them
  3. User sees collapsible frontmatter section at the top of each file
  4. User sees rendered markdown content with syntax-highlighted code blocks
  5. Opening an already-open file switches to its existing tab (no duplicates)
**Plans:** 4 plans

Plans:
- [x] 08-01-PLAN.md — Core infrastructure: gray-matter dependency, store extension with tab management
- [x] 08-02-PLAN.md — Viewer shell: GSDFileViewer container, scrollable tabs, GSDPanel integration
- [x] 08-03-PLAN.md — Content rendering: markdown renderer, frontmatter display, code blocks with copy
- [x] 08-04-PLAN.md — Integration: file loading via Tauri fs, wire content rendering into viewer

### Phase 9: State Tree

**Goal:** User can browse milestone/phase/plan hierarchy with status indicators and actions
**Depends on:** Phase 8 (tree click opens files in viewer)
**Requirements:** TREE-01, TREE-02, TREE-03, TREE-04, TREE-05, TREE-06, TREE-07, TREE-08, TREE-09
**Success Criteria** (what must be TRUE):
  1. User sees 3-level tree: milestone > phases > plans in the State view
  2. User can expand/collapse tree nodes
  3. User sees status indicators (pending/in-progress/complete) on each node
  4. User can click a node to open its corresponding file in the viewer
  5. User sees inline action buttons (execute, plan) on nodes based on status
  6. User can view archived milestones in a separate collapsed section
  7. Right-click context menu replaced by inline actions (per CONTEXT.md decision)
**Plans:** 3 plans

Plans:
- [x] 09-01-PLAN.md — Data layer: MilestoneInfo type, parser, 3-level tree transforms with filepath
- [x] 09-02-PLAN.md — Visual refinement: status dots, file opening on click, milestone rendering
- [x] 09-03-PLAN.md — Archived section and integration: GSDArchivedSection, GSDStatePanel wiring

### Phase 10: Command Forms

**Goal:** User can execute GSD commands via smart forms with parameters and flags
**Depends on:** Phase 7 (Commands view in sidebar)
**Requirements:** CMD-01, CMD-02, CMD-03, CMD-04, CMD-05, CMD-06, CMD-07
**Success Criteria** (what must be TRUE):
  1. User sees all 27 GSD commands organized into 7 categories
  2. User can click a command to open a modal dialog with a form
  3. User sees form fields matching the command's parameters
  4. User can toggle applicable flags (checkboxes) for the command
  5. User sees form fields prepopulated with current state values where applicable
  6. User can submit the form to execute the command in the terminal
**Plans:** 5 plans

Plans:
- [ ] 10-01-PLAN.md — Expand command registry to 27 commands in 7 categories
- [ ] 10-02-PLAN.md — Smart forms with React Hook Form + Zod validation
- [ ] 10-03-PLAN.md — Flag toggle switches for command options
- [ ] 10-04-PLAN.md — State prepopulation from STATE.md
- [ ] 10-05-PLAN.md — Command execution with toast feedback

### Phase 11: npx Installation

**Goal:** User can install and run opcode via `npx opcode` without Rust toolchain
**Depends on:** None (independent infrastructure phase)
**Requirements:** NPX-01, NPX-02, NPX-03, NPX-04, NPX-05
**Success Criteria** (what must be TRUE):
  1. `npx opcode` works on fresh machine with only Node.js (>=16) installed
  2. Binary download completes in <30 seconds on average connection
  3. All P0 platforms supported (Linux x64, macOS x64/arm64, Windows x64)
  4. Version is synchronized across all package manifests automatically
  5. Release process is fully automated via git tags
**Plans:** 5 plans

Plans:
- [ ] 11-01-PLAN.md — Local build validation: build scripts, standalone binary testing
- [ ] 11-02-PLAN.md — npm package structure: wrapper scripts, postinstall download
- [ ] 11-03-PLAN.md — CI/CD pipeline: GitHub Actions workflow for cross-compilation
- [ ] 11-04-PLAN.md — npm publishing: automated release workflow with tag triggers
- [ ] 11-05-PLAN.md — Documentation and polish: README updates, version sync script

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 2/2 | Complete | 2026-01-24 |
| 2. Visualization | v1.0 | 2/2 | Complete | 2026-01-25 |
| 3. Interactivity | v1.0 | 4/4 | Complete | 2026-01-25 |
| 4. Command Panel | v1.0 | 3/3 | Complete | 2026-01-25 |
| 5. Rebranding | v1.0 | 3/3 | Complete | 2026-01-25 |
| 6. Conversation View | v1.0 | 4/4 | Complete | 2026-01-25 |
| 7. Icon Sidebar | v1.1 | 2/2 | Complete | 2026-01-25 |
| 8. Markdown Viewer | v1.1 | 4/4 | Complete | 2026-01-26 |
| 9. State Tree | v1.1 | 3/3 | Complete | 2026-01-26 |
| 10. Command Forms | v1.1 | 0/5 | Not started | - |
| 11. npx Installation | v1.1 | 0/5 | Not started | - |
