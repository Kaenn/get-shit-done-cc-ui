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

      {/* Category List - 7 categories in logical workflow order */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <GSDCommandCategory
          category="project-setup"
          label="Project Setup"
          commands={commandsByCategory['project-setup']}
        />
        <GSDCommandCategory
          category="phase-lifecycle"
          label="Phase Lifecycle"
          commands={commandsByCategory['phase-lifecycle']}
        />
        <GSDCommandCategory
          category="roadmap-ops"
          label="Roadmap Operations"
          commands={commandsByCategory['roadmap-ops']}
        />
        <GSDCommandCategory
          category="milestone-ops"
          label="Milestone Operations"
          commands={commandsByCategory['milestone-ops']}
        />
        <GSDCommandCategory
          category="quick-work"
          label="Quick Work"
          commands={commandsByCategory['quick-work']}
        />
        <GSDCommandCategory
          category="navigation"
          label="Navigation"
          commands={commandsByCategory.navigation}
        />
        <GSDCommandCategory
          category="configuration"
          label="Configuration"
          commands={commandsByCategory.configuration}
        />
      </div>
    </div>
  );
}
