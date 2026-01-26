/**
 * GSD state panel placeholder
 * Shows placeholder for Phase 9 State Tree implementation
 */

import { FolderTree } from 'lucide-react';

export function GSDStatePanel() {
  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center gap-2 mb-4">
        <FolderTree className="w-5 h-5 text-primary" />
        <h2 className="text-sm font-semibold">State Tree</h2>
      </div>
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        <p>State tree coming in Phase 9</p>
      </div>
    </div>
  );
}
