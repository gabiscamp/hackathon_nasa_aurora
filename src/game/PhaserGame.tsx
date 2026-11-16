import { useLayoutEffect, useRef } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from './config/gameConfig';

interface PhaserGameProps {
  className?: string;
}

/** Only one Phaser game may exist: a second one on the same page draws nothing (blank station). */
let liveGame: Phaser.Game | null = null;

export function PhaserGame({ className }: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  // Layout effect: its cleanup runs BEFORE React takes the canvas off the page. With a normal
  // effect, Phaser would see a 0×0 box for a frame and fail to resize ("Framebuffer incomplete").
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || gameRef.current) return;

    // A game left from an earlier mount (React hid and showed the screen again): remove it
    // and its canvas now, not on its next frame, which may never come.
    if (liveGame) {
      liveGame.destroy(true);
      liveGame = null;
    }
    container.querySelectorAll('canvas').forEach((c) => c.remove());

    const config = createGameConfig(container.id);
    const game = new Phaser.Game(config);
    gameRef.current = game;
    liveGame = game;
    // Dev only: lets Playwright QA scripts read the game state (skill game-qa-visual-testing).
    if (import.meta.env.DEV) (window as unknown as { __game?: Phaser.Game }).__game = game;

    return () => {
      game.destroy(true);
      if (liveGame === game) liveGame = null;
      gameRef.current = null;
      container.querySelectorAll('canvas').forEach((c) => c.remove());
    };
  }, []);

  return (
    <div
      id="phaser-container"
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
