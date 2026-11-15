"""
Build the in-game station pieces from the raw art in src/assets/Nave/.

For every piece it:
  1. keys out the magenta background (soft alpha + colour un-blending, so the
     JPEG fringes do not leave a pink halo),
  2. trims the empty border,
  3. resizes it to the in-game scale (pixels on screen at camera zoom 1),
  4. writes an RGBA PNG to src/assets/station/<name>.png.

Requirements: Python 3.10+, Pillow, numpy  (pip install pillow numpy)
Usage (from the project root):  python scripts/build_station_assets.py

Re-run it whenever an image in src/assets/Nave/ changes. If the trimmed size
of a piece changes, check its walkable rects in src/game/world/stationLayout.ts.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "src" / "assets" / "Nave"
OUT_DIR = ROOT / "src" / "assets" / "station"

# name -> (source file, scale). Scales put every piece on the same visual grid:
# the 1536px top-down rooms at 0.5, the 2752px side-view art at 0.25.
PIECES: dict[str, tuple[str, float]] = {
    "greenhouse": ("Estufa-Hidropônica-Espacial.png", 0.5),
    "lab": ("modulo-laboratorial- invertido.jpeg", 0.5),
    "gym": ("Academia.png", 0.5),
    "kitchen": ("Cozinha.png", 0.5),
    "capsules": ("Cápsulas-Espaciais-de-Transporte.png", 0.5),
    "bathroom": ("banheiro-invertido.jpeg", 0.42),
    "dormitory": ("cabine-dormitorio.jpeg", 0.5),
    "node": ("no-de-conexao.jfif", 0.25),
    "airlock": ("airlocks.jfif", 0.25),
    "truss": ("treliça.jfif", 0.25),
    "radiator": ("radiador.jfif", 0.25),
    "solar": ("Painel-Solar.jpeg", 0.75),
}

# Pieces whose art itself contains magenta/pink (the greenhouse grow lights): only the
# magenta connected to the image border is background. Everywhere else every magenta
# pixel is keyed, so enclosed gaps (e.g. inside the truss lattice) turn transparent too.
BORDER_KEY_ONLY = {"greenhouse"}

# Doorways painted in the key colour (a see-through gap between the door posts). After
# keying they would show open space and cut the crew walking through them, so they are
# filled with the floor right below. Rects are (x0, y0, x1, y1) in built-PNG pixels.
DOOR_FILLS: dict[str, list[tuple[int, int, int, int]]] = {
    "bathroom": [(160, 24, 236, 80)],
    "lab": [(347, 14, 401, 46)],
}
# Height of the floor strip (just under the hole) that is tiled upward into it.
DOOR_FILL_STRIP = 16

# "magenta-ness" = min(R, B) - G. Pure key ~255, neutral greys ~0, blues < 0.
KEY_OPAQUE_BELOW = 60.0
KEY_CLEAR_ABOVE = 140.0


def connected_to_border(mask: np.ndarray) -> np.ndarray:
    """Pixels of `mask` reachable from the image border through `mask` (4-neighbour fill)."""
    reached = np.zeros_like(mask)
    reached[0, :] = mask[0, :]
    reached[-1, :] = mask[-1, :]
    reached[:, 0] = mask[:, 0]
    reached[:, -1] = mask[:, -1]
    while True:
        grown = reached.copy()
        grown[1:, :] |= reached[:-1, :]
        grown[:-1, :] |= reached[1:, :]
        grown[:, 1:] |= reached[:, :-1]
        grown[:, :-1] |= reached[:, 1:]
        grown &= mask
        if np.array_equal(grown, reached):
            return reached
        reached = grown


def key_out_magenta(img: Image.Image, border_only: bool = False) -> Image.Image:
    rgb = np.asarray(img.convert("RGB")).astype(np.float32)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    m = np.minimum(r, b) - g

    # Actual key colour of this file (JPEG/PNG exports drift a little from #ff00ff).
    key_px = rgb[m > 180]
    key = key_px.mean(axis=0) if len(key_px) else np.array([255.0, 0.0, 255.0])

    alpha = np.clip((KEY_CLEAR_ABOVE - m) / (KEY_CLEAR_ABOVE - KEY_OPAQUE_BELOW), 0.0, 1.0)
    if border_only:
        alpha = np.where(connected_to_border(m > KEY_OPAQUE_BELOW), alpha, 1.0)

    # Un-blend partially keyed pixels: C = a*F + (1-a)*K  =>  F = (C - (1-a)K) / a
    a = alpha[..., None]
    safe = np.maximum(a, 1e-3)
    fg = np.clip((rgb - (1.0 - a) * key) / safe, 0, 255)
    fg = np.where(a > 0, fg, 0)

    out = np.dstack([fg, alpha * 255.0]).round().astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def fill_doorways(img: Image.Image, rects: list[tuple[int, int, int, int]]) -> Image.Image:
    """Put floor under the see-through part of each doorway rect (the art stays on top)."""
    px = np.asarray(img).copy()
    for x0, y0, x1, y1 in rects:
        hole = px[y0:y1, x0:x1, 3] < 250
        rows = np.nonzero(hole.any(axis=1))[0]
        if len(rows) == 0:
            continue
        top = y0 + rows.min()
        src_y = y0 + rows.max() + 2  # first rows of solid floor under the hole
        strip = px[src_y : src_y + DOOR_FILL_STRIP, x0:x1].astype(np.float32)
        # Tile the strip upward so the floor pattern continues into the doorway.
        fill = np.concatenate([strip] * (-(-(src_y - top) // DOOR_FILL_STRIP)), axis=0)[-(src_y - top):]
        region = px[top:src_y, x0:x1].astype(np.float32)
        a = region[..., 3:4] / 255.0
        region[..., :3] = region[..., :3] * a + fill[..., :3] * (1 - a)
        region[..., 3] = 255
        px[top:src_y, x0:x1] = region.round().astype(np.uint8)
    return Image.fromarray(px, "RGBA")


def build_piece(name: str, src_name: str, scale: float) -> tuple[int, int]:
    src = SRC_DIR / src_name
    keyed = key_out_magenta(Image.open(src), border_only=name in BORDER_KEY_ONLY)

    # Trim to the visible content (ignore near-transparent JPEG noise).
    alpha = np.asarray(keyed)[..., 3]
    ys, xs = np.nonzero(alpha > 24)
    keyed = keyed.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))

    w = max(1, round(keyed.width * scale))
    h = max(1, round(keyed.height * scale))
    # Pillow resamples RGBA with premultiplied alpha, so edges stay clean.
    resized = keyed.resize((w, h), Image.Resampling.LANCZOS)
    if name in DOOR_FILLS:
        resized = fill_doorways(resized, DOOR_FILLS[name])

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    resized.save(OUT_DIR / f"{name}.png", optimize=True)
    return w, h


def main() -> int:
    for name, (src_name, scale) in PIECES.items():
        w, h = build_piece(name, src_name, scale)
        print(f"{name:10s} {w:5d} x {h:<5d}  <- {src_name} @ {scale}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
