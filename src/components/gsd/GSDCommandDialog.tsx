/**
 * Command dialog for parameter editing and execution
 * Modal dialog that shows command parameters and advanced flags
 */

import { useEffect, useState } from 'react';
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
import { cn } from '@/lib/utils';
import { useGSDStore } from '@/stores/gsdStore';
import { api } from '@/lib/api';

export function GSDCommandDialog() {
  const {
    commandDialogOpen,
    selectedCommand,
    commandInitialValues,
    closeCommandDialog,
    parsedData,
    projectPath,
  } = useGSDStore();

  const [formValues, setFormValues] = useState<Record<string, string | number>>({});
  const [advancedFlags, setAdvancedFlags] = useState('');

  // Initialize form values when dialog opens or command changes
  useEffect(() => {
    if (selectedCommand && parsedData) {
      const initialValues: Record<string, string | number> = {};
      selectedCommand.parameters.forEach((param) => {
        // Use commandInitialValues if provided, otherwise fall back to defaults
        if (commandInitialValues && commandInitialValues[param.name] !== undefined) {
          initialValues[param.name] = commandInitialValues[param.name];
        } else if (param.defaultValue !== undefined) {
          initialValues[param.name] = param.defaultValue;
        } else {
          initialValues[param.name] = param.type === 'number' ? 0 : '';
        }
      });
      setFormValues(initialValues);
      setAdvancedFlags('');
    }
  }, [selectedCommand, parsedData, commandInitialValues]);

  const handleExecute = async () => {
    if (!selectedCommand || !projectPath) return;

    try {
      // Build parameter values string
      const paramValues = selectedCommand.parameters
        .map((param) => {
          const value = formValues[param.name];
          if (value !== undefined && value !== '') {
            return `${value}`;
          }
          return '';
        })
        .filter(Boolean)
        .join(' ');

      // Build final command
      const finalCommand = `${selectedCommand.fullCommand} ${paramValues} ${advancedFlags}`.trim();

      // Execute command with /clear prefix
      await api.executeClaudeCode(projectPath, `/clear\n${finalCommand}`, 'sonnet');

      // Close dialog on success
      closeCommandDialog();
    } catch (error) {
      console.error('Failed to execute command:', error);
      // Keep dialog open on error so user can retry
    }
  };

  const handleInputChange = (paramName: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [paramName]: value,
    }));
  };

  if (!selectedCommand) return null;

  return (
    <Dialog open={commandDialogOpen} onOpenChange={closeCommandDialog}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{selectedCommand.label}</DialogTitle>
          <DialogDescription>{selectedCommand.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Parameter fields */}
          {selectedCommand.parameters.length > 0 && (
            <div className="space-y-3">
              {selectedCommand.parameters.map((param) => (
                <div key={param.name} className="space-y-1.5">
                  <Label htmlFor={param.name}>
                    {param.label}
                    {!param.required && (
                      <span className="text-muted-foreground ml-1">(optional)</span>
                    )}
                  </Label>
                  <Input
                    id={param.name}
                    type={param.type === 'number' ? 'number' : 'text'}
                    value={formValues[param.name] ?? ''}
                    onChange={(e) => handleInputChange(param.name, e.target.value)}
                    placeholder={param.defaultValue?.toString() || ''}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Advanced flags */}
          <div className="space-y-1.5">
            <Label htmlFor="advanced-flags">Advanced Flags (optional)</Label>
            <Input
              id="advanced-flags"
              type="text"
              value={advancedFlags}
              onChange={(e) => setAdvancedFlags(e.target.value)}
              placeholder="--flag value --other-flag"
            />
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={closeCommandDialog}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium",
              "border border-border",
              "hover:bg-muted transition-colors"
            )}
          >
            Cancel
          </button>
          <button
            onClick={handleExecute}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium",
              "bg-primary text-primary-foreground",
              "hover:bg-primary/90 transition-colors"
            )}
          >
            Execute
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
