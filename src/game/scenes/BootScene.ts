import Phaser from 'phaser';
import { SHIP_BG_KEY, SHIP_BG_URL, SPACE_BG_KEY, SPACE_BG_URL } from '../world/shipLayout';
import { CHARACTER_SPRITES, SPRITE_FRAME_H, SPRITE_FRAME_W } from '../world/characterSprites';
import { buildModularAstronauts, preloadModularAstronaut } from '../world/modularAstronaut';

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
    this.scene.start('GameScene');
  }
}
