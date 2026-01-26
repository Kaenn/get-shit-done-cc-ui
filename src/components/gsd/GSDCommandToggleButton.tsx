/**
 * Toggle button to show/hide GSD command panel
 * Appears on the left edge when panel is collapsed
 */

import { LayoutPanelLeft } from 'lucide-react';
import { useGSDStore } from '@/stores/gsdStore';
import { cn } from '@/lib/utils';

export function GSDCommandToggleButton() {
  const { toggleCommandPanel } = useGSDStore();

  return (
    <button
      onClick={toggleCommandPanel}
      className={cn(
        "fixed left-0 top-1/2 -translate-y-1/2 z-50",
        "flex items-center justify-center",
        "w-6 h-16 rounded-r-md",
        "bg-primary/10 hover:bg-primary/20",
        "border border-l-0 border-border",
        "text-muted-foreground hover:text-foreground",
        "transition-all duration-200",
        "shadow-sm hover:shadow-md",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      )}
      title="Show Command Panel"
      aria-label="Show Command Panel"
    >
      <LayoutPanelLeft className="w-4 h-4" />
    </button>
  );
}
