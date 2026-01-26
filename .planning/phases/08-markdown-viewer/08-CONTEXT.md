# Phase 8: Markdown Viewer - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Tabbed file viewer for state files with frontmatter display, markdown rendering, and syntax-highlighted code blocks. Replaces the status panel in the right pane. Users can open multiple files in tabs and switch between them.

</domain>

<decisions>
## Implementation Decisions

### Tab behavior
- Horizontal scroll with arrow buttons when tabs overflow
- No limit on number of open tabs
- Close button closes tab immediately (no confirmation)
- Auto-select adjacent tab after closing
- Opening already-open file switches to existing tab (no duplicates)

### Frontmatter display
- Collapsed by default, click to expand
- Display as raw YAML block with syntax highlighting
- Visual treatment: border/divider separating from content
- Hide section entirely for files without frontmatter

### Markdown rendering
- Full GFM support: tables, blockquotes, strikethrough, footnotes, etc.
- Link handling: external links → browser tab, internal .md links → new viewer tab
- Task lists (checkboxes) are read-only, not interactive
- Note: Research should investigate good markdown libraries for full GFM

### Code blocks
- Syntax theme matches app theme (dark for dark mode, light for light)
- Line numbers always visible
- Copy button appears on hover
- Language support: common web stack minimum (JS/TS, JSON, YAML, MD, Bash, HTML, CSS)

### Claude's Discretion
- New tab positioning (end vs next to active)
- Image handling in markdown
- Exact language list for syntax highlighting beyond web stack
- Markdown library selection (research will inform this)

</decisions>

<specifics>
## Specific Ideas

- User mentioned "finding a good md library is a good idea" — research should prioritize library evaluation for full GFM support with syntax highlighting

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-markdown-viewer*
*Context gathered: 2026-01-25*
