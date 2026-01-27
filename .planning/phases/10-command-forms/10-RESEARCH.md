# Phase 10: Command Forms - Research

**Researched:** 2026-01-26
**Domain:** React forms with Radix UI Dialog, React Hook Form + Zod, Tauri Shell integration
**Confidence:** HIGH

## Summary

This phase requires implementing smart forms for GSD commands with parameter inputs, flag toggles, validation, and terminal execution via Tauri Shell plugin. The research confirms the existing dependencies (React Hook Form, Zod, Radix Dialog, Radix Switch, Radix Toast) are the current best practices for this use case in 2026.

The standard approach is: Radix UI Dialog for accessible modals → React Hook Form + Zod for type-safe validation → Tauri Shell plugin for command execution → Toast notifications for error feedback.

Key requirements include prepopulating form fields with current state values (from STATE.md), real-time validation, toggle switches for flags, and immediate terminal execution upon submission.

**Primary recommendation:** Use React Hook Form with zodResolver for each command's schema, prepopulate defaultValues on form initialization by reading STATE.md fresh each time, and leverage existing Tauri Shell permissions for command execution.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @radix-ui/react-dialog | 1.1.4 | Accessible modal dialogs | Industry standard for accessible React modals, already installed, built-in focus management and ARIA |
| react-hook-form | 7.54.2 | Form state management | Zero-dependency, excellent TypeScript support, minimal re-renders, already installed |
| zod | 3.24.1 | Schema validation | TypeScript-first validation, already installed, integrates seamlessly with React Hook Form |
| @hookform/resolvers | 3.9.1 | Zod integration | Official resolver for connecting Zod schemas to React Hook Form, already installed |
| @radix-ui/react-switch | 1.1.3 | Toggle switches for flags | Accessible toggle component, already installed (custom wrapper exists) |
| @radix-ui/react-toast | 1.2.3 | Error notifications | Accessible toast notifications, already installed (custom wrapper exists) |
| @tauri-apps/plugin-shell | 2.0+ | Terminal command execution | Official Tauri plugin for executing commands, already installed and configured |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-select | 2.1.3 | Dropdown for phase selection | Already installed, accessible dropdown for phase number selection |
| @radix-ui/react-label | 2.1.1 | Form field labels | Already installed, accessible labels with proper associations |
| framer-motion | 12.0.0-alpha.1 | Modal animations | Already installed, for smooth dialog open/close transitions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React Hook Form | Formik | Formik has larger bundle size and more re-renders, React Hook Form is more performant |
| Radix Dialog | react-modal | react-modal is older pattern, Radix is more modern with better accessibility |
| Zod | Yup | Zod has better TypeScript inference and is designed for TS-first projects |

**Installation:**
All dependencies already installed. No new packages required.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── gsd/
│   │   ├── GSDCommandDialog.tsx      # Main command dialog wrapper
│   │   ├── GSDCommandForm.tsx        # Dynamic form component
│   │   └── forms/
│   │       ├── PlanPhaseForm.tsx     # Specific form for /gsd:plan-phase
│   │       ├── ExecutePhaseForm.tsx  # Specific form for /gsd:execute-phase
│   │       └── ...                   # One form per command with params
│   └── ui/
│       ├── dialog.tsx                # Existing Radix Dialog wrapper
│       ├── switch.tsx                # Existing Switch component
│       └── toast.tsx                 # Existing Toast component
├── lib/
│   └── gsd/
│       ├── command-registry.ts       # Existing command definitions
│       ├── command-schemas.ts        # NEW: Zod schemas per command
│       └── command-executor.ts       # NEW: Terminal execution logic
└── stores/
    └── gsdStore.ts                   # Existing Zustand store (already has dialog state)
```

### Pattern 1: Command Dialog with Dynamic Form

**What:** Modal dialog that renders appropriate form based on selected command

**When to use:** For all GSD commands with parameters or flags

**Example:**
```typescript
// Source: Radix UI Dialog + React Hook Form best practices
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useGSDStore } from '@/stores/gsdStore';
import { GSDCommandForm } from './GSDCommandForm';

export function GSDCommandDialog() {
  const { commandDialogOpen, selectedCommand, closeCommandDialog } = useGSDStore();

  return (
    <Dialog open={commandDialogOpen} onOpenChange={(open) => !open && closeCommandDialog()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{selectedCommand?.label}</DialogTitle>
        </DialogHeader>
        {selectedCommand && <GSDCommandForm command={selectedCommand} />}
      </DialogContent>
    </Dialog>
  );
}
```

### Pattern 2: React Hook Form with Zod Schema

**What:** Form validation using Zod schemas with React Hook Form

**When to use:** For each command that requires parameter validation

**Example:**
```typescript
// Source: React Hook Form + Zod integration guide 2026
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Define schema for command
const planPhaseSchema = z.object({
  phase: z.number().min(1).optional(),
  skipResearch: z.boolean().default(false),
});

type PlanPhaseFormData = z.infer<typeof planPhaseSchema>;

export function PlanPhaseForm({ onSubmit }: { onSubmit: (data: PlanPhaseFormData) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<PlanPhaseFormData>({
    resolver: zodResolver(planPhaseSchema),
    defaultValues: {
      phase: undefined, // Will be prepopulated from STATE.md
      skipResearch: false,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

### Pattern 3: Prepopulating from STATE.md

**What:** Read STATE.md on form open to prepopulate current phase number

**When to use:** For commands with phase parameter (plan-phase, execute-phase)

**Example:**
```typescript
// Source: React controlled components best practices
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { parseStateFile } from '@/lib/gsd/parsers';

export function PlanPhaseForm() {
  const { reset } = useForm();

  useEffect(() => {
    // Read STATE.md fresh on form open
    async function loadCurrentPhase() {
      try {
        const content = await readTextFile('path/to/STATE.md');
        const state = parseStateFile(content);
        // Prepopulate form with current phase
        reset({ phase: state.currentPhase });
      } catch {
        // Leave empty if STATE.md missing
        reset({ phase: undefined });
      }
    }
    loadCurrentPhase();
  }, [reset]);

  return <form>{/* ... */}</form>;
}
```

### Pattern 4: Terminal Execution via Tauri Shell

**What:** Execute command string directly in terminal using Tauri Shell plugin

**When to use:** On form submission after validation passes

**Example:**
```typescript
// Source: Tauri Shell plugin documentation
import { Command } from '@tauri-apps/plugin-shell';

async function executeGSDCommand(commandString: string) {
  try {
    // Execute command directly in terminal
    const command = Command.create('claude', [commandString]);
    const output = await command.execute();

    if (output.code !== 0) {
      throw new Error(`Command failed: ${output.stderr}`);
    }

    return output.stdout;
  } catch (error) {
    throw new Error(`Failed to execute command: ${error}`);
  }
}

// Usage in form submit
function handleSubmit(data: FormData) {
  const commandString = `/gsd:plan-phase ${data.phase || ''}`.trim();
  executeGSDCommand(commandString)
    .then(() => {
      closeDialog();
      showToast('Command sent to terminal', 'success');
    })
    .catch((error) => {
      showToast(error.message, 'error');
    });
}
```

### Pattern 5: Flag Toggles with Switch

**What:** Use Radix Switch for boolean flags (--skip-research, --gaps-only, etc.)

**When to use:** For all optional command flags

**Example:**
```typescript
// Source: Radix UI Switch documentation
import { Controller } from 'react-hook-form';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

<Controller
  name="skipResearch"
  control={control}
  render={({ field }) => (
    <div className="flex items-center gap-2">
      <Switch
        checked={field.value}
        onCheckedChange={field.onChange}
      />
      <Label>Skip Research (--skip-research)</Label>
    </div>
  )}
/>
```

### Anti-Patterns to Avoid

- **Caching STATE.md values:** Always read fresh on form open, don't cache in Zustand store
- **Large monolithic form component:** Create separate form components per command type
- **Submitting without validation:** Always validate with Zod schema before execution
- **Silent failures:** Always show toast notification if command execution fails
- **Manual form state management:** Let React Hook Form handle all form state

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Custom validation logic | Zod schemas + zodResolver | Zod provides type-safe validation with excellent error messages |
| Form state | useState for each field | React Hook Form | RHF handles re-renders, touched fields, errors automatically |
| Modal accessibility | Custom modal with overlay | Radix Dialog | Focus trapping, keyboard navigation, ARIA attributes built-in |
| Toggle switches | Checkbox styled as toggle | Radix Switch | Accessible switch role with proper ARIA states |
| Toast notifications | Custom notification system | Radix Toast (wrapped) | Auto-dismiss timers, screen reader announcements, animation |
| Command parameter building | String concatenation | Template functions | Prevents injection, handles escaping, validates structure |

**Key insight:** Form validation and accessibility are far more complex than they appear. The combination of React Hook Form + Zod + Radix primitives handles edge cases that would take weeks to implement correctly (screen readers, keyboard navigation, validation timing, error focus management).

## Common Pitfalls

### Pitfall 1: Not Reading STATE.md Fresh

**What goes wrong:** Using cached state values leads to stale prepopulation

**Why it happens:** Developer assumes Zustand store has current values, but STATE.md may have changed outside the app

**How to avoid:** Always read STATE.md with readTextFile on dialog open, don't rely on store

**Warning signs:** Form shows wrong phase number after external changes to STATE.md

### Pitfall 2: Shell Permission Not Configured

**What goes wrong:** Command execution silently fails or throws permission error

**Why it happens:** Tauri Shell plugin requires explicit permission configuration in capabilities

**How to avoid:** Verify capabilities/default.json has "shell:allow-execute" and "shell:allow-spawn" permissions (already configured in project)

**Warning signs:** Permission denied errors when executing commands

### Pitfall 3: Validation Mode Causing Poor UX

**What goes wrong:** Form validates on every keystroke, showing errors immediately

**Why it happens:** React Hook Form default mode is "onChange" which validates constantly

**How to avoid:** Use mode: "onBlur" or "all" for better UX - validates on blur first, then onChange after first error

**Warning signs:** Users complain about seeing errors while typing

### Pitfall 4: Dialog Not Closing on Escape

**What goes wrong:** Users press Escape but dialog stays open

**Why it happens:** Forgot to wire up onOpenChange handler to close dialog action

**How to avoid:** Always connect Dialog onOpenChange to closeCommandDialog action

**Warning signs:** Keyboard users unable to close dialog without clicking close button

### Pitfall 5: Missing Required Field Asterisk

**What goes wrong:** Users submit form without required fields, get validation error

**Why it happens:** Visual indication of required fields not clear

**How to avoid:** Add asterisk (*) to label text for required fields, use red border on error

**Warning signs:** High form submission error rate for required fields

### Pitfall 6: Command String Building Without Escaping

**What goes wrong:** Special characters in parameters break command execution

**Why it happens:** Simple string concatenation doesn't handle quotes, spaces, etc.

**How to avoid:** Use proper command building with argument array instead of string concatenation

**Warning signs:** Commands fail with parsing errors when parameters contain special characters

## Code Examples

Verified patterns from official sources:

### Complete Command Form with Validation

```typescript
// Source: React Hook Form + Zod best practices 2026
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const planPhaseSchema = z.object({
  phase: z.number().min(1).max(100).optional(),
  skipResearch: z.boolean().default(false),
  gapsOnly: z.boolean().default(false),
});

type PlanPhaseFormData = z.infer<typeof planPhaseSchema>;

export function PlanPhaseForm({
  onSubmit,
  defaultValues
}: {
  onSubmit: (data: PlanPhaseFormData) => void;
  defaultValues?: Partial<PlanPhaseFormData>;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PlanPhaseFormData>({
    resolver: zodResolver(planPhaseSchema),
    mode: 'onBlur', // Better UX: validate on blur, then onChange
    defaultValues: {
      phase: defaultValues?.phase,
      skipResearch: false,
      gapsOnly: false,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Phase Number Input */}
      <div>
        <Label htmlFor="phase">
          Phase Number
          {/* No asterisk - field is optional */}
        </Label>
        <input
          id="phase"
          type="number"
          {...register('phase', { valueAsNumber: true })}
          className={errors.phase ? 'border-red-500' : ''}
          placeholder="Leave empty for current phase"
        />
        {errors.phase && (
          <p className="text-xs text-red-500 mt-1">{errors.phase.message}</p>
        )}
      </div>

      {/* Skip Research Flag */}
      <div className="flex items-center gap-2">
        <Controller
          name="skipResearch"
          control={control}
          render={({ field }) => (
            <>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
              <Label>Skip Research (--skip-research)</Label>
            </>
          )}
        />
      </div>

      {/* Gaps Only Flag */}
      <div className="flex items-center gap-2">
        <Controller
          name="gapsOnly"
          control={control}
          render={({ field }) => (
            <>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
              <Label>Gaps Only (--gaps-only)</Label>
            </>
          )}
        />
      </div>

      {/* Submit Button */}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Executing...' : 'Execute Command'}
      </Button>
    </form>
  );
}
```

### Command Execution with Tauri Shell

```typescript
// Source: Tauri Shell plugin documentation v2
import { Command } from '@tauri-apps/plugin-shell';

interface CommandExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
}

/**
 * Execute GSD command in terminal
 * Assumes 'claude' is allowed in shell permissions
 */
export async function executeGSDCommand(
  command: string,
  args: string[] = []
): Promise<CommandExecutionResult> {
  try {
    // Build command with arguments
    const fullArgs = [command, ...args.filter(Boolean)];

    // Execute via Tauri Shell plugin
    const cmd = Command.create('claude', fullArgs);
    const output = await cmd.execute();

    if (output.code !== 0) {
      return {
        success: false,
        error: output.stderr || 'Command execution failed',
      };
    }

    return {
      success: true,
      output: output.stdout,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Usage in form submit handler
async function handleFormSubmit(data: PlanPhaseFormData) {
  // Build command string
  const command = '/gsd:plan-phase';
  const args = [];

  if (data.phase) args.push(String(data.phase));
  if (data.skipResearch) args.push('--skip-research');
  if (data.gapsOnly) args.push('--gaps-only');

  // Execute command
  const result = await executeGSDCommand(command, args);

  if (result.success) {
    showToast('Command sent to terminal', 'success');
    closeDialog();
  } else {
    showToast(result.error || 'Execution failed', 'error');
  }
}
```

### Reading STATE.md for Prepopulation

```typescript
// Source: Tauri FS plugin + React Hook Form reset pattern
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { parseStateFile } from '@/lib/gsd/parsers';

export function usePrepopulatePhase(projectPath: string | null) {
  const { reset } = useForm();

  useEffect(() => {
    if (!projectPath) return;

    async function loadCurrentPhase() {
      try {
        const statePath = `${projectPath}/.planning/STATE.md`;
        const content = await readTextFile(statePath);
        const state = parseStateFile(content);

        // Prepopulate form with current phase
        reset({
          phase: state.currentPhase,
        });
      } catch (error) {
        // STATE.md doesn't exist or failed to parse
        // Leave field empty (user can fill manually)
        console.warn('Could not read STATE.md:', error);
      }
    }

    loadCurrentPhase();
  }, [projectPath, reset]);
}
```

### Toast Notification Integration

```typescript
// Source: Existing toast.tsx component in project
import { useState } from 'react';
import { Toast, ToastContainer } from '@/components/ui/toast';

export function useCommandToast() {
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  const ToastComponent = toast ? (
    <ToastContainer>
      <Toast
        message={toast.message}
        type={toast.type}
        duration={3000}
        onDismiss={() => setToast(null)}
      />
    </ToastContainer>
  ) : null;

  return { showToast, ToastComponent };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Formik + Yup | React Hook Form + Zod | 2023-2024 | Better TypeScript inference, smaller bundle, fewer re-renders |
| react-modal | Radix Dialog | 2022-2023 | Built-in accessibility, better focus management, composable |
| HTML checkbox | Radix Switch | 2022-2023 | Accessible switch role (not checkbox), better mobile UX |
| Custom toast | Radix Toast + Sonner | 2024-2025 | Screen reader support, swipe gestures, better animations |
| Tauri v1 Shell API | Tauri v2 Shell Plugin | 2024 | New permission system, more secure, better error handling |

**Deprecated/outdated:**
- Formik: Still maintained but heavier and less TypeScript-friendly than React Hook Form
- react-modal: Older pattern, lacks modern accessibility features
- Controlled inputs without libraries: Too much boilerplate, error-prone validation

## Open Questions

Things that couldn't be fully resolved:

1. **Command argument escaping strategy**
   - What we know: Tauri Shell supports argument arrays for safe execution
   - What's unclear: Whether Claude Code CLI requires specific quoting for flags
   - Recommendation: Test with special characters in parameters, use array-based args

2. **Phase dropdown vs number input tradeoff**
   - What we know: Dropdown requires loading all phases, number input is simpler
   - What's unclear: User preference between browsing phases vs typing number
   - Recommendation: Start with number input + placeholder text, iterate based on feedback

3. **Form validation timing for real-time feedback**
   - What we know: "onBlur" mode is better UX than "onChange"
   - What's unclear: Whether "all" mode (blur + change) is too aggressive
   - Recommendation: Start with "onBlur", can switch to "all" if users request it

## Sources

### Primary (HIGH confidence)
- [Radix UI Dialog Documentation](https://www.radix-ui.com/primitives/docs/components/dialog) - Official Radix Dialog patterns
- [React Hook Form Documentation](https://react-hook-form.com/) - Official RHF patterns and API
- [Zod Documentation](https://zod.dev/) - Official Zod schema patterns
- [Tauri Shell Plugin Documentation](https://v2.tauri.app/plugin/shell/) - Official Tauri v2 Shell API
- Existing codebase:
  - `/src/components/ui/dialog.tsx` - Radix Dialog wrapper already in use
  - `/src/components/ui/switch.tsx` - Custom Switch component wrapper
  - `/src/components/ui/toast.tsx` - Custom Toast component with framer-motion
  - `/src/stores/gsdStore.ts` - Command dialog state management
  - `/src/lib/gsd/command-registry.ts` - Command definitions with parameters
  - `/src-tauri/capabilities/default.json` - Shell permissions already configured

### Secondary (MEDIUM confidence)
- [React Hook Form + Zod Integration Guide 2026](https://www.contentful.com/blog/react-hook-form-validation-zod/) - Best practices for combining RHF and Zod
- [Radix UI Dialog Best Practices](https://www.radix-ui.com/primitives/docs/components/dialog) - Accessibility patterns
- [React Form Prepopulation Best Practices](https://medium.com/@vanthedev/how-to-pre-populate-inputs-when-editing-forms-in-react-2530d6069ab3) - Controlled component patterns

### Tertiary (LOW confidence)
- None - all findings verified with official documentation or existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies already installed and proven in 2026
- Architecture: HIGH - Patterns verified in official docs and existing codebase
- Pitfalls: MEDIUM - Based on common issues in documentation and community discussions

**Research date:** 2026-01-26
**Valid until:** 2026-04-26 (90 days - stable ecosystem, slow-moving dependencies)
