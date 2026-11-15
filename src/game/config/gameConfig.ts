import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { GameScene } from '../scenes/GameScene';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export function createGameConfig(parent: string): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#0a0e27',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        // Debug boxes are drawn with Graphics every frame; keep them off (F2 shows the floor map in dev).
        debug: false,
      },
    },
    scene: [BootScene, GameScene],
    // Cap at 60 fps: on 120/144 Hz monitors the loop would otherwise run 2× more often for nothing.
    fps: { target: 60, limit: 60 },
    // The canvas is drawn at the real size of its box on screen (no extra browser
    // stretching), and pixel art is scaled with nearest-neighbour so it stays sharp.
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.NO_CENTER,
    },
    pixelArt: true,
    roundPixels: true,
  };
}
