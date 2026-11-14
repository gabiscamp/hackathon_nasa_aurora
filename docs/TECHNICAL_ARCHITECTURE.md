# Aurora Station -- Technical Architecture

## Overview

Aurora Station uses a dual-layer architecture: Phaser 3 renders the game world in a canvas element, and React renders the UI as HTML overlays on top. The two layers communicate through a shared event bus and Zustand stores.

```
┌─────────────────────────────────────────────┐
│                  Browser                     │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │          React Layer (HTML/CSS)         │ │
│  │  HUD, Dialogue, Missions, Menus        │ │
│  │  Positioned absolutely over canvas      │ │
│  └──────────────┬──────────────────────────┘ │
│                 │ Zustand + EventEmitter     │
│  ┌──────────────┴──────────────────────────┐ │
│  │         Phaser Layer (Canvas)           │ │
│  │  Game world, sprites, tilemap, physics  │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │         Engine Layer (Pure TS)          │ │
│  │  Resource calc, event logic, endings    │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │         Data Layer (Static TS)          │ │
│  │  Missions, crew, endings, rooms         │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## Phaser Layer

The game world is rendered entirely in Phaser 3 using Arcade Physics.

### Scenes

#### BootScene
- **Purpose**: Load all assets (spritesheets, tilemap JSON, audio stubs)
- **Flow**: Shows loading bar, then transitions to GameScene
- **Assets loaded**: Player spritesheet, crew spritesheets, tilemap, tile images, UI icons

#### GameScene
- **Purpose**: Main gameplay. Renders the station, characters, and interactive objects.
- **Contains**:
  - Tilemap rendering (station layout)
  - Player character with WASD/arrow key movement
  - NPC crew members (Kira, Leo, Maya) positioned in their rooms
  - Interactive objects (consoles, panels, crates) with proximity detection
  - Collision layer from tilemap (walls, furniture)
  - Camera following player with deadzone
- **Physics**: Arcade physics for player movement and collision detection
- **Interaction zones**: Overlap checks between player and interactable objects. When overlap detected, emit `'interact-available'` event.

#### UIScene
- **Purpose**: Phaser-side visual effects that need to be in the canvas (particles, screen shake, flash effects)
- **Runs parallel to GameScene** (Phaser supports multiple active scenes)
- **Contains**: Screen flash on critical events, particle effects for damage/repair

### Tilemap

- Created with Tiled map editor, exported as JSON
- **Layers**:
  - `ground` -- Floor tiles
  - `walls` -- Wall tiles (collision enabled)
  - `furniture` -- Desks, beds, equipment (collision enabled)
  - `objects` -- Interactive objects (overlap detection, no collision)
  - `overlay` -- Above-player elements (ceiling details, lighting)
- **Tile size**: 32x32 pixels
- **Map size**: Approximately 60x40 tiles (1920x1280 pixels)

### Player Character

- **Sprite**: 32x32 pixel character with 4-direction walk animation (4 frames each)
- **Movement**: WASD or arrow keys. Speed: 160 pixels/second.
- **Collision**: Arcade physics body, collides with walls and furniture layers
- **Interaction**: Press E (or Space) when near an interactable to trigger it
- **Camera**: Follows player with 100px deadzone in each direction. Clamped to map bounds.

### NPC Characters

- **Sprites**: 32x32 each, with idle animation (2 frames)
- **Position**: Placed in their primary rooms. Can be relocated by mission events.
- **Interaction**: Walk near + press E. Emits `'interact'` event with NPC ID.
- **Visual**: Name label floating above sprite. Border glow in character color when interactable.

## React Layer

HTML/CSS overlay positioned absolutely on top of the Phaser canvas. Handles all UI that benefits from HTML rendering (text, buttons, complex layouts).

### Component Tree

```
<App>
  ├── <PhaserGame />          // Canvas container
  ├── <HUD />                 // Always visible during gameplay
  │   ├── <ResourceBar />     // Energy, Oxygen, Shielding (x3)
  │   ├── <CrewPortraits />   // 4 crew member portraits with status
  │   ├── <DayCounter />      // "Day 12 / 90"
  │   └── <AlertBanner />     // Notification slide-in
  ├── <DialogueBox />         // Bottom of screen, character dialogue
  │   ├── <Portrait />
  │   ├── <DialogueText />    // Typewriter effect
  │   └── <ContinuePrompt />
  ├── <MissionPanel />        // Full overlay for mission events
  │   ├── <MissionBriefing />
  │   ├── <ChoiceButtons />   // 2-3 choice options
  │   └── <OutcomeDisplay />
  ├── <NASAPopup />           // Educational fact after missions
  ├── <DaySummary />          // End-of-day resource summary
  ├── <Inventory />           // Supply check panel
  ├── <PauseMenu />           // Pause, settings, quit
  ├── <TitleScreen />         // Main menu
  ├── <CrewIntro />           // Crew introduction sequence
  └── <EndingScreen />        // End-of-game results
```

### Styling

- Tailwind CSS for all React component styling
- Custom color tokens defined in `tailwind.config.js` matching the design system
- `pointer-events: none` on the overlay container, `pointer-events: auto` on interactive elements only
- This allows clicks to pass through to the Phaser canvas except where UI elements exist

## Bridge: Phaser-React Communication

### EventEmitter

A shared `EventEmitter3` instance acts as the communication bus between Phaser and React.

```typescript
// src/utils/eventBus.ts
import EventEmitter from 'eventemitter3';
export const eventBus = new EventEmitter();
```

#### Events Emitted by Phaser

| Event | Payload | Trigger |
|-------|---------|---------|
| `'interact'` | `{ type: 'npc' \| 'object', id: string }` | Player presses E near interactable |
| `'interact-available'` | `{ type: string, id: string }` | Player enters interaction range |
| `'interact-unavailable'` | `{}` | Player leaves interaction range |
| `'enter-room'` | `{ roomId: string }` | Player walks into a new room |
| `'player-moved'` | `{ x: number, y: number }` | Player position update (throttled) |

#### Events Emitted by React

| Event | Payload | Trigger |
|-------|---------|---------|
| `'choice-made'` | `{ missionId: string, choiceId: string }` | Player selects a mission choice |
| `'menu-opened'` | `{}` | Pause menu opens (Phaser should pause) |
| `'menu-closed'` | `{}` | Pause menu closes (Phaser should resume) |
| `'dialogue-complete'` | `{ npcId: string }` | Dialogue sequence finished |
| `'day-advance'` | `{}` | Trigger next day |
| `'move-npc'` | `{ npcId: string, roomId: string }` | Relocate NPC due to mission |

### Zustand Stores

Zustand stores are the single source of truth. Both Phaser scenes and React components read from and write to the same stores.

#### useGameStore

```typescript
interface GameState {
  currentScene: 'title' | 'intro' | 'game' | 'ending';
  currentDay: number;          // 1-90
  currentPhase: 'briefing' | 'explore' | 'mission' | 'summary';
  isPaused: boolean;
  commanderName: string;
  commanderColor: string;
  act: 1 | 2 | 3;             // Derived from currentDay

  // Actions
  setScene: (scene: GameState['currentScene']) => void;
  advanceDay: () => void;
  setPhase: (phase: GameState['currentPhase']) => void;
  setPaused: (paused: boolean) => void;
  setCommander: (name: string, color: string) => void;
}
```

#### useResourceStore

```typescript
interface ResourceState {
  energy: number;              // 0-100
  oxygen: number;              // 0-100
  shielding: number;           // 0-100

  // Actions
  setResource: (key: 'energy' | 'oxygen' | 'shielding', value: number) => void;
  applyDelta: (deltas: { energy?: number; oxygen?: number; shielding?: number }) => void;
  getAverageResources: () => number;
  isAnyCritical: () => boolean;
}
```

#### useCrewStore

```typescript
interface CrewMember {
  id: string;
  name: string;
  role: string;
  color: string;
  health: number;              // 0-100
  morale: number;              // 0-100
  available: boolean;          // false if assigned to multi-day task
  unavailableUntilDay: number | null;
  currentRoom: string;
}

interface CrewState {
  crew: Record<string, CrewMember>;

  // Actions
  updateCrew: (id: string, updates: Partial<CrewMember>) => void;
  setAvailability: (id: string, available: boolean, untilDay?: number) => void;
}
```

#### useMissionStore

```typescript
interface MissionState {
  currentMission: Mission | null;
  missionHistory: MissionResult[];
  activeMissionId: string | null;

  // Actions
  startMission: (mission: Mission) => void;
  completeMission: (result: MissionResult) => void;
  getMissionById: (id: string) => Mission | undefined;
}
```

#### useNarrativeStore

```typescript
interface NarrativeState {
  activeDialogue: DialogueLine[] | null;
  dialogueIndex: number;
  alerts: Alert[];
  nasaPopup: NASAFact | null;

  // Actions
  startDialogue: (lines: DialogueLine[]) => void;
  advanceDialogue: () => void;
  endDialogue: () => void;
  addAlert: (alert: Alert) => void;
  showNASAPopup: (fact: NASAFact) => void;
}
```

## Engine Layer (Pure TypeScript)

Business logic with zero framework dependencies. Can be unit tested in isolation.

### resourceEngine.ts

```typescript
// Calculate daily resource changes based on current state
function calculateDailyDrain(state: ResourceState, day: number, act: number): ResourceDeltas;

// Apply mission choice consequences
function applyChoiceConsequences(choice: Choice, resources: ResourceState): ResourceDeltas;

// Check interconnection effects (low energy → oxygen drops)
function calculateInterconnections(resources: ResourceState): ResourceDeltas;

// Clamp all resources to 0-100
function clampResources(resources: ResourceState): ResourceState;
```

### eventResolver.ts

```typescript
// Determine which mission triggers on a given day
function getMissionForDay(day: number, history: MissionResult[]): Mission | null;

// Resolve a choice into outcomes
function resolveChoice(mission: Mission, choiceId: string, crew: CrewState): MissionOutcome;

// Check if any conditional events should fire
function checkConditionalEvents(state: GameState, resources: ResourceState): Event[];
```

### endingCalculator.ts

```typescript
// Determine which ending the player gets
function calculateEnding(resources: ResourceState, crew: CrewState): EndingType;

// Generate the final stats report
function generateReport(history: MissionResult[], resources: ResourceState): MissionReport;
```

## Data Layer (Static TypeScript)

Typed static data files. No logic, just structured content.

### missions.ts
- Array of 13 `Mission` objects
- Each mission: id, title, day, act, basedOn (real NASA incident), briefingText, choices (2-3), nasaFact
- Each choice: id, label, description, consequences (resource deltas), crewEffects, outcomeText

### crew.ts
- Array of 4 `CrewMember` definitions
- Each: id, name, role, color, defaultRoom, personality traits, dialogue lines

### endings.ts
- Three `Ending` objects (good, medium, bad)
- Each: threshold, title, description, crewReactions

### rooms.ts
- Array of 8 `Room` definitions
- Each: id, name, description, interactables, position on map

## File Structure

```
src/
├── game/                      # Phaser game code
│   ├── PhaserGame.tsx         # React component that mounts Phaser
│   ├── config.ts              # Phaser game configuration
│   ├── scenes/
│   │   ├── BootScene.ts       # Asset loading
│   │   ├── GameScene.ts       # Main gameplay scene
│   │   └── UIScene.ts         # Visual effects overlay
│   ├── entities/
│   │   ├── Player.ts          # Player character class
│   │   ├── NPC.ts             # NPC character class
│   │   └── InteractableObject.ts  # Interactive station objects
│   └── systems/
│       ├── InteractionSystem.ts   # Proximity detection + interaction
│       ├── CameraSystem.ts        # Camera follow + deadzone
│       └── DayCycleSystem.ts      # Day progression logic
├── components/                # React UI components
│   ├── hud/
│   │   ├── HUD.tsx
│   │   ├── ResourceBar.tsx
│   │   ├── CrewPortraits.tsx
│   │   ├── DayCounter.tsx
│   │   └── AlertBanner.tsx
│   ├── dialogue/
│   │   ├── DialogueBox.tsx
│   │   └── NASAPopup.tsx
│   ├── missions/
│   │   ├── MissionPanel.tsx
│   │   ├── MissionBriefing.tsx
│   │   ├── ChoiceButtons.tsx
│   │   └── OutcomeDisplay.tsx
│   ├── screens/
│   │   ├── TitleScreen.tsx
│   │   ├── CrewIntro.tsx
│   │   ├── DaySummary.tsx
│   │   └── EndingScreen.tsx
│   └── shared/
│       ├── Panel.tsx
│       ├── Button.tsx
│       └── Portrait.tsx
├── stores/                    # Zustand state management
│   ├── useGameStore.ts
│   ├── useResourceStore.ts
│   ├── useCrewStore.ts
│   ├── useMissionStore.ts
│   └── useNarrativeStore.ts
├── engine/                    # Pure TypeScript logic
│   ├── resourceEngine.ts
│   ├── eventResolver.ts
│   └── endingCalculator.ts
├── data/                      # Static game data
│   ├── missions.ts
│   ├── crew.ts
│   ├── endings.ts
│   └── rooms.ts
├── utils/
│   ├── eventBus.ts            # Shared EventEmitter
│   └── nasaApi.ts             # DONKI + APOD fetch helpers
├── hooks/
│   └── useNasaData.ts         # React hook for NASA API data
├── styles/
│   └── index.css              # Tailwind imports + global styles
├── assets/                    # Static assets
│   ├── sprites/
│   ├── tilemaps/
│   └── audio/
├── App.tsx                    # Root component
└── main.tsx                   # Entry point
```

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Build | Vite | 5.x |
| UI Framework | React | 18.x |
| Game Engine | Phaser | 3.80+ |
| Language | TypeScript | 5.x |
| State | Zustand | 4.x |
| Styling | Tailwind CSS | 3.x |
| Event Bus | eventemitter3 | 5.x |
| Deploy | Vercel | -- |

## NASA API Integration

### DONKI (Space Weather Database)

- **Endpoint**: `https://api.nasa.gov/DONKI/CME`
- **Usage**: Fetch recent coronal mass ejection data for Mission 6
- **Fallback**: If API is down or no recent data, use scripted solar storm data
- **Rate limit**: 30 requests/hour with demo key, 1000/hour with registered key

### APOD (Astronomy Picture of the Day)

- **Endpoint**: `https://api.nasa.gov/planetary/apod`
- **Usage**: Display as "Letter from Earth" in Common Room
- **Cache**: Store today's APOD in localStorage to avoid repeated calls
- **Display**: Show image thumbnail + title + simplified explanation

## Performance Considerations

- Phaser canvas renders at 60fps. React overlay renders only on state change.
- Tilemap uses static layers (not re-rendered each frame).
- Event bus messages are throttled where appropriate (player position: max 10/sec).
- NASA API calls are cached in localStorage with 24h TTL.
- Asset loading is sequential in BootScene with a visible progress bar.
- All sprites use texture atlases to minimize draw calls.
