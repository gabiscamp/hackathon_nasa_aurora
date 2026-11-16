import { t as localize } from '../../i18n/translate';
import { useEffect, useRef, type PointerEvent } from 'react';
import { EVENTS, gameEvents } from '../../game/events';

type Direction = 'up' | 'down' | 'left' | 'right';

const DIRECTIONS: { direction: Direction; label: string; symbol: string }[] = [
  { direction: 'up', label: 'Move up', symbol: '▲' },
  { direction: 'left', label: 'Move left', symbol: '◀' },
  { direction: 'down', label: 'Move down', symbol: '▼' },
  { direction: 'right', label: 'Move right', symbol: '▶' },
];

export function TouchControls({ onOpenMap }: { onOpenMap: () => void }) {
  const active = useRef(new Map<number, Direction>());

  useEffect(() => {
    const clear = () => {
      active.current.clear();
      gameEvents.emit(EVENTS.TOUCH_MOVE, { x: 0, y: 0 });
    };
    window.addEventListener('blur', clear);
    document.addEventListener('visibilitychange', clear);
    gameEvents.on(EVENTS.MENU_OPENED, clear);
    return () => {
      clear();
      window.removeEventListener('blur', clear);
      document.removeEventListener('visibilitychange', clear);
      gameEvents.off(EVENTS.MENU_OPENED, clear);
    };
  }, []);

  const publish = () => {
    const directions = new Set(active.current.values());
    gameEvents.emit(EVENTS.TOUCH_MOVE, {
      x: Number(directions.has('right')) - Number(directions.has('left')),
      y: Number(directions.has('down')) - Number(directions.has('up')),
    });
  };
  const start = (event: PointerEvent<HTMLButtonElement>, direction: Direction) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    active.current.set(event.pointerId, direction);
    publish();
  };
  const stop = (event: PointerEvent<HTMLButtonElement>) => {
    active.current.delete(event.pointerId);
    publish();
  };

  return (
    <div className="touch-controls" aria-label={localize("Touch controls")}>
      <div className="touch-controls__directions" aria-label={localize("Movement")}>
        {localize(DIRECTIONS.map(({ direction, label, symbol }) => (
          <button key={direction} type="button" className={`touch-controls__direction touch-controls__direction--${direction}`}
            aria-label={localize(label)} onPointerDown={(event) => start(event, direction)}
            onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}>
            {localize(symbol)}
          </button>
        )))}
      </div>
      <div className="touch-controls__actions">
        <button type="button" className="touch-controls__map" onClick={onOpenMap}>{localize("Map")}</button>
        <button type="button" className="touch-controls__interact" onClick={() => gameEvents.emit(EVENTS.INTERACT)}>{localize("Interact")}</button>
      </div>
    </div>
  );
}
