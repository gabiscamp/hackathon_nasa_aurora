import Phaser from 'phaser';
import bodyPngUrl from '../../assets/cabecas/exports/web-v2/uniforme-nasa.png';
import bodyJsonUrl from '../../assets/cabecas/exports/web-v2/uniforme-nasa.json?url';
import anchorsJsonUrl from '../../assets/cabecas/exports/web-v2/uniforme-nasa-head-anchors.json?url';
import headsPngUrl from '../../assets/cabecas/exports/web-v2/cabecas.png';
import headsJsonUrl from '../../assets/cabecas/exports/web-v2/cabecas.json?url';
import type { HeadId } from '../../data/astronauts';

/**
 * Modular astronaut (team pixel art): one NASA-uniform body atlas + swappable heads.
 * At boot, every head is drawn onto every body frame (using the per-frame neck anchors)
 * into one spritesheet per head, so the game uses plain sprites and animations.
 * Format: src/assets/cabecas/exports/web-v2 (see AstronautaModular.jsx there).
 */

export const HEAD_IDS: readonly HeadId[] = ['cabeca-1', 'cabeca-2', 'cabeca-3', 'cabeca-4'];

const BODY_KEY = 'astro-body';
const BODY_JSON_KEY = 'astro-body-json';
const ANCHORS_KEY = 'astro-anchors-json';
const HEADS_KEY = 'astro-heads';
const HEADS_JSON_KEY = 'astro-heads-json';

/** Body frame size and the feet point inside it (from the export notes). */
export const ASTRO_FRAME_W = 32;
export const ASTRO_FRAME_H = 47;
export const ASTRO_ORIGIN_Y = 46 / 47;

type View = 'front' | 'side' | 'back';
interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface BodyAtlas {
  frames: { frame: Rect; duration: number }[];
  meta: { frameTags: { name: string; from: number; to: number }[] };
}
interface Anchors {
  atlasFrames: { view: View; x: number; y: number }[];
}
interface HeadsAtlas {
  pin: Record<View, [number, number]>;
  heads: Record<string, Record<View, Rect>>;
}

export function astronautTextureKey(head: HeadId): string {
  return `astro-${head}`;
}

/** Call from BootScene.preload. */
export function preloadModularAstronaut(scene: Phaser.Scene) {
  scene.load.image(BODY_KEY, bodyPngUrl);
  scene.load.json(BODY_JSON_KEY, bodyJsonUrl);
  scene.load.json(ANCHORS_KEY, anchorsJsonUrl);
  scene.load.image(HEADS_KEY, headsPngUrl);
  scene.load.json(HEADS_JSON_KEY, headsJsonUrl);
}

/**
 * Call once after loading (BootScene.create): builds one spritesheet texture per head
 * and the idle/walk animations for down, up and side (left = side flipped).
 */
export function buildModularAstronauts(scene: Phaser.Scene) {
  const body = scene.cache.json.get(BODY_JSON_KEY) as BodyAtlas;
  const anchors = scene.cache.json.get(ANCHORS_KEY) as Anchors;
  const heads = scene.cache.json.get(HEADS_JSON_KEY) as HeadsAtlas;
  const bodyImg = scene.textures.get(BODY_KEY).getSourceImage() as HTMLImageElement;
  const headsImg = scene.textures.get(HEADS_KEY).getSourceImage() as HTMLImageElement;
  const count = body.frames.length;

  for (const head of HEAD_IDS) {
    const key = astronautTextureKey(head);
    if (scene.textures.exists(key)) continue;
    const canvas = scene.textures.createCanvas(key, ASTRO_FRAME_W * count, ASTRO_FRAME_H);
    if (!canvas) continue;
    const ctx = canvas.getContext();
    ctx.imageSmoothingEnabled = false;

    body.frames.forEach(({ frame }, i) => {
      const ox = i * ASTRO_FRAME_W;
      ctx.drawImage(bodyImg, frame.x, frame.y, frame.w, frame.h, ox, 0, frame.w, frame.h);
      const anchor = anchors.atlasFrames[i];
      const rect = heads.heads[head][anchor.view];
      const [pinX, pinY] = heads.pin[anchor.view];
      ctx.drawImage(headsImg, rect.x, rect.y, rect.w, rect.h, ox + anchor.x - pinX, anchor.y - pinY, rect.w, rect.h);
      canvas.add(i, 0, ox, 0, ASTRO_FRAME_W, ASTRO_FRAME_H);
    });
    canvas.refresh();

    for (const tag of body.meta.frameTags) {
      // Tags: idle_down, walk_down, idle_up, walk_up, idle_right, walk_right
      const frames = [];
      for (let f = tag.from; f <= tag.to; f++) frames.push({ key, frame: f, duration: body.frames[f].duration });
      scene.anims.create({ key: `${key}-${tag.name}`, frames, repeat: -1 });
    }
  }
}

/** Animation key for a direction; left uses the right-facing frames with flipX. */
export function astronautAnim(head: HeadId, action: 'idle' | 'walk', dir: 'down' | 'up' | 'left' | 'right'): string {
  const side = dir === 'left' ? 'right' : dir;
  return `${astronautTextureKey(head)}-${action}_${side}`;
}
