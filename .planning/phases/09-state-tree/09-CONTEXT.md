# Phase 9: State Tree - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Hierarchical milestone/phase/plan tree browser with status indicators and actions. Users can browse project state, see progress at a glance, and click nodes to open files in the viewer. Tree click opens files in Phase 8 viewer.

</domain>

<decisions>
## Implementation Decisions

### Tree Structure & Display
- VSCode-style indentation with vertical guide lines connecting parent to children
- Default state: current/active milestone expanded, others collapsed
- Expand/collapse via chevron icon only (clicking node text has different action)
- Show progress counts inline, e.g., "Phase 7 (2/3 plans)"

### Status Indicators
- Color-only status (no icons) — colored dot before node name
- Color scheme: Gray (pending), Blue (in-progress), Green (complete)
- In-progress status has subtle pulse animation to draw attention

### Node Interactions
- Clicking node text opens corresponding file in markdown viewer (Phase 8)
- Inline action buttons always visible on right side of row
- No right-click context menu — use inline actions and command panel only

### Archived Milestones
- Separate "Archived" section at bottom of tree
- Collapsed by default, shows "Archived (N)" header
- Dimmed/muted styling (lower opacity, grayed out)
- Archived nodes still clickable — opens file in viewer (read-only context)

### Claude's Discretion
- Which inline actions appear on which node types (plan, execute, discuss based on status/type)
- Exact animation timing for pulse effect
- Guide line styling (color, opacity, thickness)
- Spacing and typography details

</decisions>

<specifics>
## Specific Ideas

- Tree should feel like VSCode explorer with connecting lines
- Progress counts at a glance (don't need to expand to see completion status)
- Pulse animation makes active work immediately obvious
- Archived section keeps tree clean while preserving history access

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-state-tree*
*Context gathered: 2026-01-25*
