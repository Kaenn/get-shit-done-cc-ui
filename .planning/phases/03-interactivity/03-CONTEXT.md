# Phase 3: Interactivity - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Users execute GSD commands and combos directly from the panel. Clicking nodes triggers terminal commands, combos auto-chain commands, and "Next Up" provides a primary action button. The tree view and status indicators from Phase 2 are prerequisites.

</domain>

<decisions>
## Implementation Decisions

### Command Execution
- Click triggers `/clear` + command — clean slate each time
- Quick preview: show command in tooltip/popover, click again to confirm
- Minimal feedback: brief flash/pulse on click, terminal is the main feedback
- Block clicks while command runs — disable clickable nodes during execution

### Combo Behavior
- Toggle switch in panel header for combo mode
- Immediate auto-chain: next command fires instantly on success
- Interrupt by toggling off combo switch — stops after current command
- Toggle state only for visual indicator — no extra glow or accent

### "Next Up" Action
- Placement: on top of input text (bottom of terminal)
- Label shows actual command: "/gsd:plan-phase 3"
- Button disappears while running, reappears with next action when ready
- Button hidden when no next action available (complete, stuck, etc.)

### Node Click Mapping
- Only current phase nodes are clickable — past/future phases just expand/collapse
- Always visible indicator on clickable nodes (play icon or action button)
- State-aware command routing: discuss (optional) → plan → execute
- Phase nodes only expand/collapse, don't trigger commands

### Claude's Discretion
- Exact preview popover design and positioning
- Click pulse animation specifics
- Play/action icon design for clickable nodes
- Error handling when commands fail

</decisions>

<specifics>
## Specific Ideas

- "Next Up" button positioned at terminal input area — not in the GSD panel header
- Command routing follows the GSD workflow: discuss → plan → execute (discuss optional)
- Non-current phase nodes remain interactive for tree navigation but don't trigger commands

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-interactivity*
*Context gathered: 2026-01-24*
