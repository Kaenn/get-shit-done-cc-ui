/**
 * Tree data transformation for hierarchical visualization
 * Transforms flat phase/plan data into nested TreeNode structure
 */

import type { PhaseInfo, PlanInfo } from './parsers';

export interface TreeNodeProgress {
  completed: number;
  total: number;
}

export interface TreeNode {
  id: string; // 'phase-1', 'plan-1-01'
  type: 'phase' | 'plan';
  label: string; // 'Phase 1: Foundation', 'Plan 01: ...'
  status: 'pending' | 'in-progress' | 'complete';
  progress?: TreeNodeProgress; // Only for phases
  metadata?: {
    goal?: string; // Phase goal
    description?: string; // Plan description (name)
  };
  children?: TreeNode[];
}

/**
 * Build hierarchical tree data from phases and plans
 *
 * @param phases - Phase info from ROADMAP.md
 * @param plans - Plan info from PLAN.md files
 * @param currentPhaseNumber - Current phase from STATE.md
 * @returns Array of phase TreeNodes with plan children
 */
export function buildTreeData(
  phases: PhaseInfo[],
  plans: PlanInfo[],
  currentPhaseNumber: number
): TreeNode[] {
  return phases.map((phase) => {
    // Filter plans belonging to this phase
    const phasePlans = plans
      .filter((plan) => plan.phaseNumber === phase.number)
      .sort((a, b) => a.planNumber - b.planNumber);

    // Create plan TreeNodes as children
    const children: TreeNode[] = phasePlans.map((plan) => ({
      id: `plan-${plan.phaseNumber}-${plan.planNumber.toString().padStart(2, '0')}`,
      type: 'plan' as const,
      label: `Plan ${plan.planNumber.toString().padStart(2, '0')}`,
      status: plan.status,
      metadata: {
        description: plan.name,
      },
    }));

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

    return {
      id: `phase-${phase.number}`,
      type: 'phase' as const,
      label: `Phase ${phase.number}: ${phase.name}`,
      status,
      progress,
      metadata: {
        goal: phase.goal,
      },
      children,
    };
  });
}
