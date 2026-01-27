# Phase 11: npx Installation - Context

**Gathered:** 2026-01-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Cross-platform binary distribution via npm so users can run `npx get-shit-done-cc-ui` without Rust toolchain. Binary is downloaded on first run, cached locally, and executed. Supports Linux x64, macOS x64/arm64, and Windows x64.

</domain>

<decisions>
## Implementation Decisions

### Download Experience
- Spinner with size info during download (e.g., `⠋ Downloading... 2.3MB/4.5MB`)
- Prompt user to retry on failure (not auto-retry, not fail-fast)
- Cache binary inside `node_modules` — auto-cleaned by npm
- Verify download with SHA256 checksum against published checksum file

### First-run Behavior
- First invocation downloads binary only, user must run again to execute
- No version checking on subsequent runs — user controls updates via npm
- No re-verification of cached binary — trust once downloaded
- `npx get-shit-done-cc-ui --version` shows wrapper version only (no binary download)

### Error Messaging
- Concise messages with clear next action (e.g., "Download failed. Check connection and retry.")
- Unsupported platform message includes link to build-from-source instructions
- Color-coded output: red for errors, yellow for warnings — respects `NO_COLOR` env var
- Standard exit codes: 0=success, 1=general error, 2=usage error

### Platform Detection
- WSL detected and uses Linux binary (linux-x64)
- ARM Linux detected and shows helpful message with build instructions (not supported in P0)
- `GSD_UI_PLATFORM` environment variable allows manual platform override
- P0 platforms: linux-x64, darwin-x64, darwin-arm64, win32-x64

### Naming
- npm package: `get-shit-done-cc-ui`
- Command: `npx get-shit-done-cc-ui`
- Environment variable prefix: `GSD_UI_`

### Claude's Discretion
- Rosetta 2 handling on macOS (prefer ARM with x64 fallback seems reasonable)
- Exact spinner animation style
- Checksum file format and hosting location
- postinstall vs lazy download implementation

</decisions>

<specifics>
## Specific Ideas

- Two-phase invocation: first run downloads, second run executes — keeps download explicit
- "Just works" on CI/CD with standard exit codes
- WSL users get Linux binary automatically (most common expectation)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-npx-installation*
*Context gathered: 2026-01-26*
