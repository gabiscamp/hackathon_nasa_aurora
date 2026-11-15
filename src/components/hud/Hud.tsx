import { useCallback, useEffect, useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { PlayerStatus } from './PlayerStatus';
import { ObjectiveTracker } from './ObjectiveTracker';
import { InventoryBar } from './InventoryBar';
import { Minimap } from './Minimap';
import { LocationHint } from './LocationHint';
import { ShipMapOverlay } from './ShipMapOverlay';
import './Hud.css';

/** In-game HUD overlay, laid out like references/wireframe/spaceship-reference-02.png. */
export function Hud() {
  const phase = useGameStore((s) => s.phase);
  const [mapOpen, setMapOpen] = useState(false);
  const closeMap = useCallback(() => setMapOpen(false), []);
  // The decision card and dialogue box sit at the bottom, so the hotbar steps aside.
  const bottomBusy = phase === 'decision' || phase === 'result';

  useEffect(() => {
    if (mapOpen) return; // the open map handles its own keys
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'm' || e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, [contenteditable="true"]')) return;
      // Another window (pause menu, dialog) is on top: don't stack the map over it.
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
      setMapOpen(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mapOpen]);

  return (
    <div className="hud">
      <PlayerStatus />
      <ObjectiveTracker />
      {!bottomBusy && <InventoryBar />}
      <LocationHint />
      <Minimap onOpen={() => setMapOpen(true)} />
      {/* The station image is AI-generated: team briefing rule = visible watermark while it is on screen. */}
      <span className="hud-ai-mark">AI-generated map</span>
      {mapOpen && <ShipMapOverlay onClose={closeMap} />}
    </div>
  );
}
