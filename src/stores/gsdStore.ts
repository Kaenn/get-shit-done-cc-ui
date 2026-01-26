import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StateCreator } from 'zustand';
import type { TreeNode } from '@/lib/gsd/tree-transforms';
import type { GSDCommandDefinition } from '@/lib/gsd/command-registry';

// Types for parsed data
export interface StateData {
  currentPhase: number;
  totalPhases: number;
  currentPlan: number;
  totalPlans: number | null; // null when "?"
  progress: number;
  phaseName: string;
}

export interface PhaseInfo {
  number: number;
  name: string;
  goal: string;
  status: 'pending' | 'in-progress' | 'complete';
}

// Store state interface
interface GSDState {
  // Persisted state (survives reload)
  isPanelVisible: boolean;
  panelWidth: number;
  isCommandPanelVisible: boolean;
  commandPanelWidth: number;

  // Runtime state (not persisted)
  parsedData: StateData | null;
  phases: PhaseInfo[];
  treeData: TreeNode[];
  expandedNodes: Set<string>;
  hasHydrated: boolean;
  isLoading: boolean;
  error: string | null;

  // Command execution state (runtime only)
  isCommandRunning: boolean;
  currentCommand: string | null;
  nextAction: { command: string; label: string } | null;
  comboMode: boolean;
  projectPath: string | null;

  // Command panel UI state (runtime only)
  expandedCategories: Set<string>;
  commandDialogOpen: boolean;
  selectedCommand: GSDCommandDefinition | null;
  showInactiveCommands: boolean;

  // Actions
  togglePanel: () => void;
  setPanelWidth: (width: number) => void;
  toggleCommandPanel: () => void;
  setCommandPanelWidth: (width: number) => void;
  updateParsedData: (data: StateData | null) => void;
  setPhases: (phases: PhaseInfo[]) => void;
  setTreeData: (data: TreeNode[]) => void;
  toggleNode: (nodeId: string) => void;
  initializeExpanded: (currentPhaseNumber: number) => void;
  setHasHydrated: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  setError: (error: string | null) => void;

  // Command execution actions
  setCommandRunning: (command: string | null) => void;
  setNextAction: (action: { command: string; label: string } | null) => void;
  toggleComboMode: () => void;
  setProjectPath: (path: string | null) => void;

  // Command panel actions
  toggleCategory: (category: string) => void;
  initializeCategories: () => void;
  openCommandDialog: (command: GSDCommandDefinition) => void;
  closeCommandDialog: () => void;
  toggleShowInactiveCommands: () => void;
}

const gsdStore: StateCreator<GSDState> = (set) => ({
  // Initial persisted state
  isPanelVisible: true,
  panelWidth: 75,
  isCommandPanelVisible: true,
  commandPanelWidth: 20,

  // Initial runtime state
  parsedData: null,
  phases: [],
  treeData: [],
  expandedNodes: new Set<string>(),
  hasHydrated: false,
  isLoading: false,
  error: null,

  // Initial command execution state
  isCommandRunning: false,
  currentCommand: null,
  nextAction: null,
  comboMode: false,
  projectPath: null,

  // Initial command panel UI state
  expandedCategories: new Set<string>(),
  commandDialogOpen: false,
  selectedCommand: null,
  showInactiveCommands: true,

  // Actions
  togglePanel: () => set((state) => ({ isPanelVisible: !state.isPanelVisible })),

  setPanelWidth: (width: number) => set({ panelWidth: width }),

  toggleCommandPanel: () => set((state) => {
    const newVisible = !state.isCommandPanelVisible;
    // Initialize categories when opening command panel
    if (newVisible && state.expandedCategories.size === 0) {
      return {
        isCommandPanelVisible: newVisible,
        expandedCategories: new Set(['plan'])
      };
    }
    return { isCommandPanelVisible: newVisible };
  }),

  setCommandPanelWidth: (width: number) => set({ commandPanelWidth: width }),

  updateParsedData: (data: StateData | null) => set({ parsedData: data }),

  setPhases: (phases: PhaseInfo[]) => set({ phases }),

  setTreeData: (data: TreeNode[]) => set({ treeData: data }),

  toggleNode: (nodeId: string) =>
    set((state) => {
      const newExpanded = new Set(state.expandedNodes);
      if (newExpanded.has(nodeId)) {
        newExpanded.delete(nodeId);
      } else {
        newExpanded.add(nodeId);
      }
      return { expandedNodes: newExpanded };
    }),

  initializeExpanded: (currentPhaseNumber: number) =>
    set(() => ({
      expandedNodes: new Set([`phase-${currentPhaseNumber}`]),
    })),

  setHasHydrated: (value: boolean) => set({ hasHydrated: value }),

  setLoading: (value: boolean) => set({ isLoading: value }),

  setError: (error: string | null) => set({ error }),

  // Command execution actions
  setCommandRunning: (command: string | null) =>
    set({ isCommandRunning: !!command, currentCommand: command }),

  setNextAction: (action: { command: string; label: string } | null) =>
    set({ nextAction: action }),

  toggleComboMode: () => set((state) => ({ comboMode: !state.comboMode })),

  setProjectPath: (path: string | null) => set({ projectPath: path }),

  // Command panel actions
  toggleCategory: (category: string) =>
    set((state) => {
      const newExpanded = new Set(state.expandedCategories);
      if (newExpanded.has(category)) {
        newExpanded.delete(category);
      } else {
        newExpanded.add(category);
      }
      return { expandedCategories: newExpanded };
    }),

  initializeCategories: () =>
    set(() => ({
      expandedCategories: new Set(['plan']),
    })),

  openCommandDialog: (command: GSDCommandDefinition) =>
    set({ commandDialogOpen: true, selectedCommand: command }),

  closeCommandDialog: () =>
    set({ commandDialogOpen: false, selectedCommand: null }),

  toggleShowInactiveCommands: () =>
    set((state) => ({ showInactiveCommands: !state.showInactiveCommands })),
});

export const useGSDStore = create<GSDState>()(
  persist(gsdStore, {
    name: 'gsd-panel-storage',
    partialize: (state) => ({
      isPanelVisible: state.isPanelVisible,
      panelWidth: state.panelWidth,
      isCommandPanelVisible: state.isCommandPanelVisible,
      commandPanelWidth: state.commandPanelWidth,
    }),
    onRehydrateStorage: () => (state) => {
      if (state) {
        state.setHasHydrated(true);
      }
    },
  })
);
