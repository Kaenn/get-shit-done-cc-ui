/**
 * GSD Command Executor
 * Executes GSD commands in the terminal via existing API
 */

import { api } from '@/lib/api';
import type { GSDCommandDefinition } from './command-registry';

export interface CommandExecutionResult {
  success: boolean;
  error?: string;
}

interface FormValues {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Build command string from form values
 */
export function buildCommandString(
  command: GSDCommandDefinition,
  formValues: FormValues
): string {
  // Start with base command
  let commandString = command.fullCommand;

  // Add parameter values in order
  command.parameters.forEach((param) => {
    const value = formValues[param.name];
    if (value !== undefined && value !== '' && value !== 0) {
      commandString += ` ${value}`;
    }
  });

  // Add enabled flags
  if (command.flags) {
    command.flags.forEach((flag) => {
      if (formValues[flag.name] === true) {
        commandString += ` ${flag.flag}`;
      }
    });
  }

  return commandString.trim();
}

/**
 * Execute GSD command in terminal
 * Uses existing executeClaudeCode API which handles terminal communication
 */
export async function executeGSDCommand(
  projectPath: string,
  command: GSDCommandDefinition,
  formValues: FormValues
): Promise<CommandExecutionResult> {
  try {
    const commandString = buildCommandString(command, formValues);

    // Execute command with /clear prefix for clean terminal state
    await api.executeClaudeCode(projectPath, `/clear\n${commandString}`, 'sonnet');

    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error executing command';
    console.error('Command execution failed:', message);
    return { success: false, error: message };
  }
}
