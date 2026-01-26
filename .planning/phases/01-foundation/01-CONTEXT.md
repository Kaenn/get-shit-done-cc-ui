# Phase 1: Foundation - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

GSD panel infrastructure with parsed project data — panel layout, visibility toggling, resizing, and data display from `.planning/` files. Users can toggle and resize the panel, see current phase/milestone info, and panel auto-refreshes on file changes.

</domain>

<decisions>
## Implementation Decisions

### Panel layout & positioning
- Right side of terminal, panel on right, terminal on left
- Default width: narrow (~250-300px) but resizable
- Edge tab/button visible when collapsed for re-opening
- Integrated visual style — seamless with terminal, same background, subtle divider only

### Toggle & resize behavior
- Keyboard shortcut: Cmd/Ctrl + B (VS Code style sidebar toggle)
- Toggle animation: instant, no slide animation
- Persist panel width between sessions
- Resize constraints: flexible range 150-800px

### Data display format
- Summary level detail: phase name + goal + success criteria count
- Progress shown as text only ("3/5 plans complete"), no progress bar
- Color scheme: match existing OPCode terminal theme
- Include subtle "Next Up" hint at bottom showing suggested next command

### Auto-refresh behavior
- Immediate updates when .planning files change (no debounce)
- Subtle flash highlight on changed content
- Show friendly error state if files malformed or missing
- Watch entire .planning/ directory tree for changes

### Claude's Discretion
- Exact pixel dimensions and spacing
- Divider styling (line weight, opacity)
- Error message wording
- Flash animation duration and easing
- Edge tab visual design

</decisions>

<specifics>
## Specific Ideas

- Panel should feel "integrated" with terminal — not like a separate app bolted on
- Instant toggle preferred for snappy feel, matching terminal responsiveness
- "Next Up" is just a hint in Phase 1 (clickable action comes in Phase 3)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-01-24*
