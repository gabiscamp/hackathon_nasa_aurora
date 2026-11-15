import { useGameStore } from '../../stores/useGameStore';
import { PlayerStatus } from './PlayerStatus';
import { ObjectiveTracker } from './ObjectiveTracker';
import { InventoryBar } from './InventoryBar';
import { Minimap } from './Minimap';
import { LocationHint } from './LocationHint';
import './Hud.css';

/** In-game HUD overlay, laid out like references/wireframe/spaceship-reference-02.png. */
export function Hud() {
  const phase = useGameStore((s) => s.phase);
  // The decision card and dialogue box sit at the bottom, so the hotbar steps aside.
  const bottomBusy = phase === 'decision' || phase === 'result';

  return (
    <div className="hud">
      <PlayerStatus />
      <ObjectiveTracker />
      {!bottomBusy && <InventoryBar />}
      <LocationHint />
      <Minimap />
    </div>
  );
}
