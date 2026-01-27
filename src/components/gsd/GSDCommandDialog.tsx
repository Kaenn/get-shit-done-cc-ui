/**
 * Command dialog for parameter editing and execution
 * Modal dialog that shows command parameters with React Hook Form + Zod validation
 */

import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Toast, ToastContainer } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { useGSDStore } from '@/stores/gsdStore';
import { executeGSDCommand } from '@/lib/gsd/command-executor';
import { getSchemaForCommand } from '@/lib/gsd/command-schemas';
import { readCurrentPhase } from '@/lib/gsd/state-reader';

export function GSDCommandDialog() {
  const {
    commandDialogOpen,
    selectedCommand,
    commandInitialValues,
    closeCommandDialog,
    projectPath,
  } = useGSDStore();

  // Toast state for error notifications
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Get schema dynamically based on selected command
  const schema = useMemo(() => {
    return selectedCommand ? getSchemaForCommand(selectedCommand.id) : getSchemaForCommand('');
  }, [selectedCommand]);

  // Initialize React Hook Form with Zod resolver
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onBlur', // Validate on blur for better UX
  });

  // Reset form values when dialog opens or command changes
  // Reads STATE.md fresh each time for phase prepopulation
  useEffect(() => {
    if (!commandDialogOpen || !selectedCommand) return;

    async function prepopulateForm() {
      const defaultValues: Record<string, string | number | boolean> = {};

      // Check if command has a phase parameter
      const hasPhaseParam = selectedCommand!.parameters.some(p => p.name === 'phase');

      // Set default values for parameters
      // Priority: commandInitialValues > STATE.md > defaultValue > empty
      for (const param of selectedCommand!.parameters) {
        // 1. Check if initialValues were passed (e.g., from action link)
        if (commandInitialValues && commandInitialValues[param.name] !== undefined) {
          defaultValues[param.name] = commandInitialValues[param.name];
        }
        // 2. For phase parameter without initialValue, read from STATE.md
        else if (param.name === 'phase' && hasPhaseParam && projectPath) {
          const currentPhase = await readCurrentPhase(projectPath);
          if (currentPhase !== null) {
            defaultValues.phase = currentPhase;
          }
        }
        // 3. Fall back to parameter defaultValue
        else if (param.defaultValue !== undefined) {
          defaultValues[param.name] = param.defaultValue;
        }
        // 4. Default to empty
        else {
          defaultValues[param.name] = param.type === 'number' ? '' : '';
        }
      }

      // Set default values for flags (all false by default)
      selectedCommand!.flags.forEach((flag) => {
        defaultValues[flag.name] = false;
      });

      reset(defaultValues);
    }

    prepopulateForm();
  }, [commandDialogOpen, selectedCommand, commandInitialValues, projectPath, reset]);

  const onFormSubmit = async (data: Record<string, unknown>) => {
    if (!selectedCommand || !projectPath) {
      setErrorToast('Cannot execute: No command or project selected');
      return;
    }

    // Clear any previous error toast
    setErrorToast(null);

    // Cast form data to expected type
    const formValues = data as Record<string, string | number | boolean | undefined>;

    // Execute using the command executor utility
    const result = await executeGSDCommand(projectPath, selectedCommand, formValues);

    if (result.success) {
      // Close modal immediately on success
      closeCommandDialog();
    } else {
      // Show toast on error, keep dialog open for retry
      setErrorToast(result.error || 'Failed to execute command');
    }
  };

  if (!selectedCommand) return null;

  return (
    <>
      <Dialog open={commandDialogOpen} onOpenChange={closeCommandDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedCommand.label}</DialogTitle>
            <DialogDescription>{selectedCommand.description}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onFormSubmit)}>
            <div className="space-y-4 py-4">
              {/* Parameter fields */}
              {selectedCommand.parameters.length > 0 && (
                <div className="space-y-3">
                  {selectedCommand.parameters.map((param) => {
                    const fieldError = errors[param.name];
                    const errorMessage = fieldError?.message as string | undefined;

                    return (
                      <div key={param.name} className="space-y-1.5">
                        <Label htmlFor={param.name}>
                          {param.label}
                          {param.required ? (
                            <span className="text-red-500 ml-0.5">*</span>
                          ) : (
                            <span className="text-muted-foreground ml-1">(optional)</span>
                          )}
                        </Label>
                        <Input
                          id={param.name}
                          type={param.type === 'number' ? 'number' : 'text'}
                          placeholder={param.defaultValue?.toString() || ''}
                          className={cn(
                            fieldError && 'border-red-500 focus-visible:ring-red-500'
                          )}
                          {...register(param.name, {
                            valueAsNumber: param.type === 'number',
                          })}
                        />
                        {errorMessage && (
                          <p className="text-xs text-red-500 mt-1">{errorMessage}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Flag toggle switches */}
              {selectedCommand.flags && selectedCommand.flags.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Options
                  </Label>
                  {selectedCommand.flags.map((flag) => (
                    <Controller
                      key={flag.name}
                      name={flag.name}
                      control={control}
                      render={({ field }) => (
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <Label
                              htmlFor={flag.name}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {flag.label}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {flag.description}
                            </p>
                          </div>
                          <Switch
                            id={flag.name}
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                          />
                        </div>
                      )}
                    />
                  ))}
                </div>
              )}

              {/* No parameters message */}
              {selectedCommand.parameters.length === 0 &&
                selectedCommand.flags.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    This command has no configurable parameters.
                  </p>
                )}
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={closeCommandDialog}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium',
                  'border border-border',
                  'hover:bg-muted transition-colors'
                )}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium',
                  'bg-primary text-primary-foreground',
                  'hover:bg-primary/90 transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isSubmitting ? 'Executing...' : 'Execute'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Error toast notification */}
      <ToastContainer>
        {errorToast && (
          <Toast
            message={errorToast}
            type="error"
            duration={5000}
            onDismiss={() => setErrorToast(null)}
          />
        )}
      </ToastContainer>
    </>
  );
}
