# Requirements: GSD-UI v1.1

**Defined:** 2026-01-25
**Core Value:** Terminal-centric workflow enhancement — GSD panel augments Claude Code without disrupting terminal-first experience

## v1.1 Requirements

Requirements for v1.1 Context Enhancement milestone. Each maps to roadmap phases.

### Icon Sidebar

- [x] **SIDE-01**: Left pane has 48px vertical icon bar on left edge
- [x] **SIDE-02**: Icon bar contains Commands icon and State icon
- [x] **SIDE-03**: Clicking icon switches left panel content to corresponding view
- [x] **SIDE-04**: Active view shows 2px accent-colored left border indicator
- [x] **SIDE-05**: Icons have tooltips on hover showing view name

### Commands Panel

- [ ] **CMD-01**: Commands view shows all 27 GSD commands
- [ ] **CMD-02**: Commands grouped into 7 categories (Project Setup, Phase Lifecycle, Roadmap Ops, Milestone Ops, Quick Work, Navigation, Configuration)
- [ ] **CMD-03**: Click on command opens modal dialog
- [ ] **CMD-04**: Modal contains smart form with fields matching command parameters
- [ ] **CMD-05**: Form shows checkable flags where applicable (--skip-research, --gaps-only, etc.)
- [ ] **CMD-06**: Form fields prepopulated with current state values (current phase number, etc.)
- [ ] **CMD-07**: Submit executes command with form values in terminal

### State Tree

- [ ] **TREE-01**: State view shows hierarchical tree of current milestone
- [ ] **TREE-02**: Tree displays 3 levels: milestone → phases → plans
- [ ] **TREE-03**: Nodes show status indicators (pending/in-progress/complete)
- [ ] **TREE-04**: Nodes are expandable/collapsible
- [ ] **TREE-05**: Click on node opens corresponding file in right pane viewer
- [ ] **TREE-06**: Nodes have inline action buttons (execute, plan, etc.) based on status
- [ ] **TREE-07**: Archived milestones section shows collapsed past milestones
- [ ] **TREE-08**: Clicking archived milestone opens its markdown file in viewer
- [ ] **TREE-09**: Right-click on node opens context menu with available actions

### Markdown Viewer

- [ ] **VIEW-01**: Right pane displays state file viewer instead of status panel
- [ ] **VIEW-02**: Viewer has tabbed interface for multiple open files
- [ ] **VIEW-03**: Opening file reuses existing tab if file already open
- [ ] **VIEW-04**: Each tab shows collapsible frontmatter section at top
- [ ] **VIEW-05**: Tab content renders markdown below frontmatter (read-only)
- [ ] **VIEW-06**: Code blocks have syntax highlighting

## v1.2+ Requirements

Deferred to future release. Tracked but not in current roadmap.

### Icon Sidebar Enhancements

- **SIDE-06**: Badge indicators on icons showing counts (pending plans, etc.)
- **SIDE-07**: Keyboard shortcuts Ctrl+1/Ctrl+2 to switch views

### Commands Panel Enhancements

- **CMD-08**: Search/filter box to find commands
- **CMD-09**: Recent commands section at top
- **CMD-10**: Keyboard navigation within modal (arrow keys)

### Markdown Viewer Enhancements

- **VIEW-07**: Mermaid diagram rendering
- **VIEW-08**: Table of contents for long files
- **VIEW-09**: Search within file (Ctrl+F)

### State Tree Enhancements

- **TREE-10**: Progress bars on phase nodes
- **TREE-11**: Drag-drop reordering of phases (if GSD supports it)

## Out of Scope

| Feature | Reason |
|---------|--------|
| File editing | Read-only viewer, Claude Code manages .planning/ writes |
| Real-time collaboration | Single user for v1 |
| Plugin system | Deferred to v2.x per research |
| Hot reload of commands | Restart sufficient |
| Mobile layout | Desktop/web only |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SIDE-01 | Phase 7 | Complete |
| SIDE-02 | Phase 7 | Complete |
| SIDE-03 | Phase 7 | Complete |
| SIDE-04 | Phase 7 | Complete |
| SIDE-05 | Phase 7 | Complete |
| VIEW-01 | Phase 8 | Pending |
| VIEW-02 | Phase 8 | Pending |
| VIEW-03 | Phase 8 | Pending |
| VIEW-04 | Phase 8 | Pending |
| VIEW-05 | Phase 8 | Pending |
| VIEW-06 | Phase 8 | Pending |
| TREE-01 | Phase 9 | Pending |
| TREE-02 | Phase 9 | Pending |
| TREE-03 | Phase 9 | Pending |
| TREE-04 | Phase 9 | Pending |
| TREE-05 | Phase 9 | Pending |
| TREE-06 | Phase 9 | Pending |
| TREE-07 | Phase 9 | Pending |
| TREE-08 | Phase 9 | Pending |
| TREE-09 | Phase 9 | Pending |
| CMD-01 | Phase 10 | Pending |
| CMD-02 | Phase 10 | Pending |
| CMD-03 | Phase 10 | Pending |
| CMD-04 | Phase 10 | Pending |
| CMD-05 | Phase 10 | Pending |
| CMD-06 | Phase 10 | Pending |
| CMD-07 | Phase 10 | Pending |

**Coverage:**
- v1.1 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0

---
*Requirements defined: 2026-01-25*
*Last updated: 2026-01-25 after roadmap creation*
