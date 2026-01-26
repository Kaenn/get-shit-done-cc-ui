# Pitfalls Research: v1.1 UI Enhancements

**Domain:** Adding UI visualization features to existing React/Tauri/Zustand/Radix app
**Researched:** 2026-01-25
**Confidence:** HIGH (verified against codebase patterns + authoritative sources)

---

## Critical Pitfalls

These mistakes cause rewrites, broken UX, or security vulnerabilities.

### 1. Radix Portal Z-Index Collision with New Activity Bar

**Risk:** Adding an icon sidebar (activity bar) creates a new stacking context that conflicts with existing Radix portals (Dialog, Popover, DropdownMenu). Tooltips, dropdowns, and dialogs render behind the sidebar or in wrong positions.

**Why This Matters for GSD-UI:** The codebase already uses `@radix-ui/react-popover`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-dialog`, and `@radix-ui/react-tooltip`. The current `CustomTitlebar.tsx` and `TabManager.tsx` create overlapping z-index contexts. Adding a fixed sidebar will compete with these.

**Warning Signs:**
- Dropdowns or tooltips appear behind the activity bar
- Dialog overlays don't cover the sidebar
- Click events don't reach elements visually on top
- Console shows no errors, but UI layering is wrong

**Prevention:**
1. Use Radix's new `Portal` part (not the legacy radix-portal) which doesn't set automatic z-index
2. Establish a z-index scale and document it:
   ```typescript
   // z-index.ts
   export const Z_INDEX = {
     activityBar: 10,
     mainContent: 1,
     dropdown: 50,
     dialog: 100,
     toast: 150,
   } as const;
   ```
3. Apply z-index to the Portal container, not the content
4. Test every existing Radix component (tooltip, dropdown, dialog) with sidebar visible

**Phase:** Activity Bar implementation (Phase 1)

**Sources:**
- [Radix Primitives z-index issues #1317](https://github.com/radix-ui/primitives/issues/1317)
- [Radix portal layering control #760](https://github.com/radix-ui/primitives/issues/760)

---

### 2. Zustand Store Subscription Memory Leak in Tab System

**Risk:** Tabs that subscribe to Zustand stores (sessionStore, gsdStore) don't unsubscribe on unmount, causing memory leaks and stale state updates to unmounted components.

**Why This Matters for GSD-UI:** The existing `TabContext.tsx` manages tab lifecycle. When adding a tabbed file viewer that displays session data from `sessionStore.ts`, each tab will subscribe to store slices. The current code uses `subscribeWithSelector` middleware but doesn't show cleanup patterns in components.

**Warning Signs:**
- Memory grows steadily when opening/closing tabs
- Console warnings: "Can't perform state update on unmounted component"
- Stale data appears briefly when switching tabs
- Chrome DevTools Heap Snapshot shows detached DOM nodes

**Prevention:**
1. Always use selectors to subscribe to minimal state:
   ```typescript
   // GOOD: Subscribe to specific slice
   const sessions = useSessionStore((state) => state.sessions[projectId]);

   // BAD: Subscribe to entire store
   const store = useSessionStore();
   ```
2. For manual subscriptions, always unsubscribe:
   ```typescript
   useEffect(() => {
     const unsubscribe = useSessionStore.subscribe(
       (state) => state.currentSession,
       (session) => { /* handle */ }
     );
     return () => unsubscribe(); // CRITICAL
   }, []);
   ```
3. Use `destroy()` method when completely removing stores in tests

**Phase:** Tabbed File Viewer (Phase 3)

**Sources:**
- [Zustand memory leak discussion #2054](https://github.com/pmndrs/zustand/discussions/2054)
- [Zustand store cleanup best practices](https://www.projectrules.ai/rules/zustand)

---

### 3. XSS Vulnerability in Markdown Rendering with Frontmatter

**Risk:** Rendering user-provided markdown (session outputs, CLAUDE.md files) without sanitization allows XSS attacks through embedded HTML or malicious frontmatter.

**Why This Matters for GSD-UI:** The app already uses `react-markdown` and `@uiw/react-md-editor` in `MarkdownEditor.tsx`. Session outputs may contain untrusted content. If adding frontmatter parsing, YAML injection becomes a vector.

**Warning Signs:**
- Using `rehype-raw` without `rehype-sanitize`
- Rendering markdown from external sources (session files) without validation
- Frontmatter parser executes code or allows arbitrary keys
- `dangerouslySetInnerHTML` appears anywhere near markdown content

**Prevention:**
1. Never enable `rehype-raw` without `rehype-sanitize`:
   ```typescript
   import rehypeRaw from 'rehype-raw';
   import rehypeSanitize from 'rehype-sanitize';

   <ReactMarkdown
     rehypePlugins={[rehypeRaw, rehypeSanitize]} // ORDER MATTERS
   >
   ```
2. Use `gray-matter` for frontmatter with strict YAML parsing (no code execution)
3. Implement Content Security Policy as defense in depth
4. Restrict allowed HTML elements with `allowedElements` prop
5. Filter URLs with `urlTransform` to block `javascript:` protocol

**Phase:** Markdown Rendering (Phase 2)

**Sources:**
- [React Markdown Security Guide 2025](https://strapi.io/blog/react-markdown-complete-guide-security-styling)
- [Secure Markdown in React - HackerOne](https://www.hackerone.com/blog/secure-markdown-rendering-react-balancing-flexibility-and-safety)
- [Stored XSS pitfall in markdown editors](https://medium.com/@brian3814/pitfall-of-potential-xss-in-markdown-editors-1d9e0d2df93a)

---

### 4. AnimatePresence Memory Leak with Rapid Tab Switching

**Risk:** Framer Motion's `AnimatePresence` doesn't properly unmount children when state changes rapidly (fast tab switching), causing stuck animations and memory leaks.

**Why This Matters for GSD-UI:** The existing `TabManager.tsx` uses `AnimatePresence` and `motion` from `framer-motion`. The `SessionList.tsx` wraps cards in `AnimatePresence mode="popLayout"`. Rapid tab switching will trigger this bug.

**Warning Signs:**
- Exit animations don't play or get stuck mid-animation
- Old tab content remains visible after switching
- Memory grows when rapidly cycling through tabs
- Console shows React state updates on unmounted components

**Prevention:**
1. Never wrap animated children in React Fragments inside AnimatePresence:
   ```typescript
   // BAD
   <AnimatePresence>
     <>
       <motion.div key="a">...</motion.div>
       <motion.div key="b">...</motion.div>
     </>
   </AnimatePresence>

   // GOOD
   <AnimatePresence>
     <motion.div key="a">...</motion.div>
     <motion.div key="b">...</motion.div>
   </AnimatePresence>
   ```
2. Ensure AnimatePresence is NOT conditionally rendered:
   ```typescript
   // BAD: AnimatePresence unmounts before exit animation
   {isVisible && <AnimatePresence><Child /></AnimatePresence>}

   // GOOD: Keep AnimatePresence mounted
   <AnimatePresence>{isVisible && <Child />}</AnimatePresence>
   ```
3. Avoid `layoutId` conflicts when multiple tabs have same-named elements
4. Add `key` props to all animated children (already done in existing code)
5. Consider debouncing rapid tab switches (100-200ms)

**Phase:** All phases with animation (especially Tab System, Phase 3)

**Sources:**
- [AnimatePresence memory leak #625](https://github.com/framer/motion/issues/625)
- [AnimatePresence fast state changes #2554](https://github.com/framer/motion/issues/2554)
- [Understanding AnimatePresence bugs](https://medium.com/javascript-decoded-in-plain-english/understanding-animatepresence-in-framer-motion-attributes-usage-and-a-common-bug-914538b9f1d3)

---

## Medium Pitfalls

These mistakes cause delays, technical debt, or degraded UX.

### 5. Layout Thrashing When Adding Fixed Sidebar

**Risk:** Adding a fixed-position activity bar causes main content to recalculate layout on every resize/toggle, causing visible jank and paint thrashing.

**Why This Matters for GSD-UI:** The current `App.tsx` uses flexbox with `flex-1 overflow-hidden` for content areas. Adding a sidebar that toggles width will trigger expensive reflows.

**Warning Signs:**
- Visible jank when toggling sidebar
- High "Layout" times in Chrome Performance tab
- Content shifts unexpectedly during animations
- Scroll position resets when sidebar toggles

**Prevention:**
1. Use CSS transforms instead of width changes for toggle:
   ```css
   .sidebar { transform: translateX(-100%); } /* collapsed */
   .sidebar.open { transform: translateX(0); }
   ```
2. Use `will-change: transform` on sidebar
3. Keep main content width calculation in CSS, not JS
4. Use CSS Grid for the main layout (more stable than flexbox for this):
   ```css
   .layout {
     display: grid;
     grid-template-columns: auto 1fr; /* sidebar + content */
   }
   ```
5. Debounce resize handlers

**Phase:** Activity Bar implementation (Phase 1)

---

### 6. Stale Closures in Dynamic Form Callbacks

**Risk:** Form validation callbacks capture stale state when form schema changes dynamically based on user selection (e.g., different command forms require different validation).

**Why This Matters for GSD-UI:** Adding dynamic command forms with `react-hook-form` and `zod` (both already in dependencies) where validation rules change based on selected command type.

**Warning Signs:**
- Validation errors reference old field values
- Form submits with outdated data
- Async validation runs on fields that were removed
- ESLint `react-hooks/exhaustive-deps` warnings ignored

**Prevention:**
1. Use functional updates for state that validation depends on:
   ```typescript
   const onValidate = useCallback((data) => {
     // Use ref or functional update to get latest state
     return latestSchemaRef.current.parse(data);
   }, []); // Empty deps is intentional with ref
   ```
2. Reset form when schema changes:
   ```typescript
   useEffect(() => {
     reset(getDefaultValues(commandType));
   }, [commandType, reset]);
   ```
3. Separate Zod schemas per command type (discriminated union)
4. Use `mode: "onChange"` carefully with async validation (causes per-keystroke requests)
5. Debounce async validation with `awesome-debounce-promise` (lodash.debounce breaks promises)

**Phase:** Dynamic Command Forms (Phase 2)

**Sources:**
- [Async Form Validation with Zod & React Hook Form](https://blog.benorloff.co/async-form-validation-with-zod-react-hook-form)
- [React Hook Form async validation patterns #9005](https://github.com/orgs/react-hook-form/discussions/9005)
- [Stale closures in React](https://www.dhiwise.com/post/react-stale-closure-common-problems-and-easy-solutions)

---

### 7. Tree View Type Confusion with Heterogeneous Data

**Risk:** Mixing different data types in the same tree (current milestone items + archived items) without proper TypeScript discrimination leads to runtime errors when accessing type-specific properties.

**Why This Matters for GSD-UI:** The existing `FilePicker.tsx` handles only `FileEntry` type. Adding a tree that shows both current milestone files AND archived sessions requires handling different node types.

**Warning Signs:**
- TypeScript errors suppressed with `as any`
- Runtime "undefined is not a function" on type-specific methods
- Inconsistent node rendering (some nodes missing icons/actions)
- Optional properties accessed without null checks

**Prevention:**
1. Use discriminated unions with a `type` or `kind` discriminant:
   ```typescript
   type TreeNode =
     | { kind: 'milestone'; data: MilestoneItem; children: TreeNode[] }
     | { kind: 'archive'; data: ArchivedSession; children: TreeNode[] }
     | { kind: 'file'; data: FileEntry };

   function renderNode(node: TreeNode) {
     switch (node.kind) {
       case 'milestone': return <MilestoneNode {...node.data} />;
       case 'archive': return <ArchiveNode {...node.data} />;
       case 'file': return <FileNode {...node.data} />;
     }
   }
   ```
2. Never destructure before narrowing:
   ```typescript
   // BAD
   const { data } = node; // data type is unknown

   // GOOD
   if (node.kind === 'file') {
     const { data } = node; // data is FileEntry
   }
   ```
3. Use exhaustive switch checks with `never` type
4. Normalize data at fetch time, not render time

**Phase:** Tree View Enhancement (Phase 4)

**Sources:**
- [TypeScript Discriminated Unions for React](https://medium.com/@uramanovich/typescript-discriminated-unions-for-robust-react-components-58bc06f37299)
- [Discriminated unions best practices](https://www.totaltypescript.com/discriminated-unions-are-a-devs-best-friend)

---

### 8. react-markdown Performance with Large Session Outputs

**Risk:** Rendering large markdown files (session outputs can be 1000+ lines) causes UI freeze during parsing, blocking animations and user input.

**Why This Matters for GSD-UI:** Session outputs displayed in `SessionOutputViewer.tsx` can be very large. The current `MarkdownEditor.tsx` uses `@uiw/react-md-editor` which has similar concerns.

**Warning Signs:**
- UI freezes for 1-3 seconds when opening large files
- Animations stutter during markdown render
- Chrome DevTools shows long "Scripting" tasks (>100ms)
- `react-markdown` parse happens on main thread

**Prevention:**
1. Virtualize long markdown content with `react-window`:
   ```typescript
   // Split markdown into blocks, render only visible
   const blocks = markdown.split('\n\n');
   <VariableSizeList
     height={400}
     itemCount={blocks.length}
     itemSize={getBlockHeight}
   >
     {({ index, style }) => (
       <div style={style}>
         <ReactMarkdown>{blocks[index]}</ReactMarkdown>
       </div>
     )}
   </VariableSizeList>
   ```
2. Memoize parsed markdown:
   ```typescript
   const memoizedContent = useMemo(
     () => <ReactMarkdown>{content}</ReactMarkdown>,
     [content]
   );
   ```
3. Show loading state during parse (don't block UI)
4. Consider pre-rendering to HTML on backend for very large files
5. Truncate preview with "Show more" expansion

**Phase:** Markdown Rendering / Session Viewer (Phase 2, 3)

**Sources:**
- [react-markdown virtualization discussion #1027](https://github.com/orgs/remarkjs/discussions/1027)
- [react-markdown performance #459](https://github.com/remarkjs/react-markdown/issues/459)

---

## Low Pitfalls

These mistakes cause annoyance but are fixable.

### 9. Event Listener Cleanup in FilePicker Keyboard Navigation

**Risk:** Adding keyboard navigation to tree view without proper cleanup causes duplicate handlers and memory leaks.

**Why This Matters for GSD-UI:** The existing `FilePicker.tsx` already has keyboard event handling in a useEffect (lines 186-237). Extending this pattern to a new tree view requires careful cleanup.

**Warning Signs:**
- Keyboard shortcuts fire multiple times
- After navigating away and back, key handling is broken
- Memory gradually increases with repeated mounts

**Prevention:**
1. Always return cleanup function:
   ```typescript
   useEffect(() => {
     const handler = (e: KeyboardEvent) => { /* ... */ };
     window.addEventListener('keydown', handler);
     return () => window.removeEventListener('keydown', handler);
   }, [dependencies]);
   ```
2. Use `useCallback` for handler to maintain reference stability
3. Consider `useEventListener` hook to encapsulate pattern

**Phase:** Tree View Enhancement (Phase 4)

---

### 10. Tab State Desync with External Updates

**Risk:** Tab state in `TabContext.tsx` can desync from actual session state when sessions are updated externally (e.g., Tauri file watcher, SSE updates).

**Why This Matters for GSD-UI:** The `TabContext.tsx` stores `sessionData` in tab objects. The `sessionStore.ts` has `handleSessionUpdate` for real-time updates. These two sources of truth can diverge.

**Warning Signs:**
- Tab title shows old session name after rename
- "Unsaved changes" indicator appears incorrectly
- Session data in tab differs from store data

**Prevention:**
1. Single source of truth - store session ID in tab, fetch data from store:
   ```typescript
   // Tab stores only sessionId, not sessionData
   const session = useSessionStore(
     (state) => state.sessions[tab.sessionId]
   );
   ```
2. Or, subscribe to store changes and update tab:
   ```typescript
   useEffect(() => {
     const unsub = useSessionStore.subscribe(
       (state) => state.sessions[sessionId],
       (session) => updateTab(tabId, { sessionData: session })
     );
     return unsub;
   }, [sessionId]);
   ```
3. Use optimistic updates with rollback on failure

**Phase:** Tabbed File Viewer (Phase 3)

---

### 11. Tailwind Dynamic Class Name Compilation Failure

**Risk:** Tailwind's JIT compiler doesn't compile class names constructed dynamically at runtime.

**Why This Matters for GSD-UI:** When building dynamic forms with conditional styling based on validation state or command type.

**Warning Signs:**
- Styles work in development but fail in production
- Conditional classes like `text-${color}-500` don't apply
- No error messages, just missing styles

**Prevention:**
1. Use complete class names, not interpolation:
   ```typescript
   // BAD
   className={`text-${isError ? 'red' : 'green'}-500`}

   // GOOD
   className={isError ? 'text-red-500' : 'text-green-500'}
   ```
2. Use CVA (class-variance-authority) - already in dependencies
3. Safelist dynamic classes in tailwind.config if needed

**Phase:** All phases with conditional styling

---

## Phase-Specific Risk Summary

| Phase | Feature | High-Risk Pitfalls | Mitigation Focus |
|-------|---------|-------------------|------------------|
| 1 | Activity Bar | #1 Z-Index, #5 Layout Thrashing | Z-index scale, CSS Grid layout |
| 2 | Command Forms + Markdown | #3 XSS, #6 Stale Closures, #8 Performance | rehype-sanitize, useCallback, virtualization |
| 3 | Tabbed Viewer | #2 Memory Leak, #4 AnimatePresence, #10 State Desync | Cleanup patterns, single source of truth |
| 4 | Tree View | #7 Type Confusion, #9 Event Cleanup | Discriminated unions, effect cleanup |

---

## Integration Risks with Existing Codebase

### Existing Patterns to Preserve

1. **Tab lifecycle** (`TabContext.tsx`) - Don't duplicate session state
2. **Store subscriptions** (`sessionStore.ts`) - Use `subscribeWithSelector` patterns
3. **Animation patterns** (`framer-motion` usage in `SessionList.tsx`, `TabManager.tsx`) - Keep AnimatePresence outside conditionals
4. **Radix component usage** - Respect existing portal/overlay patterns

### Files Most Likely to Need Modification

| File | Risk | Reason |
|------|------|--------|
| `App.tsx` | Medium | Layout restructure for activity bar |
| `TabContext.tsx` | High | Tab state management changes |
| `TabManager.tsx` | Medium | Animation and z-index changes |
| `sessionStore.ts` | Low | May need additional selectors |

---

## Sources

- [Radix Primitives z-index #1317](https://github.com/radix-ui/primitives/issues/1317)
- [Zustand subscriptions #2054](https://github.com/pmndrs/zustand/discussions/2054)
- [React Markdown Security 2025](https://strapi.io/blog/react-markdown-complete-guide-security-styling)
- [AnimatePresence bugs](https://github.com/framer/motion/issues/625)
- [React Hook Form async validation](https://blog.benorloff.co/async-form-validation-with-zod-react-hook-form)
- [TypeScript Discriminated Unions](https://www.totaltypescript.com/discriminated-unions-are-a-devs-best-friend)
- [react-markdown performance #1027](https://github.com/orgs/remarkjs/discussions/1027)
- [Stale closures in React](https://www.dhiwise.com/post/react-stale-closure-common-problems-and-easy-solutions)
- [Z-index and stacking contexts](https://dev.to/minoosh/today-i-learned-layouts-and-the-z-index-trap-in-react-366f)
