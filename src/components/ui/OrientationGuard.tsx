import { t as localize } from '../../i18n/translate';
import { useEffect, useState } from 'react';
import './OrientationGuard.css';

function shouldRequestRotation() {
  if (typeof window === 'undefined') return false;

  const isPortrait = window.matchMedia('(orientation: portrait)').matches || window.innerHeight > window.innerWidth;
  const hasTouch = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  const shortScreenSide = Math.min(window.screen.width, window.screen.height);
  const looksLikePhone = shortScreenSide <= 760;

  return hasTouch && looksLikePhone && isPortrait;
}

/** Blocks touch-first phones in portrait and releases the game as soon as they rotate. */
export function OrientationGuard() {
  const [rotationNeeded, setRotationNeeded] = useState(shouldRequestRotation);

  useEffect(() => {
    const orientationQuery = window.matchMedia('(orientation: portrait)');
    let frame = 0;
    let settleTimer = 0;

    const updateOrientation = () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settleTimer);
      frame = window.requestAnimationFrame(() => setRotationNeeded(shouldRequestRotation()));
      // Some mobile browsers update innerWidth/innerHeight after the orientation event.
      settleTimer = window.setTimeout(() => setRotationNeeded(shouldRequestRotation()), 300);
    };

    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);
    window.visualViewport?.addEventListener('resize', updateOrientation);
    window.screen.orientation?.addEventListener('change', updateOrientation);
    orientationQuery.addEventListener('change', updateOrientation);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settleTimer);
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
      window.visualViewport?.removeEventListener('resize', updateOrientation);
      window.screen.orientation?.removeEventListener('change', updateOrientation);
      orientationQuery.removeEventListener('change', updateOrientation);
    };
  }, []);

  return (
    <div
      className={`orientation-guard${rotationNeeded ? ' is-active' : ''}`}
      role="alert"
      aria-live="assertive"
      aria-hidden={!rotationNeeded}
    >
      <div className="orientation-guard__phone" aria-hidden="true">
        <span />
      </div>
      <h2>{localize("Rotate your phone")}</h2>
      <p>{localize("Aurora Station works best horizontally. Turn your device to continue the mission.")}</p>
      <div className="orientation-guard__arrow" aria-hidden="true">↻</div>
    </div>
  );
}
