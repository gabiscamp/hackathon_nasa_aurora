# Aurora Station -- Development Roadmap

## Phase Overview

| Phase | Name | Status | Description |
|-------|------|--------|-------------|
| 0 | Environment Setup | Done | Vite + React + Phaser + Tailwind + TypeScript |
| 1 | Phaser Boot | Next | Empty scene, camera, dark space background |
| 2 | Station Tilemap | Pending | Load ship layout, walls, floor, rooms |
| 3 | Player Character | Pending | Sprite, WASD movement, collision |
| 4 | HUD Overlay | Pending | React components over canvas |
| 5 | Interaction System | Pending | Walk near + press E to interact |
| 6 | Mission System | Pending | Day cycle, events, choices, consequences |
| 7 | Narrative | Pending | Dialogue, crew conversations, Earth messages |
| 8 | NASA Integration | Pending | DONKI data, APOD, educational popups |
| 9 | Polish | Pending | Animations, transitions, sound, tutorial |
| 10 | Submission | Pending | Build, deploy, test, submit |

---

## Phase 0: Environment Setup (DONE)

**Goal**: Working dev environment with all dependencies.

- [x] Initialize Vite + React + TypeScript project
- [x] Install and configure Tailwind CSS
- [x] Install Zustand for state management
- [x] Create project structure (src/game/, src/components/, src/stores/, src/engine/, src/data/)
- [x] Create Zustand stores (useGameStore, useResourceStore, useCrewStore, useMissionStore, useNarrativeStore)
- [x] Create engine modules (resourceEngine, eventResolver, endingCalculator)
- [x] Create static data files (missions.ts with 7 of 13 missions, crew.ts, endings.ts)
- [x] Create initial React screens (TitleScreen, MissionBriefing, CrewIntro, EndingScreen)
- [x] Verify npm run dev works

---

## Phase 1: Phaser Boot

**Goal**: Phaser running inside React, rendering a dark space background.

### Tasks

- [ ] Install Phaser 3 (npm install phaser)
- [ ] Create src/game/config.ts -- Phaser game configuration (800x600 or responsive, Arcade physics, transparent background)
- [ ] Create src/game/PhaserGame.tsx -- React component that mounts the Phaser game instance into a div
- [ ] Create src/game/scenes/BootScene.ts -- Loads a placeholder asset, shows "Loading..." text, transitions to GameScene
- [ ] Create src/game/scenes/GameScene.ts -- Empty scene with dark blue/space background color (#0a0e27)
- [ ] Mount PhaserGame in App.tsx so the canvas renders
- [ ] Verify: Dark canvas visible in browser, no errors in console, React components still render on top

### Acceptance Criteria

- Phaser canvas renders at the correct size
- Space background color matches #0a0e27
- React overlay renders on top of the canvas (verify with a test element)
- No memory leaks on hot-reload (Phaser instance cleaned up properly)

---

## Phase 2: Station Tilemap

**Goal**: The Aurora Station layout rendered as a tilemap the camera can pan across.

### Tasks

- [ ] Design station layout in Tiled (or create a simple JSON tilemap manually)
- [ ] Create tileset image: 32x32 tiles for floor, walls, furniture, room markers
- [ ] Define rooms in tilemap: Bridge, Crew Quarters, Lab, Medical Bay, Engineering, Storage, Common Room, Airlock
- [ ] Create tilemap layers: ground, walls (collision), furniture (collision), objects (no collision), overlay
- [ ] Load tilemap and tileset in BootScene
- [ ] Render tilemap in GameScene
- [ ] Set up collision on walls and furniture layers
- [ ] Configure camera bounds to match map size

### Acceptance Criteria

- Station layout visible with distinct rooms
- Walls and furniture tiles rendered
- Camera can be manually tested (before player exists, use arrow keys to pan)
- Room boundaries are clear visually

### Fallback

If Tiled is too complex for the timeline, create the tilemap programmatically using Phaser's Tilemap.createBlankDynamic and place tiles via code. Less flexible but faster.

---

## Phase 3: Player Character

**Goal**: Player character walks through the station with collision.

### Tasks

- [ ] Create or source a 32x32 character spritesheet (4 directions x 4 frames = 16 frames minimum)
- [ ] Create src/game/entities/Player.ts class extending Phaser.Physics.Arcade.Sprite
- [ ] Implement WASD + arrow key input handling
- [ ] Set player movement speed (160 px/sec)
- [ ] Add collision between player and walls/furniture layers
- [ ] Create walk animations (down, up, left, right) from spritesheet
- [ ] Set idle frame when not moving
- [ ] Configure camera to follow player with deadzone (100px each direction)
- [ ] Clamp camera to tilemap bounds
- [ ] Spawn player in the Bridge room

### Acceptance Criteria

- Player character visible on the tilemap
- WASD and arrow keys move the character in 4 directions
- Walk animation plays while moving, idle when stopped
- Player cannot walk through walls or furniture
- Camera follows player smoothly

### Fallback

If no spritesheet available, use a colored rectangle (32x32) as placeholder. Movement and collision still work.

---

## Phase 4: HUD Overlay

**Goal**: React-based HUD showing resources, crew, and day counter on top of the game canvas.

### Tasks

- [ ] Create src/components/hud/HUD.tsx -- Container positioned at top of viewport
- [ ] Create src/components/hud/ResourceBar.tsx -- Animated bar with icon, label, and percentage
- [ ] Create src/components/hud/CrewPortraits.tsx -- Row of 4 circular portraits with colored borders
- [ ] Create src/components/hud/DayCounter.tsx -- "Day X / 90" with act label
- [ ] Create src/components/hud/AlertBanner.tsx -- Slide-in notification for events
- [ ] Style all components with Tailwind using design system tokens
- [ ] Set pointer-events: none on overlay container, pointer-events: auto on interactive elements
- [ ] Connect HUD to Zustand stores (useResourceStore, useCrewStore, useGameStore)
- [ ] Add color transitions: bars change color at warning (amber) and critical (red) thresholds
- [ ] Add pulse animation for critical resources

### Acceptance Criteria

- HUD visible on top of game canvas
- Resource bars show current values and update in real time when store changes
- Crew portraits display with correct accent colors
- Day counter shows current day
- Clicking through empty HUD space reaches the Phaser canvas (pointer-events passthrough)
- Bars change color at 50%, 20% thresholds

---

## Phase 5: Interaction System

**Goal**: Player walks near crew/objects and presses E to interact.

### Tasks

- [ ] Create src/game/entities/NPC.ts -- NPC class with idle animation and interaction zone
- [ ] Create src/game/entities/InteractableObject.ts -- Station objects with proximity detection
- [ ] Create src/game/systems/InteractionSystem.ts -- Manages overlap checks and E-key input
- [ ] Place Kira in Engineering, Leo in Medical Bay, Maya in Lab
- [ ] Place interactive objects in each room (consoles, panels, etc.)
- [ ] Show interaction prompt ("Press E") when player is near an interactable
- [ ] Emit 'interact' event on eventBus when player presses E
- [ ] React receives event and opens appropriate UI (dialogue, panel, etc.)
- [ ] Create src/utils/eventBus.ts with shared EventEmitter instance
- [ ] NPC name labels visible above sprites with character accent color

### Acceptance Criteria

- Walking near an NPC shows "Press E" prompt
- Pressing E triggers the interaction event
- React receives the event and can respond (e.g., open dialogue box)
- Interaction prompt disappears when player walks away
- Works for both NPCs and objects

---

## Phase 6: Mission System

**Goal**: Day cycle with mission events, player choices, and resource consequences.

### Tasks

- [ ] Create src/game/systems/DayCycleSystem.ts -- Manages day progression and phases
- [ ] Implement day flow: briefing -> explore -> mission -> summary
- [ ] Complete remaining 6 missions in src/data/missions.ts (bring total to 13)
- [ ] Create src/components/missions/MissionPanel.tsx -- Full-screen mission overlay
- [ ] Create src/components/missions/MissionBriefing.tsx -- Situation description
- [ ] Create src/components/missions/ChoiceButtons.tsx -- 2-3 choices with trade-off descriptions
- [ ] Create src/components/missions/OutcomeDisplay.tsx -- Result after choice
- [ ] Create src/components/screens/DaySummary.tsx -- End-of-day resource changes
- [ ] Wire choices to resourceEngine: apply consequences to stores
- [ ] Wire crew effects: availability changes, health/morale impacts
- [ ] Implement act progression (Act 1: days 1-30, Act 2: 31-60, Act 3: 61-90)
- [ ] Implement ending trigger on Day 90

### Acceptance Criteria

- Days advance correctly from 1 to 90
- Missions trigger on their designated days
- Player sees briefing, makes a choice, sees outcome
- Resource bars update after choices
- Crew availability changes are reflected in the UI
- Reaching Day 90 triggers the ending calculation

---

## Phase 7: Narrative

**Goal**: Dialogue system, crew conversations, and "Letters from Earth."

### Tasks

- [ ] Create src/components/dialogue/DialogueBox.tsx -- Bottom-screen dialogue with portrait, name, and typewriter text
- [ ] Implement typewriter text effect (30ms per character)
- [ ] Add "click to advance" or "click to skip" for dialogue
- [ ] Write crew dialogue lines for each room/interaction context
- [ ] Implement morning briefing dialogue sequence
- [ ] Create Earth message system (daily text from mission control)
- [ ] Add crew reactions to mission outcomes (short dialogue after choices)
- [ ] Wire dialogue to useNarrativeStore

### Acceptance Criteria

- Talking to crew shows dialogue box with portrait and typewriter text
- Clicking advances to next line or skips typewriter
- Different dialogue based on current day/act/recent events
- Morning briefings set the tone for each day

---

## Phase 8: NASA Integration

**Goal**: Real NASA data and educational content.

### Tasks

- [ ] Create src/utils/nasaApi.ts -- Fetch helpers for DONKI and APOD APIs
- [ ] Create src/hooks/useNasaData.ts -- React hook for NASA data with caching
- [ ] Integrate DONKI CME data into Mission 6 (Solar Storm Warning)
- [ ] Integrate APOD into "Letters from Earth" in Common Room
- [ ] Create src/components/dialogue/NASAPopup.tsx -- Educational fact popup after missions
- [ ] Add NASA facts to all 13 missions
- [ ] Implement localStorage caching for API responses (24h TTL)
- [ ] Add fallback data for when APIs are unavailable
- [ ] Display NASA logo/attribution where required

### Acceptance Criteria

- Solar storm mission references real DONKI data when available
- APOD image and description shown in Common Room
- NASA popup appears after each mission with real science facts
- Game works fully offline with fallback data

---

## Phase 9: Polish

**Goal**: Make the game feel complete and polished.

### Tasks

- [ ] Add screen transitions (fade in/out between scenes)
- [ ] Add panel entrance/exit animations (slide, fade)
- [ ] Add resource change animations (number counting up/down)
- [ ] Add sound effect stubs (button clicks, alerts, ambient) -- even if just placeholder
- [ ] Create tutorial overlay for first 2 days (teach movement, interaction, choices)
- [ ] Add room name labels when entering rooms
- [ ] Add visual feedback for critical resource states (screen tint, particle effects)
- [ ] Review all text for reading level (target: simple English, short sentences)
- [ ] Test full game flow from Day 1 to Day 90
- [ ] Fix any bugs found during playthrough

### Acceptance Criteria

- Game feels smooth and responsive
- Transitions are not jarring
- Tutorial teaches basic mechanics without overwhelming
- Full 90-day playthrough is possible without crashes
- Text is readable and age-appropriate

---

## Phase 10: Submission

**Goal**: Deploy and submit.

### Tasks

- [ ] Run npm run build -- verify production build succeeds
- [ ] Deploy to Vercel (or Netlify as backup)
- [ ] Test deployed version on multiple browsers (Chrome, Firefox, Edge)
- [ ] Test on tablet resolution (1024x768)
- [ ] Write submission fields: title, description, how it uses NASA data, tech stack
- [ ] Take screenshots for submission
- [ ] Record short gameplay video or GIF if required
- [ ] Final review of all content for accuracy and tone
- [ ] Submit

### Acceptance Criteria

- Game loads and plays on the deployed URL
- No console errors in production
- All NASA data integration works in production
- Submission fields are complete and compelling
