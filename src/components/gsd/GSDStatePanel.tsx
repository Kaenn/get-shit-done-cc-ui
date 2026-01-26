/**
 * GSD state panel - displays milestone/phase/plan tree
 * Integrates GSDTreeView for active milestones with built-in archived section
 */

import { FolderTree } from 'lucide-react';
import { useGSDStore } from '@/stores/gsdStore';
import { GSDTreeView } from './GSDTreeView';

export function GSDStatePanel() {
  const { treeData, isLoading, error, projectPath } = useGSDStore();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <FolderTree className="w-5 h-5 text-primary" />
        <h2 className="text-sm font-semibold">State Tree</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && (
          <div className="text-sm text-muted-foreground">Loading...</div>
        )}

        {error && (
          <div className="text-sm text-destructive">{error}</div>
        )}

        {!isLoading && !error && treeData.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-8">
            <p>No project data found.</p>
            <p className="mt-1 text-xs">
              Initialize GSD to see your project tree.
            </p>
          </div>
        )}

        {!isLoading && !error && treeData.length > 0 && (
          <GSDTreeView projectPath={projectPath} />
        )}
      </div>
    </div>
  );
}
