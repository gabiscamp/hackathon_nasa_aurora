import Phaser from 'phaser';
import { GAME_FONT } from '../../styles/theme';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { speak } from '../../utils/speech';
import { playFootstep } from '../../utils/sounds';

/**
 * The game uses pixelArt (nearest-neighbour) for sprites. Text scaled that way gets jagged
 * edges that read like serifs, so text textures use smooth (linear) filtering: Lexend stays clean.
 */
interface MarkerParts {
  container: Phaser.GameObjects.Container;
  glow: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
}

function smoothText(t: Phaser.GameObjects.Text): Phaser.GameObjects.Text {
  t.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
  return t;
}
import { gameEvents, EVENTS, type MissionMarkerSpec } from '../events';
import { markerSpecs } from '../missionMarkers';
import { useCrewStore } from '../../stores/useCrewStore';
import { CREW_ROLES, type CrewRole } from '../../data/crew';
import { availability, useDutyStore } from '../../stores/useDutyStore';
import { findPath, nudged, randomFloorPoint, type Point } from '../world/crewPaths';
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
/** Smaller than INTERACT_DISTANCE: AUR-1 wanders the station and must be walked right up to
 *  (R and a click on it open its panel from anywhere). */
const ROBOT_INTERACT_DISTANCE = 55;
/** Crew walking speed in world px/s (the player walks at 160). */
const CREW_SPEED = 55;
/** Pause between two strolls of a free crew member (ms). */
const CREW_STROLL_PAUSE: [number, number] = [2500, 7000];
/** Where each one stands in a room, so two crew members sent to the same room don't overlap. */
const CREW_OFFSETS: Record<CrewRole, Point> = {
  engineer: { x: -16, y: 4 },
  medic: { x: 16, y: 4 },
  scientist: { x: 0, y: 16 },
};

type CrewGoal = { mode: 'work' | 'rest'; room: RoomId } | { mode: 'stroll' } | { mode: 'away' };

/** A crew member walking around the station by themselves. */
interface CrewWalker {
  role: CrewRole;
  node: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Sprite | null;
  head: HeadId | null;
  path: Point[];
  facing: 'down' | 'up' | 'left' | 'right';
  /** Mode + room it is heading to; a new goal (new job, sick, free) re-routes it. */
  goalKey: string;
  stroll: boolean;
  /** Free crew: when the next stroll starts (null = not planned yet). */
  nextStrollAt: number | null;
}

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
  /** One "!" per open problem (several can be open at once). Keyed by mission id. */
  private missionMarkers = new Map<string, MarkerParts>();
  /** The marker the player opened last (the camera zooms on it). */
  private activeMarkerId: string | null = null;
  private frozen = false;
  private robot: Phaser.GameObjects.Sprite | null = null;
  private crewWalkers: CrewWalker[] = [];
  private robotPatrol: Phaser.Tweens.Tween | null = null;
  private speechBubble: Phaser.GameObjects.Container | null = null;
  private speechTimer: Phaser.Time.TimerEvent | null = null;
  /** Fires SPEECH_BUBBLE_DONE a moment after typing ends; cancelled when the bubble is skipped or hidden. */
  private speechDoneTimer: Phaser.Time.TimerEvent | null = null;
  /** Shows the whole bubble text at once (set while it is typing). */
  private finishSpeech: (() => void) | null = null;
  /** Window click listener that skips the typing; removed with the bubble. */
  private speechSkipListener: ((e: MouseEvent) => void) | null = null;

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
      this.createNPC(role, spawn.x, spawn.y, Phaser.Display.Color.HexStringToColor(member.color).color, firstName, head);
    }
    this.startCrewRoutines();
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
      // A mission "!" comes first: the robot walking by must never block a problem.
      const id = this.nearestMarker();
      if (id) {
        this.activeMarkerId = id;
        gameEvents.emit(EVENTS.MISSION_START, id);
        return;
      }
      if (this.isNearRobot()) gameEvents.emit(EVENTS.ROBOT_INTERACT);
    });

    // Mission events from React (MissionOverlay / GameScreen). Removed when the scene ends:
    // otherwise a destroyed scene from an earlier visit keeps reacting after "Continue mission".
    const onSetMarkers = (markers: MissionMarkerSpec[]) => this.setMissionMarkers(markers);
    const onShowSpeech = (text: string) => this.showSpeechBubble(text);
    const onHideSpeech = () => this.hideSpeechBubble();
    const onZoomIn = () => {
      this.frozen = true;
      const cam = this.cameras.main;
      const marker = this.activeMarkerId ? this.missionMarkers.get(this.activeMarkerId) : undefined;
      const target = marker ? { x: marker.x, y: marker.y } : { x: this.player.x, y: this.player.y };
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
    gameEvents.on(EVENTS.SET_MISSION_MARKERS, onSetMarkers);
    gameEvents.on('CAMERA_ZOOM_IN', onZoomIn);
    gameEvents.on('CAMERA_ZOOM_OUT', onZoomOut);
    gameEvents.on(EVENTS.SHOW_SPEECH_BUBBLE, onShowSpeech);
    gameEvents.on(EVENTS.HIDE_SPEECH_BUBBLE, onHideSpeech);
    const removeMissionListeners = () => {
      gameEvents.off(EVENTS.SET_MISSION_MARKERS, onSetMarkers);
      gameEvents.off('CAMERA_ZOOM_IN', onZoomIn);
      gameEvents.off('CAMERA_ZOOM_OUT', onZoomOut);
      gameEvents.off(EVENTS.SHOW_SPEECH_BUBBLE, onShowSpeech);
      gameEvents.off(EVENTS.HIDE_SPEECH_BUBBLE, onHideSpeech);
      // A bubble still typing has a click listener on the window: drop it with the scene.
      this.finishSpeech = null;
      this.stopSpeechTyping();
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, removeMissionListeners);
    this.events.once(Phaser.Scenes.Events.DESTROY, removeMissionListeners);

    // React may have sent the markers before this scene existed (e.g. "Continue mission"
    // while the map was still loading): draw them from the saved state too.
    if (useGameStore.getState().phase === 'decision') this.setMissionMarkers(markerSpecs(useMissionStore.getState().openEvents));
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
        const isNodeHatch = p.piece === 'node' && r.y === 262;
        const cropY = isNodeHatch ? 240 : p.flipY ? def.height - r.y - r.h : r.y;
        const cropHeight = isNodeHatch ? 110 : r.h;
        const overlay = piece().setCrop(cropX, cropY, r.w, cropHeight).setDepth(OVERHEAD_DEPTH + p.depth / 10);
        if (isNodeHatch) {
          // Cover the marked passage from the upper grey strip down to the
          // curved inner rim; leave the opening beneath the rim unobstructed.
          const s = STATION_SCALE;
          const shape = this.make.graphics({}, false);
          shape.fillStyle(0xffffff);
          shape.fillRect((p.x + 118) * s, (p.y + 262) * s, 145 * s, 88 * s);
          shape.fillRect((p.x + 417) * s, (p.y + 262) * s, 133 * s, 88 * s);
          shape.fillPoints([
            { x: (p.x + 263) * s, y: (p.y + 240) * s },
            { x: (p.x + 417) * s, y: (p.y + 240) * s },
            { x: (p.x + 417) * s, y: (p.y + 337) * s },
            { x: (p.x + 400) * s, y: (p.y + 323) * s },
            { x: (p.x + 375) * s, y: (p.y + 315) * s },
            { x: (p.x + 340) * s, y: (p.y + 312) * s },
            { x: (p.x + 305) * s, y: (p.y + 315) * s },
            { x: (p.x + 280) * s, y: (p.y + 323) * s },
            { x: (p.x + 263) * s, y: (p.y + 337) * s },
          ], true);
          const mask = shape.createGeometryMask();
          overlay.setMask(mask);
          this.events.once(Phaser.Scenes.Events.DESTROY, () => {
            mask.destroy();
            shape.destroy();
          });
        }
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

  private createNPC(role: CrewRole, x: number, y: number, color: number, name: string, head: HeadId | null) {
    const npc = this.add.container(x, y).setDepth(9);
    if (this.stationMask) npc.setMask(this.stationMask);
    const walker: CrewWalker = { role, node: npc, sprite: null, head, path: [], facing: 'down', goalKey: '', stroll: false, nextStrollAt: null };
    this.crewWalkers.push(walker);

    if (head && this.textures.exists(astronautTextureKey(head))) {
      const sprite = this.add.sprite(0, 0, astronautTextureKey(head), 0).setOrigin(0.5, ASTRO_ORIGIN_Y);
      sprite.anims.play(astronautAnim(head, 'idle', 'down'));
      npc.add([sprite, this.npcLabel(name, -50)]);
      npc.setData('name', name);
      walker.sprite = sprite;
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

  /**
   * Where a crew member should be right now, from their duty (src/stores/useDutyStore.ts):
   * on a job -> the mission's room; sick or resting -> the crew quarters; free -> strolling;
   * gone back to Earth -> not on the station.
   */
  private crewGoal(role: CrewRole): CrewGoal {
    const duty = useDutyStore.getState().crew[role];
    switch (availability(duty, useGameStore.getState().day)) {
      case 'away':
        return { mode: 'away' };
      case 'sick':
      case 'resting':
        return { mode: 'rest', room: 'quarters' };
      case 'busy': {
        const room = duty.task?.room as RoomId | undefined;
        return room && ROOM_CENTERS[room] ? { mode: 'work', room } : { mode: 'stroll' };
      }
      default:
        return { mode: 'stroll' };
    }
  }

  /** Sends each crew member where their duty says (called when a job, a sickness or the day changes). */
  private refreshCrewGoals = () => {
    for (const w of this.crewWalkers) {
      const goal = this.crewGoal(w.role);
      const key = goal.mode === 'work' || goal.mode === 'rest' ? `${goal.mode}:${goal.room}` : goal.mode;
      if (key === w.goalKey) continue;
      w.goalKey = key;
      w.node.setVisible(goal.mode !== 'away');
      w.stroll = goal.mode === 'stroll';
      w.nextStrollAt = null;
      w.path = [];
      if (goal.mode === 'work' || goal.mode === 'rest') {
        const spot = nudged(ROOM_CENTERS[goal.room], CREW_OFFSETS[w.role]);
        w.path = findPath({ x: w.node.x, y: w.node.y }, spot) ?? [];
      } else if (goal.mode === 'stroll') {
        // Just freed (or the game just started): a short pause, then off they go.
        w.nextStrollAt = this.time.now + Phaser.Math.Between(500, 2500);
      }
    }
  };

  private startCrewRoutines() {
    this.refreshCrewGoals();
    const offDuty = useDutyStore.subscribe(this.refreshCrewGoals);
    const offDay = useGameStore.subscribe((s, prev) => {
      if (s.day !== prev.day) this.refreshCrewGoals();
    });
    const stop = () => {
      offDuty();
      offDay();
      this.crewWalkers = [];
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, stop);
    this.events.once(Phaser.Scenes.Events.DESTROY, stop);
  }

  /** Walks each crew member along their path; free ones pick a new spot after a pause. */
  private updateCrew(delta: number) {
    const now = this.time.now;
    const dt = Math.min(delta, 50) / 1000;
    for (const w of this.crewWalkers) {
      if (!w.node.visible) continue;
      if (w.path.length === 0 && w.stroll) {
        if (w.nextStrollAt === null) {
          w.nextStrollAt = now + Phaser.Math.Between(...CREW_STROLL_PAUSE);
        } else if (now >= w.nextStrollAt) {
          const spot = randomFloorPoint();
          w.path = (spot && findPath({ x: w.node.x, y: w.node.y }, spot)) || [];
          w.nextStrollAt = null;
        }
      }

      let moving = false;
      let budget = CREW_SPEED * dt;
      while (budget > 0 && w.path.length > 0) {
        const next = w.path[0];
        const dx = next.x - w.node.x;
        const dy = next.y - w.node.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0.01) {
          w.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
          moving = true;
        }
        if (dist <= budget) {
          w.node.setPosition(next.x, next.y);
          w.path.shift();
          budget -= dist;
        } else {
          w.node.setPosition(w.node.x + (dx / dist) * budget, w.node.y + (dy / dist) * budget);
          budget = 0;
        }
      }

      if (w.sprite && w.head) {
        w.sprite.setFlipX(w.facing === 'left');
        w.sprite.anims.play(astronautAnim(w.head, moving ? 'walk' : 'idle', w.facing), true);
      }
    }
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
    this.robot.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Phaser also hears clicks on HTML windows drawn over the canvas (a crew card, a button):
      // only a click really on the game canvas, with no window open, talks to the robot.
      if (this.frozen || pointer.event?.target !== this.game.canvas) return;
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
      // About 35 world-pixels/second: deliberately slower than the player (160 px/s).
      duration: Math.max(3000, distance * 28),
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        if (this.robot) gameEvents.emit(EVENTS.ROBOT_MOVED, { x: this.robot.x, y: this.robot.y });
      },
      onComplete: () => {
        if (!this.robot) return;
        gameEvents.emit(EVENTS.ROBOT_MOVED, { x: this.robot.x, y: this.robot.y });
        this.robotPatrol = null;
        // Long inspection stop so the player can walk up and interact with AUR-1.
        this.time.delayedCall(Phaser.Math.Between(4000, 8000), () => this.startRandomRobotPatrol());
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

  /** Draws one "!" per open problem; problems in the same room stand side by side. */
  setMissionMarkers(markers: MissionMarkerSpec[]) {
    for (const parts of this.missionMarkers.values()) {
      parts.container.destroy();
      parts.glow.destroy();
    }
    this.missionMarkers.clear();

    const perRoom = new Map<string, number>();
    for (const m of markers) {
      const center = ROOM_CENTERS[m.room as RoomId];
      if (!center) continue;
      const index = perRoom.get(m.room) ?? 0;
      perRoom.set(m.room, index + 1);
      const x = center.x + index * 70;
      const y = center.y;
      const color = m.critical ? 0xe74c3c : 0xf59e0b;

      const glow = this.add.graphics().setDepth(15).setAlpha(0.6);
      glow.fillStyle(color, 0.35);
      glow.fillCircle(x, y, 55);
      glow.fillStyle(color, 0.15);
      glow.fillCircle(x, y, 80);
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.4, to: 1 },
        duration: m.critical ? 500 : 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      const container = this.add.container(x, y - 30).setDepth(20);
      const bg = this.add.graphics();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(-14, -18, 28, 36, 6);
      bg.fillTriangle(-8, 18, 8, 18, 0, 28);
      const text = smoothText(this.add.text(0, 0, '!', {
        fontSize: '22px',
        fontStyle: 'bold',
        color: m.critical ? '#ffffff' : '#1a1a2e',
        fontFamily: GAME_FONT,
        resolution: 4,
      }).setOrigin(0.5));
      container.add([bg, text]);
      this.tweens.add({
        targets: container,
        y: y - 40,
        duration: m.critical ? 350 : 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.missionMarkers.set(m.id, { container, glow, x, y });
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
    this.speechDoneTimer = this.time.delayedCall(fullText.length * 30 + 200, () => this.finishSpeech?.());

    // Whole text now, then "done" (once): from the timer above, or from a click anywhere.
    this.finishSpeech = () => {
      this.finishSpeech = null;
      this.stopSpeechTyping();
      textObj.setText(fullText);
      gameEvents.emit('SPEECH_BUBBLE_DONE');
    };
    // Click anywhere while it types → skip to the end (the bubble sits under a React overlay,
    // so listen on the window). That click only finishes the text, like the React typewriter.
    this.speechSkipListener = (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      this.finishSpeech?.();
    };
    window.addEventListener('click', this.speechSkipListener, true);
  }

  /** Stops the typing timers and the skip-on-click listener (the bubble itself stays). */
  private stopSpeechTyping() {
    this.speechTimer?.destroy();
    this.speechTimer = null;
    this.speechDoneTimer?.destroy();
    this.speechDoneTimer = null;
    if (this.speechSkipListener) {
      window.removeEventListener('click', this.speechSkipListener, true);
      this.speechSkipListener = null;
    }
  }

  private hideSpeechBubble() {
    this.finishSpeech = null;
    this.stopSpeechTyping();
    if (this.speechBubble) {
      this.speechBubble.destroy();
      this.speechBubble = null;
    }
    this.frozen = false;
  }

  /** The open problem the player is standing next to (closest one), if any. */
  private nearestMarker(): string | null {
    let best: string | null = null;
    let bestDist = INTERACT_DISTANCE;
    for (const [id, m] of this.missionMarkers) {
      const dist = Math.hypot(this.player.x - m.x, this.player.y - m.y);
      if (dist < bestDist) {
        best = id;
        bestDist = dist;
      }
    }
    return best;
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
    // The crew keeps walking while a mission window is open: those just sent head to the job.
    this.updateCrew(delta);
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
