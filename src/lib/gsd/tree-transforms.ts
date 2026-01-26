/**
 * Tree data transformation for hierarchical visualization
 * Transforms flat phase/plan data into nested TreeNode structure
 */

import type { PhaseInfo, PlanInfo, MilestoneInfo } from './parsers';

export interface TreeNodeProgress {
  completed: number;
  total: number;
}

export interface TreeNode {
  id: string; // 'milestone-10', 'phase-1', 'plan-1-01'
  type: 'milestone' | 'phase' | 'plan';
  label: string; // 'v1.0 MVP', 'Phase 1: Foundation', 'Plan 01: ...'
  status: 'pending' | 'in-progress' | 'complete';
  filepath?: string; // Path to corresponding file (for viewer integration) - deprecated, use contextFiles
  contextFiles?: string[]; // Files to open when node is clicked (multiple files)
  archived?: boolean; // true for archived milestones
  progress?: TreeNodeProgress; // For milestones and phases
  metadata?: {
    goal?: string; // Phase or milestone goal
    description?: string; // Plan description (name)
    phaseDir?: string; // Phase directory name for file path generation
  };
  children?: TreeNode[];
}

/**
 * Get phase directory name from phase info
 * Converts phase name to kebab-case for directory lookup
 */
function getPhaseDirectoryName(phase: PhaseInfo): string {
  const paddedNumber = phase.number.toString().padStart(2, '0');
  const kebabName = phase.name.toLowerCase().replace(/\s+/g, '-');
  return `${paddedNumber}-${kebabName}`;
}

/**
 * Build hierarchical tree data from phases and plans
 *
 * @param phases - Phase info from ROADMAP.md
 * @param plans - Plan info from PLAN.md files
 * @param currentPhaseNumber - Current phase from STATE.md
 * @param projectPath - Optional project path for filepath generation
 * @returns Array of phase TreeNodes with plan children
 */
export function buildTreeData(
  phases: PhaseInfo[],
  plans: PlanInfo[],
  currentPhaseNumber: number,
  projectPath?: string
): TreeNode[] {
  return phases.map((phase) => {
    // Filter plans belonging to this phase
    const phasePlans = plans
      .filter((plan) => plan.phaseNumber === phase.number)
      .sort((a, b) => a.planNumber - b.planNumber);

    const phaseDirName = getPhaseDirectoryName(phase);

    // Create plan TreeNodes as children
    const children: TreeNode[] = phasePlans.map((plan) => {
      const planPadded = plan.planNumber.toString().padStart(2, '0');
      const phasePadded = phase.number.toString().padStart(2, '0');
      const planBase = `${phasePadded}-${planPadded}`;
      const planFilename = `${planBase}-PLAN.md`;
      const summaryFilename = `${planBase}-SUMMARY.md`;

      // Build context files: PLAN.md always, SUMMARY.md if plan is complete
      const contextFiles: string[] = [];
      if (projectPath) {
        const basePath = `${projectPath}/.planning/phases/${phaseDirName}`;
        contextFiles.push(`${basePath}/${planFilename}`);
        // Add SUMMARY.md for completed plans
        if (plan.status === 'complete') {
          contextFiles.push(`${basePath}/${summaryFilename}`);
        }
      }

      return {
        id: `plan-${plan.phaseNumber}-${planPadded}`,
        type: 'plan' as const,
        label: `Plan ${planPadded}`,
        status: plan.status,
        filepath: projectPath
          ? `${projectPath}/.planning/phases/${phaseDirName}/${planFilename}`
          : undefined,
        contextFiles: contextFiles.length > 0 ? contextFiles : undefined,
        metadata: {
          description: plan.name,
        },
      };
    });

    // Calculate progress
    const completedPlans = phasePlans.filter((p) => p.status === 'complete').length;
    const progress: TreeNodeProgress = {
      completed: completedPlans,
      total: phasePlans.length,
    };

    // Determine phase status
    let status: TreeNode['status'];
    if (phasePlans.length > 0 && completedPlans === phasePlans.length) {
      status = 'complete';
    } else if (phase.number === currentPhaseNumber) {
      status = 'in-progress';
    } else if (phase.number < currentPhaseNumber) {
      // Past phases should be complete (or at least not pending)
      status = completedPlans > 0 ? 'in-progress' : 'pending';
    } else {
      status = 'pending';
    }

    // Build phase context files: CONTEXT.md always, RESEARCH.md and VERIFICATION.md if they exist
    // Note: We list potential files; the UI will handle missing files gracefully
    const phaseContextFiles: string[] = [];
    if (projectPath) {
      const basePath = `${projectPath}/.planning/phases/${phaseDirName}`;
      const phasePadded = phase.number.toString().padStart(2, '0');
      // CONTEXT.md is the primary phase file
      phaseContextFiles.push(`${basePath}/${phasePadded}-CONTEXT.md`);
      // RESEARCH.md and VERIFICATION.md are optional
      phaseContextFiles.push(`${basePath}/${phasePadded}-RESEARCH.md`);
      phaseContextFiles.push(`${basePath}/${phasePadded}-VERIFICATION.md`);
    }

    return {
      id: `phase-${phase.number}`,
      type: 'phase' as const,
      label: `Phase ${phase.number}: ${phase.name}`,
      status,
      // Phases are directories, not files - don't set filepath
      // Users can click into plans to view individual plan files
      filepath: undefined,
      contextFiles: phaseContextFiles.length > 0 ? phaseContextFiles : undefined,
      progress,
      metadata: {
        goal: phase.goal,
        phaseDir: phaseDirName,
      },
      children,
    };
  });
}

/**
 * Calculate aggregate progress for a milestone from its phases
 */
function calculateMilestoneProgress(
  phases: PhaseInfo[],
  plans: PlanInfo[]
): TreeNodeProgress {
  let completed = 0;
  let total = 0;

  for (const phase of phases) {
    const phasePlans = plans.filter((p) => p.phaseNumber === phase.number);
    total += phasePlans.length;
    completed += phasePlans.filter((p) => p.status === 'complete').length;
  }

  return { completed, total };
}

/**
 * Build 3-level tree with milestones at the root
 *
 * @param milestones - Milestone info from ROADMAP.md
 * @param phases - Phase info from ROADMAP.md
 * @param plans - Plan info from PLAN.md files
 * @param currentPhaseNumber - Current phase from STATE.md
 * @param projectPath - Project path for filepath generation
 * @returns Object with active and archived milestone trees
 */
export function buildMilestoneTree(
  milestones: MilestoneInfo[],
  phases: PhaseInfo[],
  plans: PlanInfo[],
  currentPhaseNumber: number,
  projectPath: string
): { active: TreeNode[]; archived: TreeNode[] } {
  const active: TreeNode[] = [];
  const archived: TreeNode[] = [];

  for (const milestone of milestones) {
    // Filter phases belonging to this milestone
    const milestonePhases = phases.filter(
      (p) => p.number >= milestone.phaseRange.start &&
             p.number <= milestone.phaseRange.end
    );

    // Build phase subtree for this milestone
    const phaseChildren = buildTreeData(
      milestonePhases,
      plans,
      currentPhaseNumber,
      projectPath
    );

    // Calculate milestone progress
    const progress = calculateMilestoneProgress(milestonePhases, plans);

    // Determine milestone filepath
    // Active milestones point to the main ROADMAP.md
    // Archived milestones don't have a filepath (archived roadmaps may not exist)
    const filepath = milestone.archived
      ? undefined
      : `${projectPath}/.planning/ROADMAP.md`;

    // Build milestone context files: ROADMAP.md, STATE.md, REQUIREMENTS.md
    const milestoneContextFiles: string[] = [];
    if (!milestone.archived) {
      milestoneContextFiles.push(`${projectPath}/.planning/ROADMAP.md`);
      milestoneContextFiles.push(`${projectPath}/.planning/STATE.md`);
      milestoneContextFiles.push(`${projectPath}/.planning/REQUIREMENTS.md`);
    }

    const milestoneNode: TreeNode = {
      id: `milestone-${milestone.number}`,
      type: 'milestone',
      label: milestone.name,
      status: milestone.status,
      filepath,
      contextFiles: milestoneContextFiles.length > 0 ? milestoneContextFiles : undefined,
      archived: milestone.archived,
      progress,
      metadata: {
        goal: milestone.goal,
      },
      children: phaseChildren,
    };

    if (milestone.archived) {
      archived.push(milestoneNode);
    } else {
      active.push(milestoneNode);
    }
  }

  return { active, archived };
}
