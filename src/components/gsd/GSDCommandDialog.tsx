/**
 * Command dialog for parameter editing and execution
 * Modal dialog that shows command parameters with React Hook Form + Zod validation
 */

import { useEffect, useMemo } from 'react';
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
import { cn } from '@/lib/utils';
import { useGSDStore } from '@/stores/gsdStore';
import { api } from '@/lib/api';
import { getSchemaForCommand } from '@/lib/gsd/command-schemas';

export function GSDCommandDialog() {
  const {
    commandDialogOpen,
    selectedCommand,
    commandInitialValues,
    closeCommandDialog,
    projectPath,
  } = useGSDStore();

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
  useEffect(() => {
    if (commandDialogOpen && selectedCommand) {
      const defaultValues: Record<string, string | number | boolean> = {};

      // Set default values for parameters
      selectedCommand.parameters.forEach((param) => {
        if (commandInitialValues && commandInitialValues[param.name] !== undefined) {
          defaultValues[param.name] = commandInitialValues[param.name];
        } else if (param.defaultValue !== undefined) {
          defaultValues[param.name] = param.defaultValue;
        } else {
          defaultValues[param.name] = param.type === 'number' ? '' : '';
        }
      });

      // Set default values for flags (all false by default)
      selectedCommand.flags.forEach((flag) => {
        defaultValues[flag.name] = false;
      });

      reset(defaultValues);
    }
  }, [commandDialogOpen, selectedCommand, commandInitialValues, reset]);

  const onFormSubmit = async (data: Record<string, unknown>) => {
    if (!selectedCommand || !projectPath) return;

    try {
      // Build parameter values string
      const paramValues = selectedCommand.parameters
        .map((param) => {
          const value = data[param.name];
          if (value !== undefined && value !== '' && value !== null) {
            return `${value}`;
          }
          return '';
        })
        .filter(Boolean)
        .join(' ');

      // Build flags string (flags will be handled in Plan 03)
      // For now, just include active flags from form data
      const flagValues = selectedCommand.flags
        .filter((flag) => data[flag.name] === true)
        .map((flag) => flag.flag)
        .join(' ');

      // Build final command
      const finalCommand = `${selectedCommand.fullCommand} ${paramValues} ${flagValues}`.trim();

      // Execute command with /clear prefix
      await api.executeClaudeCode(projectPath, `/clear\n${finalCommand}`, 'sonnet');

      // Close dialog on success
      closeCommandDialog();
    } catch (error) {
      console.error('Failed to execute command:', error);
      // Keep dialog open on error so user can retry
    }
  };

  if (!selectedCommand) return null;

  return (
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
  );
}
