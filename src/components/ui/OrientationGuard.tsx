import './OrientationGuard.css';

/** Blocks the game only on touch-first phones held in portrait mode. */
export function OrientationGuard() {
  return (
    <div className="orientation-guard" role="alert" aria-live="assertive">
      <div className="orientation-guard__phone" aria-hidden="true">
        <span />
      </div>
      <h2>Rotate your phone</h2>
      <p>Aurora Station works best horizontally. Turn your device to continue the mission.</p>
      <div className="orientation-guard__arrow" aria-hidden="true">↻</div>
    </div>
  );
}
