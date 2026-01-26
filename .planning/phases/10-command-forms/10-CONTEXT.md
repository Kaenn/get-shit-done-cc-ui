# Phase 10: Command Forms - Context

**Gathered:** 2026-01-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Execute GSD commands via smart forms with parameters and flags. User sees all 27 commands organized by category, clicks to open modal form, fills parameters/flags, and submits to execute in terminal.

</domain>

<decisions>
## Implementation Decisions

### Form Layout & Organization
- Modal dialog for command forms (centered overlay)
- Commands organized by 7 categories (workflow stages)
- Categories collapsible, default all expanded
- Command items show name only (description appears in form)

### Parameter Handling
- Required fields marked with asterisk, red border if empty on validation
- Flags displayed as toggle switches
- Real-time validation as user types
- Phase number input: dropdown with phase names + fallback number input for missing phases

### State Prepopulation
- Auto-fill current phase number only (from STATE.md)
- Prepopulated values editable, no visual indicator distinguishing them
- Empty field if STATE.md missing or no current phase
- State read fresh on each form open (not cached)

### Execution Feedback
- Submit sends command directly to terminal via Tauri
- Modal closes immediately after send
- Toast notification on error (e.g., no terminal connected)
- No command history feature

### Claude's Discretion
- Modal styling and animations
- Category icons and visual treatment
- Toast notification duration and placement
- Keyboard shortcuts (Escape to close, Enter to submit)

</decisions>

<specifics>
## Specific Ideas

- Direct terminal execution preferred over clipboard workflow
- Clean command list (names only) keeps interface minimal
- Collapsible categories all start expanded so user sees full command set

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-command-forms*
*Context gathered: 2026-01-26*
