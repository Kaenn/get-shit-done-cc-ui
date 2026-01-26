/**
 * Tree view container for GSD visualization
 * Renders hierarchical phases -> plans structure
 */

import { useEffect } from 'react';
import { useGSDStore } from '@/stores/gsdStore';
import { GSDTreeNode } from './GSDTreeNode';

interface GSDTreeViewProps {
  projectPath: string | null;
}

export function GSDTreeView({ projectPath }: GSDTreeViewProps) {
  const { treeData, parsedData, initializeExpanded } = useGSDStore();

  // Extract currentPhaseNumber from parsedData (set by useGSDData from STATE.md)
  const currentPhaseNumber = parsedData?.currentPhase ?? 1;

  // Initialize expanded state on first load - expand current phase by default
  useEffect(() => {
    initializeExpanded(currentPhaseNumber);
  }, [currentPhaseNumber, initializeExpanded]);

  if (!treeData || treeData.length === 0) {
    return null;
  }

  return (
    <div role="tree" className="space-y-1">
      {treeData.map((node) => (
        <GSDTreeNode
          key={node.id}
          node={node}
          depth={0}
          currentPhaseNumber={currentPhaseNumber}
          projectPath={projectPath}
        />
      ))}
    </div>
  );
}
