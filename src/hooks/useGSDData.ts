/**
 * Hook for loading and refreshing GSD data from .planning/ files
 * Orchestrates file reading, parsing, and store updates
 */

import { useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useGSDStore } from '@/stores/gsdStore';
import type { StateData } from '@/stores/gsdStore';
import { parseStateMd, parseRoadmapMd, parsePlanMd, parseMilestones } from '@/lib/gsd/parsers';
import type { PlanInfo } from '@/lib/gsd/parsers';
import { buildTreeData, buildMilestoneTree } from '@/lib/gsd/tree-transforms';
import type { TreeNode } from '@/lib/gsd/tree-transforms';
import { useGSDFileWatcher } from '@/lib/gsd/watcher';
import { getNextAction } from '@/lib/gsd/commands';
import { api } from '@/lib/api';

interface GsdPlanningFiles {
  state_content: string | null;
  roadmap_content: string | null;
}

interface PlanFileData {
  content: string;
  has_summary: boolean;
  phase_dir: string;
  filename: string;
}

/**
 * Load GSD data from .planning/ directory and keep it in sync
 *
 * @param projectPath - Path to project root (null in web mode or no project)
 */
export function useGSDData(projectPath: string | null): void {
  const {
    updateParsedData,
    setPhases,
    setMilestoneData,
    setTreeData,
    setArchivedTreeData,
    setLoading,
    setError,
    setNextAction,
    setProjectPath,
    comboMode,
    isCommandRunning,
    setCommandRunning,
  } = useGSDStore();

  // Track previous isCommandRunning state for combo mode
  const prevIsCommandRunning = useRef(isCommandRunning);
  // Track previous nextAction to avoid infinite loops
  const prevNextActionRef = useRef<{ command: string; label: string } | null>(null);

  const loadData = useCallback(async () => {
    if (!projectPath) {
      // No project path - clear data
      updateParsedData(null);
      setPhases([]);
      setMilestoneData([]);
      setTreeData([]);
      setArchivedTreeData([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Read files using Tauri backend command
      const result = await invoke<GsdPlanningFiles>('read_gsd_planning_files', {
        projectPath,
      });

      // Parse STATE.md
      let currentPhaseNumber = 1;
      if (result.state_content) {
        const stateData = parseStateMd(result.state_content);
        updateParsedData(stateData);
        currentPhaseNumber = stateData.currentPhase;
      } else {
        updateParsedData(null);
      }

      // Parse ROADMAP.md for phases and milestones
      let phases: ReturnType<typeof parseRoadmapMd> = [];
      if (result.roadmap_content) {
        phases = parseRoadmapMd(result.roadmap_content);
        setPhases(phases);

        // Parse milestones from same ROADMAP.md content
        const milestones = parseMilestones(result.roadmap_content, phases.length);
        setMilestoneData(milestones);
      } else {
        setPhases([]);
        setMilestoneData([]);
      }

      // Load plan files from Rust backend
      const planFiles = await invoke<PlanFileData[]>('read_gsd_plan_files', {
        projectPath,
      });

      // Parse each plan file
      const plans: PlanInfo[] = [];
      for (const file of planFiles) {
        const planInfo = parsePlanMd(file.content, file.has_summary);
        if (planInfo) {
          plans.push(planInfo);
        }
      }

      // Build 3-level tree data with milestones
      if (phases.length > 0) {
        const milestones = parseMilestones(result.roadmap_content || '', phases.length);
        const { active, archived } = buildMilestoneTree(
          milestones,
          phases,
          plans,
          currentPhaseNumber,
          projectPath
        );
        setTreeData(active);
        setArchivedTreeData(archived);
      } else {
        // Fallback to 2-level tree if no phases
        const treeData = buildTreeData(phases, plans, currentPhaseNumber, projectPath);
        setTreeData(treeData);
        setArchivedTreeData([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load GSD data');
      updateParsedData(null);
      setPhases([]);
      setMilestoneData([]);
      setTreeData([]);
      setArchivedTreeData([]);
    } finally {
      setLoading(false);
    }
  }, [projectPath, updateParsedData, setPhases, setMilestoneData, setTreeData, setArchivedTreeData, setLoading, setError]);

  // Load on mount and projectPath change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Setup file watcher
  useGSDFileWatcher(projectPath, loadData);

  // Update project path in store
  useEffect(() => {
    setProjectPath(projectPath);
  }, [projectPath, setProjectPath]);

  // Calculate nextAction whenever treeData or parsedData changes
  // This runs regardless of panel visibility
  useEffect(() => {
    // Helper to check if action changed
    const actionsEqual = (
      a: { command: string; label: string } | null,
      b: { command: string; label: string } | null
    ) => {
      if (a === null && b === null) return true;
      if (a === null || b === null) return false;
      return a.command === b.command && a.label === b.label;
    };

    // Helper to update nextAction only if changed
    const updateNextAction = (treeData: TreeNode[], parsedData: StateData | null) => {
      console.log('[useGSDData] updateNextAction called:', {
        treeDataLength: treeData.length,
        parsedData: parsedData ? { currentPhase: parsedData.currentPhase } : null
      });

      if (parsedData && treeData.length > 0) {
        const action = getNextAction(treeData, parsedData.currentPhase);
        console.log('[useGSDData] getNextAction result:', action);
        if (!actionsEqual(action, prevNextActionRef.current)) {
          console.log('[useGSDData] setting nextAction:', action);
          prevNextActionRef.current = action;
          setNextAction(action);
        } else {
          console.log('[useGSDData] nextAction unchanged, skipping');
        }
      } else if (prevNextActionRef.current !== null) {
        console.log('[useGSDData] clearing nextAction (no data)');
        prevNextActionRef.current = null;
        setNextAction(null);
      }
    };

    // Subscribe to store changes for treeData and parsedData only
    let prevTreeData = useGSDStore.getState().treeData;
    let prevParsedData = useGSDStore.getState().parsedData;

    const unsubscribe = useGSDStore.subscribe((state) => {
      // Only recalculate if treeData or parsedData changed
      if (state.treeData !== prevTreeData || state.parsedData !== prevParsedData) {
        prevTreeData = state.treeData;
        prevParsedData = state.parsedData;
        updateNextAction(state.treeData, state.parsedData);
      }
    });

    // Calculate initial value
    const initialState = useGSDStore.getState();
    updateNextAction(initialState.treeData, initialState.parsedData);

    return unsubscribe;
  }, [setNextAction]);

  // Combo mode: auto-chain commands when one completes
  useEffect(() => {
    // Detect transition from running → not running
    if (prevIsCommandRunning.current && !isCommandRunning && comboMode && projectPath) {
      // Command just completed, trigger next action if available
      const state = useGSDStore.getState();
      const nextAction = state.nextAction;

      if (nextAction) {
        // Small delay to allow file watcher to update state
        const timer = setTimeout(async () => {
          // Re-check nextAction after delay (may have changed)
          const currentState = useGSDStore.getState();
          const currentNextAction = currentState.nextAction;

          if (currentNextAction && currentState.comboMode && !currentState.isCommandRunning) {
            setCommandRunning(currentNextAction.command);
            try {
              await api.executeClaudeCode(projectPath, `/clear\n${currentNextAction.command}`, 'sonnet');
            } catch (error) {
              console.error('Combo mode auto-chain failed:', error);
            } finally {
              setCommandRunning(null);
            }
          }
        }, 1000); // 1s delay to allow file system updates

        return () => clearTimeout(timer);
      }
    }

    prevIsCommandRunning.current = isCommandRunning;
  }, [isCommandRunning, comboMode, projectPath, setCommandRunning]);
}
