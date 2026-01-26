/**
 * File watcher hook for GSD planning files
 * Uses polling approach with Tauri backend command
 */

import { useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useGSDStore } from '@/stores/gsdStore';

/**
 * Watch project for .planning/ file changes via polling
 * Detects modifications to STATE.md and ROADMAP.md
 *
 * @param projectPath - Path to project root (null in web mode)
 * @param onUpdate - Callback when files change
 * @param pollInterval - Polling interval in ms (default: 2000)
 */
export function useGSDFileWatcher(
  projectPath: string | null,
  onUpdate: () => void,
  pollInterval = 2000
): void {
  const lastModTimesRef = useRef<{
    stateMd?: number;
    roadmapMd?: number;
  }>({});

  useEffect(() => {
    // Update store with current project path
    const { setProjectPath } = useGSDStore.getState();
    setProjectPath(projectPath);

    // Skip if no project path (web mode or no project)
    if (!projectPath) {
      return;
    }

    const checkForChanges = async () => {
      try {
        // Get modification times using backend command
        const [stateMtime, roadmapMtime] = await invoke<[number | null, number | null]>(
          'get_gsd_file_stats',
          { projectPath }
        );

        // Check if files have changed
        const lastTimes = lastModTimesRef.current;
        const stateChanged = lastTimes.stateMd !== undefined &&
          stateMtime !== null &&
          lastTimes.stateMd !== stateMtime;
        const roadmapChanged = lastTimes.roadmapMd !== undefined &&
          roadmapMtime !== null &&
          lastTimes.roadmapMd !== roadmapMtime;

        // Update stored times
        lastModTimesRef.current = {
          stateMd: stateMtime ?? undefined,
          roadmapMd: roadmapMtime ?? undefined,
        };

        // Trigger update if any file changed
        if (stateChanged || roadmapChanged) {
          onUpdate();
        }
      } catch (error) {
        console.error('Error checking file modifications:', error);
      }
    };

    // Initial check to populate times
    checkForChanges();

    // Set up polling interval
    const intervalId = setInterval(checkForChanges, pollInterval);

    // Clean up on unmount
    return () => {
      clearInterval(intervalId);
      setProjectPath(null);
    };
  }, [projectPath, onUpdate, pollInterval]);
}
