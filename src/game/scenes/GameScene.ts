import Phaser from 'phaser';
import { gameEvents, EVENTS } from '../events';

const PLAYER_SPEED = 160;
const PLAYER_SIZE = 28;

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private playerBody!: Phaser.Physics.Arcade.Body;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Space background
    this.cameras.main.setBackgroundColor('#0a0e27');

    // Placeholder station outline
    const stationWidth = 800;
    const stationHeight = 500;
    const sx = (width - stationWidth) / 2;
    const sy = (height - stationHeight) / 2;

    // Station hull (placeholder)
    const hull = this.add.graphics();
    hull.fillStyle(0x706558, 1);
    hull.fillRoundedRect(sx, sy, stationWidth, stationHeight, 24);
    hull.lineStyle(2, 0x8b7b6b, 1);
    hull.strokeRoundedRect(sx, sy, stationWidth, stationHeight, 24);

    // Station floor
    const floor = this.add.graphics();
    floor.fillStyle(0x9a8f82, 1);
    floor.fillRoundedRect(sx + 16, sy + 16, stationWidth - 32, stationHeight - 32, 16);

    // Room dividers (placeholder grid)
    const dividers = this.add.graphics();
    dividers.lineStyle(3, 0x706558, 0.8);
    // Horizontal divider
    dividers.lineBetween(sx + 16, sy + stationHeight * 0.45, sx + stationWidth - 16, sy + stationHeight * 0.45);
    // Vertical dividers
    dividers.lineBetween(sx + stationWidth * 0.33, sy + 16, sx + stationWidth * 0.33, sy + stationHeight - 16);
    dividers.lineBetween(sx + stationWidth * 0.66, sy + 16, sx + stationWidth * 0.66, sy + stationHeight - 16);

    // Room labels
    const labelStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '12px',
      color: '#706558',
      fontFamily: 'Nunito, sans-serif',
    };
    this.add.text(sx + 40, sy + 24, 'BRIDGE', labelStyle);
    this.add.text(sx + stationWidth * 0.35, sy + 24, 'LAB', labelStyle);
    this.add.text(sx + stationWidth * 0.68, sy + 24, 'QUARTERS', labelStyle);
    this.add.text(sx + 40, sy + stationHeight * 0.48, 'ENGINEERING', labelStyle);
    this.add.text(sx + stationWidth * 0.35, sy + stationHeight * 0.48, 'MEDICAL', labelStyle);
    this.add.text(sx + stationWidth * 0.68, sy + stationHeight * 0.48, 'STORAGE', labelStyle);

    // Player character (placeholder circle + direction indicator)
    this.player = this.add.container(width / 2, height / 2);

    const body = this.add.graphics();
    body.fillStyle(0x3b82f6, 1);
    body.fillCircle(0, 0, PLAYER_SIZE / 2);
    body.lineStyle(2, 0xe2e8f0, 1);
    body.strokeCircle(0, 0, PLAYER_SIZE / 2);

    const directionDot = this.add.graphics();
    directionDot.fillStyle(0xe2e8f0, 1);
    directionDot.fillCircle(0, -PLAYER_SIZE / 2 + 4, 4);

    this.player.add([body, directionDot]);

    // Physics
    this.physics.world.enable(this.player);
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setCircle(PLAYER_SIZE / 2, -PLAYER_SIZE / 2, -PLAYER_SIZE / 2);
    this.playerBody.setCollideWorldBounds(true);

    // Constrain to station area
    this.physics.world.setBounds(
      sx + 20,
      sy + 20,
      stationWidth - 40,
      stationHeight - 40,
    );

    // NPC placeholders
    this.createNPC(sx + stationWidth * 0.5, sy + stationHeight * 0.6, 0xf5a623, 'Kira');
    this.createNPC(sx + stationWidth * 0.5, sy + stationHeight * 0.75, 0x2ecc71, 'Leo');
    this.createNPC(sx + stationWidth * 0.35 + 60, sy + 100, 0x8b5cf6, 'Maya');

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      E: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E),
    };

    // Camera
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1);

    gameEvents.emit(EVENTS.ENTER_ROOM, 'bridge');
  }

  private createNPC(x: number, y: number, color: number, name: string) {
    const npc = this.add.container(x, y);

    const circle = this.add.graphics();
    circle.fillStyle(color, 1);
    circle.fillCircle(0, 0, 14);
    circle.lineStyle(2, 0xe2e8f0, 1);
    circle.strokeCircle(0, 0, 14);

    const label = this.add.text(0, -24, name, {
      fontSize: '11px',
      color: '#e2e8f0',
      fontFamily: 'Nunito, sans-serif',
    }).setOrigin(0.5);

    npc.add([circle, label]);
    npc.setData('name', name);
  }

  update() {
    const up = this.cursors.up.isDown || this.wasd.W.isDown;
    const down = this.cursors.down.isDown || this.wasd.S.isDown;
    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;

    let vx = 0;
    let vy = 0;

    if (left) vx = -PLAYER_SPEED;
    else if (right) vx = PLAYER_SPEED;

    if (up) vy = -PLAYER_SPEED;
    else if (down) vy = PLAYER_SPEED;

    // Normalize diagonal
    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }

    this.playerBody.setVelocity(vx, vy);

    // Rotate direction indicator
    if (vx !== 0 || vy !== 0) {
      const angle = Math.atan2(vy, vx) - Math.PI / 2;
      this.player.setRotation(angle);
    }
  }
}
