import Phaser from 'phaser';

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

    // TODO: Load actual game assets here
    // this.load.image('station', 'assets/tilemaps/station.png');
    // this.load.tilemapTiledJSON('station-map', 'assets/tilemaps/station.json');
    // this.load.spritesheet('player', 'assets/characters/player.png', { frameWidth: 32, frameHeight: 48 });
  }

  create() {
    this.scene.start('GameScene');
  }
}
