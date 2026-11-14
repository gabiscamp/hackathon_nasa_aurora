---
name: phaser-game-development
description: Phaser 3 game development patterns for a 2D top-down exploration game integrated with React. Covers scene lifecycle, physics, tilemaps, input, camera, and the React-Phaser bridge.
---

# Phaser 3 Game Development Skill

Reference: https://docs.phaser.io/

## Scene Lifecycle

Every Phaser scene has three core methods. Respect their purpose strictly:

### `preload()`

Load all assets here. Never load assets in `create()` or `update()`.

```typescript
preload() {
  // Prefer atlases over individual images
  this.load.atlas('crew', 'assets/crew.png', 'assets/crew.json');
  this.load.tilemapTiledJSON('ship', 'assets/tilemaps/ship.json');
  this.load.image('tileset', 'assets/tilesets/ship-tileset.png');
  this.load.audio('ambient', 'assets/audio/ambient-hum.ogg');
}
```

### `create()`

Set up the world, physics bodies, cameras, input, and initial state. Runs once after preload completes.

```typescript
create() {
  // 1. Create tilemap
  const map = this.make.tilemap({ key: 'ship' });
  const tileset = map.addTilesetImage('ship-tileset', 'tileset');
  const floorLayer = map.createLayer('Floor', tileset);
  const wallLayer = map.createLayer('Walls', tileset);
  wallLayer.setCollisionByProperty({ collides: true });

  // 2. Create player
  this.player = this.physics.add.sprite(400, 300, 'crew', 'captain-idle-down');
  this.player.setSize(24, 24);       // Hitbox smaller than sprite
  this.player.setOffset(4, 8);       // Center hitbox on feet

  // 3. Collisions
  this.physics.add.collider(this.player, wallLayer);

  // 4. Camera
  this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
  this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

  // 5. Input
  this.cursors = this.input.keyboard.createCursorKeys();
  this.wasd = this.input.keyboard.addKeys('W,A,S,D') as Record<string, Phaser.Input.Keyboard.Key>;

  // 6. Animations
  this.createAnimations();
}
```

### `update(time: number, delta: number)`

Runs every frame (~60fps). Keep this **minimal**. Only handle:

- Player movement input
- Velocity changes
- Animation state transitions
- Proximity checks (throttled)

```typescript
update(time: number, delta: number) {
  if (!this.player) return;

  const speed = 160;
  this.player.setVelocity(0);

  // Movement
  if (this.cursors.left.isDown || this.wasd.A.isDown) {
    this.player.setVelocityX(-speed);
    this.player.anims.play('walk-left', true);
    this.facing = 'left';
  } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
    this.player.setVelocityX(speed);
    this.player.anims.play('walk-right', true);
    this.facing = 'right';
  }

  if (this.cursors.up.isDown || this.wasd.W.isDown) {
    this.player.setVelocityY(-speed);
    this.player.anims.play('walk-up', true);
    this.facing = 'up';
  } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
    this.player.setVelocityY(speed);
    this.player.anims.play('walk-down', true);
    this.facing = 'down';
  }

  // Idle when not moving
  if (this.player.body.velocity.x === 0 && this.player.body.velocity.y === 0) {
    this.player.anims.play(`idle-${this.facing}`, true);
  }

  // Normalize diagonal movement
  this.player.body.velocity.normalize().scale(speed);
}
```

---

## Arcade Physics

Use Arcade physics (not Matter.js) for this project. It is simpler and sufficient for top-down movement.

### Configuration

```typescript
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },   // Top-down: no gravity
      debug: false,                // Enable during development
    },
  },
  scene: [BootScene, GameScene, UIScene],
};
```

### Key Physics Patterns

- **Zero gravity**: Top-down games have no gravity. Set `gravity: { x: 0, y: 0 }`.
- **Hitbox tuning**: Always `setSize()` and `setOffset()` to make hitboxes smaller than sprites. The visual character is ~32x48 but the collision body should be ~24x24 centered on the feet.
- **Colliders vs Overlaps**: Use `collider` for walls/furniture (blocks movement). Use `overlap` for interaction zones (triggers callback without blocking).
- **Immovable bodies**: Set `body.setImmovable(true)` on furniture, walls, and NPCs so the player doesn't push them.

```typescript
// Furniture collision - player can't push it
const desk = this.physics.add.staticImage(200, 150, 'desk');

// Interaction zone - triggers callback
const interactZone = this.physics.add.sprite(200, 170, null);
interactZone.setSize(48, 48);
interactZone.setVisible(false);
this.physics.add.overlap(this.player, interactZone, this.onNearObject, null, this);
```

---

## Tilemap Integration (Tiled)

### Tiled Editor Setup

- Export maps as **JSON** (not TMX).
- Use a consistent tile size: **32x32** or **48x48** pixels.
- Layer naming convention:
  - `Floor` — walkable ground tiles
  - `Walls` — wall tiles with `collides: true` custom property
  - `Furniture` — decorative objects with collision
  - `Above` — elements rendered above the player (upper parts of tall furniture)
  - `Interactions` — object layer with named points/rectangles for interactive zones

### Loading and Using Tilemaps

```typescript
// In preload
this.load.tilemapTiledJSON('ship-map', 'assets/tilemaps/ship.json');
this.load.image('ship-tiles', 'assets/tilesets/ship-tileset.png');

// In create
const map = this.make.tilemap({ key: 'ship-map' });
const tileset = map.addTilesetImage('ship-tileset', 'ship-tiles');

const floor = map.createLayer('Floor', tileset);
const walls = map.createLayer('Walls', tileset);
const furniture = map.createLayer('Furniture', tileset);
const above = map.createLayer('Above', tileset);

// Collision from Tiled custom properties
walls.setCollisionByProperty({ collides: true });
furniture.setCollisionByProperty({ collides: true });

// Render order: above layer on top of player
above.setDepth(10);

// Object layer for interactions
const interactionObjects = map.getObjectLayer('Interactions');
interactionObjects.objects.forEach((obj) => {
  const zone = this.add.zone(obj.x!, obj.y!, obj.width!, obj.height!);
  this.physics.world.enable(zone);
  (zone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
  zone.setData('name', obj.name);
  zone.setData('properties', obj.properties);
  this.interactionZones.push(zone);
});
```

---

## Sprite Animation

### Spritesheet Setup

Use texture atlases (JSON hash or JSON array) instead of individual frame images.

```typescript
// Atlas JSON structure (example)
{
  "frames": {
    "captain-idle-down-0": { "frame": { "x": 0, "y": 0, "w": 32, "h": 48 } },
    "captain-idle-down-1": { "frame": { "x": 32, "y": 0, "w": 32, "h": 48 } },
    "captain-walk-down-0": { "frame": { "x": 64, "y": 0, "w": 32, "h": 48 } },
    // ...
  }
}
```

### Creating Animations

```typescript
private createAnimations() {
  const directions = ['up', 'down', 'left', 'right'];
  const characters = ['captain', 'scientist', 'medic', 'engineer'];

  for (const char of characters) {
    for (const dir of directions) {
      // Walk animation
      this.anims.create({
        key: `${char}-walk-${dir}`,
        frames: this.anims.generateFrameNames('crew', {
          prefix: `${char}-walk-${dir}-`,
          start: 0,
          end: 3,
        }),
        frameRate: 8,
        repeat: -1,
      });

      // Idle animation
      this.anims.create({
        key: `${char}-idle-${dir}`,
        frames: this.anims.generateFrameNames('crew', {
          prefix: `${char}-idle-${dir}-`,
          start: 0,
          end: 1,
        }),
        frameRate: 2,
        repeat: -1,
      });
    }
  }
}
```

---

## Camera

### Follow Player with Smooth Lerp

```typescript
// Smooth follow (0.1 lerp = slight lag, feels natural)
this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

// Bound camera to map so it never shows outside the ship
this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

// Optional: set zoom for the right framing
this.cameras.main.setZoom(1.5);
```

### Camera Rules for This Game

- Camera follows the player character at all times during exploration.
- Camera bounds = tilemap bounds (never show void beyond the ship).
- Zoom level should frame approximately 3-4 rooms around the player.
- During dialogue or cutscenes, camera can pan to a target using `this.cameras.main.pan(x, y, duration)`.

---

## Keyboard Input

### Dual Input (WASD + Arrow Keys)

Always support both input schemes simultaneously. Kids may use either.

```typescript
// In create()
this.cursors = this.input.keyboard.createCursorKeys();
this.wasd = this.input.keyboard.addKeys({
  W: Phaser.Input.Keyboard.KeyCodes.W,
  A: Phaser.Input.Keyboard.KeyCodes.A,
  S: Phaser.Input.Keyboard.KeyCodes.S,
  D: Phaser.Input.Keyboard.KeyCodes.D,
}) as Record<string, Phaser.Input.Keyboard.Key>;

// Interaction key
this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

// In update() - check both
const left = this.cursors.left.isDown || this.wasd.A.isDown;
const right = this.cursors.right.isDown || this.wasd.D.isDown;
const up = this.cursors.up.isDown || this.wasd.W.isDown;
const down = this.cursors.down.isDown || this.wasd.S.isDown;

// Interaction with debounce
if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
  this.tryInteract();
}
```

---

## Interactive Objects

### Overlap Zone Pattern

```typescript
private nearbyObject: Phaser.GameObjects.Zone | null = null;

private onNearObject(
  player: Phaser.Physics.Arcade.Sprite,
  zone: Phaser.GameObjects.Zone
) {
  this.nearbyObject = zone;
  // Emit event so React UI shows the prompt
  this.game.events.emit('show-interact-prompt', {
    name: zone.getData('name'),
    x: zone.x,
    y: zone.y,
  });
}

private onLeaveObject() {
  this.nearbyObject = null;
  this.game.events.emit('hide-interact-prompt');
}

private tryInteract() {
  if (!this.nearbyObject) return;

  const objectName = this.nearbyObject.getData('name');
  this.game.events.emit('interact', { object: objectName });
}
```

### Checking Proximity in Update (if not using overlap)

```typescript
// Throttled proximity check - every 200ms, not every frame
if (time - this.lastProximityCheck > 200) {
  this.lastProximityCheck = time;
  this.checkProximity();
}
```

---

## Asset Loading Best Practices

### Prefer Atlases Over Individual Images

A single atlas load is far faster than dozens of individual image loads:

```typescript
// GOOD: One atlas with all crew sprites
this.load.atlas('crew', 'assets/sprites/crew.png', 'assets/sprites/crew.json');

// BAD: Individual images
this.load.image('captain-idle', 'assets/sprites/captain-idle.png');
this.load.image('captain-walk-1', 'assets/sprites/captain-walk-1.png');
// ... 40 more loads
```

### Loading Screen

Show a loading bar in the Boot scene:

```typescript
class BootScene extends Phaser.Scene {
  preload() {
    const bar = this.add.rectangle(640, 360, 400, 30, 0x4dc9f6);
    bar.setOrigin(0, 0.5);
    bar.setScale(0, 1);

    this.load.on('progress', (value: number) => {
      bar.setScale(value, 1);
    });

    this.load.on('complete', () => {
      this.scene.start('GameScene');
    });

    // Load all game assets here
    this.load.atlas('crew', 'assets/sprites/crew.png', 'assets/sprites/crew.json');
    // ...
  }
}
```

### Audio

- Use `.ogg` for best browser compatibility with Phaser.
- Provide `.mp3` fallback: `this.load.audio('bgm', ['assets/audio/bgm.ogg', 'assets/audio/bgm.mp3'])`.
- Keep audio files small. Compress to 128kbps or lower for SFX.

---

## React-Phaser Integration

This is the critical architectural pattern for the project. Phaser owns the game world; React owns the UI.

### Mounting Phaser Inside React

```tsx
import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { gameConfig } from '../game/config';

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      ...gameConfig,
      parent: containerRef.current,
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}
```

### Event Bridge (Phaser <-> React)

Use Phaser's built-in `EventEmitter` on the game instance to communicate:

```typescript
// --- Phaser side (in a scene) ---
// Emit to React
this.game.events.emit('player-entered-room', { room: 'lab' });
this.game.events.emit('resource-changed', { health: 80, energy: 60 });

// Listen from React
this.game.events.on('start-dialogue', (data: { npcId: string }) => {
  this.pausePlayerMovement();
});
```

```tsx
// --- React side ---
import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

export function useGameEvents(game: Phaser.Game | null) {
  const setCurrentRoom = useGameStore((s) => s.setCurrentRoom);
  const setResources = useGameStore((s) => s.setResources);

  useEffect(() => {
    if (!game) return;

    const onRoom = (data: { room: string }) => setCurrentRoom(data.room);
    const onResource = (data: { health: number; energy: number }) => setResources(data);

    game.events.on('player-entered-room', onRoom);
    game.events.on('resource-changed', onResource);

    return () => {
      game.events.off('player-entered-room', onRoom);
      game.events.off('resource-changed', onResource);
    };
  }, [game]);
}

// Sending events TO Phaser from React
function startDialogue(game: Phaser.Game, npcId: string) {
  game.events.emit('start-dialogue', { npcId });
}
```

### Zustand as Shared State

Zustand store acts as the single source of truth for data both Phaser and React need:

```typescript
import { create } from 'zustand';

interface GameState {
  health: number;
  energy: number;
  xp: number;
  level: number;
  currentRoom: string;
  inventory: (string | null)[];
  missionId: string | null;
  missionProgress: number;

  setResources: (r: Partial<Pick<GameState, 'health' | 'energy' | 'xp'>>) => void;
  setCurrentRoom: (room: string) => void;
  addToInventory: (item: string) => boolean;
  removeFromInventory: (item: string) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  health: 100,
  energy: 100,
  xp: 0,
  level: 1,
  currentRoom: 'bridge',
  inventory: [null, null, null, null, null],
  missionId: null,
  missionProgress: 0,

  setResources: (r) => set((s) => ({ ...s, ...r })),
  setCurrentRoom: (room) => set({ currentRoom: room }),
  addToInventory: (item) => {
    const inv = [...get().inventory];
    const emptySlot = inv.indexOf(null);
    if (emptySlot === -1) return false;
    inv[emptySlot] = item;
    set({ inventory: inv });
    return true;
  },
  removeFromInventory: (item) => {
    const inv = [...get().inventory];
    const idx = inv.indexOf(item);
    if (idx !== -1) inv[idx] = null;
    set({ inventory: inv });
  },
}));
```

---

## Performance Guidelines

### Object Pooling

For frequently created/destroyed objects (particles, projectiles, floating text):

```typescript
// Create a group as a pool
this.floatingTexts = this.add.group({
  classType: Phaser.GameObjects.Text,
  maxSize: 10,
  runChildUpdate: false,
});

// Get from pool instead of creating new
const text = this.floatingTexts.get(x, y, '') as Phaser.GameObjects.Text;
if (text) {
  text.setActive(true).setVisible(true);
  text.setText('+10 XP');
  this.tweens.add({
    targets: text,
    y: y - 40,
    alpha: 0,
    duration: 1000,
    onComplete: () => {
      text.setActive(false).setVisible(false);
    },
  });
}
```

### Texture Atlases

- Pack all related sprites into a single atlas using TexturePacker or free alternatives.
- Maximum atlas size: 2048x2048 for broad device support.
- One atlas per category: `crew.png`, `ship-objects.png`, `ui-icons.png`.

### Update Loop Discipline

- **Never** do file I/O, network calls, or heavy computation in `update()`.
- Throttle proximity/distance checks to every 100-200ms using a time accumulator.
- Use events to communicate state changes, not polling in update.
- Cache references in `create()` — never use `this.children.getByName()` in `update()`.

### Scene Management

- Use multiple scenes layered: `GameScene` (world) + `UIScene` (HUD overlays in Phaser if needed).
- `this.scene.launch('UIScene')` runs it in parallel, not replacing the game scene.
- Pause scenes that aren't visible: `this.scene.pause('GameScene')` during menus.

---

## Project File Structure

```
src/
  game/
    config.ts           # Phaser game configuration
    scenes/
      BootScene.ts      # Asset loading, loading bar
      GameScene.ts      # Main gameplay scene
    objects/
      Player.ts         # Player character class
      NPC.ts            # NPC character class
      InteractiveObject.ts
    utils/
      AnimationFactory.ts
      PhysicsHelper.ts
  components/
    GameCanvas.tsx       # React wrapper for Phaser
    hud/
      HUD.tsx            # Main HUD container
      HealthBar.tsx
      EnergyBar.tsx
      InventoryBar.tsx
      MissionPanel.tsx
      Minimap.tsx
    dialogue/
      DialogueBox.tsx
    menus/
      PauseMenu.tsx
      MainMenu.tsx
  store/
    gameStore.ts         # Zustand store
  hooks/
    useGameEvents.ts     # Phaser <-> React event bridge
  assets/
    sprites/
    tilemaps/
    tilesets/
    audio/
    ui/
```
