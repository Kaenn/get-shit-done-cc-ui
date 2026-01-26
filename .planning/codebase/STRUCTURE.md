# Codebase Structure

**Analysis Date:** 2026-01-24

## Directory Layout

```
gsd-ui/
├── src/                                # Main React application source
│   ├── main.tsx                        # Entry point, providers setup
│   ├── App.tsx                         # Root component, view routing
│   ├── styles.css                      # Global Tailwind + custom styles
│   ├── vite-env.d.ts                   # Vite environment types
│   ├── components/                     # React components (121 files)
│   │   ├── ui/                         # Radix UI primitives
│   │   ├── claude-code-session/        # Claude session sub-components
│   │   ├── widgets/                    # Tool-specific widgets
│   │   ├── ClaudeCodeSession.tsx       # Main session component (68KB)
│   │   ├── AgentExecution.tsx          # Agent run orchestration
│   │   ├── TabManager.tsx              # Tab bar and drag-reorder
│   │   ├── TabContent.tsx              # Tab content router
│   │   ├── Settings.tsx                # Settings panel
│   │   ├── ProjectList.tsx             # Project listing
│   │   ├── SessionList.tsx             # Session history
│   │   └── [50+ other feature components]
│   ├── contexts/                       # React Context providers
│   │   ├── TabContext.tsx              # Tab state and persistence
│   │   └── ThemeContext.tsx            # Theme (dark/light) mode
│   ├── hooks/                          # Custom React hooks
│   │   ├── useAnalytics.ts             # Analytics events (22KB)
│   │   ├── useTabState.ts              # Tab management hook
│   │   ├── useApiCall.ts               # API call wrapper
│   │   ├── usePerformanceMonitor.ts    # Performance tracking
│   │   ├── index.ts                    # Barrel export
│   │   └── [5 other utility hooks]
│   ├── stores/                         # Zustand state management
│   │   ├── sessionStore.ts             # Session/project state
│   │   ├── agentStore.ts               # Agent runs state
│   │   └── README.md
│   ├── services/                       # Data persistence services
│   │   ├── sessionPersistence.ts       # Session localStorage
│   │   └── tabPersistence.ts           # Tab localStorage
│   ├── lib/                            # Utilities and adapters
│   │   ├── api.ts                      # Type definitions + API methods (53KB)
│   │   ├── apiAdapter.ts               # Tauri/web environment adapter
│   │   ├── analytics/                  # Analytics system
│   │   │   ├── index.ts                # Main export
│   │   │   ├── events.ts               # Event definitions
│   │   │   ├── consent.ts              # GDPR consent flow
│   │   │   ├── resourceMonitor.ts      # CPU/memory tracking
│   │   │   └── types.ts                # Analytics types
│   │   ├── api-tracker.ts              # API call instrumentation
│   │   ├── claudeSyntaxTheme.ts        # Code highlighting theme
│   │   ├── date-utils.ts               # Date formatting
│   │   ├── hooksManager.ts             # Hook configuration
│   │   ├── linkDetector.tsx            # URL parsing
│   │   ├── outputCache.tsx             # Message output caching
│   │   └── utils.ts                    # Class name utilities
│   ├── types/                          # TypeScript definitions
│   │   └── hooks.ts                    # Hook configuration types
│   └── assets/                         # Static assets
│       ├── fonts/                      # Inter font files
│       ├── nfo/                        # NFO art and logo
│       └── shimmer.css                 # Shimmer animation
├── src-tauri/                          # Tauri desktop backend
│   ├── src/                            # Rust source code
│   │   ├── commands/                   # IPC command handlers
│   │   ├── process/                    # Process management
│   │   └── checkpoint/                 # Checkpoint persistence
│   ├── tauri.conf.json                 # Tauri configuration
│   └── Cargo.toml                      # Rust dependencies
├── tsconfig.json                       # TypeScript configuration
├── vite.config.ts                      # Vite build configuration
├── package.json                        # NPM dependencies and scripts
├── .planning/                          # GSD planning artifacts
│   └── codebase/                       # Analysis documents
├── scripts/                            # Build and utility scripts
├── .github/workflows/                  # CI/CD configuration
└── README.md                           # Project documentation
```

## Directory Purposes

**src/components/**
- Purpose: All React UI components (functional)
- Contains: Pages, layouts, features, UI primitives, modals, forms
- Key files: ClaudeCodeSession.tsx (main session view), TabManager.tsx (navigation)
- Organization: Feature-based subdirectories (ui/, claude-code-session/, widgets/)

**src/contexts/**
- Purpose: React Context API providers for shared state
- Contains: TabContext for navigation, ThemeContext for styling
- Pattern: Context + useContext hook for component consumption

**src/hooks/**
- Purpose: Custom React hooks for logic reuse
- Contains: Analytics, API calls, tab state, performance monitoring
- Pattern: Named useXXX, accept config, return state+actions
- Exported: All from index.ts barrel file

**src/stores/**
- Purpose: Global state management via Zustand
- Contains: sessionStore (projects/sessions), agentStore (agent runs)
- Pattern: Store creators with middleware (subscribeWithSelector)
- Features: Loading states, error handling, CRUD actions

**src/services/**
- Purpose: Stateless service classes for persistence and cross-cutting concerns
- Contains: SessionPersistenceService (localStorage), TabPersistenceService
- Pattern: Static methods, wrapped in try/catch
- Access: localStorage only (no network calls)

**src/lib/**
- Purpose: Utilities, adapters, and foundational services
- Contains: API definitions, environment adapter, analytics, helpers
- Key patterns:
  - `api.ts`: Type definitions + API client methods
  - `apiAdapter.ts`: Tauri vs web routing
  - `analytics/`: PostHog integration with event tracking
  - Utilities: cn() for classes, date formatting, link detection

**src/lib/analytics/**
- Purpose: Analytics and monitoring system
- Modules:
  - `events.ts`: Event type definitions and tracking methods
  - `consent.ts`: GDPR consent management
  - `resourceMonitor.ts`: CPU/memory monitoring loop
  - `types.ts`: Shared type definitions

**src/types/**
- Purpose: Shared TypeScript interfaces (non-component)
- Contains: Hook configuration types
- Pattern: Separate from component types (which inline)

**src/assets/**
- Purpose: Static files (fonts, images, CSS animations)
- Contains: Inter font, NFO logo/art, shimmer animation

**src-tauri/**
- Purpose: Desktop application backend (Rust)
- Contains: IPC command handlers, process management, file operations
- Separate from React source but compiled together

## Key File Locations

**Entry Points:**
- `src/main.tsx`: React app initialization, provider setup
- `src/App.tsx`: Root component with view routing
- `src-tauri/src/main.rs`: Tauri window initialization

**Configuration:**
- `tsconfig.json`: TypeScript compiler options, path aliases (@/*)
- `vite.config.ts`: Build tool configuration
- `package.json`: Dependencies, build scripts
- `src-tauri/tauri.conf.json`: Tauri app settings

**Core Logic:**
- `src/lib/api.ts`: API methods and type definitions
- `src/stores/sessionStore.ts`: Session/project state
- `src/stores/agentStore.ts`: Agent run state
- `src/hooks/useTabState.ts`: Tab management logic
- `src/hooks/useAnalytics.ts`: Analytics event tracking

**Testing:**
- No test files in src (testing infrastructure not present)

## Naming Conventions

**Files:**
- Components: PascalCase.tsx (ClaudeCodeSession.tsx)
- Services: PascalCase class + Service suffix (SessionPersistenceService)
- Utilities: camelCase.ts (apiAdapter.ts, utils.ts)
- Types: camelCase.ts (hooks.ts)
- Hooks: camelCase starting with 'use' (useAnalytics.ts)
- Folders: kebab-case for compound names (claude-code-session, ui)

**Components:**
- React functional components in PascalCase (TabManager, ClaudeCodeSession)
- Props interfaces: ComponentNameProps (TabManagerProps)
- Internal functions: camelCase (getIcon, getStatusIcon)
- Event handlers: camelCase with 'on' prefix (onClose, onClick)

**Variables:**
- State: camelCase (activeTabId, isLoading)
- Constants: UPPER_SNAKE_CASE (MAX_TABS, STORAGE_KEY_PREFIX)
- React hooks state: camelCase pairs (const [value, setValue] = useState())

**Types:**
- Interfaces: PascalCase (Tab, TabContextType, Session)
- Type aliases: PascalCase (ProcessType, View)
- Generic types: T, U (standard conventions)

## Where to Add New Code

**New Feature Component:**
- Primary code: `src/components/FeatureName.tsx`
- Sub-components: `src/components/feature-name/` subdirectory
- Props types: Inline in component file, interface named ComponentNameProps
- Imports: Use @/ path alias for absolute imports from src/

**New Hook for Feature:**
- Implementation: `src/hooks/useFeatureName.ts`
- Export: Add to `src/hooks/index.ts` barrel file
- Pattern: Follow useAnalytics.ts or useTabState.ts for structure

**New State Management:**
- Zustand store: `src/stores/featureStore.ts`
- Pattern: Use sessionStore.ts or agentStore.ts as template
- Middleware: subscribeWithSelector for reactive subscriptions

**New Utility Function:**
- Shared utilities: `src/lib/utils.ts` (add to cn-like exports)
- Feature-specific: `src/lib/featureName.ts` (new file)
- Services: `src/services/FeatureNameService.ts` (if class-based)

**New API Methods:**
- Add to: `src/lib/api.ts` in appropriate section
- Pattern: Define types at top, methods below
- Routing: Call apiCall() from apiAdapter.ts (handles Tauri/web)

**New Type Definitions:**
- Component types: Inline in component file
- Shared types: `src/types/featureName.ts` or add to existing type file
- API types: Define in `src/lib/api.ts` alongside methods

## Special Directories

**node_modules/:**
- Purpose: NPM dependencies
- Generated: Yes (from package.json + pnpm-lock.yaml)
- Committed: No
- Note: pnpm workspace used (see pnpm-lock.yaml)

**.git/:**
- Purpose: Git repository
- Generated: Yes
- Committed: No

**src-tauri/:targets/**
- Purpose: Compiled Tauri binaries
- Generated: Yes (during build)
- Committed: No

**dist/**
- Purpose: Built web assets (after vite build)
- Generated: Yes
- Committed: No

**.planning/codebase/**
- Purpose: GSD analysis documents
- Generated: Yes (by /gsd:map-codebase)
- Committed: Yes (for team reference)

**scripts/**
- Purpose: Utility and build scripts
- Contains: fetch-and-build.js for executable download
- Committed: Yes

## Component Organization Patterns

**Feature Components (Large):**
- Pattern: Combine logic + UI in single file if <200 lines
- Split at: >200 lines → move sub-components to subdirectory
- Example: ClaudeCodeSession.tsx (68KB) has sub-exports in claude-code-session/

**UI Component Library:**
- Location: `src/components/ui/`
- Source: Radix UI + shadcn/ui style (wrapped primitives)
- Pattern: Each component in separate file (button.tsx, dialog.tsx)
- Export: Via components/index.ts barrel file

**Modal/Dialog Components:**
- Pattern: Render inline via state (DialogContent, DialogHeader, etc.)
- Location: In parent component or separate .tsx if complex
- Closure: Via Dialog onOpenChange handler

**Widget Components:**
- Location: `src/components/widgets/`
- Purpose: Tool-specific components (BashWidget, LSWidget, TodoWidget)
- Pattern: Receive data via props, event callbacks

## Path Aliases

**Configuration:**
- `@/*` → `./src/*`
- Defined in: `tsconfig.json` and Vite config
- Usage: All imports use @/ prefix for absolute paths from src/

**Examples:**
- `import { api } from "@/lib/api"`
- `import { useTabState } from "@/hooks/useTabState"`
- `import { Button } from "@/components/ui/button"`

