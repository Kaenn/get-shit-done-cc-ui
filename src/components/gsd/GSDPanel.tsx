/**
 * Main GSD panel container
 * Wraps content with resizable three-pane layout
 */

import React from 'react';
import { useGSDStore } from '@/stores/gsdStore';
import { ThreePane } from '@/components/ui/three-pane';
import { GSDCommandPanel } from './GSDCommandPanel';
import { GSDStatePanel } from './GSDStatePanel';
import { GSDIconSidebar } from './GSDIconSidebar';
import { GSDPanelContent } from './GSDPanelContent';
import { GSDToggleButton } from './GSDToggleButton';
import { GSDCommandToggleButton } from './GSDCommandToggleButton';
import { GSDCommandDialog } from './GSDCommandDialog';

interface GSDPanelProps {
  children: React.ReactNode;
}

/**
 * GSD panel wrapper for tab content
 * Shows three-pane layout: command panel (left), content (center), status panel (right)
 * Toggle buttons appear when panels are collapsed
 */
export function GSDPanel({ children }: GSDPanelProps) {
  const {
    isPanelVisible,
    panelWidth,
    setPanelWidth,
    isCommandPanelVisible,
    commandPanelWidth,
    setCommandPanelWidth,
    sidebarActiveView,
    hasHydrated,
  } = useGSDStore();

  // Wait for hydration to avoid flash
  if (!hasHydrated) {
    return <>{children}</>;
  }

  return (
    <>
      <ThreePane
        left={
          <div className="flex h-full">
            <GSDIconSidebar />
            <div className="flex-1 overflow-hidden">
              {sidebarActiveView === 'commands' ? (
                <GSDCommandPanel />
              ) : (
                <GSDStatePanel />
              )}
            </div>
          </div>
        }
        center={children}
        right={<GSDPanelContent />}
        leftWidth={commandPanelWidth}
        rightWidth={panelWidth}
        showLeft={isCommandPanelVisible}
        showRight={isPanelVisible}
        minLeftWidth={200}
        minCenterWidth={400}
        minRightWidth={200}
        onLeftWidthChange={setCommandPanelWidth}
        onRightWidthChange={setPanelWidth}
      />
      {!isCommandPanelVisible && <GSDCommandToggleButton />}
      {!isPanelVisible && <GSDToggleButton />}
      <GSDCommandDialog />
    </>
  );
}
