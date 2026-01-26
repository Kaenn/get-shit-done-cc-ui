/**
 * GSD command panel container
 * Displays all GSD commands grouped by category
 */

import { Eye, EyeOff } from 'lucide-react';
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
      {/* Minimal header - just toggle button */}
      <div className="flex items-center justify-end px-2 py-1 border-b border-border">
        <button
          onClick={toggleShowInactiveCommands}
          className={cn(
            "p-1 rounded hover:bg-muted transition-colors",
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
