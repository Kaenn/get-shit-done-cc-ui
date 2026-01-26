/**
 * GSD command panel container
 * Displays all GSD commands grouped by category
 */

import { FolderOpen, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCommandsByCategory } from '@/lib/gsd/command-registry';
import { useGSDStore } from '@/stores/gsdStore';
import { GSDCommandCategory } from './GSDCommandCategory';

export function GSDCommandPanel() {
  const { showInactiveCommands, toggleShowInactiveCommands } = useGSDStore();

  // Get commands grouped by category
  const commandsByCategory = getCommandsByCategory();

  return (
    <div className={cn(
      "flex flex-col h-full bg-background border-r border-border"
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
        <FolderOpen className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold">Commands</h2>

        {/* Inactive toggle button */}
        <button
          onClick={toggleShowInactiveCommands}
          className={cn(
            "ml-auto p-1 rounded hover:bg-muted transition-colors",
            "text-muted-foreground hover:text-foreground"
          )}
          title={showInactiveCommands ? "Hide inactive commands" : "Show inactive commands"}
          aria-label={showInactiveCommands ? "Hide inactive commands" : "Show inactive commands"}
        >
          {showInactiveCommands ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Category List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <GSDCommandCategory
          category="plan"
          label="Planning"
          commands={commandsByCategory.plan}
        />
        <GSDCommandCategory
          category="execute"
          label="Execution"
          commands={commandsByCategory.execute}
        />
        <GSDCommandCategory
          category="settings"
          label="Settings"
          commands={commandsByCategory.settings}
        />
      </div>
    </div>
  );
}
