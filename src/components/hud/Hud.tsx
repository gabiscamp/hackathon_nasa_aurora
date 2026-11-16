import { useCallback, useEffect, useState } from 'react';
import { PlayerStatus } from './PlayerStatus';
import { ObjectiveTracker } from './ObjectiveTracker';
import { Minimap } from './Minimap';
import { LocationHint } from './LocationHint';
import { ShipMapOverlay } from './ShipMapOverlay';
import { gameEvents, EVENTS } from '../../game/events';
import './Hud.css';

/** In-game HUD overlay, laid out like references/wireframe/spaceship-reference-02.png. */
export function Hud() {
  const [mapOpen, setMapOpen] = useState(false);
  const closeMap = useCallback(() => setMapOpen(false), []);

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

  useEffect(() => {
    const openMap = () => {
      if (!document.querySelector('[role="dialog"], [role="alertdialog"]')) setMapOpen(true);
    };
    gameEvents.on(EVENTS.OPEN_MAP, openMap);
    return () => void gameEvents.off(EVENTS.OPEN_MAP, openMap);
  }, []);

  return (
    <div className="hud">
      {/* Desktop: display:contents (each panel keeps its corner). Phone: one stacked column at the top. */}
      <div className="hud-top">
        <ObjectiveTracker />
        <PlayerStatus />
      </div>
      <LocationHint />
      <Minimap onOpen={() => setMapOpen(true)} />
      {/* The station image is AI-generated: team briefing rule = visible watermark while it is on screen. */}
      <span className="hud-ai-mark">AI-generated map</span>
      {mapOpen && <ShipMapOverlay onClose={closeMap} />}
    </div>
  );
}
