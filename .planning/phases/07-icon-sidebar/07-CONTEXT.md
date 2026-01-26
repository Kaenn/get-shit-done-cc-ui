# Phase 7: Icon Sidebar - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

VSCode-style vertical icon bar (48px wide) for switching between Commands and State views. This is a navigation component on the left edge of the left pane. Users click icons to change what panel content is displayed.

</domain>

<decisions>
## Implementation Decisions

### Icon Design & Sizing
- Use Lucide icons (already in project)
- 24px icon size within the 48px bar
- Square buttons with rounded corners (4-6px radius)

### Visual Feedback
- Active state: 2px accent-colored left border + icon color change (VSCode style)
- Inactive icons: dimmed at 60-70% opacity
- Hover: subtle background appears behind icon
- All effects instant, no animation

### Animation & Transitions
- View switching: instant swap, no transition animation
- Active indicator: no animation, appears immediately
- Hover states: instant, no fade
- Tooltips: 300-500ms delay before appearing

### Layout Positioning
- Sidebar spans full height of left pane
- Icons top-aligned within the sidebar
- No border or separator from content
- Background matches panel (seamless blend)

### Claude's Discretion
- Specific Lucide icon choices for Commands and State views
- Exact rounded corner radius (4-6px range)
- Tooltip positioning (right of sidebar)
- Exact opacity values for inactive/hover states

</decisions>

<specifics>
## Specific Ideas

- "Keep it like VSCode" — the active state styling should match VSCode's icon sidebar feel
- Clean, minimal appearance — no visual clutter, sidebar blends with panel

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-icon-sidebar*
*Context gathered: 2026-01-25*
