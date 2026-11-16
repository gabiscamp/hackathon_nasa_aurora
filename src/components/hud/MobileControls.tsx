import { t as localize } from '../../i18n/translate';
import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { gameEvents, EVENTS, type TouchMovePayload } from '../../game/events';
import { MapIcon } from './HudIcons';
import './MobileControls.css';

type Direction = keyof TouchMovePayload;

const EMPTY_MOVE: TouchMovePayload = { up: false, down: false, left: false, right: false };

/** Thumb controls used on coarse-pointer phones in landscape mode. */
export function MobileControls() {
  const pointers = useRef(new Map<number, Direction>());

  const emitMove = () => {
    const next = { ...EMPTY_MOVE };
    for (const direction of pointers.current.values()) next[direction] = true;
    gameEvents.emit(EVENTS.TOUCH_MOVE, next);
  };

  const press = (direction: Direction) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, direction);
    emitMove();
  };

  const release = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    pointers.current.delete(event.pointerId);
    emitMove();
  };

  useEffect(() => {
    const reset = () => {
      pointers.current.clear();
      gameEvents.emit(EVENTS.TOUCH_MOVE, EMPTY_MOVE);
    };
    window.addEventListener('blur', reset);
    document.addEventListener('visibilitychange', reset);
    return () => {
      window.removeEventListener('blur', reset);
      document.removeEventListener('visibilitychange', reset);
      reset();
    };
  }, []);

  const directionButton = (direction: Direction, label: string, arrow: string) => (
    <button
      type="button"
      className={`mobile-control mobile-control--${direction}`}
      aria-label={localize(label)}
      onPointerDown={press(direction)}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
    >
      <span aria-hidden="true">{localize(arrow)}</span>
    </button>
  );

  return (
    <div className="mobile-controls" aria-label={localize("Touch game controls")}>
      <div className="mobile-dpad" aria-label={localize("Move astronaut")}>
        {localize(directionButton('up', 'Move up', '▲'))}
        {localize(directionButton('left', 'Move left', '◀'))}
        <span className="mobile-dpad__center" aria-hidden="true" />
        {localize(directionButton('right', 'Move right', '▶'))}
        {localize(directionButton('down', 'Move down', '▼'))}
      </div>

      <div className="mobile-actions">
        <button
          type="button"
          className="mobile-action mobile-action--map"
          onClick={() => gameEvents.emit(EVENTS.OPEN_MAP)}
          aria-label={localize("Open station map")}
        >
          <MapIcon size={22} />
          <span>{localize("Map")}</span>
        </button>
        <button
          type="button"
          className="mobile-action mobile-action--interact"
          onPointerDown={(event) => {
            event.preventDefault();
            gameEvents.emit(EVENTS.TOUCH_INTERACT);
          }}
          aria-label={localize("Interact with nearby mission or robot")}
        >
          <strong>!</strong>
          <span>{localize("Use")}</span>
        </button>
      </div>
    </div>
  );
}
