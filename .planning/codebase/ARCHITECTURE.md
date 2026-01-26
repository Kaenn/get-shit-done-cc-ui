# Architecture

**Analysis Date:** 2026-01-24

## Pattern Overview

**Overall:** Modular client-server architecture with tab-based UI shell and layered component composition.

**Key Characteristics:**
- Environment-agnostic adapter pattern (Tauri desktop + web browser support)
- Context-based state management with Zustand stores for global state
- Tab-based navigation system with persistence
- Analytics-first initialization with PostHog tracking
- Component-driven UI with Radix UI primitives and Tailwind CSS
- Functional React hooks for business logic extraction

## Layers

**Presentation Layer:**
- Purpose: Render UI components and manage user interactions
- Location: `src/components/`
- Contains: React components (UI primitives, page-level components, feature-specific components)
- Depends on: hooks, contexts, utilities, services
- Used by: App.tsx, TabContent.tsx routing

**Business Logic Layer:**
- Purpose: Encapsulate feature-specific logic and state management
- Location: `src/hooks/`, `src/stores/`
- Contains: Custom hooks (useAnalytics, useApiCall, useTabState), Zustand stores (sessionStore, agentStore)
- Depends on: API layer, services
- Used by: Components throughout the application

**Service Layer:**
- Purpose: Handle cross-cutting concerns (persistence, API communication)
- Location: `src/services/`, `src/lib/`
- Contains: SessionPersistenceService, TabPersistenceService, analytics system, API adapter
- Depends on: External libraries (Tauri API, localStorage, PostHog)
- Used by: hooks, stores, top-level initialization

**API Adapter Layer:**
- Purpose: Abstract environment differences (Tauri vs web)
- Location: `src/lib/apiAdapter.ts`, `src/lib/api.ts`
- Contains: Environment detection, unified API interface
- Depends on: @tauri-apps/api (optional), Tauri invoke system
- Used by: All data-fetching operations

**Utilities & Styling:**
- Purpose: Reusable helpers and design tokens
- Location: `src/lib/utils.ts`, `src/lib/date-utils.ts`, `src/lib/claudeSyntaxTheme.ts`
- Contains: Classname helpers (cn), date formatting, code highlighting themes
- Used by: All layers

## Data Flow

**Session Creation and Persistence:**

1. User selects project → ProjectList loads project details
2. User initiates Claude Code session → ClaudeCodeSession mounts
3. Session object flows through context → Tab added via TabContext.addTab()
4. Messages accumulated in component state → SessionPersistenceService.saveSession()
5. On tab close → Tab removed, session data persisted in localStorage
6. On restart → TabProvider loads saved tabs from TabPersistenceService

**API Request Flow:**

1. Component calls hook (useApiCall, useAnalytics, useTrackEvent)
2. Hook invokes api.* method from `src/lib/api.ts`
3. API method calls apiCall() from apiAdapter.ts
4. Adapter detects environment (isTauriEnvironment)
5. Routes to invoke() for Tauri or fetch() for web
6. Result returned through hook, component updates state

**Store Update Flow:**

1. Component or hook calls store action (e.g., sessionStore.fetchProjects())
2. Action updates loading state via set()
3. API call executes
4. On success → Store updates data via set({ projects: [...] })
5. Component subscribed to store re-renders
6. On error → set({ error: message })

**State Management:**

- Global state: Projects, sessions, agent runs (Zustand stores with subscribeWithSelector)
- Context state: Tab management, theme, active tab ID (TabContext, ThemeContext)
- Local state: UI-specific (modals, forms, loading states) via useState
- Persisted state: Sessions, tabs (localStorage via PersistenceService)

## Key Abstractions

**Tab System:**
- Purpose: Unified navigation and multi-view support
- Examples: `src/contexts/TabContext.tsx`, `src/components/TabManager.tsx`
- Pattern: Context provider + custom hook (useTabContext) + reducer-like actions (addTab, removeTab, updateTab)
- Data structure: Array of Tab objects with type discrimination (chat | agent | projects | settings | etc.)

**API Abstraction:**
- Purpose: Unify Tauri desktop and web browser environments
- Examples: `src/lib/apiAdapter.ts`, `src/lib/api.ts`
- Pattern: Environment detection at startup → conditional routing in apiCall()
- Methods: invoke() for Tauri, fetch() for web, automatic error handling

**Persistence Services:**
- Purpose: Decouple storage implementation from components
- Examples: `src/services/sessionPersistence.ts`, `src/services/tabPersistence.ts`
- Pattern: Static class with STORAGE_KEY_PREFIX pattern, localStorage interface
- Operations: saveSession, loadSession, clearSession with fallback error handling

**Custom Hooks for Composition:**
- Purpose: Extract complex logic into reusable, testable units
- Examples: `src/hooks/useAnalytics.ts`, `src/hooks/useTabState.ts`, `src/hooks/useApiCall.ts`
- Pattern: Accept config parameters, return state + actions, manage lifecycle in useEffect
- Benefits: Logic reuse across components without prop drilling

## Entry Points

**Application Boot:**
- Location: `src/main.tsx`
- Triggers: Browser loads HTML
- Responsibilities:
  - Initialize analytics and resource monitoring
  - Detect platform (macOS-specific styling)
  - Set favicon
  - Render React root with providers (PostHogProvider, ErrorBoundary, AnalyticsErrorBoundary)

**App Component:**
- Location: `src/App.tsx`
- Triggers: After main.tsx mounts
- Responsibilities:
  - Wrap child components with ThemeProvider, TabProvider, OutputCacheProvider
  - Initialize web mode compatibility
  - Load projects on mount
  - Manage top-level view state (legacy views still supported: welcome, projects, editor, etc.)
  - Currently defaults to "tabs" view for tab-based navigation

**Tab-Based Navigation:**
- Location: `src/components/TabManager.tsx`, `src/components/TabContent.tsx`
- Triggers: App defaults to "tabs" view
- Responsibilities:
  - TabManager: Render tab bar, handle drag-reorder, track active tab
  - TabContent: Route to correct component based on active tab type

**Session Initialization:**
- Location: `src/components/ClaudeCodeSession.tsx`
- Triggers: User clicks chat tab or creates new session
- Responsibilities:
  - Detect Tauri event listeners (fallback to DOM events)
  - Stream messages from Claude
  - Manage checkpoint/timeline navigation
  - Persist session data on unmount

## Error Handling

**Strategy:** Boundary-based with granular component recovery.

**Patterns:**
- React Error Boundaries: `src/components/ErrorBoundary.tsx` (top-level), `src/components/AnalyticsErrorBoundary.tsx` (analytics-specific)
- API error handling: Try/catch in store actions with error state management
- Tauri API fallback: Conditional imports with web-mode defaults
- localStorage failures: Wrapped in try/catch, logged to console, non-fatal
- Event listener setup: Graceful degradation (DOM events if Tauri unavailable)

## Cross-Cutting Concerns

**Logging:**
- Pattern: Console.log with context prefixes (e.g., `[ClaudeCodeSession]`, `[detectEnvironment]`)
- Location: Scattered throughout for debugging (not centralized)
- No dedicated logger service

**Validation:**
- Pattern: Type-based (TypeScript strict mode enabled)
- Zod schemas used in form contexts (via @hookform/resolvers)
- Runtime validation at API boundaries

**Authentication:**
- Pattern: Implicit (API calls pass through to backend)
- No client-side auth layer
- Assumes environment (Tauri or web) handles auth upstream

**Analytics:**
- Pattern: PostHog integration with consent flow
- Location: `src/lib/analytics/` (events.ts, consent.ts, resourceMonitor.ts)
- Hooks: useAnalytics, useTrackEvent, usePageView, useAppLifecycle
- Initialization: Called in main.tsx before rendering, monitored continuously
- Resource monitoring: Tracks CPU/memory every 2 minutes

