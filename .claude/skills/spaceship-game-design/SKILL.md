---
name: spaceship-game-design
description: Visual identity, art direction, UI/HUD rules, ship layout, and character design for the Starship Explorer (Aurora Station) 2D top-down game. All visual decisions must align with the reference images.
---

# Spaceship Game Design Skill

## Reference Images

Two reference wireframes exist in `references/wireframe/`:

### Reference 02 (PRIMARY) — `spaceship-reference-02.png`

This is the canonical layout and HUD design. Key observations:

- **Single player character** standing in the center of the ship.
- **~7 rooms** visible:
  - **Bridge / Cockpit** (top-center) — pilot seat, forward viewport, navigation console.
  - **Crew Quarters** (upper-left) — bunk beds along the wall, personal lockers.
  - **Lab** (upper-right) — blue containment tank, monitoring screens, sample table.
  - **Storage** (left) — stacked crates, supply shelves.
  - **Medical Bay** (center-bottom) — red cross marker, medical bed, supply cabinet.
  - **Common Room** (center-right) — dining table with chairs, recreation area.
  - **Engineering** (implied, lower area) — power conduits, machinery.
- **HUD elements**:
  - **Top-left**: Character portrait in a rounded frame. Below it, three horizontal bars — Health (red/green), Energy (blue), XP (yellow) — plus a level indicator badge.
  - **Top-right**: Mission panel showing current objective text and progress.
  - **Bottom-center**: Inventory bar with 5 equidistant slots. Example contents: bag, laptop, medkit, wrench, one empty slot.
  - **Bottom-right**: Minimap / compass rose showing ship orientation and nearby points of interest.
- **Background**: Dark space with scattered asteroids drifting past the viewport.

### Reference 01 (COMPLEMENTARY) — `spaceship-reference-01.png`

Shows the crew management perspective:

- **4 crew members** visible simultaneously, each in a different room performing tasks.
- **Left HUD column**: All 4 crew portraits stacked vertically. Each portrait has a red (health) and blue (energy) bar beside it.
- **Top-right**: Same mission panel style as Reference 02.
- **Bottom**: Same inventory bar layout.
- **Background**: A planet (Mars) visible below the ship through viewports.

---

## Art Direction

### Style

**Painterly / cel-shaded hybrid.** The game uses hand-painted 2D environments with cartoon clarity. Think "animated storybook in space" — rich textures but clean, readable shapes.

This is **NOT pixel art**. Assets should have smooth lines, painted lighting, and visible brushwork texture in backgrounds. Outlines are soft or absent, relying on color contrast for separation.

### Lighting Philosophy

- **Warm ambers** for interior overhead lights, lanterns, and cozy areas (crew quarters, common room).
- **Cool blues and teals** for screens, holographic displays, lab equipment, and the cockpit viewport glow.
- **Neutral grays** for structural elements — walls, floors, door frames, corridors.
- **Red** exclusively for warnings, damage indicators, and critical alerts.
- Rooms should feel individually lit. The lab feels cooler than the common room. Engineering has harsher overhead light.

### Perspective

Top-down with a **slight three-quarter angle** (approximately 20-30 degrees from directly overhead). This means:

- You can see the tops AND the front faces of furniture.
- Walls have visible thickness on their south-facing side.
- Characters have visible heads and shoulders, not just the top of the head.
- Consistent light source from the upper-left.

---

## Color Palette

Use these exact values as the canonical palette. Every asset, UI element, and effect must derive from these:

| Token | Hex | Usage |
|---|---|---|
| `bg-space` | `#0a0e27` | Space background, deep UI panels |
| `ship-hull` | `#8b7b6b` | Exterior hull, structural beams |
| `ship-floor` | `#9a8f82` | Walkable floor tiles |
| `ship-walls` | `#706558` | Interior walls, partitions |
| `accent-blue` | `#4dc9f6` | Screens, tech highlights, energy bars |
| `accent-amber` | `#f5a623` | Lights, warmth, XP bar, interactive prompts |
| `accent-red` | `#e74c3c` | Health bar (low), warnings, damage |
| `accent-green` | `#2ecc71` | Health bar (full), success states, oxygen |
| `text-light` | `#f0ece4` | Primary text on dark backgrounds |
| `panel-bg` | `rgba(20, 27, 45, 0.9)` | HUD panel backgrounds |

### Palette Application Rules

- Background gradients go from `bg-space` to a slightly lighter navy, never pure black.
- Ship interior always contrasts against the dark space — the hull is the brightest structural element.
- Interactive objects get a subtle `accent-amber` outline or glow on hover/proximity.
- Disabled/locked items use 40% opacity of their normal color.

---

## Typography

**Font Family**: Nunito (Google Fonts) — rounded, kid-friendly, highly legible sans-serif.

**Fallback Stack**: `'Nunito', 'Nunito Sans', system-ui, -apple-system, sans-serif`

### Size Scale

| Token | Size | Weight | Usage |
|---|---|---|---|
| `text-sm` | 14px | 400 | Tooltips, secondary info, item counts |
| `text-base` | 18px | 400 | Body text, dialogue, descriptions |
| `text-lg` | 24px | 700 | Section headers, room names, crew names |
| `text-xl` | 32px | 800 | Screen titles, mission complete banners |

### Typography Rules

- All game text uses Nunito. No mixing fonts.
- Line height: 1.5 for body, 1.2 for headings.
- Letter spacing: normal for body, +0.5px for headings.
- Text on dark panels always uses `text-light` (#f0ece4). Never pure white (#fff).
- Numbers in resource bars use tabular (monospace) numerals if available, otherwise `font-variant-numeric: tabular-nums`.

---

## Ship Layout Rules

### Room Count and Connectivity

The ship contains **7-8 rooms** connected by corridors:

1. **Bridge / Cockpit** — top of the ship, forward-facing viewport. Navigation console, pilot chair, comms station.
2. **Crew Quarters** — bunks, personal storage, privacy curtains. Feels cozy and warm.
3. **Science Lab** — blue containment tank, sample analysis station, wall-mounted monitors. Cool-toned lighting.
4. **Storage Bay** — crates of various sizes, supply shelves, cargo management terminal.
5. **Medical Bay** — medical bed, supply cabinet, diagnostic screen. Red cross insignia on the floor or wall.
6. **Common Room** — dining table with 4 chairs, small kitchen area, recreational items (books, a plant).
7. **Engineering** — reactor/power core visual, maintenance panels, tool racks.
8. *(Optional)* **Airlock / EVA Prep** — suit rack, exterior door, decontamination area.

### Corridor Rules

- Corridors are **at least 2 character-widths wide** for comfortable navigation.
- Every room connects to at least one corridor. No dead ends without a room.
- Doors are visible between rooms and corridors. They can be open, closed, or locked (red indicator).
- The corridor layout should allow reaching any room from any other room in at most 3 corridor segments.

### Walkable Space Rules

- **Clear walkable floor** must be visually distinct from walls and furniture.
- Floor uses `ship-floor` color. Walls use `ship-walls` color. The contrast must be obvious.
- Furniture and equipment sit ON the floor but the player walks AROUND them.
- Every room has enough open floor for the character to enter, turn, and approach interactive objects.
- Collision boundaries match visual boundaries — if it looks solid, the player can't walk through it.

### Room Identity

Each room must be instantly identifiable by its furniture and equipment even without labels:

- Bridge: pilot chair + viewport + star field
- Crew Quarters: beds + personal items
- Lab: blue tank + screens
- Storage: crates + shelves
- Medical: red cross + medical bed
- Common Room: table + chairs
- Engineering: machinery + pipes + glow

---

## Character Design

### Proportions

**Chibi / cartoon style** with approximately **2.5 heads tall** proportions. This means:

- Large expressive head (40% of total height).
- Compact body with simple limbs.
- Oversized hands for gesture readability.
- Feet are simple rounded shapes.

### Crew Members

4 distinct crew members, each with a **unique silhouette** and **accent color**:

| Crew Member | Role | Accent Color | Silhouette Feature |
|---|---|---|---|
| Captain | Commander / Pilot | `accent-amber` gold | Tall collar, command badge |
| Scientist | Research / Lab | `accent-blue` teal | Lab coat, goggles on head |
| Medic | Health / Life Support | `accent-green` | Cross armband, medical pouch |
| Engineer | Repairs / Power | `accent-red` orange-red | Tool belt, heavy gloves |

### Readability Requirements

- Characters must be identifiable at the default game zoom level (full ship visible).
- Each character's silhouette must be distinct even as a solid-color shadow.
- Walking animation: minimum 4 frames per direction (up, down, left, right).
- Idle animation: subtle breathing/shifting, 2-3 frames looping.
- Interaction animation: character faces the object and extends hand.

---

## HUD Design Rules

### General Principles

- All HUD panels use `panel-bg` (rgba(20, 27, 45, 0.9)) — dark, semi-transparent, never fully opaque.
- Rounded corners: 8px on all HUD containers.
- **Icons always precede text** in HUD elements.
- HUD must **never cover more than 20% of the total screen area**.
- HUD elements have a 1px border using `accent-blue` at 30% opacity for subtle definition.

### Layout Zones

```
+--[Portrait+Bars]--------------------[Mission Panel]--+
|                                                       |
|                                                       |
|                    GAME WORLD                         |
|                                                       |
|                                                       |
+--------[Inventory Bar (5 slots)]----[Minimap]--------+
```

### Top-Left: Character Status

- Character portrait: 64x64px rounded square with 2px `accent-amber` border.
- Three horizontal bars stacked below the portrait:
  - **Health**: red (`accent-red`) when low, green (`accent-green`) when high. Gradient transition.
  - **Energy**: `accent-blue`. Depletes with actions, regenerates over time.
  - **XP**: `accent-amber`. Shows progress to next level.
- Level badge: circular, shows current level number.
- Bar dimensions: 120px wide, 12px tall, 4px gap between bars.

### Top-Right: Mission Panel

- Width: max 280px. Dark panel with mission icon + title + short description.
- Progress indicator below description (e.g., "Collect samples: 2/5").
- Collapses to just the icon when the player is in dialogue or cutscene.

### Bottom-Center: Inventory Bar

- 5 inventory slots arranged horizontally.
- Each slot: 48x48px with 2px border.
- Active/selected slot: `accent-amber` border, slight glow.
- Empty slots: dashed border at 40% opacity.
- Items show a small icon. Hovering shows the item name tooltip.

### Bottom-Right: Minimap

- Circular or rounded-square minimap, approximately 100x100px.
- Shows simplified ship layout with room outlines.
- Player position as a bright dot.
- Crew member positions as colored dots matching their accent colors.
- North indicator / compass arrow.

### Crew Overview (Reference 01 Mode)

When viewing all crew (e.g., crew management screen):

- Left column: 4 portraits stacked vertically with health (red) and energy (blue) bars.
- Each portrait is clickable to select/focus that crew member.
- Selected crew member gets a highlight border.

---

## Interaction Design

### Proximity Prompts

When the player is within interaction range of an object:

- A small prompt appears above the object: `[E] Examine` or `[E] Use`.
- Prompt uses `panel-bg` background, `text-light` text, `accent-amber` for the key indicator.
- Prompt fades in over 200ms, fades out over 150ms.

### Dialogue

- Dialogue box appears at bottom of screen, spanning ~80% width.
- Speaker portrait on the left (80x80px).
- Speaker name in `text-lg` bold above the dialogue text.
- Dialogue text in `text-base`, revealed character-by-character (typewriter effect, ~30ms per character).
- Choice buttons below dialogue text when decisions are presented.

---

## Accessibility Notes

- All interactive elements must have sufficient contrast (WCAG AA minimum).
- Color-coded information (health bars, status) must also have a secondary indicator (icon, pattern, or label).
- Font size must never go below 14px.
- Target audience is kids 7-12, so language should be simple and clear.
- Interactive prompts should be large enough for mouse and touch input.
