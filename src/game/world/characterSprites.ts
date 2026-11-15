/**
 * Walk spritesheets per astronaut (only commanders the player controls for now).
 * Sheet layout: 4 columns × 4 rows of 40×48 frames at native pixel-art size
 * (1 art pixel = 1 map pixel), rows = down, left, right, up.
 * Built from the team's sheet in assets/characters/_source/ (white background removed,
 * frames aligned on the feet).
 */
export interface CharacterSprite {
  key: string;
  url: string;
}

export const SPRITE_FRAME_W = 40;
export const SPRITE_FRAME_H = 48;
export const SPRITE_COLS = 4;
export const SPRITE_DIRECTIONS = ['down', 'left', 'right', 'up'] as const;
export type SpriteDirection = (typeof SPRITE_DIRECTIONS)[number];
/** Feet sit on y=46 inside the 48 px frame. */
export const SPRITE_ORIGIN_Y = 46 / 48;
/** Native size: the astronaut is ~40 px tall on the 1600×800 map. */
export const SPRITE_SCALE = 1;

export const CHARACTER_SPRITES: Record<string, CharacterSprite> = {
  mcclain: { key: 'cmdr-mcclain-walk', url: '/assets/characters/cmdr-mcclain-walk.png' },
};
