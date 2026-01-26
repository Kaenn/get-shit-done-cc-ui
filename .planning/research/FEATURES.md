# Feature Research

**Domain:** Plugin-based UI systems for desktop applications (CLI tool extensions)
**Researched:** 2026-01-24
**Confidence:** MEDIUM-HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Plugin registration system** | Standard in all plugin architectures (VS Code, Obsidian, Figma) | MEDIUM | Config-based declaration (package.json/manifest pattern). Must define plugin identity, version, dependencies |
| **Enable/disable per plugin** | Users expect granular control over extensions | LOW | Boolean toggle in settings UI. Strapi, VS Code, WordPress all provide this |
| **Plugin discovery/listing** | Users need to know what plugins are available and active | LOW | Simple UI showing installed plugins, status, and basic metadata |
| **Configuration/settings per plugin** | Every modern plugin system has per-plugin settings | MEDIUM | Plugin declares settings schema, core renders UI. VS Code uses contributes.configuration pattern |
| **Contribution points** | Plugins need defined extension points to hook into | HIGH | Core defines where plugins can extend (views, commands, menus, panels). VS Code has 32+ contribution points |
| **Side panel/view registration** | Standard UI extension point for contextual information | MEDIUM | Plugins register custom views in sidebars/panels. VS Code uses contributes.views + contributes.viewsContainers |
| **Command registration** | Plugins need to expose actions users can trigger | MEDIUM | Commands with ID, label, keyboard shortcuts. Exposed in command palette or buttons |
| **Icon/visual identity** | Users identify plugins visually in UI | LOW | Plugin provides icon, shown in panels, settings, command palette |
| **Data isolation** | Each plugin's data must not interfere with others | MEDIUM | Scoped storage per plugin. Figma uses figma.clientStorage, VS Code uses workspace.getConfiguration |
| **Error boundaries** | Plugin crashes shouldn't crash the entire app | MEDIUM | Sandboxing/isolation. VS Code runs extensions in separate Extension Host process |
| **Basic lifecycle hooks** | Plugins need initialization/cleanup control | MEDIUM | onActivate, onDeactivate, onConfigChange. Activation events define when plugin loads |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable for specific use cases.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Combo actions (auto-chain commands)** | Workflow automation - execute multiple commands in sequence | MEDIUM | GSD-specific need. User clicks once, multiple commands execute. Reduces cognitive load |
| **Pre-prompted commands** | Commands with preset parameters for common workflows | LOW | Template pattern: command + default args. Speeds up repetitive tasks |
| **Data source abstraction** | Plugins can use different backends (files, SQLite, HTTP) without core changes | HIGH | Adapter pattern for data sources. Enables flexible plugin implementations |
| **Tree view with custom nodes** | Hierarchical data visualization with plugin-defined node types | MEDIUM | Generic tree component, plugins provide data + render logic. GSD shows milestones→phases→plans |
| **Status indicators/badges** | Visual state representation (pending, in-progress, complete) | LOW | Color-coded badges. Common in task management, useful for GSD workflow tracking |
| **Action buttons in tree nodes** | Contextual actions directly on tree items (no modal needed) | LOW | "Next Up" buttons in GSD. Reduces clicks, keeps users in flow |
| **Webview/custom UI** | Plugins can render fully custom UI beyond standard components | HIGH | VS Code webviews, Figma iframe pattern. Max flexibility but security complexity |
| **Keyboard shortcuts per plugin** | Plugin-specific hotkeys for power users | LOW | VS Code contributes.keybindings. Improves productivity for frequent tasks |
| **Welcome content for empty views** | Onboarding guidance when plugin first activated | LOW | VS Code contributes.viewsWelcome. Reduces friction for new users |
| **Plugin-specific themes/styling** | Plugins can customize appearance within their views | MEDIUM | Scoped CSS or theme tokens. Maintains brand identity within plugin |
| **Cross-plugin communication** | Plugins can expose APIs for other plugins | HIGH | VS Code extensions can depend on each other. Creates ecosystem, but adds coupling risk |
| **Secret/credential storage** | Secure storage for API keys, tokens | MEDIUM | Obsidian added SecretStorage API in Jan 2026. Prevents hardcoding credentials |
| **Setting groups/organization** | Settings UI organized into logical sections | LOW | Obsidian added SettingGroup in Jan 2026. Improves UX for complex plugins |
| **Context menus** | Right-click actions in plugin views | MEDIUM | VS Code contributes.menus. Familiar desktop app pattern |
| **Drag & drop support** | Visual reordering, file uploads in plugin views | MEDIUM | Fancytree supports drag-drop for tree reorganization. Modern UX expectation |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems. Deliberately avoid for v1.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Plugin marketplace/discovery** | Users want to browse and install plugins easily | Requires server infrastructure, moderation, update mechanism, security review. Massive scope increase | Manual plugin installation for v1. Focus on architecture first, marketplace later |
| **Hot reload/live updates** | Developers want fast iteration during plugin development | Complex invalidation logic, memory leaks, state corruption risks. VS Code requires restart for many changes | Require app restart to activate plugin changes. Simpler, more reliable |
| **Plugin sandboxing with full isolation** | Security-conscious users want plugins untrusted by default | Requires VM/container per plugin, IPC overhead, complex permission model. Figma's sandbox is restrictive | Trust-based model for v1. Only load explicitly installed plugins. Add permissions later |
| **Version compatibility matrix** | Support multiple plugin API versions simultaneously | Massive maintenance burden, confusing for developers. Semantic versioning helps but doesn't solve it | Single API version for v1. Break compatibility deliberately, document migration |
| **Plugin dependencies/registry** | Plugins can require other plugins as dependencies | Circular dependency hell, version conflicts (npm-style nightmares). Increases coupling | Plugins are self-contained for v1. No dependencies on other plugins |
| **Real-time collaboration on plugin data** | Multiple users editing same plugin data simultaneously | CRDT/OT complexity, conflict resolution, network layer. Way beyond v1 scope | Single-user only for v1. Plugin data is local to machine |
| **Backward compatibility guarantee** | Never break plugin APIs across versions | Becomes technical debt anchor. Can't evolve architecture without legacy baggage | Explicitly no backward compatibility promise for v1. Move fast, document breaking changes |
| **Plugin permissions/capabilities system** | Fine-grained control over what plugins can access | Complex permission model, confusing UX (Android permission fatigue). Over-engineering for v1 | All-or-nothing trust for v1. Plugin gets full access when enabled |
| **Plugin analytics/telemetry** | Track plugin usage, errors, performance | Privacy concerns, data collection infrastructure, GDPR compliance. Scope creep | No built-in plugin analytics for v1. Plugins can add their own if needed |
| **Multi-language plugin support** | Write plugins in any language (Python, Go, Rust, etc.) | Requires polyglot runtime, build tooling, packaging complexity. TypeScript-only is simpler | TypeScript-only for v1. Single language = simpler tooling, better DX |

## Feature Dependencies

```
Plugin Registration System
    ├──requires──> Configuration Schema (plugins declare settings)
    ├──requires──> Lifecycle Hooks (activation/deactivation)
    └──enables──> Enable/Disable Toggle (need registration to toggle)

Contribution Points
    ├──requires──> Plugin Registration (plugins must register before contributing)
    ├──enables──> Side Panel Registration (panels are contribution points)
    ├──enables──> Command Registration (commands are contribution points)
    └──enables──> View Registration (views are contribution points)

Side Panel Registration
    ├──requires──> Contribution Points (panels declared as contributions)
    ├──enhances──> Tree View (panels often contain trees)
    └──enhances──> Custom UI (panels display plugin-specific UI)

Command Registration
    ├──requires──> Contribution Points (commands declared as contributions)
    ├──enhances──> Action Buttons (buttons trigger commands)
    ├──enhances──> Pre-prompted Commands (templates built on commands)
    └──enhances──> Combo Actions (combos chain commands)

Data Source Abstraction
    ├──enables──> Plugin Flexibility (plugins choose data backend)
    └──independent──> UI Features (data layer separate from presentation)

Tree View
    ├──requires──> Side Panel (trees displayed in panels)
    ├──enhances──> Status Indicators (nodes show status)
    └──enhances──> Action Buttons (nodes have contextual actions)

Combo Actions
    ├──requires──> Command Registration (combos execute commands)
    ├──requires──> Enable/Disable per Combo (user controls combos)
    └──conflicts──> Plugin Sandboxing (combos need command execution access)
```

### Dependency Notes

- **Plugin Registration is foundational:** Almost all other features depend on plugins being registered first
- **Contribution Points are core abstraction:** Define the contract between core and plugins. Must be designed before building specific extensions
- **Data Source Abstraction is orthogonal:** UI features don't care about data backend. Keep them separate
- **Combo Actions require command infrastructure:** Can't chain commands that don't exist. Build commands first
- **Sandboxing conflicts with automation:** Strict isolation makes combo actions harder. Choose trust model carefully

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the plugin architecture with GSD.

- [x] **Plugin registration via config** — Plugins declare identity, version, contribution points in manifest/config file
- [x] **Enable/disable per plugin** — Settings UI with toggle switches for each installed plugin
- [x] **Side panel contribution point** — Plugins register custom panels in sidebar
- [x] **Tree view component** — Generic tree with expand/collapse, plugin provides data structure
- [x] **Command registration** — Plugins declare commands, core exposes them in UI
- [x] **Action buttons in tree** — Nodes can have clickable buttons (e.g., "Next Up" in GSD)
- [x] **Status indicators** — Visual badges for node states (pending/in-progress/complete)
- [x] **Pre-prompted commands** — Commands with default arguments for common workflows
- [x] **Combo actions** — User-defined command chains (e.g., /clear then /gsd:progress)
- [x] **Data source abstraction** — Interface for plugins to load data (filesystem adapter for GSD)
- [x] **Basic lifecycle** — onActivate/onDeactivate hooks for plugin initialization
- [x] **Error boundaries** — Plugin errors don't crash app, show error state in plugin panel

### Add After Validation (v1.x)

Features to add once core architecture is proven with GSD plugin.

- [ ] **Keyboard shortcuts** — Add when second plugin needs custom hotkeys
- [ ] **Context menus** — Add when tree actions outgrow inline buttons
- [ ] **Welcome content** — Add when plugins need onboarding (contributes.viewsWelcome pattern)
- [ ] **Setting groups** — Add when plugins have >5 settings (Obsidian SettingGroup pattern)
- [ ] **Custom icons per plugin** — Add when visual identity matters for multi-plugin UX
- [ ] **Plugin metadata display** — Version, author, description in settings. Add when managing multiple plugins
- [ ] **Drag & drop in trees** — Add if GSD or future plugin needs reordering (not for v1 read-only)
- [ ] **Webview support** — Add if plugin needs fully custom UI beyond standard components
- [ ] **Secret storage** — Add when plugin needs API credentials (Obsidian SecretStorage pattern)

### Future Consideration (v2+)

Features to defer until plugin ecosystem is established.

- [ ] **Plugin marketplace** — Requires server, moderation, versioning infrastructure
- [ ] **Hot reload** — Developer convenience, complex to implement correctly
- [ ] **Plugin sandboxing** — Security model adds significant complexity
- [ ] **Version compatibility** — Support multiple API versions simultaneously
- [ ] **Plugin dependencies** — Let plugins require other plugins (npm-style)
- [ ] **Cross-plugin APIs** — Plugins expose services to other plugins
- [ ] **Multi-language support** — Python, Go, Rust plugins (beyond TypeScript)
- [ ] **Plugin permissions** — Fine-grained capability control
- [ ] **Plugin analytics** — Built-in usage tracking
- [ ] **Real-time collaboration** — Multi-user plugin data editing

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Plugin registration | HIGH | MEDIUM | P1 |
| Enable/disable toggle | HIGH | LOW | P1 |
| Side panel contribution | HIGH | MEDIUM | P1 |
| Command registration | HIGH | MEDIUM | P1 |
| Tree view component | HIGH | MEDIUM | P1 |
| Data source abstraction | HIGH | HIGH | P1 |
| Action buttons | HIGH | LOW | P1 |
| Status indicators | MEDIUM | LOW | P1 |
| Combo actions | HIGH (GSD-specific) | MEDIUM | P1 |
| Pre-prompted commands | MEDIUM | LOW | P1 |
| Error boundaries | HIGH | MEDIUM | P1 |
| Lifecycle hooks | MEDIUM | MEDIUM | P1 |
| Configuration schema | MEDIUM | MEDIUM | P1 |
| Keyboard shortcuts | MEDIUM | LOW | P2 |
| Context menus | MEDIUM | MEDIUM | P2 |
| Welcome content | LOW | LOW | P2 |
| Setting groups | LOW | LOW | P2 |
| Custom icons | LOW | LOW | P2 |
| Metadata display | LOW | LOW | P2 |
| Drag & drop | LOW | MEDIUM | P2 |
| Webview support | MEDIUM | HIGH | P2 |
| Secret storage | MEDIUM | MEDIUM | P2 |
| Plugin marketplace | HIGH | VERY HIGH | P3 |
| Hot reload | MEDIUM | HIGH | P3 |
| Sandboxing | HIGH (security) | VERY HIGH | P3 |
| Version compatibility | MEDIUM | HIGH | P3 |
| Plugin dependencies | LOW | HIGH | P3 |
| Cross-plugin APIs | LOW | HIGH | P3 |
| Multi-language support | LOW | VERY HIGH | P3 |
| Permission system | MEDIUM | HIGH | P3 |
| Plugin analytics | LOW | MEDIUM | P3 |
| Real-time collaboration | LOW | VERY HIGH | P3 |

**Priority key:**
- P1: Must have for launch — validates core plugin architecture with GSD
- P2: Should have when possible — improves UX but not blocking
- P3: Nice to have for future — ecosystem features, defer until multi-plugin need proven

## Competitor Feature Analysis

| Feature | VS Code Extensions | Obsidian Plugins | Figma Plugins | Our Approach (GSD-UI) |
|---------|-------------------|------------------|---------------|----------------------|
| **Registration** | package.json manifest | manifest.json | manifest.json | Config-based (JSON/TypeScript) |
| **Contribution Points** | 32+ defined points | API-based (no manifest contributions) | Limited to UI + data | Start with 5 core points: views, commands, panels, settings, combos |
| **Side Panels** | contributes.views + viewsContainers | Workspace leaves, ribbons | Sidebar UI in iframe | contributes.panels for plugin sidebars |
| **Commands** | contributes.commands + API | Command API | No command palette | contributes.commands + combo support |
| **Settings** | contributes.configuration | Plugin settings tab | No built-in settings UI | contributes.configuration with UI auto-generation |
| **Tree Views** | TreeView API with data providers | No built-in tree | No built-in tree | Generic TreeView component, plugins provide data |
| **Data Storage** | workspace.getConfiguration, globalState | Plugin data folder + localStorage | figma.clientStorage (limited) | Abstracted data sources (file/SQLite/custom) |
| **Lifecycle** | activate/deactivate events | onload/onunload | Run/close (no persistence) | onActivate/onDeactivate hooks |
| **Sandboxing** | Extension Host process isolation | No sandboxing (full Node.js access) | Strict sandbox (no browser APIs except iframe) | No sandboxing for v1 (trust model) |
| **UI Customization** | Webviews for custom HTML | Full DOM access | iframe with postMessage | Standard components for v1, webviews later |
| **Hot Reload** | Reload window required | Live reload during dev | No hot reload | Restart required for v1 |
| **Marketplace** | VS Code Marketplace (official) | Community plugins list | Plugin Hub | No marketplace for v1 |
| **Multi-language** | TypeScript/JavaScript only | JavaScript only | TypeScript/JavaScript only | TypeScript only for v1 |
| **Error Handling** | Extension Host crash recovery | Console errors, no isolation | Sandbox errors isolated | React Error Boundaries per plugin |

## GSD Plugin Requirements (Reference)

Since GSD is the first plugin, its requirements validate the architecture:

**Must support:**
- Reading `.planning/` directory structure (filesystem data source)
- Tree hierarchy: Milestones → Phases → Plans (3-level tree)
- Status badges: pending, in-progress, complete (status indicators)
- "Next Up" action buttons (action buttons in tree)
- Command registration: `/gsd:progress`, `/gsd:plan-phase`, etc. (command contribution)
- Combo definition: "Clear + Progress" (combo actions)
- Enable/disable combos per user (settings UI)
- Pre-prompted commands: `/gsd:plan-phase {phase_number}` (command templates)

**GSD validates these generic features:**
- Filesystem data source adapter (can be replaced with SQLite/HTTP later)
- Tree view with custom node rendering
- Status indicator system
- Action button system
- Command registration and execution
- Combo chaining mechanism
- Settings schema and UI generation

## Sources

### High Confidence (Official Documentation)
- [VS Code Extension API - Contribution Points](https://code.visualstudio.com/api/references/contribution-points) — Official API reference, verified Jan 2026
- [VS Code Extension Capabilities](https://code.visualstudio.com/api/extension-capabilities/overview) — Common patterns for extensions
- [Tauri Plugin Architecture](https://v2.tauri.app/concept/architecture/) — Official Tauri v2 architecture docs
- [Figma Plugin Architecture](https://www.figma.com/blog/how-we-built-the-figma-plugin-system/) — Official Figma engineering blog

### Medium Confidence (Verified Web Sources)
- [Building VS Code Extensions in 2026: The Complete Guide](https://abdulkadersafi.com/blog/building-vs-code-extensions-in-2026-the-complete-modern-guide) — Modern best practices, 2026
- [Obsidian Release Notes - January 2026](https://releasebot.io/updates/obsidian) — SettingGroup and SecretStorage APIs added
- [Strapi Plugin Configuration](https://docs-v4.strapi.io/dev-docs/configurations/plugins) — Enable/disable pattern example
- [Desktop Development 2026](https://www.designrush.com/agency/web-development-companies/trends/desktop-development) — Modern desktop app trends

### Low Confidence (General Web Research)
- [Plugin Architecture Definition (PDF)](https://cs.uwaterloo.ca/~m2nagapp/courses/CS446/1195/Arch_Design_Activity/PlugIn.pdf) — Academic pattern overview
- [Best Desktop Automation Tools 2026](https://testgrid.io/blog/desktop-automation-tools/) — Industry survey
- [Tree View API Resources](https://www.jqueryscript.net/blog/Best-Tree-View-Plugins-jQuery.html) — UI component patterns

---
*Feature research for: Plugin-based UI systems for desktop CLI tools*
*Researched: 2026-01-24*
*Confidence: MEDIUM-HIGH (VS Code/Figma verified, some patterns inferred)*
