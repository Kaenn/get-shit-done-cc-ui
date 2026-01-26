# Phase 4: Command Panel - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Left panel displaying GSD commands grouped by category, with contextual awareness based on project state. Users see available actions, their active/inactive state, and can execute with parameter editing. Command execution and combos are handled in Phase 3 — this phase focuses on the panel UI and command presentation.

</domain>

<decisions>
## Implementation Decisions

### Panel Layout & Organization
- Commands grouped by category (Plan, Execute, Settings) — GSD's natural grouping
- Category sections collapsible — active category expanded by default, others collapsed
- Compact/minimal visual weight — small icons, tight spacing, text-focused
- Panel is resizable (drag to adjust width) — matches right GSD panel behavior

### Command State Visualization
- Inactive commands are grayed out but visible — dimmed text/icon, still present
- No explanation for why commands are inactive — user learns through experience
- No special "suggested next action" highlighting — all active commands treated equally
- Clicking inactive commands still executes — no warning, command runs (may fail in terminal)

### Execution Interaction
- Click shows modal dialog first — centered overlay with form fields
- No quick-execute option — always show modal for consistency
- Parameters: common flags as form fields + raw text input for advanced flags
- Pre-filled with smart defaults based on context (e.g., current phase number)

### Contextual Awareness
- Full project state affects command availability (phase, plans, blockers, todos)
- Real-time updates via file watcher — panel refreshes when .planning/ files change
- Project-aware: panel refreshes when active terminal/project changes
- No context summary header — context affects commands but isn't displayed separately

### Claude's Discretion
- Exact category names and grouping of specific commands
- Modal dialog styling and form field layout
- File watcher implementation details
- How to detect terminal/project switch

</decisions>

<specifics>
## Specific Ideas

- Terminal switching should trigger panel refresh — each project has different state
- Modal should feel lightweight despite always appearing — quick to dismiss if defaults are fine
- Panel should match the compact aesthetic of the existing GSD panel on the right

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-command-panel*
*Context gathered: 2026-01-24*
