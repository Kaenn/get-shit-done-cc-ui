# Phase 5: Rebranding - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete rebrand from OPCode to GSD-UI — updating all references, branding elements, color scheme (violet to cyan), and adding proper attribution to the original OPCode project.

</domain>

<decisions>
## Implementation Decisions

### Brand Identity
- Product name: **GSD-UI** (hyphenated)
- No tagline or subtitle — name stands alone
- Color scheme: Replace violet/purple accent with **cyan** throughout
- Name placement: Window title only — no in-app header branding

### Attribution Style
- Text: "Built on OPCode"
- Position: Bottom-right corner (subtle footer text)
- Behavior: Click opens https://github.com/winfunc/opcode in default browser
- Visual: Small, unobtrusive — visible but not prominent

### Loading/Startup Experience
- Terminal loading: Progress dots with "thinking..." text
- Non-terminal loading: Simple spinner
- Spinner/dots color: Cyan (brand color)
- Splash screen: Yes — brief logo flash until app loaded (no minimum duration)

### Logo/Visual Branding
- No image logo currently — text-based "GSD-UI" in cyan
- Splash screen: "GSD-UI" text centered during loading
- Style: Claude's discretion (recommend terminal-style monospace to match app aesthetic)

### Claude's Discretion
- Exact font choice for GSD-UI text logo
- Precise cyan shade (should complement existing UI)
- Transition timing for splash screen fade
- Loading animation implementation details

</decisions>

<specifics>
## Specific Ideas

- Logo image exists at `src/assets/logo/gsd-ui-logo.png` but has no transparent background — use as color reference only (cyan blocks aesthetic)
- "thinking..." text matches the GSD workflow concept
- Keep the terminal-centric UX — branding shouldn't be intrusive

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-rebranding*
*Context gathered: 2026-01-25*
