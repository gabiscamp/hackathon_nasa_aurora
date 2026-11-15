# Aurora Station -- Design System

## Color Palette

### Core Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `space-bg` | `#0a0e27` | Main background, space/void areas |
| `ship-hull` | `#8b7b6b` | Station exterior walls, hull panels |
| `floor` | `#9a8f82` | Walkable floor tiles inside the station |
| `walls` | `#706558` | Interior walls, room dividers |
| `panel-bg` | `rgba(20, 27, 45, 0.9)` | HUD panels, dialogue boxes, overlays |
| `text-light` | `#f0ece4` | Primary text color on dark backgrounds |

### Accent Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `accent-blue` | `#4dc9f6` | Oxygen resource, interactive highlights, links |
| `accent-amber` | `#f5a623` | Energy resource, Kira's color, warnings |
| `accent-red` | `#e74c3c` | Danger alerts, critical resource levels, errors |
| `accent-green` | `#2ecc71` | Health/Leo's color, success states, positive feedback |
| `accent-purple` | `#8b5cf6` | Shielding resource, Maya's color, science elements |

### Character Colors

| Character | Hex | Usage |
|-----------|-----|-------|
| Kira Santos | `#f5a623` | Portrait border, name text, dialogue accent |
| Dr. Leo Park | `#2ecc71` | Portrait border, name text, dialogue accent |
| Maya Torres | `#8b5cf6` | Portrait border, name text, dialogue accent |
| Commander | Player-chosen | Selected at game start from preset palette |

### Commander Color Options (Player Choice)

| Option | Hex |
|--------|-----|
| Sky Blue | `#4dc9f6` |
| Coral | `#ff6b6b` |
| Gold | `#ffd93d` |
| Teal | `#6bcb77` |
| Pink | `#ee6c9e` |
| White | `#f0ece4` |

### Semantic Colors

| State | Color | Usage |
|-------|-------|-------|
| Safe (>50%) | `#2ecc71` | Resource bars, status indicators |
| Warning (20-50%) | `#f5a623` | Resource bars turning amber |
| Critical (<20%) | `#e74c3c` | Resource bars turning red, flashing |
| Disabled | `#4a4a5a` | Inactive buttons, unavailable options |
| Hover | Current color + 20% brightness | Interactive element hover state |

## Typography

### Font Family

**Primary**: Lexend (Google Fonts) — escolhida pelo time em 2026-11-15, substituiu a Nunito
- Weights: 400 (Regular), 600 (SemiBold), 700 (Bold), 800 (ExtraBold)
- Fallback: `'Lexend', 'Segoe UI', system-ui, sans-serif`
- Reason: Rounded, friendly letterforms. Highly readable. Great for kids.

### Size Scale

| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `text-sm` | 14px | 1.4 | Captions, timestamps, minor labels |
| `text-base` | 18px | 1.5 | Body text, dialogue, descriptions |
| `text-lg` | 24px | 1.3 | Section headers, crew names, resource labels |
| `text-xl` | 32px | 1.2 | Screen titles, mission names |
| `text-xxl` | 48px | 1.1 | Hero text, game title, ending headlines |

### Text Rules

- Max 2 sentences per dialogue bubble
- Max 40 characters per line in dialogue (soft wrap)
- All-caps for labels only (e.g., "ENERGY", "DAY 12"), never for body text
- Bold for emphasis, never italic (harder for kids to read)
- Text shadow `0 1px 3px rgba(0,0,0,0.5)` on text over game world

## Spacing Scale

Based on 4px unit.

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight gaps, icon-to-label |
| `space-2` | 8px | Inner padding of small elements |
| `space-3` | 12px | Between related items |
| `space-4` | 16px | Standard padding, between sections |
| `space-6` | 24px | Between groups of elements |
| `space-8` | 32px | Large section gaps |
| `space-12` | 48px | Screen-level margins |

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 4px | Small badges, tags |
| `rounded-md` | 8px | Buttons, input fields, cards |
| `rounded-lg` | 12px | Panels, dialogue boxes |
| `rounded-xl` | 16px | Large modals, full overlays |
| `rounded-full` | 9999px | Circular elements, crew portraits |

## HUD Panels

Semi-transparent overlays that float on top of the Phaser canvas.

```css
.hud-panel {
  background: rgba(20, 27, 45, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}
```

### Panel Variants

| Variant | Border Color | Usage |
|---------|-------------|-------|
| Default | `rgba(255, 255, 255, 0.1)` | Standard HUD, info panels |
| Alert | `rgba(231, 76, 60, 0.5)` | Warning panels, critical alerts |
| Success | `rgba(46, 204, 113, 0.3)` | Positive outcomes, completed tasks |
| Mission | `rgba(77, 201, 246, 0.3)` | Mission briefing, choices |

## Buttons

### Base Button

```css
.btn {
  min-width: 60px;
  min-height: 60px;
  padding: 12px 24px;
  border-radius: 8px;
  font-family: 'Lexend', sans-serif;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 20px rgba(77, 201, 246, 0.3);
}

.btn:active {
  transform: translateY(0);
}
```

### Button Variants

| Variant | Background | Border | Text | Usage |
|---------|-----------|--------|------|-------|
| Primary | `#4dc9f6` | `#4dc9f6` | `#0a0e27` | Main actions, confirm |
| Danger | `#e74c3c` | `#e74c3c` | `#f0ece4` | Risky choices, cancel |
| Secondary | `transparent` | `rgba(255,255,255,0.2)` | `#f0ece4` | Back, dismiss, secondary options |
| Choice A | `rgba(77,201,246,0.15)` | `#4dc9f6` | `#f0ece4` | Mission choice option |
| Choice B | `rgba(245,166,35,0.15)` | `#f5a623` | `#f0ece4` | Mission choice option |
| Choice C | `rgba(139,92,246,0.15)` | `#8b5cf6` | `#f0ece4` | Mission choice option |

### Touch Target Rules

- Minimum touch target: 60x60px (following WCAG guidelines for kids)
- Spacing between interactive elements: minimum 8px
- No interactive elements smaller than 44x44px anywhere

## Progress Bars (Resource Bars)

```css
.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar__fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease, background-color 0.3s ease;
}
```

### Resource Bar Colors

| Resource | Color (>50%) | Color (20-50%) | Color (<20%) |
|----------|-------------|----------------|-------------|
| Energy | `#f5a623` (amber) | `#f5a623` | `#e74c3c` (red, pulsing) |
| Oxygen | `#4dc9f6` (blue) | `#f5a623` | `#e74c3c` (red, pulsing) |
| Shielding | `#8b5cf6` (purple) | `#f5a623` | `#e74c3c` (red, pulsing) |

### Critical State Animation

When any resource drops below 20%, the bar pulses:

```css
@keyframes pulse-critical {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.progress-bar__fill--critical {
  animation: pulse-critical 1.5s ease-in-out infinite;
}
```

## Crew Portraits

```css
.crew-portrait {
  width: 48px;
  height: 48px;
  border-radius: 9999px;
  border: 3px solid; /* color from character color */
  background: rgba(20, 27, 45, 0.9);
  overflow: hidden;
}

.crew-portrait--active {
  box-shadow: 0 0 12px rgba(var(--crew-color-rgb), 0.5);
}
```

### Portrait Sizes

| Context | Size | Border Width |
|---------|------|-------------|
| HUD (top bar) | 48x48px | 3px |
| Dialogue box | 64x64px | 3px |
| Crew intro screen | 128x128px | 4px |
| Day summary | 56x56px | 3px |

## Dialogue Box

```css
.dialogue-box {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  width: min(90vw, 600px);
  background: rgba(20, 27, 45, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.dialogue-box__name {
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  /* color: character accent color */
}

.dialogue-box__text {
  font-size: 18px;
  line-height: 1.5;
  color: #f0ece4;
}
```

## Icons

Emoji-based icons for the prototype phase. Will be replaced with custom pixel-art sprites in polish phase.

| Concept | Emoji | Context |
|---------|-------|---------|
| Energy | ⚡ | Resource bar label, engineering |
| Oxygen | 💨 | Resource bar label, life support |
| Shielding | 🛡️ | Resource bar label, protection |
| Health | ❤️ | Crew health indicator |
| Morale | 😊 | Crew morale indicator |
| Warning | ⚠️ | Alert messages |
| Mission | 📋 | Mission briefing |
| Science | 🔬 | Lab interactions, Maya |
| Repair | 🔧 | Engineering tasks, Kira |
| Medical | 💊 | Medical bay, Leo |
| Day/Time | ☀️ | Day counter |
| Night | 🌙 | Rest phase |
| Earth | 🌍 | Communications, APOD |
| Mars | 🔴 | Mars observation |
| EVA | 🚀 | Spacewalk activities |
| Interact | ❗ | Interaction prompt |

## Animation Timing

| Animation | Duration | Easing |
|-----------|----------|--------|
| Panel appear | 300ms | `ease-out` |
| Panel dismiss | 200ms | `ease-in` |
| Resource bar change | 500ms | `ease` |
| Button hover | 200ms | `ease` |
| Dialogue text reveal | 30ms per character | Linear (typewriter) |
| Screen transition | 400ms | `ease-in-out` |
| Critical pulse | 1500ms | `ease-in-out` (loop) |
| Notification slide-in | 250ms | `ease-out` |

## Responsive Breakpoints

| Breakpoint | Width | Target |
|-----------|-------|--------|
| Mobile | < 640px | Phone (portrait) |
| Tablet | 640-1024px | Tablet, small laptop |
| Desktop | > 1024px | Laptop, desktop, primary target |

### Layout Rules

- Game canvas scales to fit viewport, maintaining 16:9 aspect ratio
- HUD elements use fixed positioning relative to viewport
- Minimum supported resolution: 800x600
- Optimal resolution: 1280x720
- HUD scales down on mobile (smaller portraits, condensed resource bars)

## Tailwind Configuration

These tokens map to Tailwind classes for the React overlay layer:

```js
// tailwind.config.js extend
{
  colors: {
    'space-bg': '#0a0e27',
    'ship-hull': '#8b7b6b',
    'floor': '#9a8f82',
    'walls': '#706558',
    'accent-blue': '#4dc9f6',
    'accent-amber': '#f5a623',
    'accent-red': '#e74c3c',
    'accent-green': '#2ecc71',
    'accent-purple': '#8b5cf6',
    'text-light': '#f0ece4',
    'panel': 'rgba(20, 27, 45, 0.9)',
  },
  fontFamily: {
    sans: ['Lexend', 'Segoe UI', 'system-ui', 'sans-serif'],
  },
  fontSize: {
    sm: '14px',
    base: '18px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
  },
}
```
