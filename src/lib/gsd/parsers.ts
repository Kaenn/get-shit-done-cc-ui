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

export interface MilestoneInfo {
  number: number;        // e.g., 1 for v1.0, 2 for v1.1
  name: string;          // e.g., "v1.0 MVP", "v1.1 Context Enhancement"
  goal: string;          // Milestone goal from ROADMAP.md
  status: 'pending' | 'in-progress' | 'complete';
  archived: boolean;     // true if milestone is in archived section
  phaseRange: {          // Which phases belong to this milestone
    start: number;       // e.g., 1 for phases 1-6
    end: number;         // e.g., 6 for phases 1-6
  };
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

/**
 * Parse ROADMAP.md content into milestone list
 * Format example:
 *   ## Milestones
 *   - **v1.0 MVP** — Phases 1-6 (shipped 2026-01-25) — [Archive](...)
 *   - **v1.1 Context Enhancement** — Phases 7-10 (in progress)
 *
 *   ### v1.1 Context Enhancement (In Progress)
 *   **Milestone Goal:** Enhance GSD-UI with better project visualization...
 */
export function parseMilestones(content: string, totalPhases: number): MilestoneInfo[] {
  const milestones: MilestoneInfo[] = [];

  try {
    const lines = content.split('\n');

    // First pass: find milestone lines in "## Milestones" section
    let inMilestonesSection = false;
    const milestoneLines: string[] = [];

    for (const line of lines) {
      if (line.match(/^##\s+Milestones\s*$/i)) {
        inMilestonesSection = true;
        continue;
      }
      if (inMilestonesSection) {
        // Stop at next ## section
        if (line.match(/^##\s+/)) {
          break;
        }
        // Collect milestone bullet lines
        if (line.match(/^-\s+\*\*/)) {
          milestoneLines.push(line);
        }
      }
    }

    // If no milestones section found, create implicit milestone
    if (milestoneLines.length === 0) {
      return [{
        number: 1,
        name: 'Current Project',
        goal: '',
        status: 'in-progress',
        archived: false,
        phaseRange: { start: 1, end: totalPhases },
      }];
    }

    // Parse each milestone line
    for (const line of milestoneLines) {
      // Match: **v1.0 MVP** — Phases 1-6 (shipped/in progress)
      const match = line.match(
        /\*\*(v(\d+)\.(\d+)\s+([^*]+))\*\*\s*—\s*Phases?\s*(\d+)-(\d+)\s*(?:\(([^)]+)\))?/i
      );

      if (match) {
        const fullName = match[1].trim();  // "v1.0 MVP"
        const majorVersion = parseInt(match[2], 10);  // 1
        const minorVersion = parseInt(match[3], 10);  // 0
        const milestoneNumber = majorVersion * 10 + minorVersion;  // 10 for v1.0, 11 for v1.1
        const phaseStart = parseInt(match[5], 10);
        const phaseEnd = parseInt(match[6], 10);
        const statusText = match[7]?.toLowerCase() || '';

        // Determine archived and status
        const isArchived = statusText.includes('shipped') ||
                          statusText.includes('complete') ||
                          line.includes('[Archive]');

        let status: MilestoneInfo['status'];
        if (isArchived) {
          status = 'complete';
        } else if (statusText.includes('in progress') || statusText.includes('in-progress')) {
          status = 'in-progress';
        } else {
          status = 'pending';
        }

        milestones.push({
          number: milestoneNumber,
          name: fullName,
          goal: '',  // Will be filled in second pass
          status,
          archived: isArchived,
          phaseRange: { start: phaseStart, end: phaseEnd },
        });
      }
    }

    // Second pass: find goals for each milestone
    // Look for "### v1.1 Context Enhancement" sections with "**Milestone Goal:**"
    for (const milestone of milestones) {
      const versionMatch = milestone.name.match(/^v(\d+)\.(\d+)/);
      if (!versionMatch) continue;

      // Build regex to find the milestone section header
      // Match: "### v1.1 Context Enhancement (In Progress)" or similar
      const escapedName = milestone.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const sectionRegex = new RegExp(`^###\\s+${escapedName}`, 'im');

      let inMilestoneSection = false;
      for (const line of lines) {
        if (sectionRegex.test(line)) {
          inMilestoneSection = true;
          continue;
        }
        if (inMilestoneSection) {
          // Stop at next ### section
          if (line.match(/^###\s+/)) {
            break;
          }
          // Look for milestone goal
          const goalMatch = line.match(/\*\*(?:Milestone\s+)?Goal\*?\*?:\s*(.+)$/i);
          if (goalMatch) {
            milestone.goal = goalMatch[1].trim();
            break;
          }
        }
      }
    }

    return milestones;
  } catch (error) {
    console.error('Error parsing milestones:', error);
    // Return implicit milestone on error
    return [{
      number: 1,
      name: 'Current Project',
      goal: '',
      status: 'in-progress',
      archived: false,
      phaseRange: { start: 1, end: totalPhases },
    }];
  }
}
