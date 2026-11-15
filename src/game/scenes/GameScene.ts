import Phaser from 'phaser';
import { gameEvents, EVENTS } from '../events';
import { useCrewStore } from '../../stores/useCrewStore';
import { CREW_ROLES } from '../../data/crew';
import { useGameStore } from '../../stores/useGameStore';
import { getTeam } from '../../data/crews';
import {
  CHARACTER_SPRITES,
  SPRITE_COLS,
  SPRITE_DIRECTIONS,
  SPRITE_ORIGIN_Y,
  SPRITE_SCALE,
  type SpriteDirection,
} from '../world/characterSprites';
import {
  SHIP_BG_KEY,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  WALKABLE_AREAS,
  PLAYER_SPAWN,
  NPC_SPAWNS,
  ROOM_CENTERS,
  isBoxWalkable,
  roomAt,
  type RoomId,
} from '../world/shipLayout';

const PLAYER_SPEED = 160;
const PLAYER_SIZE = 28;
/** Half extents of the player's feet box used for walkability checks (world px). */
const FEET_HALF_W = 6;
const FEET_HALF_H = 3;
/** How far (px) the player may be nudged sideways to slip around a corner or into a doorway. */
const CORNER_ASSIST = 8;
/**
 * Close follow camera, player locked in the centre (Among Us style).
 * The zoom is chosen so the screen always shows about this many world pixels
 * of height (~one room), whatever the window size.
 */
const VIEW_HEIGHT = 380;
/** Never zoom out below 1:1 (that would show the edge of the map). */
const MIN_ZOOM = 1;
/** 1 = rigid lock on the player; a little below keeps it from feeling jerky. */
const FOLLOW_LERP = 0.25;
/** Minimum time between PLAYER_MOVED events sent to the React HUD (ms). */
const POSITION_EMIT_INTERVAL = 80;
const STARFIELD_KEY = 'starfield';

const INTERACT_DISTANCE = 80;

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private playerBody!: Phaser.Physics.Arcade.Body;
  /** Placeholder arrow, only when the commander has no spritesheet yet. */
  private directionDot: Phaser.GameObjects.Graphics | null = null;
  private playerSprite: Phaser.GameObjects.Sprite | null = null;
  private spriteKey = '';
  private facing: SpriteDirection = 'down';
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private walkableDebug: Phaser.GameObjects.Graphics | null = null;
  private currentRoom: RoomId | null = null;
  private lastPositionEmit = 0;
  private missionMarker: Phaser.GameObjects.Container | null = null;
  private missionGlow: Phaser.GameObjects.Graphics | null = null;
  private missionMarkerRoom: RoomId | null = null;
  private frozen = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0e27');

    this.createShipBackground();
    this.createPlayer();

    // Pause menu (React) freezes the world while it is open.
    const onMenuOpened = () => this.scene.pause();
    const onMenuClosed = () => {
      // Keys released during the pause would otherwise stay "down".
      this.input.keyboard?.resetKeys();
      this.scene.resume();
    };
    gameEvents.on(EVENTS.MENU_OPENED, onMenuOpened);
    gameEvents.on(EVENTS.MENU_CLOSED, onMenuClosed);
    // Phaser fires DESTROY (not SHUTDOWN) when React unmounts the game, so remove on both.
    const removeMenuListeners = () => {
      gameEvents.off(EVENTS.MENU_OPENED, onMenuOpened);
      gameEvents.off(EVENTS.MENU_CLOSED, onMenuClosed);
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, removeMenuListeners);
    this.events.once(Phaser.Scenes.Events.DESTROY, removeMenuListeners);

    // Crew comes from the crew chosen on the home screen.
    const crew = useCrewStore.getState().crew;
    for (const role of CREW_ROLES) {
      const member = crew[role];
      const spawn = NPC_SPAWNS[role];
      const firstName = member.name.replace(/^Dr\.\s*/, '').split(' ')[0];
      this.createNPC(spawn.x, spawn.y, Phaser.Display.Color.HexStringToColor(member.color).color, firstName);
    }

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

    // Camera: zoomed in and centred on the player, stopping at the edges of the station map.
    const camera = this.cameras.main;
    camera.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.applyZoom();
    camera.startFollow(this.player, true, FOLLOW_LERP, FOLLOW_LERP);
    // Centre on the middle of the sprite, not on the feet.
    camera.setFollowOffset(0, 16);
    // The canvas follows its box on screen; keep the same view when it resizes.
    this.scale.on(Phaser.Scale.Events.RESIZE, this.applyZoom, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off(Phaser.Scale.Events.RESIZE, this.applyZoom, this));
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.scale.off(Phaser.Scale.Events.RESIZE, this.applyZoom, this));

    this.updateRoom();
    this.emitPosition(true);

    this.input.keyboard!.on('keydown-E', () => {
      if (this.frozen) return;
      if (this.isNearMarker()) {
        gameEvents.emit(EVENTS.MISSION_START);
      }
    });

    gameEvents.on('SHOW_MISSION_MARKER', (room: RoomId) => {
      this.showMissionMarker(room);
    });

    gameEvents.on('REMOVE_MISSION_MARKER', () => {
      this.removeMissionMarker();
    });

    gameEvents.on('CAMERA_ZOOM_IN', () => {
      this.frozen = true;
      const cam = this.cameras.main;
      const target = this.missionMarker
        ? { x: this.missionMarker.x, y: this.missionMarker.y + 30 }
        : { x: this.player.x, y: this.player.y };
      const targetZoom = Math.min(this.scale.width / WORLD_WIDTH, this.scale.height / WORLD_HEIGHT) * 1.8;
      cam.pan(target.x, target.y, 600, 'Sine.easeInOut');
      cam.zoomTo(targetZoom, 600, 'Sine.easeInOut');
    });

    gameEvents.on('CAMERA_ZOOM_OUT', () => {
      this.frozen = false;
      const cam = this.cameras.main;
      const baseZoom = Math.min(this.scale.width / WORLD_WIDTH, this.scale.height / WORLD_HEIGHT);
      cam.pan(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 500, 'Sine.easeInOut');
      cam.zoomTo(baseZoom, 500, 'Sine.easeInOut');
    });
  }

  /** Station illustration over a simple starfield (the map PNG has a transparent background). */
  private createShipBackground() {
    // TODO: replace with real asset — ENV-001 star layer. Seeded so stars don't move between visits.
    // Drawn ONCE into a texture: a live Graphics object is re-triangulated every frame,
    // which cost ~6 ms per frame (and made the game lag while screen sharing).
    if (!this.textures.exists(STARFIELD_KEY)) {
      const rnd = new Phaser.Math.RandomDataGenerator(['aurora-stars']);
      const g = this.make.graphics({}, false);
      for (let i = 0; i < 260; i++) {
        g.fillStyle(0xf0ece4, rnd.realInRange(0.25, 0.9));
        g.fillRect(rnd.between(0, WORLD_WIDTH), rnd.between(0, WORLD_HEIGHT), rnd.pick([1, 1, 2]), rnd.pick([1, 1, 2]));
      }
      g.generateTexture(STARFIELD_KEY, WORLD_WIDTH, WORLD_HEIGHT);
      g.destroy();
    }
    this.add.image(0, 0, STARFIELD_KEY).setOrigin(0, 0).setDepth(0);
    this.add.image(0, 0, SHIP_BG_KEY).setOrigin(0, 0).setDepth(1);
  }

  /** Walk animations for a 4×4 sheet (rows: down, left, right, up). Frame 0 of each row = standing. */
  private createWalkAnimations(key: string) {
    SPRITE_DIRECTIONS.forEach((dir, row) => {
      const animKey = `${key}-walk-${dir}`;
      if (this.anims.exists(animKey)) return;
      this.anims.create({
        key: animKey,
        frames: this.anims.generateFrameNumbers(key, { start: row * SPRITE_COLS, end: row * SPRITE_COLS + SPRITE_COLS - 1 }),
        frameRate: 8,
        repeat: -1,
      });
    });
  }

  private createPlayer() {
    this.player = this.add.container(PLAYER_SPAWN.x, PLAYER_SPAWN.y).setDepth(10);

    // The player is the chosen crew's commander; use their spritesheet when one exists.
    const crewId = useGameStore.getState().crewId;
    const sprite = crewId ? CHARACTER_SPRITES[getTeam(crewId).commander.astronautId] : undefined;
    if (sprite && this.textures.exists(sprite.key)) {
      this.spriteKey = sprite.key;
      this.createWalkAnimations(sprite.key);
      this.playerSprite = this.add.sprite(0, 0, sprite.key, 0).setOrigin(0.5, SPRITE_ORIGIN_Y).setScale(SPRITE_SCALE);
      this.player.add(this.playerSprite);
    } else {
      this.createPlaceholderPlayer();
    }

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.physics.world.enable(this.player);
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setSize(FEET_HALF_W * 2, FEET_HALF_H * 2);
    this.playerBody.setOffset(-FEET_HALF_W, -FEET_HALF_H);
    this.playerBody.setCollideWorldBounds(true);
  }

  /** TODO: replace with real asset — circle + arrow for commanders without a spritesheet. */
  private createPlaceholderPlayer() {
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
  }

  private createNPC(x: number, y: number, color: number, name: string) {
    // TODO: replace with real asset — crew placeholder
    const npc = this.add.container(x, y).setDepth(9);

    const circle = this.add.graphics();
    circle.fillStyle(color, 1);
    // Same footprint as the ~40 px astronaut sprite.
    circle.fillCircle(0, -10, 10);
    circle.lineStyle(1.5, 0xe2e8f0, 1);
    circle.strokeCircle(0, -10, 10);

    // Rendered at 4x so the name stays sharp under the zoomed pixel-art camera.
    const label = this.add
      .text(0, -28, name, {
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#f0ece4',
        fontFamily: 'Nunito, sans-serif',
        stroke: '#0a0e27',
        strokeThickness: 2,
        resolution: 4,
      })
      .setOrigin(0.5);

    npc.add([circle, label]);
    npc.setData('name', name);
  }

  showMissionMarker(room: RoomId) {
    this.removeMissionMarker();
    const center = ROOM_CENTERS[room];
    if (!center) return;

    const glow = this.add.graphics().setDepth(15).setAlpha(0.6);
    glow.fillStyle(0xf59e0b, 0.35);
    glow.fillCircle(center.x, center.y, 55);
    glow.fillStyle(0xf59e0b, 0.15);
    glow.fillCircle(center.x, center.y, 80);
    this.missionGlow = glow;

    this.tweens.add({
      targets: glow,
      alpha: { from: 0.4, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const container = this.add.container(center.x, center.y - 30).setDepth(20);

    const bg = this.add.graphics();
    bg.fillStyle(0xf59e0b, 1);
    bg.fillRoundedRect(-14, -18, 28, 36, 6);
    bg.fillTriangle(-8, 18, 8, 18, 0, 28);

    const text = this.add.text(0, 0, '!', {
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#1a1a2e',
      fontFamily: 'Arial, sans-serif',
    }).setOrigin(0.5);

    container.add([bg, text]);
    this.missionMarkerRoom = room;
    this.missionMarker = container;

    this.tweens.add({
      targets: container,
      y: center.y - 40,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  removeMissionMarker() {
    if (this.missionMarker) {
      this.missionMarker.destroy();
      this.missionMarker = null;
      this.missionMarkerRoom = null;
    }
    if (this.missionGlow) {
      this.missionGlow.destroy();
      this.missionGlow = null;
    }
  }

  private isNearMarker(): boolean {
    if (!this.missionMarker) return false;
    const dx = this.player.x - this.missionMarker.x;
    const dy = this.player.y - (this.missionMarker.y + 30);
    return Math.sqrt(dx * dx + dy * dy) < INTERACT_DISTANCE;
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

  private applyZoom() {
    this.cameras.main.setZoom(Math.max(MIN_ZOOM, this.scale.height / VIEW_HEIGHT));
  }

  private canStand(x: number, y: number): boolean {
    return isBoxWalkable(x, y, FEET_HALF_W, FEET_HALF_H);
  }

  /**
   * When the next position is blocked, look up to CORNER_ASSIST px to either side
   * (on `axis`) for a free spot and return a small move toward the closest one.
   */
  private cornerNudge(x: number, y: number, axis: 'x' | 'y', step: number): number {
    for (let d = 1; d <= CORNER_ASSIST; d++) {
      for (const sign of [1, -1]) {
        const ox = axis === 'x' ? sign * d : 0;
        const oy = axis === 'y' ? sign * d : 0;
        if (this.canStand(x + ox, y + oy) && this.canStand(this.player.x + Math.sign(ox) * Math.min(step, d), this.player.y + Math.sign(oy) * Math.min(step, d))) {
          return sign * Math.min(step, d);
        }
      }
    }
    return 0;
  }

  update(_time: number, delta: number) {
    if (this.frozen) return;

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
    const step = PLAYER_SPEED * dt;
    const nextX = this.player.x + vx * dt;
    if (vx !== 0) {
      if (this.canStand(nextX, this.player.y)) this.player.x = nextX;
      // Blocked on a corner: slide along the wall toward the nearby opening.
      else if (vy === 0) this.player.y += this.cornerNudge(nextX, this.player.y, 'y', step);
    }
    const nextY = this.player.y + vy * dt;
    if (vy !== 0) {
      if (this.canStand(this.player.x, nextY)) this.player.y = nextY;
      else if (vx === 0) this.player.x += this.cornerNudge(this.player.x, nextY, 'x', step);
    }

    this.playerBody.setVelocity(0, 0);

    const moving = vx !== 0 || vy !== 0;
    if (moving) {
      // Horizontal wins on diagonals, like most top-down games.
      this.facing = vx < 0 ? 'left' : vx > 0 ? 'right' : vy < 0 ? 'up' : 'down';
      this.directionDot?.setRotation(Math.atan2(vy, vx) + Math.PI / 2);
      this.emitPosition();
    }
    if (this.playerSprite) {
      if (moving) {
        this.playerSprite.anims.play(`${this.spriteKey}-walk-${this.facing}`, true);
      } else if (this.playerSprite.anims.isPlaying) {
        // Stand still on the first frame of the current direction.
        this.playerSprite.anims.stop();
        this.playerSprite.setFrame(SPRITE_DIRECTIONS.indexOf(this.facing) * SPRITE_COLS);
      }
    }

    this.updateRoom();
  }
}
