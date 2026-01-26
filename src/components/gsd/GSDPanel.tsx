/**
 * Main GSD panel container
 * Wraps content with resizable three-pane layout
 */

import React from 'react';
import { useGSDStore } from '@/stores/gsdStore';
import { ThreePane } from '@/components/ui/three-pane';
import { GSDCommandPanel } from './GSDCommandPanel';
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
    hasHydrated,
  } = useGSDStore();

  // Wait for hydration to avoid flash
  if (!hasHydrated) {
    return <>{children}</>;
  }

  return (
    <>
      <ThreePane
        left={<GSDCommandPanel />}
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
