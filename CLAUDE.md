# STARSHIP EXPLORER (Aurora Station)

**NASA Space Apps Challenge 2026 — Hackathon Project**

## Project Overview

A 2D top-down space station exploration game for kids aged 7-12. The player walks through the Aurora Station, interacts with crew members, manages resources (health, energy, oxygen, food), and makes decisions during a 90-day Mars orbit mission. The game teaches space science concepts through narrative gameplay.

## Tech Stack

- **React 18** — UI layer (HUD, menus, dialogue, mission panels)
- **TypeScript** — strict mode, no `any`
- **Vite** — build tool and dev server
- **Phaser 3** — game engine (movement, physics, camera, sprites, interactions)
- **Tailwind CSS** — styling for React UI overlays
- **Zustand** — shared state between Phaser and React

## Architecture

```
┌─────────────────────────────────────────────┐
│                  Browser                     │
│  ┌──────────────┐  ┌─────────────────────┐  │
│  │  React UI    │  │   Phaser Canvas      │  │
│  │  (HUD, menus,│  │   (ship world,       │  │
│  │   dialogue)  │  │    player, NPCs,     │  │
│  │              │  │    physics, camera)   │  │
│  └──────┬───────┘  └──────────┬──────────┘  │
│         │     EventEmitter     │             │
│         └──────────┬───────────┘             │
│              ┌─────┴──────┐                  │
│              │  Zustand    │                  │
│              │  (shared    │                  │
│              │   state)    │                  │
│              └─────────────┘                  │
└─────────────────────────────────────────────┘
```

- **Phaser** handles the game world: player movement, arcade physics, tilemap rendering, camera follow, sprite animations, collision detection, and proximity-based interaction zones.
- **React** handles all UI overlays: HUD bars, inventory, mission panel, dialogue boxes, menus, and settings.
- **Zustand** is the single source of truth for data both systems need (health, energy, inventory, mission state).
- **Events** bridge the two: Phaser emits events (e.g., `player-entered-room`, `resource-changed`), React listens and updates UI. React emits events (e.g., `start-dialogue`), Phaser listens and adjusts gameplay.

## Visual References

Design reference wireframes are stored in:

- `references/wireframe/spaceship-reference-01.png` — Crew management view (4 crew visible, crew portrait column on left)
- `references/wireframe/spaceship-reference-02.png` — **PRIMARY** single-player exploration view (HUD layout, room arrangement, inventory bar)

These references define the canonical ship layout, HUD positions, and visual style.

## Code Conventions

- **TypeScript strict mode** — no `any` types, no implicit any, strict null checks
- **React components**: `PascalCase` (e.g., `HealthBar.tsx`, `MissionPanel.tsx`)
- **Phaser game objects**: `camelCase` (e.g., `this.player`, `this.wallLayer`)
- **Store files**: `camelCase` (e.g., `gameStore.ts`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `PLAYER_SPEED`, `MAX_INVENTORY_SLOTS`)
- **CSS**: Tailwind utility classes. Custom CSS only when Tailwind can't express it.
- **File organization**: see `phaser-game-development` skill for directory structure

## Skills

This project uses three Claude skills:

1. **spaceship-game-design** — Visual identity, art direction, color palette, typography, ship layout rules, character design, and HUD specifications. Consult before any visual decision.
2. **phaser-game-development** — Phaser 3 patterns: scene lifecycle, arcade physics, tilemaps, animations, camera, input, React-Phaser integration, and performance guidelines.
3. **game-qa-visual-testing** — QA test procedures for movement, collision, interaction, HUD, missions, visual regression, and Playwright automation.

## Rules

- **NEVER** alter the visual identity (colors, typography, HUD layout, art style) without first checking the reference wireframes and the `spaceship-game-design` skill.
- **NEVER** replace game assets with emoji in production code. Emoji may be used only as temporary placeholders during early prototyping and must be explicitly marked with `// TODO: replace with real asset`.
- **NEVER** use `any` type. Define proper interfaces for all game objects and state.
- **ALWAYS** test movement and collision after modifying physics or tilemap code.
- **ALWAYS** keep the HUD coverage under 20% of screen area.
- **ALWAYS** support both WASD and arrow key input simultaneously.
