/**
 * GSD command routing logic
 * Maps tree nodes to appropriate GSD commands based on status
 */

import type { TreeNode } from './tree-transforms';

/**
 * Get the appropriate GSD command for a tree node
 *
 * @param node - Tree node to get command for
 * @param currentPhaseNumber - Current phase number from STATE.md
 * @returns GSD command string or null if no action available
 */
export function getCommandForNode(
  node: TreeNode,
  currentPhaseNumber: number
): string | null {
  // Only plan nodes have commands
  if (node.type !== 'plan') {
    return null;
  }

  // Only plans in current phase are actionable
  const planPhaseMatch = node.id.match(/^plan-(\d+)-/);
  if (!planPhaseMatch || parseInt(planPhaseMatch[1]) !== currentPhaseNumber) {
    return null;
  }

  // Route based on plan status
  switch (node.status) {
    case 'pending':
      // Plan needs to be created
      return `/gsd:plan-phase ${currentPhaseNumber}`;

    case 'in-progress':
      // Plan is being executed
      return `/gsd:execute-phase ${currentPhaseNumber}`;

    case 'complete':
      // No action needed for complete plans
      return null;

    default:
      return null;
  }
}

/**
 * Get the next action for the current phase
 * Finds first pending or in-progress plan in current phase
 *
 * @param nodes - Tree data (phase nodes with plan children)
 * @param currentPhaseNumber - Current phase number from STATE.md
 * @returns Next action object or null if no action available
 */
export function getNextAction(
  nodes: TreeNode[],
  currentPhaseNumber: number
): { command: string; label: string } | null {
  console.log('[getNextAction] called with:', {
    nodesCount: nodes.length,
    nodeIds: nodes.map(n => n.id),
    currentPhaseNumber
  });

  // Find current phase node
  const currentPhase = nodes.find(
    (n) => n.id === `phase-${currentPhaseNumber}`
  );

  console.log('[getNextAction] currentPhase:', currentPhase ? {
    id: currentPhase.id,
    childrenCount: currentPhase.children?.length
  } : null);

  if (!currentPhase || !currentPhase.children) {
    console.log('[getNextAction] no current phase or no children');
    return null;
  }

  // Find first plan that needs action (pending or in-progress)
  for (const plan of currentPhase.children) {
    console.log('[getNextAction] checking plan:', {
      id: plan.id,
      type: plan.type,
      status: plan.status
    });
    const command = getCommandForNode(plan, currentPhaseNumber);
    if (command) {
      const label = getCommandLabel(command);
      console.log('[getNextAction] found action:', { command, label });
      return { command, label };
    }
  }

  console.log('[getNextAction] no actionable plans found');
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
