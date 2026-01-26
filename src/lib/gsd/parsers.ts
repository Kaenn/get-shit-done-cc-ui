/**
 * Markdown parsers for GSD planning files
 * No dependencies on gray-matter - uses simple string parsing
 */

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

export interface PlanInfo {
  phaseNumber: number;
  planNumber: number;
  name: string;
  status: 'pending' | 'in-progress' | 'complete';
}

/**
 * Parse STATE.md content into structured data
 * Format example:
 *   Phase: 1 of 3 (Foundation)
 *   Plan: 0 of ?
 *   Progress: [░░░░░░░░░░] 0%
 */
export function parseStateMd(content: string): StateData {
  const defaultData: StateData = {
    currentPhase: 0,
    totalPhases: 0,
    currentPlan: 0,
    totalPlans: null,
    progress: 0,
    phaseName: '',
  };

  try {
    const lines = content.split('\n');

    for (const line of lines) {
      // Parse "Phase: 1 of 3 (Foundation)"
      const phaseMatch = line.match(/Phase:\s*(\d+)\s+of\s+(\d+)\s*\(([^)]+)\)/i);
      if (phaseMatch) {
        defaultData.currentPhase = parseInt(phaseMatch[1], 10);
        defaultData.totalPhases = parseInt(phaseMatch[2], 10);
        defaultData.phaseName = phaseMatch[3].trim();
      }

      // Parse "Plan: 0 of ?" or "Plan: 1 of 3"
      const planMatch = line.match(/Plan:\s*(\d+)\s+of\s+(\?|\d+)/i);
      if (planMatch) {
        defaultData.currentPlan = parseInt(planMatch[1], 10);
        defaultData.totalPlans = planMatch[2] === '?' ? null : parseInt(planMatch[2], 10);
      }

      // Parse "Progress: [░░░░░░░░░░] 0%" or "Progress: [██░░░░░░░░] 20%"
      const progressMatch = line.match(/Progress:.*?(\d+)%/i);
      if (progressMatch) {
        defaultData.progress = parseInt(progressMatch[1], 10);
      }
    }

    return defaultData;
  } catch (error) {
    console.error('Error parsing STATE.md:', error);
    return defaultData;
  }
}

/**
 * Parse ROADMAP.md content into phase list
 * Format example:
 *   - [ ] **Phase 1: Foundation** - Data parsing and panel infrastructure
 *   ...
 *   ### Phase 1: Foundation
 *   **Goal**: GSD panel exists with parsed project data ready for display
 */
export function parseRoadmapMd(content: string): PhaseInfo[] {
  const phases: PhaseInfo[] = [];

  try {
    const lines = content.split('\n');
    let currentPhase: Partial<PhaseInfo> | null = null;

    // First pass: collect phase checkbox status
    const phaseStatuses = new Map<number, 'pending' | 'in-progress' | 'complete'>();
    for (const line of lines) {
      const checkboxMatch = line.match(/^-\s+\[([ x])\]\s+\*\*Phase\s+(\d+):/i);
      if (checkboxMatch) {
        const phaseNum = parseInt(checkboxMatch[2], 10);
        const status = checkboxMatch[1] === 'x' ? 'complete' : 'pending';
        phaseStatuses.set(phaseNum, status);
      }
    }

    // Second pass: extract phase details
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Match "### Phase 1: Foundation"
      const phaseHeaderMatch = line.match(/^###\s+Phase\s+(\d+):\s+(.+)$/i);
      if (phaseHeaderMatch) {
        // Save previous phase if exists
        if (currentPhase && currentPhase.number !== undefined) {
          phases.push({
            number: currentPhase.number,
            name: currentPhase.name || '',
            goal: currentPhase.goal || '',
            status: currentPhase.status || 'pending',
          });
        }

        const phaseNum = parseInt(phaseHeaderMatch[1], 10);
        currentPhase = {
          number: phaseNum,
          name: phaseHeaderMatch[2].trim(),
          goal: '',
          status: phaseStatuses.get(phaseNum) || 'pending',
        };
      }

      // Match "**Goal**: GSD panel exists..."
      if (currentPhase && line.match(/^\*\*Goal\*\*:/i)) {
        const goalMatch = line.match(/^\*\*Goal\*\*:\s*(.+)$/i);
        if (goalMatch) {
          currentPhase.goal = goalMatch[1].trim();
        }
      }
    }

    // Save last phase
    if (currentPhase && currentPhase.number !== undefined) {
      phases.push({
        number: currentPhase.number,
        name: currentPhase.name || '',
        goal: currentPhase.goal || '',
        status: currentPhase.status || 'pending',
      });
    }

    return phases;
  } catch (error) {
    console.error('Error parsing ROADMAP.md:', error);
    return [];
  }
}

/**
 * Parse PLAN.md content into plan info
 * Format example:
 *   ---
 *   phase: 02-visualization
 *   plan: 01
 *   ---
 *   <objective>
 *   Add PLAN.md parsing and tree data transformation
 *   ...
 */
export function parsePlanMd(content: string, hasSummary: boolean): PlanInfo | null {
  try {
    // Extract frontmatter between --- markers
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      return null;
    }

    const frontmatter = frontmatterMatch[1];

    // Parse phase number from "phase: 02-visualization" or "phase: 01"
    const phaseMatch = frontmatter.match(/^phase:\s*(\d+)(?:-\S+)?/m);
    if (!phaseMatch) {
      return null;
    }
    const phaseNumber = parseInt(phaseMatch[1], 10);

    // Parse plan number from "plan: 01"
    const planMatch = frontmatter.match(/^plan:\s*(\d+)/m);
    if (!planMatch) {
      return null;
    }
    const planNumber = parseInt(planMatch[1], 10);

    // Extract name from first line of text after <objective> tag
    const objectiveMatch = content.match(/<objective>\s*\n([^\n]+)/);
    const name = objectiveMatch ? objectiveMatch[1].trim() : `Plan ${planNumber.toString().padStart(2, '0')}`;

    // Status based on hasSummary parameter
    const status: PlanInfo['status'] = hasSummary ? 'complete' : 'pending';

    return {
      phaseNumber,
      planNumber,
      name,
      status,
    };
  } catch (error) {
    console.error('Error parsing PLAN.md:', error);
    return null;
  }
}
