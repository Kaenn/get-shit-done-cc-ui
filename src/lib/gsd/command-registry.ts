/**
 * GSD Command Registry
 * Centralized command definitions with eligibility functions
 */

import type { LucideIcon } from 'lucide-react';
import {
  FolderPlus,
  MessageSquare,
  FileText,
  Plus,
  FlaskConical,
  Play,
  Activity,
  Settings2,
  HelpCircle,
} from 'lucide-react';
import type { StateData, PhaseInfo } from '@/stores/gsdStore';

/**
 * Parameter definition for GSD commands
 */
export interface CommandParameter {
  name: string;
  type: 'string' | 'number';
  label: string;
  required: boolean;
  defaultValue?: string | number;
}

/**
 * GSD command definition with eligibility logic
 */
export interface GSDCommandDefinition {
  id: string;
  fullCommand: string;
  label: string;
  description: string;
  category: 'plan' | 'execute' | 'settings';
  icon: LucideIcon;
  parameters: CommandParameter[];
  isActive: (state: {
    parsedData: StateData | null;
    phases: PhaseInfo[];
  }) => boolean;
}

/**
 * Check if project has any pending or in-progress plans
 */
function hasPendingWork(phases: PhaseInfo[]): boolean {
  return phases.some(
    (phase) => phase.status === 'pending' || phase.status === 'in-progress'
  );
}

/**
 * All GSD commands with eligibility functions
 */
export const GSD_COMMANDS: GSDCommandDefinition[] = [
  // Plan category
  {
    id: 'new-project',
    fullCommand: '/gsd:new-project',
    label: 'New Project',
    description: 'Initialize with questions/research/roadmap',
    category: 'plan',
    icon: FolderPlus,
    parameters: [],
    isActive: ({ parsedData }) => !parsedData,
  },
  {
    id: 'discuss-phase',
    fullCommand: '/gsd:discuss-phase',
    label: 'Discuss Phase',
    description: 'Capture decisions before planning',
    category: 'plan',
    icon: MessageSquare,
    parameters: [],
    isActive: ({ parsedData }) => !!parsedData,
  },
  {
    id: 'plan-phase',
    fullCommand: '/gsd:plan-phase',
    label: 'Plan Phase',
    description: 'Research + plan + verify',
    category: 'plan',
    icon: FileText,
    parameters: [
      {
        name: 'phase',
        type: 'number',
        label: 'Phase Number',
        required: false,
      },
    ],
    isActive: ({ parsedData }) => !!parsedData,
  },
  {
    id: 'add-phase',
    fullCommand: '/gsd:add-phase',
    label: 'Add Phase',
    description: 'Add phase to roadmap',
    category: 'plan',
    icon: Plus,
    parameters: [],
    isActive: ({ parsedData }) => !!parsedData,
  },
  {
    id: 'research-phase',
    fullCommand: '/gsd:research-phase',
    label: 'Research Phase',
    description: 'Research a topic',
    category: 'plan',
    icon: FlaskConical,
    parameters: [],
    isActive: ({ parsedData }) => !!parsedData,
  },

  // Execute category
  {
    id: 'execute-phase',
    fullCommand: '/gsd:execute-phase',
    label: 'Execute Phase',
    description: 'Execute all plans in parallel waves',
    category: 'execute',
    icon: Play,
    parameters: [
      {
        name: 'phase',
        type: 'number',
        label: 'Phase Number',
        required: false,
      },
    ],
    isActive: ({ parsedData, phases }) =>
      !!parsedData && hasPendingWork(phases),
  },
  {
    id: 'progress',
    fullCommand: '/gsd:progress',
    label: 'Progress',
    description: 'Display current status',
    category: 'execute',
    icon: Activity,
    parameters: [],
    isActive: ({ parsedData }) => !!parsedData,
  },

  // Settings category
  {
    id: 'settings',
    fullCommand: '/gsd:settings',
    label: 'Settings',
    description: 'Configure workflow',
    category: 'settings',
    icon: Settings2,
    parameters: [],
    isActive: () => true,
  },
  {
    id: 'help',
    fullCommand: '/gsd:help',
    label: 'Help',
    description: 'Show command list',
    category: 'settings',
    icon: HelpCircle,
    parameters: [],
    isActive: () => true,
  },
];

/**
 * Get commands grouped by category
 */
export function getCommandsByCategory(): {
  plan: GSDCommandDefinition[];
  execute: GSDCommandDefinition[];
  settings: GSDCommandDefinition[];
} {
  return {
    plan: GSD_COMMANDS.filter((cmd) => cmd.category === 'plan'),
    execute: GSD_COMMANDS.filter((cmd) => cmd.category === 'execute'),
    settings: GSD_COMMANDS.filter((cmd) => cmd.category === 'settings'),
  };
}
