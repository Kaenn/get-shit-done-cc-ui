# Coding Conventions

**Analysis Date:** 2025-01-24

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `App.tsx`, `SessionList.tsx`, `ClaudeCodeSession.tsx`)
- TypeScript/JavaScript modules: camelCase or kebab-case (e.g., `useApiCall.ts`, `api-tracker.ts`, `date-utils.ts`)
- Hooks: `use` prefix with camelCase (e.g., `useClaudeMessages.ts`, `useTabState.ts`, `useApiCall.ts`)
- UI component files: descriptive PascalCase (e.g., `FloatingPromptInput.tsx`, `StreamMessage.tsx`)
- Utilities and services: camelCase (e.g., `apiAdapter.ts`, `hooksManager.ts`, `outputCache.tsx`)

**Functions:**
- Hooks: `use` prefix followed by descriptive name (e.g., `useClaudeMessages`, `useTabState`, `useApiCall`)
- Regular functions: camelCase (e.g., `handleMessage`, `loadProjects`, `clearMessages`)
- Event handlers: `handle` prefix (e.g., `handleProjectClick`, `handleViewChange`, `handleMessage`)
- Async operations: descriptive camelCase (e.g., `fetchAgentRuns`, `loadMessages`, `createAgentRun`)

**Variables:**
- Component state: camelCase (e.g., `projects`, `selectedProject`, `isLoading`, `currentSessionId`)
- Boolean flags: is/has prefix (e.g., `isLoading`, `isStreaming`, `hasTrackedFirstChat`, `showNFO`)
- Event handlers: camelCase (e.g., `onSuccess`, `onError`, `onSessionInfo`)
- Configuration objects: lowercase with underscores (e.g., `THEME_STORAGE_KEY`, `CUSTOM_COLORS_STORAGE_KEY`)

**Types:**
- Interfaces: PascalCase (e.g., `Project`, `Session`, `ClaudeSettings`, `AgentState`)
- Type aliases: PascalCase (e.g., `View`, `ProcessType`, `ThemeMode`)
- Enums/unions: PascalCase (e.g., `HookEvent`, `HookScope`)

## Code Style

**Formatting:**
- No explicit linting config found (no .eslintrc, .prettierrc, or biome.json)
- Consistent use of semicolons
- Two-space indentation observed in config files, but files use consistent internal formatting
- String quotes: double quotes for JSX attributes, single quotes for strings

**Linting:**
- TypeScript strict mode enabled (`"strict": true` in tsconfig.json)
- Unused locals/parameters not allowed (`"noUnusedLocals": true`, `"noUnusedParameters": true`)
- No fallthrough switch cases allowed (`"noFallthroughCasesInSwitch": true`)
- Type checking enforced (`"noEmit": true`)

## Import Organization

**Order:**
1. React and third-party libraries (e.g., `import { useState, useEffect } from "react"`)
2. UI libraries and components (e.g., `import { motion } from "framer-motion"`, `import { Bot } from "lucide-react"`)
3. API and lib modules (e.g., `import { api } from "@/lib/api"`)
4. Context and providers (e.g., `import { OutputCacheProvider } from "@/lib/outputCache"`)
5. Components (e.g., `import { Card } from "@/components/ui/card"`)
6. Hooks (e.g., `import { useTabState } from "@/hooks/useTabState"`)
7. Types (e.g., `import type { Project, Session } from "@/lib/api"`)

**Path Aliases:**
- `@/*` points to `./src/*` for absolute imports
- Used consistently throughout codebase: `@/lib/api`, `@/components/ui/card`, `@/hooks/useTabState`
- Type-only imports use `import type` syntax

## Error Handling

**Patterns:**
- Try-catch blocks with explicit error type checking: `error instanceof Error ? error.message : 'Default message'`
- Error objects always converted to strings with fallback messages
- Examples from `agentStore.ts`:
  ```typescript
  } catch (error) {
    set({
      error: error instanceof Error ? error.message : 'Failed to fetch agent runs',
      isLoadingRuns: false
    });
  }
  ```
- Async operations always set loading/error state in try-catch-finally pattern
- Error state stored in component/store for display
- Errors logged to console with `console.error()` for debugging (especially in data loading)

**State Management:**
- Loading states set to true before async operations
- Error set to null when operation starts
- Error and loading both updated in catch blocks
- Cleanup in finally blocks when needed

## Logging

**Framework:** `console` (no external logging library)

**Patterns:**
- Debug traces: prefixed with `[TRACE]` (e.g., in `useClaudeMessages.ts`)
- Error logging: `console.error("message:", error)` with context
- Info logging: `console.log("[TAG] message")` with descriptive tags
- Heavy tracing in stream processing and event handling functions
- Examples from `useClaudeMessages.ts`:
  ```typescript
  console.log('[TRACE] useClaudeMessages handleMessage called with:', message);
  console.error("Failed to parse JSONL:", e);
  ```

## Comments

**When to Comment:**
- JSDoc blocks for public functions and hooks
- Inline comments for complex logic or non-obvious behavior
- Block comments for section separation (e.g., `// Initialize web mode compatibility on mount`)
- Comments above effect hooks explaining their purpose

**JSDoc/TSDoc:**
- Used for function parameters and return types
- Includes `@example` for complex utilities (e.g., `cn()` function in `utils.ts`)
- Parameter documentation with type hints
- Return type documentation
- Example from `utils.ts`:
  ```typescript
  /**
   * Combines multiple class values into a single string using clsx and tailwind-merge.
   * This utility function helps manage dynamic class names and prevents Tailwind CSS conflicts.
   *
   * @param inputs - Array of class values that can be strings, objects, arrays, etc.
   * @returns A merged string of class names with Tailwind conflicts resolved
   *
   * @example
   * cn("px-2 py-1", condition && "bg-blue-500", { "text-white": isActive })
   */
  ```

## Function Design

**Size:**
- Small, focused functions preferred
- Large components factored into smaller sub-components
- Single responsibility principle observed
- `App.tsx` is 541 lines as a container; most components 500-1000 lines

**Parameters:**
- Destructured object parameters for multiple options (e.g., `options: UseClaudeMessagesOptions = {}`)
- Generic type parameters for reusable hooks (e.g., `useApiCall<T>`, `usePagination<T>`)
- Default parameters used: `(options: ApiCallOptions = {})`, `(interval = 3000)`

**Return Values:**
- Objects with multiple related values (e.g., hooks return state + callbacks)
- Tuples for closely related pairs (not heavily used)
- Custom interfaces for complex return types
- Example from `useApiCall`:
  ```typescript
  interface ApiCallState<T> {
    data: T | null;
    isLoading: boolean;
    error: Error | null;
    call: (...args: any[]) => Promise<T | null>;
    reset: () => void;
  }
  ```

## Module Design

**Exports:**
- Named exports preferred for individual items (hooks, components, utilities)
- Default export for main component (e.g., `export default App`)
- Barrel files (index.ts) export from all hooks: `export { useLoadingState } from './useLoadingState'`
- Type exports use `export type` syntax

**Barrel Files:**
- `src/hooks/index.ts` centralizes all hook exports
- Allows consistent import paths: `import { useTheme, useApiCall } from "@/hooks"`
- Simplifies component imports and reduces import path complexity

## React Patterns

**Hooks:**
- Functional components exclusively
- Custom hooks for reusable logic (useTabState, useClaudeMessages, useAnalytics)
- React context for global state (ThemeContext, TabContext, OutputCacheContext)
- Zustand stores for complex state (agentStore, sessionStore)

**Components:**
- `React.forwardRef` for UI components that need ref access (all card sub-components)
- `displayName` set on forwardRef components for debugging
- Props destructuring with rest parameters: `({ className, ...props }, ref) => (...)`
- Provider pattern for contexts: `OutputCacheProvider`, `TabProvider`

**State Management:**
- Zustand for global stores with middleware (subscribeWithSelector)
- React Context for theme and tab management
- Local component state for UI-only concerns
- No Redux or other state management library

## Type Safety

**TypeScript Configuration:**
- Target ES2020
- Strict mode enabled
- JSX set to "react-jsx" (no React import needed in files)
- Isolated modules enabled
- Path aliases for cleaner imports
- No unused locals/parameters allowed

**Common Type Patterns:**
- Generic types for reusable hooks: `useApiCall<T>`, `usePagination<T>`
- Union types for state variants: `type View = "welcome" | "projects" | "editor" | ...`
- Interface composition for complex objects
- Type-only imports: `import type { Project, Session } from "@/lib/api"`

---

*Convention analysis: 2025-01-24*
