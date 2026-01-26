# Pitfalls Research

**Domain:** Plugin-based UI systems for terminal/desktop applications
**Researched:** 2026-01-24
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Core-Plugin Tight Coupling Through Direct Imports

**What goes wrong:**
Core code imports plugin-specific types, components, or logic, creating hard dependencies that prevent adding/removing plugins without modifying core. Teams often start with "just this one plugin" and accidentally bake plugin-specific logic into the core.

**Why it happens:**
- Convenience: Directly importing plugin components is faster than designing abstractions
- Lack of clear boundaries: No enforced separation between core and plugin namespaces
- Requirements pressure: Feature deadlines push developers to take shortcuts
- Plugin-first thinking: Designing for the first plugin (GSD) rather than generic extensibility

**How to avoid:**
- **Zero imports rule**: Core code can NEVER import from `/plugins/` directory
- **Configuration-driven**: Plugins register through config objects, not code imports
- **Interface contracts**: Define strict TypeScript interfaces that plugins must implement
- **Compile-time enforcement**: Use ESLint rules to block core → plugin imports
- **Example anti-pattern**: `import { GSDPanel } from '@/plugins/gsd/components'` in core
- **Example correct pattern**: Plugin registers `{ type: 'panel', component: GSDPanel }` via API

**Warning signs:**
- Import statements from core files pointing to `/plugins/*` directory
- TypeScript errors when trying to remove a plugin directory
- Core components with plugin-specific props (e.g., `gsdData?: GSDData`)
- Conditional rendering based on plugin names: `{plugin === 'gsd' && <GSDSpecificUI />}`
- Build breaks when plugin directory is removed

**Phase to address:**
Phase 1 (Foundation) — Establish plugin registration system and interface contracts before implementing first plugin

---

### Pitfall 2: Data Source Abstraction Leakage

**What goes wrong:**
Core features expose filesystem-specific APIs (file paths, fs.readFile), making it impossible for plugins with database/API data sources to integrate. The tree view component expects file system paths, the status indicator looks for file timestamps, etc.

**Why it happens:**
- First plugin uses files: GSD reads `.planning/` directory, so core is designed around file operations
- Concrete thinking: Designing for current use case (files) rather than abstraction (data sources)
- Performance shortcuts: Direct filesystem access seems faster than abstraction layer
- Testing convenience: Mocking files is easier than designing abstract data providers

**How to avoid:**
- **Provider pattern**: Define `DataSourceProvider` interface with methods like `getItems()`, `getStatus()`
- **No path assumptions**: Core never manipulates file paths or calls filesystem APIs directly
- **Adapter layer**: Each plugin provides its own data source adapter (FileSystemDataSource, SQLiteDataSource, etc.)
- **Example leaky API**: `loadPlan(filePath: string)` — assumes filesystem
- **Example clean API**: `loadPlan(planId: string)` — source-agnostic, plugin resolves ID to data

**Warning signs:**
- Core components with parameters like `filePath`, `directory`, `fsStats`
- Direct imports of Node.js `fs` module in core code
- Error messages containing filesystem-specific language: "File not found"
- Helper utilities with names like `readPlanFile()`, `scanDirectory()`
- Plugin adapter forced to fake filesystem behavior for database-backed data

**Phase to address:**
Phase 1 (Foundation) — Design data source abstraction before building tree view and status features

---

### Pitfall 3: Versioning and Breaking Changes Without Migration Strategy

**What goes wrong:**
Core introduces breaking changes to plugin API (renamed interfaces, changed method signatures), breaking all existing plugins. No versioning system means plugins can't declare compatibility, and no migration tooling exists to upgrade plugin configs.

**Why it happens:**
- MVP mindset: "We only have one plugin, versioning seems like overkill"
- Rapid iteration: Core API evolves quickly during early development
- Lack of stability commitment: No clear "stable vs experimental" API distinction
- Missing changelog: Breaking changes not documented for plugin developers

**How to avoid:**
- **Semantic versioning**: Core plugin API follows semver (e.g., `pluginApiVersion: "1.0.0"`)
- **Compatibility matrix**: Plugins declare required API version in manifest
- **Deprecation period**: Mark old APIs as deprecated for 2+ releases before removal
- **Migration guides**: Document every breaking change with migration code examples
- **Adapter pattern**: Provide compatibility adapters for 1-2 previous major versions
- **Example**: Core v2 includes adapter that translates old v1 plugin interface calls

**Warning signs:**
- Plugin manifest has no `apiVersion` field
- Core makes interface changes without incrementing version
- No BREAKING CHANGES section in commit messages
- Plugin developers discover breaks at runtime, not compile time
- Multiple plugins break when core updates

**Phase to address:**
Phase 1 (Foundation) — Establish versioning from day one, before second plugin is added

---

### Pitfall 4: Command Execution Without Validation or Sandboxing

**What goes wrong:**
Plugins define commands that execute arbitrary terminal input without validation, allowing command injection or system compromise. A malicious plugin config could inject `; rm -rf /` into a command. Combo actions chain commands without checking intermediate results, causing cascading failures.

**Why it happens:**
- Trust assumption: Assuming plugin authors are trustworthy
- Convenience over security: String interpolation is easier than structured commands
- No threat model: Failing to consider malicious or compromised plugins
- Combo complexity: Chaining commands without error handling between steps

**How to avoid:**
- **Structured commands**: Use objects `{ command: '/gsd:plan-phase', args: { phase: 1 } }` not strings
- **Allowlist validation**: Core maintains allowlist of permitted command prefixes
- **Parameter sanitization**: Escape/validate all user-provided parameters
- **Combo rollback**: Implement transaction-like behavior for command chains
- **Permission system**: Plugins declare required permissions (filesystem, network, execute)
- **Example vulnerable**: `executeCommand(\`/gsd:plan-phase ${userInput}\`)`
- **Example secure**: `executeCommand({ cmd: '/gsd:plan-phase', args: sanitize(userInput) })`

**Warning signs:**
- Command execution uses template literals with unsanitized input
- No validation before passing commands to terminal
- Combo actions don't check success/failure between steps
- Plugin config contains raw shell commands instead of structured data
- No audit log of executed commands

**Phase to address:**
Phase 2 (Commands) — Design command validation system before implementing combo actions

---

### Pitfall 5: Plugin Isolation Failures Leading to Cross-Plugin Interference

**What goes wrong:**
Plugin A's state updates accidentally trigger re-renders in Plugin B. Plugins share global state or event listeners, causing bugs where disabling one plugin breaks another. Memory leaks occur when plugins don't clean up listeners on unmount.

**Why it happens:**
- Shared Zustand stores: All plugins write to same global store
- Event bus without namespacing: Plugins listen to generic events like `data-updated`
- React context pollution: Plugin contexts accessible to other plugins
- Missing cleanup: Plugins register listeners but don't unregister on disable

**How to avoid:**
- **Scoped stores**: Each plugin gets isolated Zustand store slice
- **Namespaced events**: Events prefixed with plugin ID: `gsd:milestone-updated`
- **Context isolation**: Plugin contexts wrapped in plugin-specific providers
- **Lifecycle hooks**: Core calls `onEnable()` and `onDisable()` for cleanup
- **Example interference**: Plugin GSD updates `store.data`, Plugin SQLite re-renders unnecessarily
- **Example isolated**: Plugin GSD updates `store.plugins.gsd.data`, isolated from others

**Warning signs:**
- Console warnings about memory leaks when toggling plugins on/off
- Plugin B breaks when Plugin A is disabled
- Performance degrades with each new plugin added
- Event listener count grows indefinitely in React DevTools
- Global state contains plugin-specific data without namespacing

**Phase to address:**
Phase 1 (Foundation) — Design plugin isolation strategy before multiple plugins exist

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoding first plugin name in core | Fast MVP implementation | Can't add second plugin without refactoring core | Never - use plugin registry from start |
| Skipping data source abstraction | Simpler code for file-based plugin | Impossible to support DB/API plugins later | Never - abstraction is core requirement |
| Plugin config as plain JSON | Easy to read/write manually | No schema validation, runtime errors | Only during Phase 1 prototyping, must migrate to typed schema |
| Shared global Zustand store | Less boilerplate, faster initial dev | Plugins interfere with each other | Never - isolation is critical |
| Command strings instead of objects | Simpler to implement combo chains | Command injection vulnerability | Never - security is non-negotiable |
| No plugin versioning | Less initial complexity | Breaking changes break all plugins | Only with single internal plugin, not for ecosystem |
| Direct filesystem access in tree view | Works fine for GSD plugin | Blocks non-file data sources | Never - breaks core architecture principle |

## Integration Gotchas

Common mistakes when connecting core to plugins.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Plugin registration | Manually importing and registering plugins in core code | Auto-discovery via config files or registry pattern |
| React component injection | Core imports plugin JSX components directly | Plugin provides component via registration API, core renders generic slot |
| Event handling | Plugins listen to core events without cleanup | Core provides `subscribe()` / `unsubscribe()` API with automatic cleanup |
| Styling | Plugins add global CSS that affects core UI | Plugins use CSS modules or scoped Tailwind classes only |
| State updates | Plugins mutate core state directly | Core provides actions API, plugins dispatch actions |
| Data fetching | Core fetches data and passes to plugins | Plugins fetch own data via data source abstraction |
| Configuration | Plugin config mixed with core settings | Plugin config isolated in `plugins/{name}/config.json` |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading all plugin data on app start | Slow startup time with multiple plugins | Lazy load plugin data when panel is opened | >3 plugins with large datasets |
| Re-rendering all plugins on any state change | UI lag when interacting with any plugin | Scoped state, React.memo, Zustand selectors | >5 active plugins simultaneously |
| Synchronous combo execution | UI freezes during command chains | Async command queue with progress indicator | >3 commands in combo sequence |
| No virtual scrolling in tree view | Slow rendering with large file trees | Implement virtual scrolling from start | >1000 items in tree |
| Full re-parse of data files on every refresh | Excessive disk I/O and CPU usage | Implement file watching with incremental updates | Files >10MB or >1000 items |
| In-memory caching of all plugin data | Memory usage grows unbounded | LRU cache with size limits | Total data >500MB across plugins |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Plugin config from untrusted source | Malicious plugin executes arbitrary commands | Validate plugin manifests against schema, require user approval for new plugins |
| Command string interpolation | Command injection (e.g., `; rm -rf /`) | Use structured command objects with parameter validation |
| Unrestricted file access | Plugin reads sensitive files outside project | Sandbox plugin file access to project directory only |
| No audit log | Can't trace malicious plugin behavior | Log all command executions and file access by plugin |
| Shared localStorage across plugins | Plugin A reads Plugin B's sensitive data | Namespace localStorage keys by plugin ID |
| Loading plugins from arbitrary URLs | Remote code execution vulnerability | Only load plugins from approved directory/registry |
| Plugin-to-plugin communication | Plugin A compromises Plugin B | Prohibit direct plugin-to-plugin calls, all communication through core API |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No feedback when plugin disabled | Confusion when panel disappears | Show toast notification: "GSD plugin disabled" |
| Combo actions without progress indicator | User thinks app is frozen during long chains | Show progress: "Step 2/5: Planning phase..." |
| Plugin errors crash entire UI | Loses all work when plugin has bug | Error boundary per plugin, core UI stays functional |
| No way to recover from failed combo | Stuck in broken state, must restart app | Allow retry of individual steps in combo |
| Command execution without confirmation | Accidentally triggers destructive operations | Require confirmation for commands marked `requiresConfirm: true` |
| Plugin settings buried in global settings | Users don't discover plugin features | Per-plugin settings accessible from plugin panel |
| No indication which commands available | Users don't know what to type | Show autocomplete with available commands from active plugins |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Plugin system:** Often missing cleanup on disable — verify listeners are unregistered when plugin toggled off
- [ ] **Tree view:** Often missing keyboard navigation — verify arrow keys, enter, expand/collapse work
- [ ] **Status indicators:** Often missing real-time updates — verify status changes when underlying data changes
- [ ] **Combo actions:** Often missing partial failure handling — verify rollback when step 3 of 5 fails
- [ ] **Command execution:** Often missing validation — verify parameters are sanitized before execution
- [ ] **Data source abstraction:** Often missing error handling — verify graceful degradation when data source unavailable
- [ ] **Plugin configuration:** Often missing schema validation — verify invalid config shows helpful error message
- [ ] **Panel layouts:** Often missing resize persistence — verify panel widths saved across sessions

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Core-plugin tight coupling | HIGH | 1. Identify all imports from core to plugins, 2. Design interface abstraction, 3. Refactor all coupled code, 4. Add lint rule to prevent regression — Requires major refactor affecting both core and all plugins |
| Data source leakage | HIGH | 1. Define DataSourceProvider interface, 2. Refactor core to use abstraction, 3. Create filesystem adapter for existing plugin, 4. Test that DB adapter could work — Major refactor but isolated to data layer |
| No versioning strategy | MEDIUM | 1. Add apiVersion to plugin manifests, 2. Implement compatibility check at load time, 3. Document current version as 1.0.0, 4. Commit to semver going forward — Low code impact but requires process change |
| Command injection vulnerability | LOW | 1. Replace string commands with objects, 2. Add validation layer, 3. Audit existing plugin commands, 4. Add security tests — Straightforward refactor with clear path |
| Plugin isolation failures | MEDIUM | 1. Scope Zustand stores by plugin, 2. Namespace event listeners, 3. Add cleanup hooks, 4. Test enable/disable cycles — Moderate refactor affecting state management |
| Performance issues (no virtual scroll) | LOW | 1. Add @tanstack/react-virtual dependency, 2. Wrap tree view with useVirtualizer, 3. Benchmark before/after — Well-understood solution with library support |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Core-plugin tight coupling | Phase 1: Foundation | Verify ESLint blocks imports from `/plugins/` in `/core/` |
| Data source abstraction leakage | Phase 1: Foundation | Verify mock DB adapter can power tree view without filesystem |
| No versioning strategy | Phase 1: Foundation | Verify plugin manifest has `apiVersion`, core checks compatibility |
| Command injection | Phase 2: Commands | Verify commands use structured objects, parameters are validated |
| Plugin isolation failures | Phase 1: Foundation | Verify disabling Plugin A doesn't affect Plugin B's functionality |
| Missing error boundaries | Phase 1: Foundation | Verify plugin crash doesn't take down core UI |
| Combo actions without rollback | Phase 3: Combos | Verify failed combo allows retry or rollback to previous state |
| Performance (no virtual scroll) | Phase 4: UI Polish | Verify tree with 10k items renders smoothly |
| Security audit missing | Phase 5: Security Review | Verify plugin permissions documented, audit log implemented |

## Sources

**Plugin Architecture & Isolation:**
- [Plug-in Architecture (Medium)](https://medium.com/omarelgabrys-blog/plug-in-architecture-dec207291800) — Core system design trade-offs
- [Scaling Infrastructure: Typed, Pluggable Framework (Medium)](https://scaibu.medium.com/scaling-infrastructure-fast-you-need-a-typed-pluggable-framework-now-a8eb7cfafe8a) — Type safety in plugin systems
- [Pluggable Architecture: Enabling Extensibility (Moments Log)](https://www.momentslog.com/development/design-pattern/pluggable-architecture-enabling-extensibility-without-core-changes) — Core changes avoidance
- [Software Extensibility Guide (Strapi)](https://strapi.io/blog/extensibility-in-software-engineering) — Boundaries and governance
- [Common Mistakes When Using Command Pattern (ACM)](https://dl.acm.org/doi/10.1145/3424771.3424773) — Command pattern anti-patterns

**Tauri Desktop Application Concerns:**
- [Tauri vs. Electron: Performance and Trade-offs (Hopp)](https://www.gethopp.app/blog/tauri-vs-electron) — Security mistakes in desktop apps
- [Tauri vs Electron Comparison 2025 (RaftLabs)](https://www.raftlabs.com/blog/tauri-vs-electron-pros-cons/) — Cross-platform consistency issues
- [Electron vs. Tauri 2025 (DoltHub)](https://www.dolthub.com/blog/2025-11-13-electron-vs-tauri/) — Plugin ecosystem maturity

**Data Source Abstraction:**
- [DataSources and Repository Patterns (Carrion.dev)](https://carrion.dev/en/posts/datasources-repository-patterns/) — Data layer abstraction
- [Repository Pattern: Over-Engineering? (Medium)](https://medium.com/@abied.abiad/the-repository-pattern-your-gateway-to-clean-data-c72235f34916) — Avoiding over-abstraction
- [Data Abstraction Using APIs (APIscene)](https://www.apiscene.io/lifecycle/data-abstraction-using-apis/) — API abstraction patterns

**React Component Coupling:**
- [React: Decoupling Components (DEV)](https://dev.to/argonauta/react-advance-decoupling-your-components-in-the-right-way-4pkn) — Component-hook tight coupling
- [React Code Review: Tightly Coupled Components (Profy.dev)](https://profy.dev/article/react-code-review-tightly-coupled-components) — Mixed responsibilities anti-pattern
- [Building Scalable React Architecture (Medium)](https://boxofkarthi.medium.com/building-a-scalable-data-layered-react-architecture-with-nx-c0b606651e30) — Data-layered architecture

**Versioning & Breaking Changes:**
- [Terraform Plugin Versioning (HashiCorp)](https://developer.hashicorp.com/terraform/plugin/best-practices/versioning) — Breaking change documentation
- [Kubebuilder Plugin Versioning](https://kubebuilder.io/plugins/plugins-versioning) — When version bumps required
- [WordPress Plugin Version Management 2025](https://wponcall.com/wordpress-plugin-version-management/) — Version update risks

---
*Pitfalls research for: Plugin-based UI systems for terminal applications*
*Researched: 2026-01-24*
