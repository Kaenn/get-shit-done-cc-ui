/**
 * State reader for command form prepopulation
 * Reads STATE.md fresh each time (not cached) per CONTEXT.md decision
 */

import { invoke } from '@tauri-apps/api/core';

interface CurrentState {
  currentPhase: number | null;
}

/**
 * Read current phase number from STATE.md
 * Returns null if STATE.md doesn't exist or can't be parsed
 */
export async function readCurrentPhase(projectPath: string): Promise<number | null> {
  try {
    const statePath = `${projectPath}/.planning/STATE.md`;
    const content = await invoke<string>('read_text_file', { filePath: statePath });

    // Parse current phase from STATE.md content
    // Look for "Phase: X of Y" or "Phase X" pattern
    const phaseMatch = content.match(/Phase:\s*(\d+)\s*of\s*\d+/i)
      || content.match(/Phase\s*(\d+)/i);

    if (phaseMatch) {
      return parseInt(phaseMatch[1], 10);
    }

    return null;
  } catch (error) {
    // STATE.md doesn't exist or read failed - this is expected for new projects
    console.warn('Could not read STATE.md for prepopulation:', error);
    return null;
  }
}

/**
 * Read current state values for form prepopulation
 */
export async function readCurrentState(projectPath: string): Promise<CurrentState> {
  const currentPhase = await readCurrentPhase(projectPath);
  return { currentPhase };
}
