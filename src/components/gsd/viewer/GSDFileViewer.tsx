/**
 * Main file viewer container
 * Displays tabbed interface for viewing markdown files with frontmatter
 */

import { X, FolderOpen, FileText } from 'lucide-react';
import { useGSDStore } from '@/stores/gsdStore';
import { cn } from '@/lib/utils';
import { GSDViewerTabs } from './GSDViewerTabs';
import { GSDFileContent } from './GSDFileContent';
import { TooltipProvider } from '@/components/ui/tooltip';

export function GSDFileViewer() {
  const { openTabs, activeTabId, togglePanel } = useGSDStore();

  // Find active tab
  const activeTab = openTabs.find(t => t.id === activeTabId);

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col bg-background border-l border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Viewer</h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Close Button */}
            <button
              onClick={togglePanel}
              className={cn(
                "p-1 rounded-sm",
                "text-muted-foreground hover:text-foreground",
                "hover:bg-muted",
                "transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              )}
              title="Hide Panel"
              aria-label="Hide Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <GSDViewerTabs />

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          {openTabs.length === 0 ? (
            <EmptyState />
          ) : activeTab ? (
            <GSDFileContent tab={activeTab} />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <FolderOpen className="w-12 h-12 text-muted-foreground/50 mb-3" />
      <p className="text-sm text-muted-foreground mb-1">No files open</p>
      <p className="text-xs text-muted-foreground/70">
        Click a file in the State tree to view it
      </p>
    </div>
  );
}
