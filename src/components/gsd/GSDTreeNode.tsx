/**
 * Recursive tree node component for GSD visualization
 * Renders milestones, phases, and plans with expand/collapse, status dots, and progress
 */

import React from 'react';
import { ChevronRight, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGSDStore } from '@/stores/gsdStore';
import { getCommandForNode, getCommandLabel } from '@/lib/gsd/commands';
import { api } from '@/lib/api';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { TreeNode } from '@/lib/gsd/tree-transforms';

interface TreeNodeProps {
  node: TreeNode;
  depth: number;
  currentPhaseNumber: number;
  projectPath: string | null;
  isArchived?: boolean; // Inherited from parent for styling
}

export const GSDTreeNode = React.memo(
  ({ node, depth, currentPhaseNumber, projectPath, isArchived }: TreeNodeProps) => {
    const { expandedNodes, toggleNode, isCommandRunning, setCommandRunning, openFile } = useGSDStore();
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    // Determine if this node or its ancestry is archived
    const isArchivedNode = node.archived || isArchived;

    // Highlight current phase
    const isCurrentPhase =
      node.type === 'phase' && node.id === `phase-${currentPhaseNumber}`;

    // Determine if this node has a clickable command
    const command = getCommandForNode(node, currentPhaseNumber);
    const isClickable = command !== null && !isCommandRunning;

    // Command execution handler
    const handleNodeClick = async (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent expand/collapse
      if (!command || isCommandRunning || !projectPath) return;

      setCommandRunning(command);
      try {
        // Send /clear followed by the command
        await api.executeClaudeCode(projectPath, `/clear\n${command}`, 'sonnet');
      } catch (error) {
        console.error('GSD command failed:', error);
      } finally {
        setCommandRunning(null);
      }
    };

    // Status indicator - colored dot only (per CONTEXT.md: "Color-only status, no icons")
    const StatusDot = ({ status }: { status: 'pending' | 'in-progress' | 'complete' }) => {
      return (
        <div
          className={cn(
            'w-2 h-2 rounded-full flex-shrink-0',
            status === 'pending' && 'bg-gray-400',
            status === 'in-progress' && 'bg-blue-500 animate-pulse',
            status === 'complete' && 'bg-green-500'
          )}
          aria-hidden="true"
        />
      );
    };

    return (
      <div
        role="treeitem"
        aria-expanded={hasChildren ? isExpanded : undefined}
      >
        {/* Node row */}
        <div
          className={cn(
            'group flex items-center gap-1.5 py-1 px-1 rounded',
            !isArchivedNode && 'hover:bg-muted/50 transition-colors',
            depth > 0 && 'ml-4',
            isCurrentPhase && 'bg-primary/10 border border-primary/30',
            isArchivedNode && 'opacity-60 cursor-default',
            !isArchivedNode && node.status === 'complete' && 'opacity-60'
          )}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && node.filepath) {
              e.preventDefault();
              openFile(node.filepath);
            }
            if (e.key === ' ' && hasChildren) {
              e.preventDefault();
              toggleNode(node.id);
            }
          }}
        >
          {/* Chevron for expandable nodes - click to expand/collapse */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="p-0.5 -m-0.5 rounded hover:bg-muted"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              <ChevronRight
                className={cn(
                  'w-4 h-4 transition-transform flex-shrink-0',
                  isExpanded && 'rotate-90'
                )}
              />
            </button>
          ) : (
            <div className="w-4" /> // Spacer for alignment
          )}

          <StatusDot status={node.status} />

          {/* Node label - click to open file in viewer */}
          <span
            onClick={(e) => {
              e.stopPropagation();
              if (node.filepath) {
                openFile(node.filepath);
              }
            }}
            className={cn(
              'text-sm flex-1 truncate',
              node.filepath && 'cursor-pointer hover:underline',
              node.status === 'complete' && 'text-muted-foreground'
            )}
          >
            {node.label}
          </span>

          {/* Play button for clickable nodes */}
          {isClickable && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleNodeClick}
                    disabled={isCommandRunning}
                    className={cn(
                      "p-1 rounded hover:bg-muted",
                      "opacity-0 group-hover:opacity-100 transition-opacity",
                      isCommandRunning && "opacity-50 cursor-not-allowed"
                    )}
                    aria-label={`Execute ${getCommandLabel(command!)}`}
                  >
                    <Play className="w-4 h-4 text-primary" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" align="center">
                  <code className="text-xs">{command}</code>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Progress for milestones and phases (x/total format only) */}
          {node.progress && (
            <span className="text-xs text-muted-foreground">
              {node.progress.completed}/{node.progress.total}
            </span>
          )}
        </div>

        {/* Recursive children with connector lines */}
        {hasChildren && isExpanded && (
          <div role="group" className="relative">
            {/* Vertical connector line */}
            <div className="absolute left-[11px] top-0 bottom-2 w-px bg-border" />

            {node.children!.map((child) => (
              <div key={child.id} className="relative">
                {/* Horizontal connector line */}
                <div className="absolute left-[11px] top-4 w-4 h-px bg-border" />
                <GSDTreeNode
                  node={child}
                  depth={depth + 1}
                  currentPhaseNumber={currentPhaseNumber}
                  projectPath={projectPath}
                  isArchived={isArchivedNode}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

GSDTreeNode.displayName = 'GSDTreeNode';
