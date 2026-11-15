import Phaser from 'phaser';
import { GAME_FONT } from '../../styles/theme';
import { gameEvents, EVENTS } from '../events';
import { useCrewStore } from '../../stores/useCrewStore';
import { CREW_ROLES } from '../../data/crew';
import { useGameStore } from '../../stores/useGameStore';
import { useMissionStore } from '../../stores/useMissionStore';
import { getTeam } from '../../data/crews';
import { ASTRONAUTS, getAstronaut, type HeadId } from '../../data/astronauts';
import { ASTRO_ORIGIN_Y, astronautAnim, astronautTextureKey } from '../world/modularAstronaut';
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
  SPACE_BG_KEY,
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
const VIEW_HEIGHT = 480;
/** Never zoom out below 1:1 (that would show the edge of the map). */
const MIN_ZOOM = 1;
/** 1 = rigid lock on the player; a little below keeps it from feeling jerky. */
const FOLLOW_LERP = 0.25;
/** Minimum time between PLAYER_MOVED events sent to the React HUD (ms). */
const POSITION_EMIT_INTERVAL = 80;

const INTERACT_DISTANCE = 80;
/** Extra zoom when the camera flies to a mission spot. */
const MISSION_ZOOM = 1.4;

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private playerBody!: Phaser.Physics.Arcade.Body;
  /** Placeholder arrow, only when the commander has no spritesheet yet. */
  private directionDot: Phaser.GameObjects.Graphics | null = null;
  private playerSprite: Phaser.GameObjects.Sprite | null = null;
  private spaceBackdrop: Phaser.GameObjects.Image | null = null;
  private spriteKey = '';
  /** Set when the player uses the modular astronaut (body + head) instead of a full sheet. */
  private playerHead: HeadId | null = null;
  private facing: SpriteDirection = 'down';
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private walkableDebug: Phaser.GameObjects.Graphics | null = null;
  private currentRoom: RoomId | null = null;
  private lastPositionEmit = 0;
  private missionMarker: Phaser.GameObjects.Container | null = null;
  private missionGlow: Phaser.GameObjects.Graphics | null = null;
  private frozen = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0e27');

    this.createShipBackground();
    this.createPlayer();

    // React windows (pause menu, big map) freeze the world while open. Counted, so closing one
    // window while another is still open doesn't unfreeze the game; a new scene always starts at 0.
    let openWindows = 0;
    const onMenuOpened = () => {
      openWindows += 1;
      if (!this.scene.isPaused()) this.scene.pause();
    };
    const onMenuClosed = () => {
      openWindows = Math.max(0, openWindows - 1);
      if (openWindows > 0) return;
      // Keys released during the pause would otherwise stay "down".
      this.input.keyboard?.resetKeys();
      if (this.scene.isPaused()) this.scene.resume();
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
      const head = ASTRONAUTS.find((a) => a.name === member.name)?.head ?? null;
      this.createNPC(spawn.x, spawn.y, Phaser.Display.Color.HexStringToColor(member.color).color, firstName, head);
    }

    // Input — WASD and arrows work simultaneously. Start clean: keys held while the
    // home screen was open (e.g. Enter on "Continue") must not stay stuck "down".
    this.input.keyboard!.enabled = true;
    this.input.keyboard!.resetKeys();
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

    // Mission events from React (MissionOverlay / GameScreen). Removed when the scene ends:
    // otherwise a destroyed scene from an earlier visit keeps reacting after "Continue mission".
    const onShowMarker = (room: RoomId) => this.showMissionMarker(room);
    const onRemoveMarker = () => this.removeMissionMarker();
    const onZoomIn = () => {
      this.frozen = true;
      const cam = this.cameras.main;
      const target = this.missionMarker
        ? { x: this.missionMarker.x, y: this.missionMarker.y + 30 }
        : { x: this.player.x, y: this.player.y };
      cam.pan(target.x, target.y, 600, 'Sine.easeInOut');
      cam.zoomTo(this.baseZoom() * MISSION_ZOOM, 600, 'Sine.easeInOut');
    };
    const onZoomOut = () => {
      this.frozen = false;
      // Back to the normal follow camera (pan to the player, then startFollow takes over again).
      const cam = this.cameras.main;
      cam.pan(this.player.x, this.player.y - 16, 500, 'Sine.easeInOut');
      cam.zoomTo(this.baseZoom(), 500, 'Sine.easeInOut');
    };
    gameEvents.on('SHOW_MISSION_MARKER', onShowMarker);
    gameEvents.on('REMOVE_MISSION_MARKER', onRemoveMarker);
    gameEvents.on('CAMERA_ZOOM_IN', onZoomIn);
    gameEvents.on('CAMERA_ZOOM_OUT', onZoomOut);
    const removeMissionListeners = () => {
      gameEvents.off('SHOW_MISSION_MARKER', onShowMarker);
      gameEvents.off('REMOVE_MISSION_MARKER', onRemoveMarker);
      gameEvents.off('CAMERA_ZOOM_IN', onZoomIn);
      gameEvents.off('CAMERA_ZOOM_OUT', onZoomOut);
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, removeMissionListeners);
    this.events.once(Phaser.Scenes.Events.DESTROY, removeMissionListeners);

    // React may have sent SHOW_MISSION_MARKER before this scene existed (e.g. "Continue mission"
    // while the map was still loading): draw the marker from the saved state too.
    const mission = useMissionStore.getState().currentMission;
    if (useGameStore.getState().phase === 'decision' && mission) this.showMissionMarker(mission.room as RoomId);
  }

  /** Station illustration over the Mars-orbit backdrop (the map PNG has a transparent background). */
  private createShipBackground() {
    if (this.textures.exists(SPACE_BG_KEY)) {
      // Painted (not pixel art): smooth scaling instead of the game-wide nearest filter.
      this.textures.get(SPACE_BG_KEY).setFilter(Phaser.Textures.FilterMode.LINEAR);
      this.spaceBackdrop = this.add.image(0, 0, SPACE_BG_KEY).setScrollFactor(0).setDepth(0);
    }
    this.add.image(0, 0, SHIP_BG_KEY).setOrigin(0, 0).setDepth(1);
  }

  /**
   * Keeps the backdrop covering the whole screen. It ignores camera scroll (scrollFactor 0) but
   * still gets the camera zoom, which scales around the view center — so place it there and undo the zoom.
   */
  private fitBackdrop() {
    if (!this.spaceBackdrop) return;
    // Read the size from the scale manager: on RESIZE it is updated before the camera may be.
    const { width, height } = this.scale;
    const cover = Math.max(width / this.spaceBackdrop.width, height / this.spaceBackdrop.height);
    this.spaceBackdrop.setPosition(width / 2, height / 2).setScale(cover / this.cameras.main.zoom);
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

    // The player is the chosen crew's commander, drawn as the team's modular astronaut with
    // their face (McClain = cabeca-1). Her older 4×4 sheet is only a fallback.
    const crewId = useGameStore.getState().crewId;
    const commanderId = crewId ? getTeam(crewId).commander.astronautId : '';
    const sprite = CHARACTER_SPRITES[commanderId];
    const head = getAstronaut(commanderId)?.head;
    if (head && this.textures.exists(astronautTextureKey(head))) {
      this.playerHead = head;
      this.playerSprite = this.add.sprite(0, 0, astronautTextureKey(head), 0).setOrigin(0.5, ASTRO_ORIGIN_Y);
      this.playerSprite.anims.play(astronautAnim(head, 'idle', 'down'));
      this.player.add(this.playerSprite);
    } else if (sprite && this.textures.exists(sprite.key)) {
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

  private createNPC(x: number, y: number, color: number, name: string, head: HeadId | null) {
    const npc = this.add.container(x, y).setDepth(9);

    if (head && this.textures.exists(astronautTextureKey(head))) {
      const sprite = this.add.sprite(0, 0, astronautTextureKey(head), 0).setOrigin(0.5, ASTRO_ORIGIN_Y);
      sprite.anims.play(astronautAnim(head, 'idle', 'down'));
      npc.add([sprite, this.npcLabel(name, -50)]);
      npc.setData('name', name);
      return;
    }

    // TODO: replace with real asset — fallback marker when an astronaut has no sprite
    const circle = this.add.graphics();
    circle.fillStyle(color, 1);
    // Same footprint as the ~40 px astronaut sprite.
    circle.fillCircle(0, -10, 10);
    circle.lineStyle(1.5, 0xe2e8f0, 1);
    circle.strokeCircle(0, -10, 10);

    npc.add([circle, this.npcLabel(name, -28)]);
    npc.setData('name', name);
  }

  /** Name tag rendered at 4x so it stays sharp under the zoomed pixel-art camera. */
  private npcLabel(name: string, y: number): Phaser.GameObjects.Text {
    return this.add
      .text(0, y, name, {
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#f0ece4',
        fontFamily: GAME_FONT,
        stroke: '#0a0e27',
        strokeThickness: 2,
        resolution: 4,
      })
      .setOrigin(0.5);
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
      fontFamily: GAME_FONT,
    }).setOrigin(0.5);

    container.add([bg, text]);
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
    // While a mission zoom is running, leave the camera to it (it zooms back out itself).
    if (!this.frozen) this.cameras.main.setZoom(this.baseZoom());
    this.fitBackdrop();
  }

  /** Normal follow-camera zoom: about VIEW_HEIGHT world pixels of height on screen. */
  private baseZoom(): number {
    return Math.max(MIN_ZOOM, this.scale.height / VIEW_HEIGHT);
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
    if (this.playerSprite && this.playerHead) {
      // Modular astronaut: side frames face right, so left is the same animation flipped.
      this.playerSprite.setFlipX(this.facing === 'left');
      this.playerSprite.anims.play(astronautAnim(this.playerHead, moving ? 'walk' : 'idle', this.facing), true);
    } else if (this.playerSprite) {
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
