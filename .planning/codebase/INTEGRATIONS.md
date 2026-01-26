# External Integrations

**Analysis Date:** 2026-01-24

## APIs & External Services

**Analytics:**
- PostHog (v1.258.3)
  - Purpose: Product analytics, event tracking, and performance monitoring
  - SDK/Client: `posthog-js` in `src/main.tsx`
  - Auth: API key via `VITE_PUBLIC_POSTHOG_KEY` environment variable
  - Host: Via `VITE_PUBLIC_POSTHOG_HOST` environment variable (defaults to `https://us.i.posthog.com`)
  - Configuration: `src/lib/analytics/index.ts`
  - Features: Event capture, screen tracking, property sanitization, consent management
  - Defaults: Opt-out disabled by default, session recording disabled for privacy

**GitHub API:**
- Purpose: Fetch agent templates from GitHub repository
- Endpoint: `https://api.github.com/repos/getAsterisk/opcode/contents/cc_agents`
- Client: `reqwest` (Rust HTTP client)
- Implementation: `src-tauri/src/commands/agents.rs:fetch_github_agents()`
- Auth: None (public API, rate-limited)
- Features:
  - Fetch list of agent files from repository
  - Download agent content from GitHub
  - Support for importing agents from GitHub

## Data Storage

**Databases:**
- SQLite (bundled)
  - Location: Managed by Tauri/Rust backend
  - Connection: Via `rusqlite` crate with bundled SQLite
  - Client: `rusqlite` with compiled-in SQLite
  - Tables managed: Agents, Agent Runs, Storage key-value
  - Initialization: `init_database()` in Tauri commands

**Local File Storage:**
- Local filesystem (primary storage)
  - Project directories: `~/.claude/projects/`
  - Session files: JSONL format within project directories
  - Settings: `~/.claude/settings.json`
  - Database: SQLite file (location managed by Tauri)

**Browser Storage:**
- localStorage
  - Session persistence: Stored keys like `opcode_session_*` for tab restoration
  - Tab state: Managed by `TabPersistenceService` in `src/services/tabPersistence.ts`
  - Analytics consent: Stored by `ConsentManager` in `src/lib/analytics/consent.ts`

**Caching:**
- In-memory state via Zustand stores:
  - `sessionStore` in `src/stores/sessionStore.ts`
  - `agentStore` in `src/stores/agentStore.ts`
- Output cache: `src/lib/outputCache.tsx` for real-time JSONL content

## Authentication & Identity

**Auth Provider:**
- Custom/None - No centralized auth provider
- API Key Helper: Custom script option in settings for auth value generation
- Approach:
  - Desktop (Tauri): Direct file system access, no auth needed
  - Web mode: Requires Claude Code CLI access to `~/.claude/` directory
  - User identity: Anonymous tracking via PostHog with auto-generated user IDs

**User Identification:**
- Anonymous IDs generated and stored in localStorage
- PostHog consent manager tracks opt-in status
- Device fingerprinting via app metadata (desktop vs web)

## Monitoring & Observability

**Error Tracking:**
- PostHog event capture for errors
- Implementation: `capture_exceptions: true` in PostHog config
- Error boundary components: `src/components/ErrorBoundary.tsx`, `src/components/AnalyticsErrorBoundary.tsx`
- Error sanitization: File paths, project names, error messages masked before sending

**Logs:**
- Browser console logging (development)
- PostHog event logs (production)
- Rust backend: env_logger with log facade
- Session output: JSONL format stored locally

**Performance Monitoring:**
- PostHog custom events for performance metrics
- Resource monitor: `src/lib/analytics/resourceMonitor.ts` (checks every 2 minutes)
- Performance tracker: `PerformanceTracker` utility for percentile tracking
- Metrics tracked:
  - Operation duration percentiles (p50, p95, p99)
  - Token usage
  - Cost tracking
  - Session counts

## CI/CD & Deployment

**Hosting:**
- Desktop: Tauri-based desktop application (macOS, Windows, Linux)
- Web: Self-hosted via Axum web server (can run on local machine or server)
- Web server: Runs on `http://0.0.0.0:{port}` with configurable port

**Web Server Endpoints:**
- Tauri web mode: `src-tauri/src/web_server.rs` provides Axum REST API
- API prefix: `/api/`
- CORS enabled: `tower-http` with `Any` origin for local development

**CI Pipeline:**
- GitHub Actions (likely, based on `.github/` directory presence)
- Build scripts: `src/scripts/fetch-and-build.js` for executable building
- Tauri commands: `tauri build` for desktop, `tauri serve` for development

## Environment Configuration

**Required env vars:**
- `VITE_PUBLIC_POSTHOG_KEY` - PostHog project API key
- `VITE_PUBLIC_POSTHOG_HOST` - PostHog server endpoint (defaults to `https://us.i.posthog.com`)
- `TAURI_DEV_HOST` - Optional, for Tauri development HMR

**Build-time env vars:**
- `MODE` - `development` or production
- Build target: Platform-specific (darwin for macOS, windows, linux)

**Runtime Configuration:**
- Port configuration: `src-tauri/tauri.conf.json`
- WebSocket support: WSS for HTTPS, WS for HTTP
- Proxy settings: Stored in SQLite database
  - `proxy_http` - HTTP proxy URL
  - `proxy_https` - HTTPS proxy URL

**Secrets location:**
- Environment variables (VITE_* for frontend)
- Tauri environment (managed by Tauri build system)
- Sensitive data: Not persisted in code, managed via environment
- PostHog API key: Embedded in client config but public-facing (not sensitive)

## Webhooks & Callbacks

**Incoming:**
- None detected - No external webhook receivers

**Outgoing:**
- GitHub API calls: Fetch agent templates (read-only, not a webhook)
- PostHog events: Batched event submissions

**Event Emissions:**
- Tauri IPC events: Frontend to Rust backend communication
- Custom events via Tauri emitter in agent commands
- Real-time JSONL streaming for agent session output

## Network Configuration

**Protocol Support:**
- HTTP/HTTPS for REST APIs
- WebSocket/WSS for real-time communication
- Local IPC (Tauri invoke) for desktop app

**CORS:**
- Enabled with `Any` origin for development
- Configured in Axum web server layer

**Proxy Support:**
- HTTP and HTTPS proxy configuration available
- Settings stored in SQLite database
- Applied via environment variables in Tauri commands

**Web Server:**
- Port: Configurable (default likely 1420 for Tauri dev, custom for web mode)
- Host: `0.0.0.0` (binds to all interfaces)
- HMR (Hot Module Reload): Separate port (1421) for development
- File serving: Configured via Tauri and custom directory serving via tower-http

## Data Protection & Privacy

**Privacy Features:**
- PII Sanitization:
  - File paths masked in analytics
  - Project paths anonymized
  - Error messages sanitized
  - API keys redacted
  - Email addresses masked
  - Agent names sanitized
  - Implementation: `src/lib/analytics/events.ts` sanitizers

**Consent Management:**
- Explicit consent required for analytics
- Users can enable/disable analytics anytime
- Data deletion option available
- Stored in localStorage as `opcode_consent_*`
- Implementation: `src/lib/analytics/consent.ts`

**Session Recording:**
- Disabled: `disable_session_recording: true` in PostHog config
- Focus on event-based analytics only

---

*Integration audit: 2026-01-24*
