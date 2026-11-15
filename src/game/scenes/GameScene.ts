import Phaser from 'phaser';
import { gameEvents, EVENTS } from '../events';
import {
  SHIP_BG_KEY,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  SPACE_MASK_COLOR,
  WALKABLE_AREAS,
  HUD_RECT_MASKS,
  HUD_CIRCLE_MASKS,
  BAKED_CHARACTER_PATCHES,
  PLAYER_SPAWN,
  NPC_SPAWNS,
  isBoxWalkable,
  roomAt,
  type RoomId,
} from '../world/shipLayout';

const PLAYER_SPEED = 160;
const PLAYER_SIZE = 28;
/** Half extents of the player's feet box used for walkability checks (world px). */
const FEET_HALF_W = 10;
const FEET_HALF_H = 5;
/** Minimum time between PLAYER_MOVED events sent to the React HUD (ms). */
const POSITION_EMIT_INTERVAL = 80;

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private playerBody!: Phaser.Physics.Arcade.Body;
  private directionDot!: Phaser.GameObjects.Graphics;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private walkableDebug: Phaser.GameObjects.Graphics | null = null;
  private currentRoom: RoomId | null = null;
  private lastPositionEmit = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0e27');

    this.createShipBackground();
    this.createPlayer();

    this.createNPC(NPC_SPAWNS.kira.x, NPC_SPAWNS.kira.y, 0xf5a623, 'Kira');
    this.createNPC(NPC_SPAWNS.leo.x, NPC_SPAWNS.leo.y, 0x2ecc71, 'Leo');
    this.createNPC(NPC_SPAWNS.maya.x, NPC_SPAWNS.maya.y, 0x8b5cf6, 'Maya');

    // Input — WASD and arrows work simultaneously
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      E: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E),
    };

    // Dev-only: F2 toggles the walkable-area overlay
    if (import.meta.env.DEV) {
      this.input.keyboard!.on('keydown-F2', () => this.toggleWalkableDebug());
    }

    // Camera: whole ship visible, as in the reference
    const camera = this.cameras.main;
    camera.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    // Fit the whole 1600×900 reference into the 1280×720 canvas (zoom 0.8)
    camera.setZoom(Math.min(this.scale.width / WORLD_WIDTH, this.scale.height / WORLD_HEIGHT));
    camera.centerOn(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);

    this.updateRoom();
    this.emitPosition(true);
  }

  /** TODO: replace with real asset — reference illustration used as the map base. */
  private createShipBackground() {
    this.add.image(0, 0, SHIP_BG_KEY).setOrigin(0, 0).setDepth(0);

    // Cover the character painted into the reference with nearby floor
    for (const patch of BAKED_CHARACTER_PATCHES) {
      this.add
        .image(-patch.dx, -patch.dy, SHIP_BG_KEY)
        .setOrigin(0, 0)
        .setCrop(patch.x + patch.dx, patch.y + patch.dy, patch.w, patch.h)
        .setDepth(1);
    }

    // Hide the HUD painted into the reference (the real HUD is React)
    const masks = this.add.graphics().setDepth(2);
    masks.fillStyle(SPACE_MASK_COLOR, 1);
    for (const r of HUD_RECT_MASKS) masks.fillRect(r.x, r.y, r.w, r.h);
    for (const c of HUD_CIRCLE_MASKS) masks.fillCircle(c.x, c.y, c.r);
  }

  private createPlayer() {
    // TODO: replace with real asset — placeholder until the commander spritesheet exists
    this.player = this.add.container(PLAYER_SPAWN.x, PLAYER_SPAWN.y).setDepth(10);

    const body = this.add.graphics();
    body.fillStyle(0x3b82f6, 1);
    body.fillCircle(0, -PLAYER_SIZE / 2, PLAYER_SIZE / 2);
    body.lineStyle(2, 0xe2e8f0, 1);
    body.strokeCircle(0, -PLAYER_SIZE / 2, PLAYER_SIZE / 2);

    // Drawn around the circle's center so rotating it orbits the dot around the body
    this.directionDot = this.add.graphics({ x: 0, y: -PLAYER_SIZE / 2 });
    this.directionDot.fillStyle(0xe2e8f0, 1);
    this.directionDot.fillCircle(0, -PLAYER_SIZE / 2 + 4, 4);

    this.player.add([body, this.directionDot]);

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.physics.world.enable(this.player);
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setSize(FEET_HALF_W * 2, FEET_HALF_H * 2);
    this.playerBody.setOffset(-FEET_HALF_W, -FEET_HALF_H);
    this.playerBody.setCollideWorldBounds(true);
  }

  private createNPC(x: number, y: number, color: number, name: string) {
    // TODO: replace with real asset — crew placeholder
    const npc = this.add.container(x, y).setDepth(9);

    const circle = this.add.graphics();
    circle.fillStyle(color, 1);
    circle.fillCircle(0, -14, 14);
    circle.lineStyle(2, 0xe2e8f0, 1);
    circle.strokeCircle(0, -14, 14);

    const label = this.add
      .text(0, -40, name, {
        fontSize: '14px',
        color: '#f0ece4',
        fontFamily: 'Nunito, sans-serif',
      })
      .setOrigin(0.5);

    npc.add([circle, label]);
    npc.setData('name', name);
  }

  private toggleWalkableDebug() {
    if (this.walkableDebug) {
      this.walkableDebug.destroy();
      this.walkableDebug = null;
      return;
    }
    const g = this.add.graphics().setDepth(5);
    g.fillStyle(0x2ecc71, 0.35);
    for (const a of WALKABLE_AREAS) g.fillRect(a.x, a.y, a.w, a.h);
    this.walkableDebug = g;
  }

  private updateRoom() {
    const room = roomAt(this.player.x, this.player.y);
    if (room && room !== this.currentRoom) {
      this.currentRoom = room;
      gameEvents.emit(EVENTS.ENTER_ROOM, room);
    }
  }

  private emitPosition(force = false) {
    const now = this.time.now;
    if (!force && now - this.lastPositionEmit < POSITION_EMIT_INTERVAL) return;
    this.lastPositionEmit = now;
    gameEvents.emit(EVENTS.PLAYER_MOVED, { x: this.player.x, y: this.player.y });
  }

  update(_time: number, delta: number) {
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
      vx *= Math.SQRT1_2;
      vy *= Math.SQRT1_2;
    }

    // Move only onto walkable floor; axes are tested separately so the
    // player slides along walls. Position is set directly (the walkable map
    // is the collision source), so the physics body never pushes it off the floor.
    const dt = Math.min(delta, 50) / 1000;
    const { x, y } = this.player;
    const nextX = x + vx * dt;
    if (vx !== 0 && isBoxWalkable(nextX, y, FEET_HALF_W, FEET_HALF_H)) this.player.x = nextX;
    const nextY = y + vy * dt;
    if (vy !== 0 && isBoxWalkable(this.player.x, nextY, FEET_HALF_W, FEET_HALF_H)) this.player.y = nextY;

    this.playerBody.setVelocity(0, 0);

    // Point the direction indicator (0 rad = facing up)
    if (vx !== 0 || vy !== 0) {
      this.directionDot.setRotation(Math.atan2(vy, vx) + Math.PI / 2);
      this.emitPosition();
    }

    this.updateRoom();
  }
}
