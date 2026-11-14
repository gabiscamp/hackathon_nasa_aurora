---
name: game-qa-visual-testing
description: QA testing procedures and visual regression testing for the Starship Explorer game. Covers movement, collisions, interactions, HUD, missions, and automated testing with Playwright.
---

# Game QA and Visual Testing Skill

## Testing Categories

All tests should be run at each milestone. Tests are organized from most critical (movement) to least critical (visual regression).

---

## 1. Movement Tests

The player must move correctly in all directions with both input schemes.

### Manual Test Checklist

| Test | Steps | Expected Result |
|---|---|---|
| Move up (arrow) | Press Up arrow | Character moves up, plays walk-up animation |
| Move down (arrow) | Press Down arrow | Character moves down, plays walk-down animation |
| Move left (arrow) | Press Left arrow | Character moves left, plays walk-left animation |
| Move right (arrow) | Press Right arrow | Character moves right, plays walk-right animation |
| Move up (WASD) | Press W | Same as Up arrow |
| Move down (WASD) | Press S | Same as Down arrow |
| Move left (WASD) | Press A | Same as Left arrow |
| Move right (WASD) | Press D | Same as Right arrow |
| Diagonal movement | Press Up + Right simultaneously | Character moves diagonally at same speed as cardinal (normalized velocity) |
| Stop on release | Release all keys | Character stops, plays idle animation matching last direction |
| Speed consistency | Move in all directions | Movement speed feels identical in every direction |

### Automated Movement Test

```typescript
// Playwright + custom Phaser bridge
test('player moves in all four directions', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas');

  const getPlayerPos = () =>
    page.evaluate(() => {
      const scene = (window as any).__PHASER_GAME__?.scene.getScene('GameScene');
      const p = scene?.player;
      return p ? { x: p.x, y: p.y } : null;
    });

  const start = await getPlayerPos();

  // Move right
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(500);
  await page.keyboard.up('ArrowRight');
  const afterRight = await getPlayerPos();
  expect(afterRight!.x).toBeGreaterThan(start!.x);

  // Move down
  await page.keyboard.down('ArrowDown');
  await page.waitForTimeout(500);
  await page.keyboard.up('ArrowDown');
  const afterDown = await getPlayerPos();
  expect(afterDown!.y).toBeGreaterThan(afterRight!.y);

  // Move left
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(500);
  await page.keyboard.up('ArrowLeft');
  const afterLeft = await getPlayerPos();
  expect(afterLeft!.x).toBeLessThan(afterDown!.x);

  // Move up
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(500);
  await page.keyboard.up('ArrowUp');
  const afterUp = await getPlayerPos();
  expect(afterUp!.y).toBeLessThan(afterLeft!.y);
});
```

### Exposing Phaser for Testing

Add this to the game config setup so tests can access the game instance:

```typescript
// In GameCanvas.tsx or config.ts, after creating the game
if (import.meta.env.DEV) {
  (window as any).__PHASER_GAME__ = game;
}
```

---

## 2. Collision Tests

The player must not pass through any solid object.

### Manual Test Checklist

| Test | Steps | Expected |
|---|---|---|
| Wall collision (all sides) | Walk into every wall segment | Player stops at wall, no clipping through |
| Furniture collision | Walk into desks, beds, tanks, tables | Player stops, cannot push furniture |
| Hull boundary | Walk to every edge of the ship | Player cannot exit the ship boundary |
| Door collision (closed) | Walk into a closed/locked door | Player stops at the door |
| Door passage (open) | Walk through an open door | Player passes through smoothly |
| Corner collision | Walk diagonally into wall corners | Player slides along wall, doesn't get stuck |
| NPC collision | Walk into an NPC | Player stops, NPC doesn't move |
| Tight corridor | Walk through narrowest corridor | Player fits through without getting stuck |

### Common Collision Bugs to Watch For

- **Corner sticking**: Player gets stuck on tilemap corners when moving diagonally. Fix: ensure hitbox is smaller than tile size and is circular or has rounded corners via `setCircle()`.
- **Clipping on high speed**: If speed is too high relative to hitbox size, player can phase through thin walls. Keep speed under 200 and walls at least 1 tile thick.
- **Z-fighting on layer edges**: Tile collision boundaries don't align with visual boundaries. Verify in Tiled that collision properties match the visual tiles.

### Automated Collision Test

```typescript
test('player cannot walk through walls', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas');

  // Move right for 3 seconds (should hit a wall before reaching ship edge)
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(3000);
  await page.keyboard.up('ArrowRight');

  const pos = await page.evaluate(() => {
    const scene = (window as any).__PHASER_GAME__?.scene.getScene('GameScene');
    const map = scene?.map;
    const p = scene?.player;
    return {
      x: p?.x,
      y: p?.y,
      mapWidth: map?.widthInPixels,
    };
  });

  // Player should NOT have reached the map edge
  expect(pos.x).toBeLessThan(pos.mapWidth! - 32);
});
```

---

## 3. Interaction Tests

Interactive objects must respond when the player is nearby and presses the interact key.

### Manual Test Checklist

| Test | Steps | Expected |
|---|---|---|
| Prompt appears | Walk near an interactive object | "[E] Examine" or similar prompt appears |
| Prompt disappears | Walk away from object | Prompt fades out |
| Interact triggers | Press E near object | Interaction triggers (dialogue, item pickup, etc.) |
| No false triggers | Press E in empty area | Nothing happens |
| Range check | Stand just outside interaction range | No prompt, no interaction |
| Multiple objects | Stand between two interactive objects | Only closest object shows prompt |
| Interact during movement | Press E while walking near object | Interaction still triggers |

### Automated Interaction Test

```typescript
test('interaction prompt appears near objects', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas');

  // Navigate to a known interactive object position
  // (This requires knowledge of the map layout)
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(1000);
  await page.keyboard.up('ArrowUp');

  // Check if an interaction prompt event was emitted
  const promptVisible = await page.evaluate(() => {
    return (window as any).__INTERACT_PROMPT_VISIBLE__ ?? false;
  });

  // Note: This requires the game to set window.__INTERACT_PROMPT_VISIBLE__ in dev mode
});
```

---

## 4. HUD Tests

All HUD elements must display correctly and update in response to game state changes.

### Manual Test Checklist

| Test | Steps | Expected |
|---|---|---|
| Health bar displays | Start game | Health bar at 100%, green color |
| Health bar updates | Take damage (via game event) | Bar decreases, transitions to red at low health |
| Energy bar displays | Start game | Energy bar at 100%, blue color |
| Energy bar depletes | Perform energy-consuming action | Bar decreases smoothly |
| XP bar updates | Gain XP | Bar fills, level badge updates on level up |
| Inventory shows items | Pick up an item | Item icon appears in first empty slot |
| Inventory full | Try to pick up item with full inventory | Feedback shown (inventory full message) |
| Mission panel updates | Accept a mission | Mission title and progress appear |
| Mission progress | Complete a mission objective | Progress counter increments |
| Minimap accuracy | Move to different room | Player dot moves on minimap accordingly |
| Portrait displays | Start game | Correct character portrait shown |
| Screen coverage | Measure HUD area | HUD covers less than 20% of screen |

### Automated HUD Test

```typescript
test('health bar reflects game state', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas');

  // Read initial health from Zustand store
  const initialHealth = await page.evaluate(() => {
    return (window as any).__ZUSTAND_STORE__?.getState().health;
  });
  expect(initialHealth).toBe(100);

  // Simulate damage
  await page.evaluate(() => {
    (window as any).__ZUSTAND_STORE__?.getState().setResources({ health: 60 });
  });

  // Verify the React HUD component updated
  const barWidth = await page.evaluate(() => {
    const bar = document.querySelector('[data-testid="health-bar-fill"]');
    return bar ? parseFloat(getComputedStyle(bar).width) : 0;
  });

  // Bar should be roughly 60% of its container
  expect(barWidth).toBeGreaterThan(0);
});
```

### Exposing Zustand for Testing

```typescript
// In store/gameStore.ts
if (import.meta.env.DEV) {
  (window as any).__ZUSTAND_STORE__ = useGameStore;
}
```

---

## 5. Mission Tests

Mission flow must trigger correctly and track progress.

### Manual Test Checklist

| Test | Steps | Expected |
|---|---|---|
| Mission available | Approach mission giver | Mission offer dialogue appears |
| Mission accept | Accept mission in dialogue | Mission panel updates with new mission |
| Objective tracking | Complete an objective step | Progress counter updates (e.g., "1/3") |
| Mission complete | Complete all objectives | Completion notification, XP reward |
| Multiple missions | Have 2+ active missions | Panel shows current, can switch view |
| Mission failure | Fail a mission condition (if applicable) | Failure feedback shown |

---

## 6. Visual Regression Testing

Compare current screenshots against reference images to catch unintended visual changes.

### Screenshot Capture

```typescript
// Playwright screenshot at key game states
test('visual: main game view matches reference', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas');
  await page.waitForTimeout(2000); // Wait for animations to settle

  await expect(page).toHaveScreenshot('game-main-view.png', {
    maxDiffPixelRatio: 0.05,  // Allow 5% pixel difference
    animations: 'disabled',
  });
});

test('visual: HUD layout matches reference', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas');
  await page.waitForTimeout(1000);

  // Screenshot just the HUD overlay area
  const hud = page.locator('[data-testid="hud-container"]');
  await expect(hud).toHaveScreenshot('hud-layout.png', {
    maxDiffPixelRatio: 0.05,
  });
});
```

### Reference Image Management

- Store baseline screenshots in `tests/visual/references/`.
- Name format: `{test-name}-{resolution}.png`.
- Update baselines intentionally: `npx playwright test --update-snapshots`.
- Review diffs in CI artifacts when tests fail.

### Comparison Against Design References

The game's visual output should be compared against the design references:

- `references/wireframe/spaceship-reference-01.png` — crew management view
- `references/wireframe/spaceship-reference-02.png` — single player exploration view

These are wireframes, not pixel-perfect targets. Check for:

- Room layout matches reference arrangement (bridge top, quarters upper-left, etc.)
- HUD element positions match (portrait top-left, mission top-right, inventory bottom-center, minimap bottom-right)
- Color palette matches the defined tokens
- Character proportions are consistent with chibi style

---

## 7. Console Error Monitoring

### During All Testing

Always have the browser console open. The game must run with **zero console errors**.

```typescript
// Playwright: capture console errors
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    errors.push(err.message);
  });

  // Store errors for assertions
  (page as any).__consoleErrors = errors;
});

test.afterEach(async ({ page }) => {
  const errors = (page as any).__consoleErrors as string[];
  expect(errors).toEqual([]);
});
```

### Common Errors to Watch For

- `Phaser.Cache: Key already in use` — duplicate asset loading
- `Cannot read properties of null` — accessing destroyed game objects
- `Texture key not found` — missing or misspelled asset key
- WebGL context lost — performance issue, too many textures
- Zustand state update on unmounted component — cleanup missing in useEffect

---

## 8. Resolution Testing

Test at these resolutions to cover the target audience's common devices:

| Resolution | Aspect Ratio | Device Type |
|---|---|---|
| 1280x720 | 16:9 | Laptop / baseline |
| 1920x1080 | 16:9 | Desktop / full HD |
| 1366x768 | 16:9 | Common laptop |
| 768x1024 | 3:4 | Tablet portrait (if supported) |

### What to Check at Each Resolution

- Game canvas fills the viewport without scrollbars.
- HUD elements don't overlap each other.
- HUD elements don't overlap the game world excessively (20% rule).
- Text remains readable (minimum 14px rendered).
- Interactive prompts are fully visible.
- No clipping of UI elements at screen edges.

### Playwright Multi-Resolution Test

```typescript
const resolutions = [
  { width: 1280, height: 720, name: 'hd' },
  { width: 1920, height: 1080, name: 'fullhd' },
];

for (const res of resolutions) {
  test(`game renders correctly at ${res.name}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: res.width, height: res.height },
    });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForSelector('canvas');
    await page.waitForTimeout(1500);

    // Check canvas dimensions
    const canvasSize = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return canvas
        ? { width: canvas.clientWidth, height: canvas.clientHeight }
        : null;
    });

    expect(canvasSize).not.toBeNull();
    expect(canvasSize!.width).toBeGreaterThanOrEqual(res.width * 0.95);
    expect(canvasSize!.height).toBeGreaterThanOrEqual(res.height * 0.95);

    // Visual regression at this resolution
    await expect(page).toHaveScreenshot(`game-${res.name}.png`, {
      maxDiffPixelRatio: 0.05,
    });

    await context.close();
  });
}
```

---

## 9. Playwright Setup for This Project

### Installation

```bash
npm install -D @playwright/test
npx playwright install chromium
```

### Configuration (`playwright.config.ts`)

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:5173',
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
```

### Running Tests

```bash
# All tests
npx playwright test

# Specific test file
npx playwright test tests/movement.spec.ts

# With UI mode (visual debugging)
npx playwright test --ui

# Update visual regression baselines
npx playwright test --update-snapshots

# Show HTML report after failure
npx playwright show-report
```

---

## Test Execution Checklist

Run this checklist before every PR or milestone delivery:

- [ ] All movement directions work (WASD + arrows)
- [ ] Diagonal movement speed is normalized
- [ ] No wall clipping in any room
- [ ] No corner sticking in corridors
- [ ] Player cannot exit ship boundaries
- [ ] All interactive objects respond to proximity
- [ ] Interact key (E) triggers correctly
- [ ] HUD displays and updates for health, energy, XP
- [ ] Inventory add/remove works
- [ ] Mission panel shows current mission
- [ ] Zero console errors during 2 minutes of gameplay
- [ ] Looks correct at 1280x720
- [ ] Looks correct at 1920x1080
- [ ] Visual output roughly matches reference wireframes
