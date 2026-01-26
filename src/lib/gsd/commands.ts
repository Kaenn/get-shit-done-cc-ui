/**
 * GSD command routing logic
 * Maps tree nodes to appropriate GSD commands based on status
 */

import type { TreeNode } from './tree-transforms';

/**
 * Action link definition for tree nodes
 */
export interface ActionLink {
  id: string;
  label: string;
  commandId: string;
  initialValues?: Record<string, string | number>;
}

/**
 * Get action links for a milestone node
 *
 * @param node - Milestone tree node
 * @returns Array of action links to show under milestone children
 */
export function getMilestoneActionLinks(node: TreeNode): ActionLink[] {
  if (node.type !== 'milestone' || node.archived) {
    return [];
  }

  const links: ActionLink[] = [];

  // Always show add-phase for non-archived milestones
  links.push({
    id: 'add-phase',
    label: '+ add phase...',
    commandId: 'add-phase',
  });

  // Check if all phases are finished
  const allPhasesComplete = node.children?.every(
    (phase) => phase.status === 'complete'
  ) ?? false;

  if (allPhasesComplete && node.children && node.children.length > 0) {
    links.push({
      id: 'audit-milestone',
      label: 'audit milestone...',
      commandId: 'audit-milestone',
    });
    links.push({
      id: 'complete-milestone',
      label: 'complete milestone...',
      commandId: 'complete-milestone',
    });
  }

  return links;
}

/**
 * Get action links for a phase node
 *
 * @param node - Phase tree node
 * @param currentPhaseNumber - Current phase number from STATE.md
 * @returns Array of action links to show under phase children
 */
export function getPhaseActionLinks(
  node: TreeNode,
  currentPhaseNumber: number
): ActionLink[] {
  if (node.type !== 'phase') {
    return [];
  }

  // Extract phase number from node id
  const phaseMatch = node.id.match(/^phase-(\d+)$/);
  if (!phaseMatch) {
    return [];
  }
  const phaseNumber = parseInt(phaseMatch[1]);

  // Only show actions for current phase that is not finished
  if (phaseNumber !== currentPhaseNumber || node.status === 'complete') {
    return [];
  }

  const links: ActionLink[] = [];

  // Check if phase has any plans
  const plans = node.children || [];
  const hasPlans = plans.length > 0;
  const hasInProgressOrCompletePlans = plans.some(
    (p) => p.status === 'in-progress' || p.status === 'complete'
  );
  const hasIncompletePlans = plans.some(
    (p) => p.status === 'pending' || p.status === 'in-progress'
  );

  // discuss-phase: show if phase hasn't been planned yet (no plans or all pending)
  if (!hasInProgressOrCompletePlans) {
    links.push({
      id: `discuss-phase-${phaseNumber}`,
      label: 'discuss phase...',
      commandId: 'discuss-phase',
      initialValues: { phase: phaseNumber },
    });
  }

  // plan-phase: show if phase has no plans or has pending plans
  if (!hasPlans || plans.some((p) => p.status === 'pending')) {
    links.push({
      id: `plan-phase-${phaseNumber}`,
      label: 'plan phase...',
      commandId: 'plan-phase',
      initialValues: { phase: phaseNumber },
    });
  }

  // execute-phase: show if phase has plans that need execution
  if (hasIncompletePlans && hasPlans) {
    links.push({
      id: `execute-phase-${phaseNumber}`,
      label: 'execute phase...',
      commandId: 'execute-phase',
      initialValues: { phase: phaseNumber },
    });
  }

  return links;
}

/**
 * Get the next action for the current phase
 * Determines the appropriate command based on phase state
 *
 * @param nodes - Tree data (phase nodes with plan children)
 * @param currentPhaseNumber - Current phase number from STATE.md
 * @returns Next action object or null if no action available
 */
export function getNextAction(
  nodes: TreeNode[],
  currentPhaseNumber: number
): { command: string; label: string } | null {
  // Find current phase node
  const currentPhase = nodes.find(
    (n) => n.id === `phase-${currentPhaseNumber}`
  );

  if (!currentPhase) {
    return null;
  }

  const plans = currentPhase.children || [];

  // If phase is complete, no action needed
  if (currentPhase.status === 'complete') {
    return null;
  }

  // Check plan states
  const hasPlans = plans.length > 0;
  const hasPendingPlans = plans.some((p) => p.status === 'pending');
  const hasInProgressPlans = plans.some((p) => p.status === 'in-progress');

  // If there are in-progress plans, execute
  if (hasInProgressPlans) {
    return {
      command: `/gsd:execute-phase ${currentPhaseNumber}`,
      label: `Execute Phase ${currentPhaseNumber}`,
    };
  }

  // If there are pending plans (but none in progress), plan them
  if (hasPendingPlans) {
    return {
      command: `/gsd:plan-phase ${currentPhaseNumber}`,
      label: `Plan Phase ${currentPhaseNumber}`,
    };
  }

  // If no plans at all, suggest planning
  if (!hasPlans) {
    return {
      command: `/gsd:plan-phase ${currentPhaseNumber}`,
      label: `Plan Phase ${currentPhaseNumber}`,
    };
  }

  return null;
}

/**
 * Convert GSD command to human-readable label
 *
 * @param command - GSD command string
 * @returns Human-readable label
 */
export function getCommandLabel(command: string): string {
  // Parse command pattern: /gsd:action-phase N
  const match = command.match(/\/gsd:(\w+)-phase\s+(\d+)/);

  if (!match) {
    return command; // Fallback to raw command
  }

  const [, action, phaseNum] = match;

  switch (action) {
    case 'plan':
      return `Plan Phase ${phaseNum}`;
    case 'execute':
      return `Execute Phase ${phaseNum}`;
    default:
      return command;
  }
}
