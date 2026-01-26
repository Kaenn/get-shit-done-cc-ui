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
  ClipboardCheck,
  Archive,
  Map,
  GitBranch,
  Flag,
  Zap,
  Compass,
  CheckCircle,
  ArrowDownUp,
  ListTodo,
  Wrench,
  User,
  Search,
  MapPin,
  Eye,
  Pause,
  RefreshCw,
} from 'lucide-react';
import type { StateData, PhaseInfo } from '@/stores/gsdStore';

/**
 * Command categories for organization
 */
export type CommandCategory =
  | 'project-setup'
  | 'phase-lifecycle'
  | 'roadmap-ops'
  | 'milestone-ops'
  | 'quick-work'
  | 'navigation'
  | 'configuration';

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
 * Flag definition for GSD commands (boolean options)
 */
export interface CommandFlag {
  name: string;        // camelCase for form field name (e.g., "skipResearch")
  flag: string;        // CLI flag (e.g., "--skip-research")
  label: string;       // Human readable (e.g., "Skip Research")
  description: string; // Tooltip text
}

/**
 * GSD command definition with eligibility logic
 */
export interface GSDCommandDefinition {
  id: string;
  fullCommand: string;
  label: string;
  description: string;
  category: CommandCategory;
  icon: LucideIcon;
  parameters: CommandParameter[];
  flags: CommandFlag[];
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
 * Organized into 7 categories with 27 total commands
 */
export const GSD_COMMANDS: GSDCommandDefinition[] = [
  // ========================================
  // PROJECT SETUP CATEGORY (3 commands)
  // ========================================
  {
    id: 'new-project',
    fullCommand: '/gsd:new-project',
    label: 'New Project',
    description: 'Initialize with questions/research/roadmap',
    category: 'project-setup',
    icon: FolderPlus,
    parameters: [],
    flags: [],
    isActive: ({ parsedData }) => !parsedData,
  },
  {
    id: 'map-codebase',
    fullCommand: '/gsd:map-codebase',
    label: 'Map Codebase',
    description: 'Analyze existing codebase structure',
    category: 'project-setup',
    icon: Search,
    parameters: [],
    flags: [],
    isActive: ({ parsedData }) => !parsedData,
  },
  {
    id: 'resume-project',
    fullCommand: '/gsd:resume-project',
    label: 'Resume Project',
    description: 'Resume work on existing project',
    category: 'project-setup',
    icon: MapPin,
    parameters: [],
    flags: [],
    isActive: ({ parsedData }) => !!parsedData,
  },

  // ========================================
  // PHASE LIFECYCLE CATEGORY (5 commands)
  // ========================================
  {
    id: 'discuss-phase',
    fullCommand: '/gsd:discuss-phase',
    label: 'Discuss Phase',
    description: 'Capture decisions before planning',
    category: 'phase-lifecycle',
    icon: MessageSquare,
    parameters: [
      {
        name: 'phase',
        type: 'number',
        label: 'Phase Number',
        required: false,
      },
    ],
    flags: [],
    isActive: ({ parsedData }) => !!parsedData,
  },
  {
    id: 'research-phase',
    fullCommand: '/gsd:research-phase',
    label: 'Research Phase',
    description: 'Research a topic for the phase',
    category: 'phase-lifecycle',
    icon: FlaskConical,
    parameters: [
      {
        name: 'phase',
        type: 'number',
        label: 'Phase Number',
        required: false,
      },
      {
        name: 'topic',
        type: 'string',
        label: 'Research Topic',
        required: false,
      },
    ],
    flags: [],
    isActive: ({ parsedData }) => !!parsedData,
  },
  {
    id: 'plan-phase',
    fullCommand: '/gsd:plan-phase',
    label: 'Plan Phase',
    description: 'Research + plan + verify',
    category: 'phase-lifecycle',
    icon: FileText,
    parameters: [
      {
        name: 'phase',
        type: 'number',
        label: 'Phase Number',
        required: false,
      },
    ],
    flags: [
      {
        name: 'skipResearch',
        flag: '--skip-research',
        label: 'Skip Research',
        description: 'Skip the research step if already done',
      },
      {
        name: 'gaps',
        flag: '--gaps',
        label: 'Gaps Only',
        description: 'Only plan remaining gaps in the phase',
      },
    ],
    isActive: ({ parsedData }) => !!parsedData,
  },
  {
    id: 'execute-phase',
    fullCommand: '/gsd:execute-phase',
    label: 'Execute Phase',
    description: 'Execute all plans in parallel waves',
    category: 'phase-lifecycle',
    icon: Play,
    parameters: [
      {
        name: 'phase',
        type: 'number',
        label: 'Phase Number',
        required: false,
      },
    ],
    flags: [
      {
        name: 'gapsOnly',
        flag: '--gaps-only',
        label: 'Gaps Only',
        description: 'Only execute incomplete plans',
      },
    ],
    isActive: ({ parsedData, phases }) =>
      !!parsedData && hasPendingWork(phases),
  },
  {
    id: 'verify-phase',
    fullCommand: '/gsd:verify-phase',
    label: 'Verify Phase',
    description: 'Verify phase completion and quality',
    category: 'phase-lifecycle',
    icon: CheckCircle,
    parameters: [
      {
        name: 'phase',
        type: 'number',
        label: 'Phase Number',
        required: false,
      },
    ],
    flags: [],
    isActive: ({ parsedData }) => !!parsedData,
  },

  // ========================================
  // ROADMAP OPERATIONS CATEGORY (3 commands)
  // ========================================
  {
    id: 'add-phase',
    fullCommand: '/gsd:add-phase',
    label: 'Add Phase',
    description: 'Add phase to end of roadmap',
    category: 'roadmap-ops',
    icon: Plus,
    parameters: [
      {
        name: 'name',
        type: 'string',
        label: 'Phase Name',
        required: true,
      },
      {
        name: 'goal',
        type: 'string',
        label: 'Phase Goal',
        required: true,
      },
    ],
    flags: [],
    isActive: ({ parsedData }) => !!parsedData,
  },
  {
    id: 'insert-phase',
    fullCommand: '/gsd:insert-phase',
    label: 'Insert Phase',
    description: 'Insert phase after specific position',
    category: 'roadmap-ops',
    icon: GitBranch,
    parameters: [
      {
        name: 'after',
        type: 'number',
        label: 'After Phase',
        required: true,
      },
      {
        name: 'name',
        type: 'string',
        label: 'Phase Name',
        required: true,
      },
      {
        name: 'goal',
        type: 'string',
        label: 'Phase Goal',
        required: true,
      },
    ],
    flags: [],
    isActive: ({ parsedData }) => !!parsedData,
  },
  {
    id: 'reorder-phases',
    fullCommand: '/gsd:reorder-phases',
    label: 'Reorder Phases',
    description: 'Reorganize phase order in roadmap',
    category: 'roadmap-ops',
    icon: ArrowDownUp,
    parameters: [],
    flags: [],
    isActive: ({ parsedData }) => !!parsedData,
  },

  // ========================================
  // MILESTONE OPERATIONS CATEGORY (3 commands)
  // ========================================
  {
    id: 'new-milestone',
    fullCommand: '/gsd:new-milestone',
    label: 'New Milestone',
    description: 'Create new milestone version',
    category: 'milestone-ops',
    icon: Flag,
    parameters: [
      {
        name: 'version',
        type: 'string',
        label: 'Version',
        required: true,
      },
      {
        name: 'goal',
        type: 'string',
        label: 'Milestone Goal',
        required: true,
      },
    ],
    flags: [],
    isActive: ({ parsedData }) => !!parsedData,
  },
  {
    id: 'audit-milestone',
    fullCommand: '/gsd:audit-milestone',
    label: 'Audit Milestone',
    description: 'Audit milestone completion vs original intent',
    category: 'milestone-ops',
    icon: ClipboardCheck,
    parameters: [],
    flags: [],
    isActive: ({ parsedData }) => !!parsedData,
  },
  {
    id: 'complete-milestone',
    fullCommand: '/gsd:complete-milestone',
    label: 'Complete Milestone',
    description: 'Archive milestone and create git tag',
    category: 'milestone-ops',
    icon: Archive,
    parameters: [],
    flags: [],
    isActive: ({ parsedData }) => !!parsedData,
  },

  // ========================================
  // QUICK WORK CATEGORY (4 commands)
  // ========================================
  {
    id: 'quick-task',
    fullCommand: '/gsd:quick-task',
    label: 'Quick Task',
    description: 'Execute a quick one-off task',
    category: 'quick-work',
    icon: Zap,
    parameters: [
      {
        name: 'description',
        type: 'string',
        label: 'Task Description',
        required: true,
      },
    ],
    flags: [],
    isActive: () => true,
  },
  {
    id: 'quick-fix',
    fullCommand: '/gsd:quick-fix',
    label: 'Quick Fix',
    description: 'Fix a specific issue quickly',
    category: 'quick-work',
    icon: Wrench,
    parameters: [
      {
        name: 'issue',
        type: 'string',
        label: 'Issue Description',
        required: true,
      },
    ],
    flags: [],
    isActive: () => true,
  },
  {
    id: 'pause-work',
    fullCommand: '/gsd:pause-work',
    label: 'Pause Work',
    description: 'Pause current work and save state',
    category: 'quick-work',
    icon: Pause,
    parameters: [],
    flags: [],
    isActive: ({ parsedData }) => !!parsedData,
  },
  {
    id: 'resume-work',
    fullCommand: '/gsd:resume-work',
    label: 'Resume Work',
    description: 'Resume paused work from saved state',
    category: 'quick-work',
    icon: RefreshCw,
    parameters: [],
    flags: [],
    isActive: ({ parsedData }) => !!parsedData,
  },

  // ========================================
  // NAVIGATION CATEGORY (5 commands)
  // ========================================
  {
    id: 'progress',
    fullCommand: '/gsd:progress',
    label: 'Progress',
    description: 'Display current project status',
    category: 'navigation',
    icon: Activity,
    parameters: [],
    flags: [],
    isActive: ({ parsedData }) => !!parsedData,
  },
  {
    id: 'help',
    fullCommand: '/gsd:help',
    label: 'Help',
    description: 'Show command list and usage',
    category: 'navigation',
    icon: HelpCircle,
    parameters: [],
    flags: [],
    isActive: () => true,
  },
  {
    id: 'check-todos',
    fullCommand: '/gsd:check-todos',
    label: 'Check Todos',
    description: 'List pending TODO items in codebase',
    category: 'navigation',
    icon: ListTodo,
    parameters: [],
    flags: [],
    isActive: ({ parsedData }) => !!parsedData,
  },
  {
    id: 'status',
    fullCommand: '/gsd:status',
    label: 'Status',
    description: 'Show detailed project status',
    category: 'navigation',
    icon: Map,
    parameters: [],
    flags: [],
    isActive: ({ parsedData }) => !!parsedData,
  },
  {
    id: 'watch',
    fullCommand: '/gsd:watch',
    label: 'Watch',
    description: 'Watch for file changes and refresh state',
    category: 'navigation',
    icon: Eye,
    parameters: [],
    flags: [],
    isActive: ({ parsedData }) => !!parsedData,
  },

  // ========================================
  // CONFIGURATION CATEGORY (3 commands)
  // ========================================
  {
    id: 'settings',
    fullCommand: '/gsd:settings',
    label: 'Settings',
    description: 'Configure workflow settings',
    category: 'configuration',
    icon: Settings2,
    parameters: [],
    flags: [],
    isActive: () => true,
  },
  {
    id: 'set-profile',
    fullCommand: '/gsd:set-profile',
    label: 'Set Profile',
    description: 'Set execution profile (thorough/balanced/fast)',
    category: 'configuration',
    icon: User,
    parameters: [
      {
        name: 'profile',
        type: 'string',
        label: 'Profile',
        required: true,
      },
    ],
    flags: [],
    isActive: () => true,
  },
  {
    id: 'configure',
    fullCommand: '/gsd:configure',
    label: 'Configure',
    description: 'Configure project-specific settings',
    category: 'configuration',
    icon: Compass,
    parameters: [],
    flags: [],
    isActive: () => true,
  },
];

/**
 * Get commands grouped by category
 */
export function getCommandsByCategory(): {
  'project-setup': GSDCommandDefinition[];
  'phase-lifecycle': GSDCommandDefinition[];
  'roadmap-ops': GSDCommandDefinition[];
  'milestone-ops': GSDCommandDefinition[];
  'quick-work': GSDCommandDefinition[];
  navigation: GSDCommandDefinition[];
  configuration: GSDCommandDefinition[];
} {
  return {
    'project-setup': GSD_COMMANDS.filter((cmd) => cmd.category === 'project-setup'),
    'phase-lifecycle': GSD_COMMANDS.filter((cmd) => cmd.category === 'phase-lifecycle'),
    'roadmap-ops': GSD_COMMANDS.filter((cmd) => cmd.category === 'roadmap-ops'),
    'milestone-ops': GSD_COMMANDS.filter((cmd) => cmd.category === 'milestone-ops'),
    'quick-work': GSD_COMMANDS.filter((cmd) => cmd.category === 'quick-work'),
    navigation: GSD_COMMANDS.filter((cmd) => cmd.category === 'navigation'),
    configuration: GSD_COMMANDS.filter((cmd) => cmd.category === 'configuration'),
  };
}

/**
 * Get a command definition by its ID
 */
export function getCommandById(id: string): GSDCommandDefinition | undefined {
  return GSD_COMMANDS.find((cmd) => cmd.id === id);
}
