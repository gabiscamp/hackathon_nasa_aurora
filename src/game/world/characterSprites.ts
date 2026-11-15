/**
 * Walk spritesheets per astronaut (only commanders the player controls for now).
 * Sheet layout: 4 columns × 4 rows of 96×128 frames (2x master), rows = down, left, right, up.
 * Built from the team's sheet in assets/characters/_source/ (white background removed,
 * frames aligned on the feet).
 */
export interface CharacterSprite {
  key: string;
  url: string;
}

export const SPRITE_FRAME_W = 96;
export const SPRITE_FRAME_H = 128;
export const SPRITE_COLS = 4;
export const SPRITE_DIRECTIONS = ['down', 'left', 'right', 'up'] as const;
export type SpriteDirection = (typeof SPRITE_DIRECTIONS)[number];
/** Feet sit on y=124 inside the 128 px frame. */
export const SPRITE_ORIGIN_Y = 124 / 128;
/** Frames are 2x masters; 0.4 gives a ~48 px tall astronaut on the 1600×800 map (fits the narrow aisles). */
export const SPRITE_SCALE = 0.4;

export const CHARACTER_SPRITES: Record<string, CharacterSprite> = {
  mcclain: { key: 'cmdr-mcclain-walk', url: '/assets/characters/cmdr-mcclain-walk.png' },
};
