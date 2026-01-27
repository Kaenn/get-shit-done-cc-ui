# Stack Research

**Domain:** Plugin system for Tauri/React desktop apps
**Researched:** 2025-01-24
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Tauri Plugin API | 2.x | Native plugin system | Official Tauri 2.0 plugin architecture with IPC bridge, mobile support, and comprehensive security validation. Used in ~30 official plugins. |
| Zod | ^4.3.6 | Plugin config schema validation | TypeScript-first validation with static type inference (`z.infer<T>`). HIGH reputation, 112K+ code snippets. Eliminates need for duplicate type definitions. |
| Zustand (slices pattern) | ^5.0.10 | Plugin state isolation | Lightweight (14M weekly downloads), built on hooks, minimal re-renders. Slices pattern enables plugin-scoped stores without cross-contamination. |
| React Context API | Built-in | Plugin provider pattern | Native solution for plugin registration and data injection without prop drilling. Zero dependencies, works seamlessly with Zustand. |

**Confidence:** HIGH - All core technologies verified via Context7 and official documentation.

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| chokidar | ^5.0.0 | File system watching | For .planning/ directory monitoring. ESM-only, requires Node.js v20+. Proven in ~30M repositories. Use for hot-reload of plugin data sources. |
| vite-tsconfig-paths | ^6.x | TypeScript path mapping | For plugin import aliases (`@plugins/*`, `@core/*`). Lazy tsconfig discovery, automatic reloads. Use to enforce plugin/core separation. |
| react-error-boundary | ^6.1.0 | Plugin isolation | Prevents plugin crashes from breaking core app. Per-plugin error boundaries with fallback UI. Use for production reliability. |
| @poppinss/chokidar-ts | Latest | TypeScript-aware file watching | Alternative to chokidar for TypeScript projects. Auto-detects tsconfig.json includes/excludes. Use if plugins include TypeScript files. |

**Confidence:** HIGH - Versions verified from official GitHub repos and web search (Jan 2025).

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Tauri CLI 2.x | Plugin scaffolding | Use `npx @tauri-apps/cli plugin new [name]` for bootstrapping. Generates Rust crate + NPM package structure. |
| TypeScript 5.5+ | Type safety | Required for Zod strict mode. Use strict: true in tsconfig.json. |
| Vite | Build tooling | Already in your stack. Use for plugin hot-reload via vite-tsconfig-paths. |

## Installation

```bash
# Core plugin infrastructure
npm install zod@^4.3.6 zustand@^5.0.10 react-error-boundary@^6.1.0

# File system watching (choose one)
npm install chokidar@^5.0.0  # General purpose, requires Node.js v20+
npm install @poppinss/chokidar-ts  # TypeScript-aware alternative

# Development
npm install -D vite-tsconfig-paths@^6 @types/node

# Tauri plugin tools (if creating native plugins)
npx @tauri-apps/cli plugin new [plugin-name]
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Zod | Yup | If you need async validation or already invested in Formik ecosystem |
| Zod | TypeBox | If you need JSON Schema output for OpenAPI specs or prefer JSON Schema-first approach |
| Zustand (slices) | Redux Toolkit | If you need time-travel debugging, devtools middleware, or complex async workflows with sagas |
| React Context | Jotai | If you prefer atomic state updates or need derived state without selectors |
| chokidar | Node.js fs.watch | NEVER - fs.watch is platform-inconsistent and unreliable |
| Tauri plugins | Electron IPC | If already using Electron (but Tauri is 10MB vs Electron's 100MB+) |

**Confidence:** MEDIUM - Alternatives based on ecosystem research and community patterns.

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Native fs.watch | Platform inconsistencies, missing recursive support, unreliable events | chokidar v5 or @poppinss/chokidar-ts |
| Global Zustand store | Plugin state leakage, circular dependencies, testing nightmares | Zustand slices pattern with plugin-scoped stores |
| Prop drilling for plugin data | Unscalable, breaks encapsulation, tight coupling | React Context API with provider pattern |
| JSON Schema + manual types | Synchronization drift, duplicate definitions | Zod with z.infer<T> for single source of truth |
| Class-based error boundaries | Verbose, incompatible with hooks, outdated pattern | react-error-boundary (built on modern hooks) |
| require() for plugin imports | No tree-shaking, no static analysis, no TypeScript integration | ES modules with dynamic import() for lazy loading |

**Confidence:** HIGH - Based on official documentation warnings and 2025 best practices.

## Stack Patterns by Variant

### Pattern 1: File-Based Plugin Discovery
**If plugins are config files only (no code execution):**
- Use chokidar v5 to watch `.plugins/` directory
- Use Zod to validate plugin manifest JSON/YAML
- Use Zustand slices to store plugin-specific state
- Because this is safest and simplest - no eval(), no security risks

**Example:**
```typescript
// .plugins/gsd.config.ts
import { z } from 'zod';

export const gsdPluginSchema = z.object({
  id: z.string(),
  name: z.string(),
  dataSource: z.string(), // path to .planning/
  components: z.object({
    treeView: z.string(), // component path
    statusIndicator: z.string(),
  }),
});

export type GsdPluginConfig = z.infer<typeof gsdPluginSchema>;
```

### Pattern 2: Code-Based Plugin Registration
**If plugins include React components and business logic:**
- Use TypeScript path mapping (`@plugins/*/index.ts`)
- Use React.lazy() + Suspense for code splitting
- Use react-error-boundary per plugin
- Use Zustand slices with middleware (persist, devtools)
- Because this enables full plugin extensibility while maintaining isolation

**Example:**
```typescript
// core/plugin-registry.tsx
import { create } from 'zustand';
import { lazy, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

const GsdPlugin = lazy(() => import('@plugins/gsd'));

function PluginContainer({ pluginId }: { pluginId: string }) {
  return (
    <ErrorBoundary fallback={<PluginError id={pluginId} />}>
      <Suspense fallback={<PluginLoading />}>
        <GsdPlugin />
      </Suspense>
    </ErrorBoundary>
  );
}
```

### Pattern 3: Hybrid (Recommended for Your Use Case)
**For GSD plugin with file-based data + React UI:**
- Use chokidar to watch `.planning/` directory
- Use Zod to validate PLAN.md, PHASE.md structure
- Use Zustand slice for GSD state (isolated from core)
- Use React Context to provide GSD data to tree/status components
- Use slot pattern for core to render plugin UI
- Because this balances flexibility with safety - plugins can't break core

**Architecture:**
```
Core provides:
  - PluginRegistry (Zustand + Context)
  - Slot components (<TreeView />, <StatusBar />)
  - Error boundaries per plugin

GSD plugin provides:
  - gsd.config.ts (Zod schema)
  - useGsdStore (Zustand slice)
  - GsdTreeView (slot implementation)
  - GsdStatusIndicator (slot implementation)
  - .planning/ watcher (chokidar)
```

**Confidence:** HIGH - Pattern validated against Tauri plugin architecture docs.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Zod ^4.3.6 | TypeScript ^5.5 | Requires strict mode in tsconfig.json |
| Zustand ^5.0.10 | React ^18.0.0, React ^19.0.0 | React 19 treats ref as prop (no forwardRef needed) |
| chokidar ^5.0.0 | Node.js ^20.0.0 | ESM-only, increased minimum version in v5 |
| vite-tsconfig-paths ^6 | Vite ^5.0.0, TypeScript ^5.0 | Lazy tsconfig discovery in v6 |
| react-error-boundary ^6.1.0 | React ^18.0.0, React ^19.0.0 | Built on modern hooks (no class components) |
| Tauri Plugin API 2.x | Tauri ^2.0.0 | Mobile support (iOS Swift, Android Kotlin) |

**Confidence:** HIGH - Compatibility verified from official changelogs and package.json peerDependencies.

## Sources

### Official Documentation (HIGH Confidence)
- [Tauri Plugin Development](https://v2.tauri.app/develop/plugins/) - Plugin structure, IPC patterns
- [Tauri Architecture](https://v2.tauri.app/concept/architecture/) - Security model, frontend-backend communication
- [Zod Official Docs](https://zod.dev/) - Type inference, schema validation patterns
- [Zod GitHub](https://github.com/colinhacks/zod) - v4.3.6 release (Jan 22, 2026)
- [Context7: Zod Documentation](/websites/zod_dev) - Plugin configuration schemas, z.infer examples

### Ecosystem Research (MEDIUM Confidence)
- [Tauri 2.0 Release](https://v2.tauri.app/blog/tauri-20/) - Advanced plugin system overview
- [Chokidar GitHub](https://github.com/paulmillr/chokidar) - v5.0.0 ESM requirements (Nov 2025)
- [React Provider Pattern](https://www.patterns.dev/vanilla/provider-pattern/) - Component composition patterns
- [React Slot Pattern](https://dev.to/neetigyachahar/what-is-the-react-slots-pattern-2ld9) - Flexible UI composition (Dec 2024)
- [Zustand State Management 2025](https://www.zignuts.com/blog/react-state-management-2025) - Slices pattern, middleware
- [Building Component Registry](https://medium.com/front-end-weekly/building-a-component-registry-in-react-4504ca271e56) - Plugin discovery patterns

### Web Search Verification (LOW-MEDIUM Confidence)
- [TypeScript Path Mapping](https://www.typescriptlang.org/tsconfig/paths.html) - baseUrl and paths config
- [vite-tsconfig-paths GitHub](https://github.com/aleclarson/vite-tsconfig-paths) - v6 lazy discovery
- [React Error Handling 2025](https://javascript.plainenglish.io/react-error-handling-2025-edition-onuncaughterror-boundaries-logging-ea7a679de22a) - Modern error boundary patterns
- [Zustand npm](https://generalistprogrammer.com/tutorials/zustand-npm-package-guide) - v5.0.10 (14M weekly downloads)
- [react-error-boundary npm](https://generalistprogrammer.com/tutorials/react-error-boundary-npm-package-guide) - v6.1.0 (Jan 2025)

---
*Stack research for: Plugin system for Tauri/React desktop apps (adding to existing OPCode fork)*
*Researched: 2025-01-24*
*Researcher: gsd-project-researcher*
*Verification: All core technology versions confirmed via official sources (GitHub releases, Context7)*

---

# v1.1 UI Enhancements: Stack Additions

**Project:** GSD-UI v1.1
**Researched:** 2026-01-25
**Overall Confidence:** HIGH

## Executive Summary

The v1.1 UI enhancements require four specific capabilities: markdown rendering with frontmatter, icon sidebar, and dynamic forms. The existing stack (React 18, Tailwind, Zustand, Radix UI) already provides excellent foundations. Only **two new libraries** are needed: `gray-matter` for YAML frontmatter parsing and `@radix-ui/react-toggle-group` for the icon sidebar. All other capabilities can be achieved with existing dependencies.

---

## Existing Stack Analysis

### Already Installed (No Changes Needed)

| Package | Current Version | Purpose for v1.1 |
|---------|-----------------|------------------|
| `react-markdown` | 9.1.0 | Markdown rendering (already used in `StreamMessage.tsx`) |
| `remark-gfm` | 4.0.1 | GitHub Flavored Markdown (already used) |
| `react-hook-form` | 7.60.0 | Form state management for command forms |
| `@hookform/resolvers` | 3.10.0 | Zod integration for form validation |
| `zod` | 3.25.76 | Schema validation for dynamic forms |
| `lucide-react` | 0.468.0 | Icons for activity bar (already 76+ files use it) |
| `zustand` | 5.x | State management for sidebar/panel visibility |
| `@radix-ui/react-collapsible` | 1.1.12 | Collapsible sections (already used in GSD tree) |

### Existing Patterns to Reuse

1. **Markdown Rendering**: `StreamMessage.tsx` already renders markdown with syntax highlighting using `react-markdown` + `remark-gfm` + `react-syntax-highlighter`
2. **Frontmatter Parsing**: `parsers.ts` already has a simple regex-based frontmatter parser (lines 170-176) - can extend or replace with gray-matter
3. **Icon-based UI**: `lucide-react` icons are used consistently throughout the app
4. **Form Patterns**: `CreateAgent.tsx`, `Settings.tsx` use `react-hook-form` + `zod`
5. **Panel State**: `gsdStore.ts` already manages panel visibility/width with Zustand persist

---

## Recommended Additions

### 1. gray-matter (YAML Frontmatter Parser)

- **Version:** ^4.0.3
- **Purpose:** Parse YAML frontmatter from markdown files (PLAN.md, etc.)
- **Why this one:**
  - Industry standard used by Gatsby, Astro, Vite, Netlify, TinaCMS
  - Battle-tested with 2,400+ dependents on npm
  - Handles complex edge cases (fenced code blocks containing YAML examples)
  - Zero-config YAML parsing, extensible to JSON/TOML if needed
  - Does NOT use regex for parsing (faster, more reliable than regex approach)
- **Integration:** Replaces the existing regex-based frontmatter parser in `parsers.ts`
- **Confidence:** HIGH - Verified via npm, well-maintained, MIT license

```typescript
// Usage example
import matter from 'gray-matter';

const { data, content } = matter(fileContent);
// data = { phase: "02-visualization", plan: 1 }
// content = markdown body without frontmatter
```

### 2. @radix-ui/react-toggle-group (Icon Sidebar)

- **Version:** ^1.1.11
- **Purpose:** VSCode-style activity bar with icon toggle buttons
- **Why this one:**
  - Already using Radix UI ecosystem (consistent styling/patterns)
  - Proper keyboard navigation (roving tabindex)
  - Supports single/multiple selection modes
  - Accessible by default (ARIA labels, focus management)
  - Works with lucide-react icons
- **Integration:** Complements existing `@radix-ui/react-collapsible` for sidebar sections
- **Confidence:** HIGH - Same ecosystem as existing Radix components

```typescript
// Usage pattern - matches existing Radix patterns
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { FileText, Settings, GitBranch } from 'lucide-react';

<ToggleGroup.Root type="single" value={activeView} onValueChange={setActiveView}>
  <ToggleGroup.Item value="files"><FileText /></ToggleGroup.Item>
  <ToggleGroup.Item value="git"><GitBranch /></ToggleGroup.Item>
  <ToggleGroup.Item value="settings"><Settings /></ToggleGroup.Item>
</ToggleGroup.Root>
```

---

## No New Libraries Needed For

### Markdown Rendering (Read-Only)
- **Use existing:** `react-markdown` 9.1.0 + `remark-gfm` 4.0.1
- **Why not upgrade:** Current versions are stable and already integrated with syntax highlighting
- **Pattern:** Copy the rendering pattern from `StreamMessage.tsx` (lines 153-307)

### Dynamic Command Forms
- **Use existing:** `react-hook-form` + `zod` + `@hookform/resolvers`
- **Why:** Schema-driven form generation is built-in capability
- **Pattern:** Define Zod schemas per command, use `zodResolver`, render fields dynamically

```typescript
// Dynamic form from command schema
const schema = z.object({
  projectName: z.string().min(1),
  phase: z.number().optional(),
});

const { register, handleSubmit } = useForm({
  resolver: zodResolver(schema)
});
```

### State Tree Visualization
- **Use existing:** `GSDTreeNode.tsx` pattern + Zustand + `@radix-ui/react-collapsible`
- **Why:** Already have tree components, just need to connect to different data source

---

## Not Recommended

### @uiw/react-md-editor
- **Already installed** for CLAUDE.md editing
- **Don't use for read-only view** - it's an editor, not a renderer
- Adds unnecessary complexity/bundle size for read-only markdown display

### marked / markdown-it
- **Why not:** `react-markdown` already installed and integrated
- Using `dangerouslySetInnerHTML` would lose React component benefits
- Would require rewriting existing markdown rendering patterns

### Full sidebar libraries (react-pro-sidebar, etc.)
- **Why not:** Adds unnecessary weight
- Radix ToggleGroup + Tailwind is simpler and consistent with existing patterns
- VSCode-style activity bar is just a vertical button group

### @radix-ui/react-icons
- **Why not:** Already using `lucide-react` with 500+ icons
- Would create inconsistency mixing icon libraries
- Lucide has better TypeScript support and tree-shaking

### gray-matter alternatives (front-matter, yaml-front-matter)
- **Why not:** `gray-matter` has 15x more downloads than alternatives
- Better maintained (by @jonschlinkert, same author as many build tools)
- More features (custom delimiters, excerpt extraction)

---

## Version Compatibility Matrix

| Package | Current in Project | Latest Available | Action |
|---------|-------------------|------------------|--------|
| `react-markdown` | 9.1.0 | 10.1.0 | Keep current (breaking changes in v10) |
| `remark-gfm` | 4.0.1 | 4.0.1 | Current |
| `zod` | 3.25.76 | 4.3.6 | Keep current (v4 has breaking changes) |
| `react-hook-form` | 7.60.0 | 7.71.1 | Optional upgrade (minor) |
| `lucide-react` | 0.468.0 | 0.563.0 | Optional upgrade (additive) |
| `gray-matter` | N/A | 4.0.3 | **ADD NEW** |
| `@radix-ui/react-toggle-group` | N/A | 1.1.11 | **ADD NEW** |

---

## Installation Command

```bash
npm install gray-matter@^4.0.3 @radix-ui/react-toggle-group@^1.1.11
```

---

## Integration Points

### 1. Frontmatter Parsing Integration

**File to modify:** `/src/lib/gsd/parsers.ts`

Replace the regex-based parser (lines 170-176) with gray-matter:

```typescript
import matter from 'gray-matter';

export function parsePlanMd(content: string, hasSummary: boolean): PlanInfo | null {
  const { data, content: body } = matter(content);

  const phaseNumber = parseInt(String(data.phase).match(/^(\d+)/)?.[1] || '0', 10);
  const planNumber = parseInt(String(data.plan), 10);

  // Extract name from <objective> tag in body
  const objectiveMatch = body.match(/<objective>\s*\n([^\n]+)/);
  const name = objectiveMatch ? objectiveMatch[1].trim() : `Plan ${planNumber.toString().padStart(2, '0')}`;

  return { phaseNumber, planNumber, name, status: hasSummary ? 'complete' : 'pending' };
}
```

### 2. Icon Sidebar Integration

**Create new component:** `/src/components/ui/activity-bar.tsx`

```typescript
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { cn } from '@/lib/utils';

export const ActivityBar = ToggleGroup.Root;
export const ActivityBarItem = React.forwardRef<...>(({ className, ...props }, ref) => (
  <ToggleGroup.Item
    ref={ref}
    className={cn(
      "p-3 text-muted-foreground hover:text-foreground",
      "data-[state=on]:text-primary data-[state=on]:bg-primary/10",
      className
    )}
    {...props}
  />
));
```

### 3. Dynamic Forms Integration

**Pattern for command forms:** Extend existing `gsdStore.ts` with command schema definitions

```typescript
// Command schema example
const newProjectSchema = z.object({
  projectName: z.string().min(1, "Project name required"),
  description: z.string().optional(),
});

// Dynamic field renderer based on schema
function renderFieldsFromSchema(schema: z.ZodObject<any>) {
  return Object.entries(schema.shape).map(([key, field]) => {
    // Render appropriate input based on field type
  });
}
```

---

## Confidence Assessment

| Area | Level | Reasoning |
|------|-------|-----------|
| Frontmatter (gray-matter) | HIGH | Industry standard, npm verified, clear documentation |
| Icon Sidebar (Radix ToggleGroup) | HIGH | Same ecosystem as existing components, well-documented |
| Markdown Rendering | HIGH | Already working in codebase, just reuse patterns |
| Dynamic Forms | HIGH | Existing libraries already installed and in use |

---

## Sources

- [gray-matter npm](https://www.npmjs.com/package/gray-matter) - Version 4.0.3
- [gray-matter GitHub](https://github.com/jonschlinkert/gray-matter) - Documentation and usage
- [NPM Compare: gray-matter vs alternatives](https://npm-compare.com/front-matter,gray-matter,yaml-front-matter)
- [Radix UI Toggle Group](https://www.radix-ui.com/primitives/docs/components/toggle-group) - Official docs
- [Radix UI Accessible Icon](https://www.radix-ui.com/primitives/docs/utilities/accessible-icon) - Icon accessibility
- [React Hook Form + Zod Integration](https://ui.shadcn.com/docs/forms/react-hook-form) - shadcn/ui patterns
- [Dynamic Forms with Zustand + RHF + Zod](https://medium.com/@rahulshukla_9187/dynamic-forms-in-react-with-zustand-react-hook-form-zod-c866cb4f7a69)
- [react-markdown vs alternatives comparison](https://npm-compare.com/markdown-it,react-markdown)

---
*v1.1 Stack Research: UI Enhancements*
*Researched: 2026-01-25*
*Researcher: gsd-project-researcher*
