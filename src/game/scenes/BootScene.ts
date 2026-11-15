import Phaser from 'phaser';
import { SPACE_BG_KEY, SPACE_BG_URL, type PieceKey } from '../world/shipLayout';
import { STATION_TEXTURE_URLS, stationTextureKey } from '../world/stationAssets';
import { CHARACTER_SPRITES, SPRITE_FRAME_H, SPRITE_FRAME_W } from '../world/characterSprites';
import { buildModularAstronauts, preloadModularAstronaut } from '../world/modularAstronaut';

/** Longest wait for the game font before starting anyway with the fallback font (ms). */
const FONT_WAIT_MS = 2500;
export const ROBOT_TEXTURE_KEY = 'robot-keyed-source';
const ROBOT_SOURCE_KEY = 'robot-source';
const ROBOT_FRAME_WIDTH = 192;
const ROBOT_FRAME_HEIGHT = 256;

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

    // Station modules from the team's art (src/assets/Nave → scripts/build_station_assets.py)
    for (const [piece, url] of Object.entries(STATION_TEXTURE_URLS) as [PieceKey, string][]) {
      this.load.image(stationTextureKey(piece), url);
    }
    this.load.image(SPACE_BG_KEY, SPACE_BG_URL);

    for (const sprite of Object.values(CHARACTER_SPRITES)) {
      this.load.spritesheet(sprite.key, sprite.url, { frameWidth: SPRITE_FRAME_W, frameHeight: SPRITE_FRAME_H });
    }
    preloadModularAstronaut(this);
    this.load.image(ROBOT_SOURCE_KEY, '/assets/characters/robot.jpeg');
  }

  create() {
    buildModularAstronauts(this);
    this.buildRobotTexture();
    // Canvas text is drawn once with whatever font is ready at that moment. Wait for Lexend
    // (bold weights used by the name labels), or at most FONT_WAIT_MS if it can't load (offline).
    const fontReady = Promise.all([document.fonts.load(`700 16px Lexend`), document.fonts.load(`400 16px Lexend`)]);
    const timeout = new Promise((resolve) => setTimeout(resolve, FONT_WAIT_MS));
    void Promise.race([fontReady, timeout])
      .catch(() => undefined)
      .then(() => this.scene.start('GameScene'));
  }

  /** Converts the source sheet's magenta key to alpha without changing the original team asset. */
  private buildRobotTexture() {
    const source = this.textures.get(ROBOT_SOURCE_KEY).getSourceImage() as HTMLImageElement;
    const canvas = document.createElement('canvas');
    canvas.width = source.naturalWidth || source.width;
    canvas.height = source.naturalHeight || source.height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;
    context.drawImage(source, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let index = 0; index < pixels.data.length; index += 4) {
      const red = pixels.data[index];
      const green = pixels.data[index + 1];
      const blue = pixels.data[index + 2];
      if (red > 185 && blue > 130 && green < 105 && red > green * 1.8) pixels.data[index + 3] = 0;
    }
    context.putImageData(pixels, 0, 0);
    const keyedTexture = this.textures.addCanvas(ROBOT_TEXTURE_KEY, canvas);
    if (!keyedTexture) return;
    // Passing a Phaser Texture updates that same texture; Phaser deliberately ignores
    // the key argument in this overload. The sprite therefore uses ROBOT_TEXTURE_KEY.
    this.textures.addSpriteSheet('', keyedTexture, {
      frameWidth: ROBOT_FRAME_WIDTH,
      frameHeight: ROBOT_FRAME_HEIGHT,
    });
  }
}
