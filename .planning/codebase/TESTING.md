# Testing Patterns

**Analysis Date:** 2025-01-24

## Test Framework

**Runner:**
- No testing framework detected (no jest.config, vitest.config, or @testing-library packages in package.json)
- No test files found in codebase (`find src -name "*.test.*" -o -name "*.spec.*"` returns no results)
- TypeScript compiler used for type checking: `tsc --noEmit`

**Run Commands:**
```bash
npm run check              # TypeScript type checking
npm run build             # Build with type checking first
npm run dev               # Development with hot reload
```

## Test File Organization

**Current State:**
- No automated testing infrastructure present
- Code quality enforced through TypeScript strict mode instead of tests
- Type checking serves as primary validation layer

**When Tests Are Needed:**
- Utilities in `src/lib/` (api.ts, outputCache.tsx, apiAdapter.ts)
- State management (agentStore.ts, sessionStore.ts)
- Custom hooks (useApiCall.ts, useClaudeMessages.ts, useAnalytics.ts)
- Complex components (FloatingPromptInput.tsx, ToolWidgets.tsx, AgentExecution.tsx)

**Recommended Structure:**
- Co-locate test files: `src/components/Button.tsx` → `src/components/Button.test.tsx`
- Or separate directory: `src/components/__tests__/Button.test.tsx`
- Store fixtures in `src/fixtures/` or `src/__mocks__/`

## Type-Based Validation Strategy

**TypeScript Strict Mode:**
- All code must pass strict TypeScript checking
- No `any` types without explicit justification
- No unused variables or parameters allowed
- No implicit `this` binding in classes

**Validation Pattern:**
The codebase uses TypeScript interfaces for validation rather than runtime tests:
```typescript
// Example from agentStore.ts - type-safe state management
interface AgentState {
  agentRuns: AgentRunWithMetrics[];
  runningAgents: Set<string>;
  isLoadingRuns: boolean;
  error: string | null;
  fetchAgentRuns: (forceRefresh?: boolean) => Promise<void>;
  // ... other actions
}
```

**Error Handling Pattern (from useClaudeMessages.ts):**
- Try-catch blocks with proper error type checking
- Graceful fallbacks on parse failures
- Logging for debugging

```typescript
try {
  const msg = JSON.parse(line);
  loadedMessages.push(msg);
  loadedRawJsonl.push(line);
} catch (e) {
  console.error("Failed to parse JSONL:", e);
}
```

## Async Testing Considerations

**Current Pattern (from useClaudeMessages.ts):**
- Event-driven async testing via Tauri or web events
- Stream message handling through event listeners
- Session info detection from message types

```typescript
const handleMessage = useCallback((message: ClaudeStreamMessage) => {
  if ((message as any).type === "start") {
    setIsStreaming(true);
    options.onStreamingChange?.(true, currentSessionId);
  } else if ((message as any).type === "response" && message.message?.usage) {
    const totalTokens = (message.message.usage.input_tokens || 0) +
                       (message.message.usage.output_tokens || 0);
    options.onTokenUpdate?.(totalTokens);
  }
}, [currentSessionId, options]);
```

**If Testing Framework Added:**
- Mock event listeners with Jest/Vitest
- Test streaming message accumulation
- Validate token counting
- Verify state updates on message types

## Mocking Strategy (When Tests Are Added)

**What Should Be Mocked:**
- API calls (mock `api.listProjects()`, `api.getSessionOutput()`, etc.)
- Event listeners (window events, Tauri events)
- External dependencies (Tauri, PostHog analytics)
- File system operations (mocked through apiAdapter)

**What NOT to Mock:**
- Core business logic in stores and hooks
- Component rendering
- State transitions
- Error handling paths

**Example Mock Pattern (for api calls):**
```typescript
// Would use jest.mock or vi.mock when testing framework is added
const mockApi = {
  listProjects: jest.fn().mockResolvedValue([
    { id: 'test-1', path: '/test', sessions: [], created_at: 1234567890 }
  ]),
  getSessionOutput: jest.fn().mockResolvedValue('output string'),
};
```

## Fixtures and Test Data

**Test Data Pattern (from types):**
Interfaces are well-defined for creating test data:

```typescript
// From api.ts - easy to create test fixtures
export interface Project {
  id: string;
  path: string;
  sessions: string[];
  created_at: number;
  most_recent_session?: number;
}

export interface Session {
  id: string;
  project_id: string;
  project_path: string;
  todo_data?: any;
  created_at: number;
  first_message?: string;
  message_timestamp?: string;
}
```

**Fixture Location (Recommendation):**
- `src/__fixtures__/api.ts` - API response fixtures
- `src/__fixtures__/messages.ts` - Claude stream message fixtures
- `src/__mocks__/api.ts` - Mock implementation of API module

**Stream Message Fixtures Example:**
```typescript
// Would go in src/__fixtures__/messages.ts
export const SAMPLE_STREAM_MESSAGE: ClaudeStreamMessage = {
  type: "response",
  message: {
    usage: {
      input_tokens: 100,
      output_tokens: 50
    }
  }
};
```

## Integration Testing Scenarios

**Critical User Journeys to Test:**

1. **Project Creation & Loading (from App.tsx)**
   - User selects directory
   - Project is created
   - Sessions are loaded
   - Proper state updates

2. **Claude Message Streaming (from useClaudeMessages.ts)**
   - Event listener setup (Tauri vs Web mode)
   - Message parsing and accumulation
   - Token usage tracking
   - State synchronization

3. **Agent Execution (from agentStore.ts)**
   - Create agent run
   - Update run status
   - Handle streaming output
   - Cancel/delete operations
   - Polling for updates

4. **Tab Management (from useTabState.ts)**
   - Create new tabs
   - Switch between tabs
   - Close tabs
   - Persist state

## Coverage Targets (If Tests Are Added)

**High Priority:**
- API adapters and data transformations (100% coverage)
- State management stores (100% coverage)
- Custom hooks (90%+ coverage)
- Error handling paths (100% coverage)

**Medium Priority:**
- Component render logic (80%+ coverage)
- Event handlers (80%+ coverage)
- Utility functions (100% coverage)

**Lower Priority:**
- UI animations (framer-motion)
- Analytics tracking
- Theme switching (visual regressions better than unit tests)

## Performance Testing

**Current Approach:**
- Performance monitoring hook: `usePerformanceMonitor` in `src/hooks/usePerformanceMonitor.ts`
- Async performance tracker: `useAsyncPerformanceTracker`
- Resource monitoring: `src/lib/analytics/resourceMonitor.ts`

**If Tests Are Added:**
- Monitor component render time
- Track API call latency
- Validate polling interval performance
- Test virtual list rendering (Tanstack virtual)

## Recommended Testing Stack (If Implementing)

**Framework:** Vitest (lightweight, Vite-native)
- Fast, parallel execution
- ESM-native
- Great TypeScript support

**Component Testing:** Vitest + React Testing Library
- For component render and interaction testing
- DOM-level assertions

**Mocking:** Vitest built-in mock utilities
- Simple API mocking
- Module mocking for Tauri/browser APIs

**Setup:**
```bash
npm install -D vitest @testing-library/react @testing-library/user-event
```

**Config (vitest.config.ts):**
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

## Example Test Patterns (Template for Future Implementation)

**Hook Testing:**
```typescript
// src/hooks/__tests__/useApiCall.test.ts
import { renderHook, act } from '@testing-library/react'
import { useApiCall } from '../useApiCall'

describe('useApiCall', () => {
  it('should handle successful API calls', async () => {
    const mockApi = jest.fn().mockResolvedValue({ data: 'test' })
    const { result } = renderHook(() => useApiCall(mockApi))

    await act(async () => {
      const data = await result.current.call()
    })

    expect(result.current.data).toEqual({ data: 'test' })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })
})
```

**Store Testing:**
```typescript
// src/stores/__tests__/agentStore.test.ts
import { renderHook, act } from '@testing-library/react'
import { useAgentStore } from '../agentStore'

describe('agentStore', () => {
  it('should fetch agent runs', async () => {
    const { result } = renderHook(() => useAgentStore())

    await act(async () => {
      await result.current.fetchAgentRuns()
    })

    expect(result.current.isLoadingRuns).toBe(false)
    expect(Array.isArray(result.current.agentRuns)).toBe(true)
  })
})
```

---

*Testing analysis: 2025-01-24*
