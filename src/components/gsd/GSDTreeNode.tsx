/**
 * Recursive tree node component for GSD visualization
 * Renders milestones, phases, and plans with expand/collapse, status dots, and progress
 */

import React, { useMemo, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { cn } from '@/lib/utils';
import { useGSDStore } from '@/stores/gsdStore';
import { getMilestoneActionLinks, getPhaseActionLinks } from '@/lib/gsd/commands';
import { GSDActionLink } from './GSDActionLink';
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
    const { expandedNodes, toggleNode, openFile, openFiles, closeAllTabs, setViewerContext } = useGSDStore();
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    // Determine if this node or its ancestry is archived
    const isArchivedNode = node.archived || isArchived;

    // Highlight current phase
    const isCurrentPhase =
      node.type === 'phase' && node.id === `phase-${currentPhaseNumber}`;

    // Get action links for this node (milestones and phases only)
    const actionLinks = useMemo(() => {
      if (isArchivedNode) return [];
      if (node.type === 'milestone') {
        return getMilestoneActionLinks(node);
      }
      if (node.type === 'phase') {
        return getPhaseActionLinks(node, currentPhaseNumber);
      }
      return [];
    }, [node, currentPhaseNumber, isArchivedNode]);

    // Determine if node should show chevron (has children or action links)
    const hasExpandableContent = hasChildren || actionLinks.length > 0;

    // Determine if node is clickable (has context files or single filepath)
    const isClickable = (node.contextFiles && node.contextFiles.length > 0) || !!node.filepath;

    // Handle node click - filter existing files and open with tab reset
    const handleNodeClick = useCallback(async () => {
      // Set viewer context based on node label
      setViewerContext(node.label);

      if (node.contextFiles && node.contextFiles.length > 0) {
        try {
          // Filter to only files that exist
          const existingFiles = await invoke<string[]>('filter_existing_files', {
            filePaths: node.contextFiles,
          });
          if (existingFiles.length > 0) {
            // Clear existing tabs and open filtered files
            openFiles(existingFiles, true);
          } else {
            // No files exist - clear tabs to show empty state
            closeAllTabs();
          }
        } catch (err) {
          console.error('Failed to filter files:', err);
          // Fallback: try opening all files (errors will show in tabs)
          openFiles(node.contextFiles, true);
        }
      } else if (node.filepath) {
        openFile(node.filepath);
      }
    }, [node.contextFiles, node.filepath, node.label, openFile, openFiles, closeAllTabs, setViewerContext]);

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
        aria-expanded={hasExpandableContent ? isExpanded : undefined}
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
            if (e.key === 'Enter' && isClickable) {
              e.preventDefault();
              handleNodeClick();
            }
            if (e.key === ' ' && hasExpandableContent) {
              e.preventDefault();
              toggleNode(node.id);
            }
          }}
        >
          {/* Chevron for expandable nodes - click to expand/collapse */}
          {hasExpandableContent ? (
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

          {/* Status dot - hidden for archived nodes (always complete, no need to show) */}
          {!isArchivedNode && <StatusDot status={node.status} />}

          {/* Node label - click to open context files in viewer */}
          <span
            onClick={(e) => {
              e.stopPropagation();
              if (isClickable) {
                handleNodeClick();
              }
            }}
            className={cn(
              'text-sm flex-1 truncate',
              isClickable && 'cursor-pointer hover:underline',
              node.status === 'complete' && 'text-muted-foreground'
            )}
          >
            {node.label}
          </span>

          {/* Progress for milestones and phases (x/total format only) - hidden for archived */}
          {node.progress && !isArchivedNode && (
            <span className="text-xs text-muted-foreground">
              {node.progress.completed}/{node.progress.total}
            </span>
          )}
        </div>

        {/* Recursive children and action links with connector lines */}
        {hasExpandableContent && isExpanded && (
          <div role="group" className="relative">
            {/* Vertical connector line */}
            <div className="absolute left-[11px] top-0 bottom-2 w-px bg-border" />

            {/* Render child nodes */}
            {node.children?.map((child) => (
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

            {/* Render action links at the bottom */}
            {actionLinks.map((link) => (
              <div key={link.id} className="relative">
                {/* Horizontal connector line */}
                <div className="absolute left-[11px] top-2.5 w-4 h-px bg-border" />
                <GSDActionLink link={link} depth={depth + 1} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

GSDTreeNode.displayName = 'GSDTreeNode';
