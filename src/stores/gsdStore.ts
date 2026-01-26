import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StateCreator } from 'zustand';
import type { TreeNode } from '@/lib/gsd/tree-transforms';
import type { GSDCommandDefinition } from '@/lib/gsd/command-registry';
import type { MilestoneInfo } from '@/lib/gsd/parsers';

// File tab interface for viewer
export interface FileTab {
  id: string;           // Unique tab ID
  filepath: string;     // Absolute file path
  title: string;        // Display name (filename extracted from path)
  content?: string;     // Cached file content (lazy loaded)
}

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
  sidebarActiveView: 'commands' | 'state';

  // Runtime state (not persisted)
  parsedData: StateData | null;
  phases: PhaseInfo[];
  milestoneData: MilestoneInfo[];
  treeData: TreeNode[];
  archivedTreeData: TreeNode[];
  expandedNodes: Set<string>;
  hasHydrated: boolean;
  isLoading: boolean;
  error: string | null;

  // Viewer tab state (runtime only)
  openTabs: FileTab[];
  activeTabId: string | null;

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
  commandInitialValues: Record<string, string | number> | null;
  showInactiveCommands: boolean;

  // Actions
  togglePanel: () => void;
  setPanelWidth: (width: number) => void;
  toggleCommandPanel: () => void;
  setCommandPanelWidth: (width: number) => void;
  setSidebarActiveView: (view: 'commands' | 'state') => void;
  updateParsedData: (data: StateData | null) => void;
  setPhases: (phases: PhaseInfo[]) => void;
  setMilestoneData: (data: MilestoneInfo[]) => void;
  setTreeData: (data: TreeNode[]) => void;
  setArchivedTreeData: (data: TreeNode[]) => void;
  toggleNode: (nodeId: string) => void;
  initializeExpanded: (currentPhaseNumber: number, currentPlanNumber?: number, milestoneData?: MilestoneInfo[]) => void;
  setHasHydrated: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  setError: (error: string | null) => void;

  // Viewer tab actions
  openFile: (filepath: string) => void;
  openFiles: (filepaths: string[]) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;

  // Command execution actions
  setCommandRunning: (command: string | null) => void;
  setNextAction: (action: { command: string; label: string } | null) => void;
  toggleComboMode: () => void;
  setProjectPath: (path: string | null) => void;

  // Command panel actions
  toggleCategory: (category: string) => void;
  initializeCategories: () => void;
  openCommandDialog: (command: GSDCommandDefinition, initialValues?: Record<string, string | number>) => void;
  closeCommandDialog: () => void;
  toggleShowInactiveCommands: () => void;
}

const gsdStore: StateCreator<GSDState> = (set, get) => ({
  // Initial persisted state
  isPanelVisible: true,
  panelWidth: 75,
  isCommandPanelVisible: true,
  commandPanelWidth: 20,
  sidebarActiveView: 'commands',

  // Initial runtime state
  parsedData: null,
  phases: [],
  milestoneData: [],
  treeData: [],
  archivedTreeData: [],
  expandedNodes: new Set<string>(),
  hasHydrated: false,
  isLoading: false,
  error: null,

  // Initial viewer tab state
  openTabs: [],
  activeTabId: null,

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
  commandInitialValues: null,
  showInactiveCommands: true,

  // Actions
  togglePanel: () => set((state) => ({ isPanelVisible: !state.isPanelVisible })),

  setPanelWidth: (width: number) => set({ panelWidth: width }),

  setSidebarActiveView: (view: 'commands' | 'state') => set({ sidebarActiveView: view }),

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

  setMilestoneData: (data: MilestoneInfo[]) => set({ milestoneData: data }),

  setTreeData: (data: TreeNode[]) => set({ treeData: data }),

  setArchivedTreeData: (data: TreeNode[]) => set({ archivedTreeData: data }),

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

  initializeExpanded: (currentPhaseNumber: number, _currentPlanNumber?: number, milestoneData?: MilestoneInfo[]) =>
    set(() => {
      const expandedSet = new Set<string>();

      // Always expand current phase
      expandedSet.add(`phase-${currentPhaseNumber}`);

      // Find and expand current milestone (the one containing current phase)
      if (milestoneData) {
        const currentMilestone = milestoneData.find(
          m => !m.archived &&
               currentPhaseNumber >= m.phaseRange.start &&
               currentPhaseNumber <= m.phaseRange.end
        );
        if (currentMilestone) {
          expandedSet.add(`milestone-${currentMilestone.number}`);
        }
      }

      return { expandedNodes: expandedSet };
    }),

  setHasHydrated: (value: boolean) => set({ hasHydrated: value }),

  setLoading: (value: boolean) => set({ isLoading: value }),

  setError: (error: string | null) => set({ error }),

  // Viewer tab actions
  openFile: (filepath: string) => {
    const state = get();
    // Check for existing tab with same filepath
    const existing = state.openTabs.find(t => t.filepath === filepath);
    if (existing) {
      // Switch to existing tab instead of creating duplicate
      // Also ensure panel is visible when opening a file
      set({ activeTabId: existing.id, isPanelVisible: true });
      return;
    }

    // Create new tab
    const newTab: FileTab = {
      id: Date.now().toString(),
      filepath,
      title: filepath.split('/').pop() || 'Untitled',
    };

    // Open the file AND ensure the panel is visible
    set({
      openTabs: [...state.openTabs, newTab],
      activeTabId: newTab.id,
      isPanelVisible: true,
    });
  },

  openFiles: (filepaths: string[]) => {
    if (filepaths.length === 0) return;

    const state = get();
    let currentTabs = [...state.openTabs];
    let lastNewTabId: string | null = null;

    for (const filepath of filepaths) {
      // Check for existing tab with same filepath
      const existing = currentTabs.find(t => t.filepath === filepath);
      if (existing) {
        // Already open, set as active (last one wins)
        lastNewTabId = existing.id;
        continue;
      }

      // Create new tab
      const newTab: FileTab = {
        id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 7),
        filepath,
        title: filepath.split('/').pop() || 'Untitled',
      };
      currentTabs.push(newTab);
      lastNewTabId = newTab.id;
    }

    // Set first new tab as active, ensure panel visible
    set({
      openTabs: currentTabs,
      activeTabId: lastNewTabId,
      isPanelVisible: true,
    });
  },

  closeTab: (tabId: string) => {
    const state = get();
    const closedIndex = state.openTabs.findIndex(t => t.id === tabId);
    const newTabs = state.openTabs.filter(t => t.id !== tabId);

    if (newTabs.length === 0) {
      // No tabs left
      set({ openTabs: [], activeTabId: null });
      return;
    }

    if (state.activeTabId === tabId) {
      // Closing active tab - select adjacent
      // Prefer next tab (right), fallback to previous (left) if closing last
      const nextIndex = Math.min(closedIndex, newTabs.length - 1);
      set({
        openTabs: newTabs,
        activeTabId: newTabs[nextIndex].id
      });
    } else {
      // Closing inactive tab - keep current active
      set({ openTabs: newTabs });
    }
  },

  setActiveTab: (tabId: string) => set({ activeTabId: tabId }),

  updateTabContent: (tabId: string, content: string) =>
    set((state) => ({
      openTabs: state.openTabs.map(t =>
        t.id === tabId ? { ...t, content } : t
      ),
    })),

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

  openCommandDialog: (command: GSDCommandDefinition, initialValues?: Record<string, string | number>) =>
    set({ commandDialogOpen: true, selectedCommand: command, commandInitialValues: initialValues || null }),

  closeCommandDialog: () =>
    set({ commandDialogOpen: false, selectedCommand: null, commandInitialValues: null }),

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
      sidebarActiveView: state.sidebarActiveView,
    }),
    onRehydrateStorage: () => (state) => {
      if (state) {
        state.setHasHydrated(true);
      }
    },
  })
);
