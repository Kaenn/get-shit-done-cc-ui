/**
 * Tree view container for GSD visualization
 * Renders hierarchical milestones -> phases -> plans structure
 */

import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGSDStore } from '@/stores/gsdStore';
import { GSDTreeNode } from './GSDTreeNode';

interface GSDTreeViewProps {
  projectPath: string | null;
}

export function GSDTreeView({ projectPath }: GSDTreeViewProps) {
  const { treeData, archivedTreeData, parsedData, milestoneData, initializeExpanded } = useGSDStore();
  const [archivedExpanded, setArchivedExpanded] = useState(false);

  // Extract currentPhaseNumber and currentPlanNumber from parsedData (set by useGSDData from STATE.md)
  const currentPhaseNumber = parsedData?.currentPhase ?? 1;
  const currentPlanNumber = parsedData?.currentPlan ?? 1;

  // Initialize expanded state on first load - expand current milestone and phase
  useEffect(() => {
    initializeExpanded(currentPhaseNumber, currentPlanNumber, milestoneData);
  }, [currentPhaseNumber, currentPlanNumber, milestoneData, initializeExpanded]);

  if (!treeData || treeData.length === 0) {
    return null;
  }

  const hasArchivedNodes = archivedTreeData && archivedTreeData.length > 0;

  return (
    <div role="tree" className="space-y-1">
      {/* Active milestones/phases/plans */}
      {treeData.map((node) => (
        <GSDTreeNode
          key={node.id}
          node={node}
          depth={0}
          currentPhaseNumber={currentPhaseNumber}
          projectPath={projectPath}
        />
      ))}

      {/* Archived section (collapsed by default, dimmed styling) */}
      {hasArchivedNodes && (
        <div className="mt-4 pt-2 border-t border-border/50">
          <button
            onClick={() => setArchivedExpanded(!archivedExpanded)}
            className={cn(
              'group flex items-center gap-2 py-1.5 px-2 rounded w-full text-left',
              'hover:bg-muted/50 transition-colors opacity-60'
            )}
          >
            <ChevronRight
              className={cn(
                'w-4 h-4 transition-transform flex-shrink-0',
                archivedExpanded && 'rotate-90'
              )}
            />
            <span className="text-sm text-muted-foreground">
              Archived ({archivedTreeData.length})
            </span>
          </button>

          {archivedExpanded && (
            <div className="ml-2">
              {archivedTreeData.map((node) => (
                <GSDTreeNode
                  key={node.id}
                  node={node}
                  depth={0}
                  currentPhaseNumber={currentPhaseNumber}
                  projectPath={projectPath}
                  isArchived={true}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
