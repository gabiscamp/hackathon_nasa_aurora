import Phaser from 'phaser';
import { GAME_FONT } from '../../styles/theme';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { speak } from '../../utils/speech';
import { playFootstep } from '../../utils/sounds';

/**
 * The game uses pixelArt (nearest-neighbour) for sprites. Text scaled that way gets jagged
 * edges that read like serifs, so text textures use smooth (linear) filtering: Lexend stays clean.
 */
function smoothText(t: Phaser.GameObjects.Text): Phaser.GameObjects.Text {
  t.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
  return t;
}
import { gameEvents, EVENTS } from '../events';
import { useCrewStore } from '../../stores/useCrewStore';
import { CREW_ROLES } from '../../data/crew';
import { useGameStore } from '../../stores/useGameStore';
import { useMissionStore } from '../../stores/useMissionStore';
import { useExplorationStore } from '../../stores/useExplorationStore';
import { getTeam, type HeadId } from '../../data/crews';
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
  SPACE_BG_KEY,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  WALKABLE_AREAS,
  BLOCKED_AREAS,
  PLACEMENTS,
  PIECES,
  STATION_SCALE,
  PLAYER_SPAWN,
  NPC_SPAWNS,
  ROOM_CENTERS,
  placedCenter,
  isBoxWalkable,
  roomAt,
  type RoomId,
} from '../world/shipLayout';
import { stationTextureKey } from '../world/stationAssets';
import { ROBOT_TEXTURE_KEY } from './BootScene';

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
/** Wall parts the crew walks under: above the player (10) and NPCs (9), below mission markers (15+). */
const OVERHEAD_DEPTH = 11;
/** Extra zoom when the camera flies to a mission spot. */
const MISSION_ZOOM = 1.4;
const ROBOT_SCALE = 0.24;
const ROBOT_INTERACT_DISTANCE = 72;

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private playerBody!: Phaser.Physics.Arcade.Body;
  /** Placeholder arrow, only when the commander has no spritesheet yet. */
  private directionDot: Phaser.GameObjects.Graphics | null = null;
  private playerSprite: Phaser.GameObjects.Sprite | null = null;
  private spaceBackdrop: Phaser.GameObjects.Image | null = null;
  /** Silhouette of the pressurized modules; characters are clipped to it (WebGL only). */
  private stationMask: Phaser.Display.Masks.BitmapMask | null = null;
  private backdropFit = { w: 0, h: 0, zoom: 0 };
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
  private robot: Phaser.GameObjects.Sprite | null = null;
  private robotPatrol: Phaser.Tweens.Tween | null = null;
  private speechBubble: Phaser.GameObjects.Container | null = null;
  private speechTimer: Phaser.Time.TimerEvent | null = null;

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

    // Crew comes from the crew chosen on the home screen; each seat has that crew's head.
    const crew = useCrewStore.getState().crew;
    const heads = getTeam(useGameStore.getState().crewId).heads;
    for (const role of CREW_ROLES) {
      const member = crew[role];
      const spawn = NPC_SPAWNS[role];
      const firstName = member.name.replace(/^Dr\.\s*/, '').split(' ')[0];
      const head = heads[role];
      this.createNPC(spawn.x, spawn.y, Phaser.Display.Color.HexStringToColor(member.color).color, firstName, head);
    }
    this.createRobot();

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
      if (this.isNearRobot()) {
        gameEvents.emit(EVENTS.ROBOT_INTERACT);
        return;
      }
      if (this.isNearMarker()) {
        gameEvents.emit(EVENTS.MISSION_START);
      }
    });

    // Mission events from React (MissionOverlay / GameScreen). Removed when the scene ends:
    // otherwise a destroyed scene from an earlier visit keeps reacting after "Continue mission".
    const onShowMarker = (room: RoomId, critical?: boolean) => this.showMissionMarker(room, critical);
    const onRemoveMarker = () => this.removeMissionMarker();
    const onShowSpeech = (text: string) => this.showSpeechBubble(text);
    const onHideSpeech = () => this.hideSpeechBubble();
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
    gameEvents.on(EVENTS.SHOW_SPEECH_BUBBLE, onShowSpeech);
    gameEvents.on(EVENTS.HIDE_SPEECH_BUBBLE, onHideSpeech);
    const removeMissionListeners = () => {
      gameEvents.off('SHOW_MISSION_MARKER', onShowMarker);
      gameEvents.off('REMOVE_MISSION_MARKER', onRemoveMarker);
      gameEvents.off('CAMERA_ZOOM_IN', onZoomIn);
      gameEvents.off('CAMERA_ZOOM_OUT', onZoomOut);
      gameEvents.off(EVENTS.SHOW_SPEECH_BUBBLE, onShowSpeech);
      gameEvents.off(EVENTS.HIDE_SPEECH_BUBBLE, onHideSpeech);
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, removeMissionListeners);
    this.events.once(Phaser.Scenes.Events.DESTROY, removeMissionListeners);

    // React may have sent SHOW_MISSION_MARKER before this scene existed (e.g. "Continue mission"
    // while the map was still loading): draw the marker from the saved state too.
    const mission = useMissionStore.getState().currentMission;
    if (useGameStore.getState().phase === 'decision' && mission) this.showMissionMarker(mission.room as RoomId);
  }

  /** ISS-style station (modules, nodes, truss, radiators, solar wings) over the Mars-orbit backdrop. */
  private createShipBackground() {
    if (this.textures.exists(SPACE_BG_KEY)) {
      // Painted (not pixel art): smooth scaling instead of the game-wide nearest filter.
      this.textures.get(SPACE_BG_KEY).setFilter(Phaser.Textures.FilterMode.LINEAR);
      this.spaceBackdrop = this.add.image(0, 0, SPACE_BG_KEY).setScrollFactor(0).setDepth(0);
    }
    for (const p of PLACEMENTS) {
      const key = stationTextureKey(p.piece);
      // Module art is drawn larger than it shows on screen: smooth filtering avoids
      // the shimmer nearest-neighbour gives when it is scaled down.
      this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
      const c = placedCenter(p);
      const piece = () =>
        this.add.image(c.x, c.y, key).setScale(STATION_SCALE).setAngle(p.angle).setFlip(p.flipX, p.flipY);
      // Pieces stack between the backdrop (0) and the debug overlay (5).
      piece().setDepth(1 + p.depth / 10);

      // Hatch rings, end caps and south door walls drawn again over the crew, so walking
      // through a doorway goes *under* the wall instead of over it (top-down look).
      const def = PIECES[p.piece];
      for (const r of def.overhead) {
        // setCrop reads the rect in the flipped frame; convert from unflipped image px.
        const cropX = p.flipX ? def.width - r.x - r.w : r.x;
        const cropY = p.flipY ? def.height - r.y - r.h : r.y;
        piece().setCrop(cropX, cropY, r.w, r.h).setDepth(OVERHEAD_DEPTH + p.depth / 10);
      }
    }
    this.stationMask = this.createStationMask();
  }

  /**
   * Silhouette of the pressurized modules. Characters are clipped to it, so a head that
   * sticks up while walking through the hatch ring between two cylinders is hidden instead
   * of showing over open space. Bitmap masks need WebGL; on Canvas characters stay unclipped.
   */
  private createStationMask(): Phaser.Display.Masks.BitmapMask | null {
    if (this.renderer.type !== Phaser.WEBGL) return null;
    const rt = this.make.renderTexture({ x: 0, y: 0, width: WORLD_WIDTH, height: WORLD_HEIGHT }, false).setOrigin(0, 0);
    for (const p of PLACEMENTS) {
      if (p.room === null) continue; // truss, radiators, solar wings: outside, nobody walks there
      const c = placedCenter(p);
      const img = this.make
        .image({ x: c.x, y: c.y, key: stationTextureKey(p.piece) }, false)
        .setScale(STATION_SCALE)
        .setAngle(p.angle)
        .setFlip(p.flipX, p.flipY);
      rt.draw(img);
      img.destroy();
    }
    const mask = rt.createBitmapMask();
    // Not on the display list, so the scene won't free it by itself.
    let freed = false;
    const free = () => {
      if (freed) return;
      freed = true;
      mask.destroy();
      rt.destroy();
      this.stationMask = null;
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, free);
    this.events.once(Phaser.Scenes.Events.DESTROY, free);
    return mask;
  }

  /**
   * Keeps the backdrop covering the whole screen. It ignores camera scroll (scrollFactor 0) but
   * still gets the camera zoom, which scales around the view center — so place it there and undo the zoom.
   */
  private fitBackdrop() {
    if (!this.spaceBackdrop) return;
    // Read the size from the scale manager: on RESIZE it is updated before the camera may be.
    const { width, height } = this.scale;
    const zoom = this.cameras.main.zoom;
    // Called every frame: only recompute when something changed (zoom tweens, resizes).
    if (width === this.backdropFit.w && height === this.backdropFit.h && zoom === this.backdropFit.zoom) return;
    this.backdropFit = { w: width, h: height, zoom };
    const cover = Math.max(width / this.spaceBackdrop.width, height / this.spaceBackdrop.height);
    this.spaceBackdrop.setPosition(width / 2, height / 2).setScale(cover / zoom);
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
    if (this.stationMask) this.player.setMask(this.stationMask);

    // The player is the chosen crew's commander, drawn as the team's modular astronaut with
    // that crew's head for them. McClain's older 4×4 sheet is only a fallback.
    const team = getTeam(useGameStore.getState().crewId);
    const commanderId = team.commander.astronautId;
    const sprite = CHARACTER_SPRITES[commanderId];
    const head = team.heads.commander;
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
    if (this.stationMask) npc.setMask(this.stationMask);

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

  /** AUR-1 roams the main pressurised corridor until it is deployed to Mars. */
  private createRobot() {
    if (!this.textures.exists(ROBOT_TEXTURE_KEY)) return;
    // The main pressurised row is continuous, so these room centres form a safe patrol route.
    // Starting on the bridge makes the robot visible early instead of hiding it at the far airlock.
    const center = ROOM_CENTERS.bridge;
    if (!this.anims.exists('robot-idle')) {
      this.anims.create({
        key: 'robot-idle',
        frames: this.anims.generateFrameNumbers(ROBOT_TEXTURE_KEY, { start: 0, end: 7 }),
        frameRate: 5,
        repeat: -1,
      });
    }
    this.robot = this.add
      .sprite(center.x, center.y, ROBOT_TEXTURE_KEY, 0)
      .setOrigin(0.5, 0.78)
      .setScale(ROBOT_SCALE)
      .setDepth(9)
      .setInteractive({ useHandCursor: true });
    this.robot.anims.play('robot-idle');
    this.robot.on('pointerdown', () => {
      if (useExplorationStore.getState().status === 'aboard') gameEvents.emit(EVENTS.ROBOT_INTERACT);
    });

    this.startRandomRobotPatrol();

    const syncRobot = (status: 'aboard' | 'exploring') => {
      const aboard = status === 'aboard';
      this.robot?.setVisible(aboard).setActive(aboard);
      if (aboard && this.robotPatrol) this.robotPatrol.resume();
      else if (aboard) this.startRandomRobotPatrol();
      else this.robotPatrol?.pause();
    };
    syncRobot(useExplorationStore.getState().status);
    const unsubscribe = useExplorationStore.subscribe((state) => syncRobot(state.status));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsubscribe);
    this.events.once(Phaser.Scenes.Events.DESTROY, unsubscribe);
  }

  /** Picks another module on the connected main corridor, waits there, then chooses again. */
  private startRandomRobotPatrol() {
    if (!this.robot || useExplorationStore.getState().status !== 'aboard') return;
    const route = [
      ROOM_CENTERS.quarters,
      ROOM_CENTERS.bridge,
      ROOM_CENTERS.engineering,
      ROOM_CENTERS.corridor,
      ROOM_CENTERS.airlock,
    ];
    const candidates = route.filter((point) => Phaser.Math.Distance.Between(this.robot!.x, this.robot!.y, point.x, point.y) > 70);
    const target = Phaser.Utils.Array.GetRandom(candidates);
    const distance = Phaser.Math.Distance.Between(this.robot.x, this.robot.y, target.x, target.y);

    this.robotPatrol = this.tweens.add({
      targets: this.robot,
      x: target.x,
      y: target.y,
      duration: Math.max(1800, distance * 12),
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        if (this.robot) gameEvents.emit(EVENTS.ROBOT_MOVED, { x: this.robot.x, y: this.robot.y });
      },
      onComplete: () => {
        if (!this.robot) return;
        gameEvents.emit(EVENTS.ROBOT_MOVED, { x: this.robot.x, y: this.robot.y });
        this.robotPatrol = null;
        this.time.delayedCall(Phaser.Math.Between(900, 2400), () => this.startRandomRobotPatrol());
      },
    });
  }

  /** Name tag rendered at 4x so it stays sharp under the zoomed pixel-art camera. */
  private npcLabel(name: string, y: number): Phaser.GameObjects.Text {
    return smoothText(this.add
      .text(0, y, name, {
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#f0ece4',
        fontFamily: GAME_FONT,
        stroke: '#0a0e27',
        strokeThickness: 2,
        resolution: 4,
      })
      .setOrigin(0.5));
  }

  showMissionMarker(room: RoomId, critical = false) {
    this.removeMissionMarker();
    const center = ROOM_CENTERS[room];
    if (!center) return;

    const color = critical ? 0xe74c3c : 0xf59e0b;

    const glow = this.add.graphics().setDepth(15).setAlpha(0.6);
    glow.fillStyle(color, 0.35);
    glow.fillCircle(center.x, center.y, 55);
    glow.fillStyle(color, 0.15);
    glow.fillCircle(center.x, center.y, 80);
    this.missionGlow = glow;

    this.tweens.add({
      targets: glow,
      alpha: { from: 0.4, to: 1 },
      duration: critical ? 500 : 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const container = this.add.container(center.x, center.y - 30).setDepth(20);

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-14, -18, 28, 36, 6);
    bg.fillTriangle(-8, 18, 8, 18, 0, 28);

    const text = smoothText(this.add.text(0, 0, '!', {
      fontSize: '22px',
      fontStyle: 'bold',
      color: critical ? '#ffffff' : '#1a1a2e',
      fontFamily: GAME_FONT,
      resolution: 4,
    }).setOrigin(0.5));

    container.add([bg, text]);
    this.missionMarker = container;

    this.tweens.add({
      targets: container,
      y: center.y - 40,
      duration: critical ? 350 : 500,
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

  private showSpeechBubble(fullText: string) {
    this.hideSpeechBubble();
    this.frozen = true;

    const bubbleW = 220;
    const bubbleH = 70;
    const offsetX = 130;
    const bubbleX = this.player.x + offsetX;
    const bubbleY = this.player.y - 20;

    const container = this.add.container(bubbleX, bubbleY).setDepth(100);

    const bg = this.add.graphics();
    // White fill, blue border
    bg.fillStyle(0xffffff, 0.95);
    bg.fillRoundedRect(-bubbleW / 2, -bubbleH / 2, bubbleW, bubbleH, 10);
    bg.lineStyle(2, 0x4dc9f6, 0.8);
    bg.strokeRoundedRect(-bubbleW / 2, -bubbleH / 2, bubbleW, bubbleH, 10);
    // Triangle pointing left to the player
    bg.fillStyle(0xffffff, 0.95);
    bg.fillTriangle(-bubbleW / 2, -6, -bubbleW / 2, 6, -bubbleW / 2 - 10, 0);
    bg.lineStyle(2, 0x4dc9f6, 0.8);
    bg.lineBetween(-bubbleW / 2, -6, -bubbleW / 2 - 10, 0);
    bg.lineBetween(-bubbleW / 2 - 10, 0, -bubbleW / 2, 6);

    const textObj = smoothText(this.add.text(0, 0, '', {
      fontSize: '10px',
      color: '#1a1a2e',
      fontFamily: GAME_FONT,
      wordWrap: { width: bubbleW - 24 },
      align: 'left',
      lineSpacing: 3,
      resolution: 3,
    }).setOrigin(0.5));

    container.add([bg, textObj]);
    this.speechBubble = container;
    // Options → Read text aloud also covers the speech bubble (it is canvas text, so L can't see it).
    if (useSettingsStore.getState().readAloud) speak(fullText);

    // Type out the text character by character
    let charIndex = 0;
    this.speechTimer = this.time.addEvent({
      delay: 30,
      repeat: fullText.length - 1,
      callback: () => {
        charIndex++;
        textObj.setText(fullText.slice(0, charIndex));
      },
    });

    // Emit done event when typing finishes
    this.time.delayedCall(fullText.length * 30 + 200, () => {
      gameEvents.emit('SPEECH_BUBBLE_DONE');
    });
  }

  private hideSpeechBubble() {
    if (this.speechTimer) {
      this.speechTimer.destroy();
      this.speechTimer = null;
    }
    if (this.speechBubble) {
      this.speechBubble.destroy();
      this.speechBubble = null;
    }
    this.frozen = false;
  }

  private isNearMarker(): boolean {
    if (!this.missionMarker) return false;
    const dx = this.player.x - this.missionMarker.x;
    const dy = this.player.y - (this.missionMarker.y + 30);
    return Math.sqrt(dx * dx + dy * dy) < INTERACT_DISTANCE;
  }

  private isNearRobot(): boolean {
    if (!this.robot?.visible || useExplorationStore.getState().status !== 'aboard') return false;
    return Phaser.Math.Distance.Between(this.player.x, this.player.y, this.robot.x, this.robot.y) < ROBOT_INTERACT_DISTANCE;
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
    g.fillStyle(0xe74c3c, 0.4);
    for (const b of BLOCKED_AREAS) g.fillRect(b.x, b.y, b.w, b.h);
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
    // The mission zoom (CAMERA_ZOOM_IN/OUT) tweens the zoom over several frames: keep the backdrop covering the screen.
    this.fitBackdrop();
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
      this.facing = vx < 0 ? 'left' : vx > 0 ? 'right' : vy < 0 ? 'up' : 'down';
      this.directionDot?.setRotation(Math.atan2(vy, vx) + Math.PI / 2);
      this.emitPosition();
      playFootstep();
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
