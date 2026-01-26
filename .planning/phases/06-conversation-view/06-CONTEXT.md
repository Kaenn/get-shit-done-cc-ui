# Phase 6: Conversation View - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Improved conversation display with collapsible messages, better readability, and organized metadata. This phase redesigns how messages appear — layout, collapse behavior, and information presentation. Creating new message types or adding conversation features (search, export) are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Message Collapse Behavior
- All messages auto-collapse except the current (most recent) message
- Collapsed preview shows Claude Code style: tool list with file/line counts, then brief description
- Click anywhere on collapsed message to expand (whole row is clickable)
- No persistence — always reset to default on page load

### AI Message Layout
- WhatsApp-style positioning: AI messages left-aligned, human messages right-aligned
- No Claude logo — position alone distinguishes AI from human
- Tool badges displayed Claude Code style (tool name + file/count details)
- Collapsed: show tool list with counts, then summary line
- Expanded: everything inline, no separate collapsible details section

### Metadata Presentation
- Show: cost, tokens, duration, turns
- Always visible inline at bottom of expanded messages (no toggle needed)
- Format: compact inline — `$0.02 · 1.2k tokens · 3.5s · 2 turns`

### Visual Hierarchy
- WhatsApp-style: AI left-aligned, human right-aligned, different bubble colors
- Minimal bubbles: subtle rounded corners, minimal shadow
- Tight spacing: 8-12px between messages
- Max-width: 70-80% of container for classic chat app feel

### Claude's Discretion
- Exact bubble colors (should complement cyan theme)
- Typography choices within messages
- Animation on expand/collapse (if any)
- System Initialized message styling

</decisions>

<specifics>
## Specific Ideas

- "Like Claude Code" — the collapsed preview format with tool list and counts
- WhatsApp as reference for left/right positioning and bubble feel
- Remove double box styling on message cards (mentioned in requirements)
- First message needs proper padding at top of conversation

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-conversation-view*
*Context gathered: 2026-01-25*
