import Phaser from 'phaser';
import { SHIP_BG_KEY, SHIP_BG_URL, SPACE_BG_KEY, SPACE_BG_URL } from '../world/shipLayout';
import { CHARACTER_SPRITES, SPRITE_FRAME_H, SPRITE_FRAME_W } from '../world/characterSprites';
import { buildModularAstronauts, preloadModularAstronaut } from '../world/modularAstronaut';

/** Longest wait for the game font before starting anyway with the fallback font (ms). */
const FONT_WAIT_MS = 2500;

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const { width, height } = this.cameras.main;
    const barWidth = 320;
    const barHeight = 20;
    const x = (width - barWidth) / 2;
    const y = height / 2;

    const bg = this.add.graphics();
    bg.fillStyle(0x1a2340, 1);
    bg.fillRoundedRect(x, y, barWidth, barHeight, 4);

    const bar = this.add.graphics();

    this.load.on('progress', (value: number) => {
      bar.clear();
      bar.fillStyle(0x3b82f6, 1);
      bar.fillRoundedRect(x + 2, y + 2, (barWidth - 4) * value, barHeight - 4, 3);
    });

    this.load.on('complete', () => {
      bg.destroy();
      bar.destroy();
    });

    // Station illustration provided by the team (magenta key removed)
    this.load.image(SHIP_BG_KEY, SHIP_BG_URL);
    this.load.image(SPACE_BG_KEY, SPACE_BG_URL);

    for (const sprite of Object.values(CHARACTER_SPRITES)) {
      this.load.spritesheet(sprite.key, sprite.url, { frameWidth: SPRITE_FRAME_W, frameHeight: SPRITE_FRAME_H });
    }
    preloadModularAstronaut(this);
  }

  create() {
    buildModularAstronauts(this);
    // Canvas text is drawn once with whatever font is ready at that moment. Wait for Lexend
    // (bold weights used by the name labels), or at most FONT_WAIT_MS if it can't load (offline).
    const fontReady = Promise.all([document.fonts.load(`700 16px Lexend`), document.fonts.load(`400 16px Lexend`)]);
    const timeout = new Promise((resolve) => setTimeout(resolve, FONT_WAIT_MS));
    void Promise.race([fontReady, timeout])
      .catch(() => undefined)
      .then(() => this.scene.start('GameScene'));
  }
}
