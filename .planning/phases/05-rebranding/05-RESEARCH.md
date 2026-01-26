# Phase 5: Rebranding - Research

**Researched:** 2026-01-25
**Domain:** Application Rebranding (Tauri/React Desktop App)
**Confidence:** HIGH

## Summary

This research covers the technical requirements for rebranding a Tauri 2 + React desktop application from "OPCode" to "GSD-UI". The standard approach involves updating configuration files (Tauri config, package.json), replacing branding strings throughout the codebase, implementing color scheme changes through CSS custom properties, creating a splash screen with text-based branding, and adding clickable attribution in the UI.

**Key findings:**
- Tauri 2 provides robust APIs for window title management and external link handling
- OKLCH color system in CSS custom properties enables precise, perceptually-uniform color theming
- Splash screen implementation follows Tauri's two-window pattern (hidden main + visible splash)
- CSS animation patterns for loading states are well-established with multiple approaches

**Primary recommendation:** Use a systematic file-by-file approach starting with configuration files, then branding strings, then color scheme, then visual elements (splash/loading/attribution). Leverage existing CSS custom property architecture for color changes. Implement splash screen using React component with framer-motion for transitions rather than separate HTML file for maintainability.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tauri | 2.x | Desktop app framework | Official framework for the project, provides window/config APIs |
| React | 18.3.1 | UI framework | Already used, handles splash screen and attribution components |
| framer-motion | 12.0.0 | Animation library | Already in project, handles splash screen transitions elegantly |
| CSS Custom Properties | Native | Color theming | Modern CSS standard, already used in project for theming |
| OKLCH color space | Native | Perceptual color definition | Best practice for 2026, provides uniform lightness across hues |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tauri-apps/api | 2.1.1 | Tauri JS bindings | Window title updates, external link opening via opener plugin |
| @tauri-apps/plugin-opener | 2.x | Open external URLs | Attribution link to GitHub (opens in default browser) |
| lucide-react | 0.468.0 | Icon library | If adding visual icons for branding (optional) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| OKLCH | HSL/RGB | OKLCH provides perceptual uniformity, better for cyan replacement |
| Framer-motion | CSS-only animations | Framer-motion already in project, provides better control |
| React splash component | Separate HTML file | React component is more maintainable and shares styles |
| Text-based logo | SVG/image logo | User specified text-based for now, easier to style |

**Installation:**
No new dependencies required - all capabilities exist in current stack.

## Architecture Patterns

### Recommended File Organization
```
Rebranding touches these areas:
├── Configuration/
│   ├── package.json              # Product name, app ID, metadata
│   ├── src-tauri/tauri.conf.json # Window title, product name, bundle info
│   └── src-tauri/Cargo.toml      # Rust package metadata
├── Branding Strings/
│   ├── src/**/*.{tsx,ts}         # Code references to "opcode"/"OPCode"
│   ├── index.html                # HTML title tag
│   └── README.md                 # Documentation
├── Visual Identity/
│   ├── src/styles.css            # Color custom properties (violet→cyan)
│   ├── src/assets/shimmer.css    # Animated elements using color
│   ├── src/lib/claudeSyntaxTheme.ts # Syntax highlighting colors
│   └── src/components/StartupIntro.tsx # Splash screen component
└── Attribution/
    └── src/components/            # New attribution component
```

### Pattern 1: Configuration File Updates
**What:** Update product names, identifiers, and metadata in config files
**When to use:** First step in rebranding - establishes foundation

**Tauri Config (src-tauri/tauri.conf.json):**
```json
{
  "productName": "GSD-UI",
  "identifier": "gsd-ui.asterisk.so",
  "app": {
    "windows": [{
      "title": "GSD-UI"
    }]
  },
  "bundle": {
    "shortDescription": "GUI app and Toolkit for Claude Code",
    "longDescription": "GSD-UI is a comprehensive GUI application...",
    "copyright": "Built on OPCode. © 2025 Asterisk."
  }
}
```

**Package.json:**
```json
{
  "name": "gsd-ui",
  "productName": "GSD-UI",
  "description": "GUI app and Toolkit for Claude Code"
}
```

**Source:** Tauri v2 configuration documentation, Electron packaging patterns adapted for Tauri

### Pattern 2: Color Scheme Migration (Violet/Purple → Cyan)
**What:** Replace violet/purple color values with cyan throughout CSS
**When to use:** After config updates, before visual component changes

**Current violet colors found:**
- `#8B5CF6` (violet in syntax highlighting)
- `#8b5cf6` (rotating-symbol color in shimmer.css)
- Various violet/purple values in claudeSyntaxTheme.ts

**Cyan color values (OKLCH for perceptual uniformity):**
```css
/* Primary cyan accent */
--color-cyan-base: oklch(0.70 0.15 200);        /* Base cyan */
--color-cyan-muted: oklch(0.70 0.10 200);       /* Muted cyan */
--color-cyan-bright: oklch(0.80 0.18 200);      /* Bright cyan */

/* Specific use cases */
--color-accent-primary: var(--color-cyan-base);  /* Main accent color */
.rotating-symbol { color: oklch(0.70 0.15 200); } /* Loading spinner */
```

**OKLCH benefits:**
- Perceptual lightness uniformity (L value) ensures cyan at 70% lightness matches violet's perceived brightness
- Chroma (C) controls saturation independently of lightness
- Hue (H) at ~200 provides true cyan (vs ~270 for violet)

**Source:** [OKLCH in CSS](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl), [Easy Theming with OKLCH](https://manuel-strehl.de/easy_theming_with_oklch)

### Pattern 3: Splash Screen Implementation
**What:** Display "GSD-UI" text logo during app startup
**When to use:** Part of startup experience, before main UI loads

**Approach:** React component with conditional visibility (cleaner than separate HTML file)

```tsx
// Modify existing StartupIntro.tsx
export function StartupIntro({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-background"
        >
          {/* Cyan-colored glow */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(800px circle at 50% 55%, oklch(0.70 0.15 200 / 0.08), transparent 65%)"
            }}
          />

          {/* GSD-UI text logo - monospace terminal style */}
          <div className="text-5xl font-mono font-extrabold tracking-tight text-cyan">
            <span className="text-cyan-bright">GSD-UI</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Font recommendation:** Use `font-mono` (already defined as `var(--font-mono)` in styles.css) for terminal-centric aesthetic consistency

**Source:** [Tauri Splashscreen Guide](https://v2.tauri.app/learn/splashscreen/), current StartupIntro.tsx implementation

### Pattern 4: Loading Animation (Progress Dots)
**What:** Terminal-style loading with progress dots + "thinking..." text
**When to use:** During operations, non-terminal contexts use simple spinner

**CSS-only implementation:**
```css
@keyframes dot-pulse {
  0%, 20% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(0.8); }
  100% { opacity: 1; transform: scale(1); }
}

.loading-dots {
  display: inline-flex;
  gap: 0.25rem;
  color: oklch(0.70 0.15 200); /* Cyan */
}

.loading-dots span {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  background-color: currentColor;
  animation: dot-pulse 1.4s ease-in-out infinite;
}

.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }
```

**React component:**
```tsx
function LoadingIndicator() {
  return (
    <div className="flex items-center gap-2">
      <div className="loading-dots">
        <span />
        <span />
        <span />
      </div>
      <span className="text-cyan text-sm">thinking...</span>
    </div>
  );
}
```

**Source:** [Bouncing Dots Loader](https://dev.to/kirteshbansal/bouncing-dots-loader-in-react-4jng), [Loading Dots Tailwind](https://tailwindflex.com/@anonymous/loading-dots)

### Pattern 5: Attribution Component (Bottom-Right)
**What:** Clickable "Built on OPCode" text that opens GitHub in browser
**When to use:** Visible in main app UI, unobtrusive footer position

```tsx
import { open } from '@tauri-apps/plugin-opener';

function Attribution() {
  const handleClick = async () => {
    try {
      await open('https://github.com/winfunc/opcode');
    } catch (error) {
      console.error('Failed to open link:', error);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-4 right-4 text-xs text-muted-foreground hover:text-cyan-bright transition-colors cursor-pointer"
      aria-label="Built on OPCode - Opens GitHub repository"
    >
      Built on OPCode
    </button>
  );
}
```

**Positioning:** `fixed bottom-4 right-4` ensures always visible, doesn't interfere with main UI
**Styling:** Subtle muted color with cyan hover for brand consistency

**Source:** [Tauri Opener Plugin](https://v2.tauri.app/plugin/opener/), [Tauri External Links Discussion](https://github.com/tauri-apps/tauri/discussions/11809)

### Pattern 6: Dynamic Window Title Updates
**What:** Set window title to "GSD-UI" programmatically (in addition to config)
**When to use:** When creating tabs or updating context dynamically

```tsx
import { getCurrentWindow } from '@tauri-apps/api/window';

async function updateWindowTitle(subtitle?: string) {
  const window = getCurrentWindow();
  const title = subtitle ? `GSD-UI - ${subtitle}` : 'GSD-UI';
  await window.setTitle(title);
}
```

**Note:** This supplements the config-level title for dynamic scenarios

**Source:** [Tauri Window API](https://v2.tauri.app/reference/javascript/api/namespacewindow/), [Window Customization](https://v2.tauri.app/learn/window-customization/)

### Anti-Patterns to Avoid
- **Hard-coding colors:** Use CSS custom properties for all color values (enables future theme changes)
- **Separate splash HTML:** Maintain splash screen as React component for style/state consistency
- **Blocking animations:** Keep animations non-blocking, use framer-motion exit animations properly
- **Inconsistent naming:** Use "GSD-UI" (hyphenated) everywhere, not "GSD UI" or "GSDUI"
- **Missing opener plugin:** Don't use `window.open()` for external links - Tauri requires opener plugin

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| External link opening | `<a target="_blank">` or `window.open()` | `@tauri-apps/plugin-opener` | Tauri security sandbox requires opener plugin, standard `<a>` tags open in Tauri window not browser |
| Progress dots animation | Complex JS interval logic | CSS keyframe animations with staggered delays | CSS animations are more performant, no JS execution during animation |
| Color theming | Manual find/replace of hex values | CSS custom properties with OKLCH | Enables runtime theme changes, maintains perceptual uniformity |
| Window title management | Direct DOM manipulation | Tauri window API `setTitle()` | Tauri windows are native, DOM title changes don't affect window chrome |
| Splash screen timing | `setTimeout` delays | React state + framer-motion AnimatePresence | Handles cleanup properly, ties to actual app ready state not arbitrary timeout |

**Key insight:** Desktop app frameworks like Tauri require using framework APIs for native operations (window management, external links) rather than web browser APIs. CSS-first approaches for animations are more performant than JavaScript-based solutions.

## Common Pitfalls

### Pitfall 1: Incomplete Color Replacement
**What goes wrong:** Missing violet/purple references in syntax highlighting, animations, or dynamically-generated colors
**Why it happens:** Color values appear in multiple formats (hex, named, RGB, OKLCH) across CSS, TypeScript theme objects, and inline styles
**How to avoid:**
1. Search for all color formats: `#8B5CF6`, `#8b5cf6`, `violet`, `purple`, `rgb(139, 92, 246)`
2. Check TypeScript files: `claudeSyntaxTheme.ts` contains theme object with color values
3. Verify animations: `shimmer.css` has hard-coded colors in `rotating-symbol` class
4. Test all theme modes: dark, gray, light, white themes may have different violet shades

**Warning signs:** UI elements still showing purple/violet after color replacement, syntax highlighting using old colors

### Pitfall 2: External Links Not Opening in Browser
**What goes wrong:** Clicking attribution link opens blank Tauri window instead of default browser
**Why it happens:** Tauri sandboxes web navigation - standard `<a>` tags or `window.open()` don't work like in browsers
**How to avoid:**
1. Import opener plugin: `import { open } from '@tauri-apps/plugin-opener';`
2. Use async function: `await open('https://github.com/winfunc/opcode');`
3. Handle errors: Wrap in try/catch to log failures
4. Configure plugin: Ensure `tauri.conf.json` enables opener plugin (may need to add to `plugins` section)

**Warning signs:** Link click creates new window showing "Failed to load" or blank screen

### Pitfall 3: Splash Screen Flicker
**What goes wrong:** Brief white flash or UI glimpse before splash screen appears
**Why it happens:** Main window becomes visible before splash component mounts or animations complete
**How to avoid:**
1. Set initial visibility state: `useState(true)` for splash visibility in App.tsx
2. Background color consistency: Splash background should match app background (`bg-background`)
3. Use AnimatePresence properly: Wrap splash in AnimatePresence to handle exit animations
4. Coordinate timing: Don't hide splash until main UI is fully rendered (check DOM ready state)

**Warning signs:** Users report seeing brief flash of main UI during startup, animations feel janky

### Pitfall 4: Package/Config Naming Inconsistency
**What goes wrong:** Some places show "GSD UI" (no hyphen), others "gsd-ui" (lowercase), causing confusion
**Why it happens:** Different conventions for different config fields (technical names vs display names)
**How to avoid:**
1. **Technical names** (lowercase, hyphenated): `"name": "gsd-ui"` in package.json, `identifier` in tauri.conf.json
2. **Display names** (proper case, hyphenated): `"productName": "GSD-UI"` everywhere visible to users
3. **Documentation** (consistent): Always "GSD-UI" in README, comments, descriptions
4. Create checklist of all locations requiring name updates

**Warning signs:** Window title shows old name, installer has wrong name, error messages reference "opcode"

### Pitfall 5: Color Scheme Breaking Theme Switching
**What goes wrong:** Cyan colors look good in dark theme but have poor contrast or wrong appearance in light theme
**Why it happens:** Direct color replacement without adjusting lightness values for theme contexts
**How to avoid:**
1. Use different OKLCH lightness per theme:
   - Dark theme: `oklch(0.70 0.15 200)` - brighter cyan
   - Light theme: `oklch(0.50 0.15 200)` - darker cyan for contrast
2. Test all four theme modes: dark, gray, light, white
3. Check contrast ratios: Use browser dev tools to verify WCAG AA compliance (4.5:1 for text)
4. Verify syntax highlighting: Each theme in `claudeSyntaxTheme.ts` needs cyan values adjusted

**Warning signs:** Cyan text invisible or hard to read in light themes, accessibility warnings in browser console

### Pitfall 6: Logo Image vs Text Logo Confusion
**What goes wrong:** Using existing `gsd-ui-logo.png` which has no transparent background, looks blocky
**Why it happens:** Context specifies image exists but shouldn't be used due to aesthetic issues
**How to avoid:**
1. Use text-based logo only: `<span className="text-cyan">GSD-UI</span>`
2. Apply font styling: `font-mono` for terminal aesthetic
3. Ignore existing PNG: Context notes PNG is for "color reference only"
4. Future-proof: If logo needed later, generate SVG or transparent PNG

**Warning signs:** Blocky cyan rectangle appears instead of clean text, design looks unprofessional

## Code Examples

Verified patterns from research:

### Color Custom Properties Update
```css
/* src/styles.css - Replace violet accent with cyan */
@theme {
  /* OLD - Remove these */
  /* Violet references removed */

  /* NEW - Add cyan variables */
  --color-cyan-base: oklch(0.70 0.15 200);
  --color-cyan-muted: oklch(0.70 0.10 200);
  --color-cyan-bright: oklch(0.80 0.18 200);

  /* Update accent colors to use cyan */
  --color-primary: oklch(0.70 0.15 200);
  --color-ring: oklch(0.70 0.15 200);
}

/* Light theme adjustments */
.theme-light {
  --color-cyan-base: oklch(0.50 0.15 200);  /* Darker for light bg */
  --color-cyan-bright: oklch(0.40 0.18 200);
}

/* Update rotating symbol */
.rotating-symbol {
  color: oklch(0.70 0.15 200); /* Was #8B5CF6 */
}
```

### Attribution Component Implementation
```tsx
// src/components/Attribution.tsx
import { open } from '@tauri-apps/plugin-opener';

export function Attribution() {
  const handleAttributionClick = async () => {
    try {
      await open('https://github.com/winfunc/opcode');
    } catch (error) {
      console.error('Failed to open OPCode repository:', error);
    }
  };

  return (
    <button
      onClick={handleAttributionClick}
      className="fixed bottom-4 right-4 z-50 text-xs text-muted-foreground hover:text-cyan-bright transition-colors duration-200 cursor-pointer"
      aria-label="View OPCode project on GitHub"
    >
      Built on OPCode
    </button>
  );
}

// Add to App.tsx or main layout component
function App() {
  return (
    <div>
      {/* Main app content */}
      <Attribution />
    </div>
  );
}
```

### Splash Screen Update
```tsx
// src/components/StartupIntro.tsx
import { AnimatePresence, motion } from "framer-motion";

export function StartupIntro({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-background"
          aria-hidden="true"
        >
          {/* Cyan ambient glow */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            style={{
              background: "radial-gradient(800px circle at 50% 55%, oklch(0.70 0.15 200 / 0.08), transparent 65%)",
              pointerEvents: "none",
            }}
          />

          {/* GSD-UI text logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative flex flex-col items-center justify-center gap-3"
          >
            {/* Main brand text - terminal style monospace */}
            <div className="text-6xl font-mono font-extrabold tracking-tight">
              <span style={{ color: 'oklch(0.80 0.18 200)' }}>GSD-UI</span>
            </div>

            {/* Optional: subtle loading indicator */}
            <div className="flex gap-1 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-bright animate-pulse" style={{ animationDelay: '0s' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-bright animate-pulse" style={{ animationDelay: '0.2s' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-bright animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### Loading Dots Component
```tsx
// src/components/LoadingDots.tsx
export function LoadingDots({ text = "thinking..." }: { text?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-cyan-bright animate-bounce"
            style={{
              animationDelay: `${i * 0.15}s`,
              animationDuration: '0.6s',
            }}
          />
        ))}
      </div>
      <span className="text-sm text-cyan-bright">{text}</span>
    </div>
  );
}

// Usage in terminal or other components
<LoadingDots text="thinking..." />
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| HSL/RGB colors | OKLCH color space | 2023-2024 | Better perceptual uniformity, easier theming across lightness values |
| Separate splash HTML | React component splash | Ongoing trend | Better style consistency, easier state management |
| `window.open()` for links | Framework-specific opener plugins | Tauri 2.x | Required for security sandbox, proper browser integration |
| CSS preprocessor variables | CSS Custom Properties | 2020+ | Runtime theme changes, native browser support, better performance |
| Manual icon editing | Icon generation tools | Ongoing | Icons remain unchanged for this phase, focus on branding strings |

**Deprecated/outdated:**
- **HSL for design systems**: OKLCH provides perceptually uniform colors, HSL fails to maintain consistent lightness across hues
- **Inline style colors**: Use CSS custom properties for all colors to enable theming
- **Synchronous title updates**: Tauri window operations are async, must await
- **Target="_blank" in Tauri**: Doesn't open external browser, use opener plugin

## Open Questions

Things that couldn't be fully resolved:

1. **Exact cyan shade preference**
   - What we know: OKLCH 200° hue provides cyan, lightness around 0.70 for dark theme
   - What's unclear: User's exact preferred shade of cyan (teal-leaning vs blue-cyan)
   - Recommendation: Start with `oklch(0.70 0.15 200)`, adjust based on visual feedback. Context mentions "complement existing UI" so test against current color scheme.

2. **Splash screen duration**
   - What we know: Context says "no minimum duration", appears until app loaded
   - What's unclear: Whether to add fade-in delay for perceived polish vs immediate display
   - Recommendation: Show immediately (no artificial delay), tie visibility to actual app ready state. User prefers functional over cosmetic delays.

3. **Monospace font variant**
   - What we know: User wants "terminal-style monospace" for text logo
   - What's unclear: Whether to use existing Inter font or switch to dedicated monospace like SF Mono
   - Recommendation: Use `var(--font-mono)` (already defined, includes SF Mono on macOS). Consistent with terminal aesthetic of app.

4. **Attribution click behavior**
   - What we know: Opens GitHub link in default browser via opener plugin
   - What's unclear: Whether to show toast notification confirming link opened
   - Recommendation: Silent open (no toast) for cleaner UX. Only show error toast if open fails.

5. **Loading animation variants**
   - What we know: Terminal contexts use dots + "thinking...", non-terminal uses "simple spinner"
   - What's unclear: What constitutes "terminal context" vs "non-terminal" - needs definition during planning
   - Recommendation: Terminal = command execution/session views. Non-terminal = general UI loading states. Plan should define specifically.

## Sources

### Primary (HIGH confidence)
- [Tauri v2 Splashscreen Guide](https://v2.tauri.app/learn/splashscreen/) - Official splash screen implementation patterns
- [Tauri v2 Window API](https://v2.tauri.app/reference/javascript/api/namespacewindow/) - Window title and state management
- [Tauri Opener Plugin](https://v2.tauri.app/plugin/opener/) - External link handling in Tauri apps
- [OKLCH in CSS: why we moved from RGB and HSL](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl) - Color space best practices
- [Easy Theming with OKLCH colors](https://manuel-strehl.de/easy_theming_with_oklch) - OKLCH custom property patterns
- Current codebase analysis (package.json, tauri.conf.json, styles.css, StartupIntro.tsx, shimmer.css)

### Secondary (MEDIUM confidence)
- [Bouncing Dots Loader in React](https://dev.to/kirteshbansal/bouncing-dots-loader-in-react-4jng) - CSS animation patterns for loading dots
- [Loading Dots Tailwind Example](https://tailwindflex.com/@anonymous/loading-dots) - Alternative loading animation approaches
- [Tauri Window Customization](https://v2.tauri.app/learn/window-customization/) - Additional window configuration options
- [Modern CSS Toolkit 2026](https://www.nickpaolini.com/blog/modern-css-toolkit-2026) - CSS best practices for 2026

### Tertiary (LOW confidence)
- Electron packaging patterns (referenced for comparison, Tauri differs significantly)
- Community discussions on Tauri link handling (issues/discussions show problem space, official docs provide solution)

## Metadata

**Confidence breakdown:**
- Configuration updates: HIGH - Standard Tauri configuration patterns, well-documented
- Color scheme changes: HIGH - OKLCH widely supported (93%+ browsers), CSS custom properties are standard
- Splash screen: HIGH - Tauri official guide + existing React implementation provides clear path
- Loading animations: HIGH - Well-established CSS animation patterns, multiple verified examples
- Attribution component: HIGH - Tauri opener plugin is official solution, pattern is straightforward
- Exact visual preferences: MEDIUM - User provided direction but some details (cyan shade, font) are Claude's discretion per context

**Research date:** 2026-01-25
**Valid until:** 60 days (stable frameworks and CSS standards, slow-moving domain)

**Assumptions validated:**
- Tauri 2.x APIs are stable and documented
- OKLCH color space has sufficient browser support for production use
- Current codebase structure supports planned changes without major refactoring
- No new dependencies required for rebranding

**Gaps for planning phase:**
- Specific file list for string replacement (planning should enumerate all files)
- Testing strategy for color contrast across themes (planning should include accessibility checks)
- Rollback plan if issues found after deployment (planning should consider restore points)
