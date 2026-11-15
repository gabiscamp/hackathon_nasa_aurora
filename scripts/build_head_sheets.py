"""
Build the in-game head atlas from the team's head sheets (public/assets/cabecas/equipe*.png).

Each sheet is a 4x4 grid on a magenta background: one astronaut per row, columns
front / side (facing right) / side (facing left) / back. The art is pixel art drawn
~8.5x bigger than the game sprite, so every head is sampled back down to game pixels
(median of the middle of each source block, which keeps the pixels crisp) and placed
in a fixed frame with the chin on the neck pin, like the old atlas.

Output: src/assets/cabecas/exports/equipes/cabecas.png + cabecas.json
(same schema as web-v2/cabecas.json, read by src/game/world/modularAstronaut.ts).

Requirements: Python 3.10+, Pillow, numpy. Usage (project root):
    python scripts/build_head_sheets.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_station_assets import key_out_magenta  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "public" / "assets" / "cabecas"
OUT_DIR = ROOT / "src" / "assets" / "cabecas" / "exports" / "equipes"

# Sheet -> head id per row (ids are used in src/data/crews.ts).
SHEETS: dict[str, list[str]] = {
    "equipe1.png": ["a-pontes", "a-aunon", "a-schmitt", "a-mcclain"],
    "equipe2.png": ["b-armstrong", "b-aunon", "b-pontes", "b-watkins"],
}
# Sheet column used for each view the game needs (side frames face right).
VIEW_COLUMNS = {"front": 0, "side": 1, "back": 3}

# Game pixels per sheet pixel: ~195 sheet px from the top of the hair to the chin
# become ~23 game px, the size of the old heads.
SCALE = 23 / 195
FRAME_W, FRAME_H = 36, 31
# Neck pin: the chin's bottom pixel row is PIN_Y + 1 (as in the old atlas), and the
# head is centred half a pixel left of PIN_X.
PIN_X, PIN_Y = 18, 24
# Only the middle of each source block is sampled, so block edges don't bleed.
SAMPLE_CORE = 0.6


def runs(profile: np.ndarray, min_len: int) -> list[tuple[int, int]]:
    """[start, end] index ranges where `profile` is true, at least `min_len` long."""
    out: list[tuple[int, int]] = []
    start: int | None = None
    for i, on in enumerate(profile):
        if on and start is None:
            start = i
        elif not on and start is not None:
            if i - start >= min_len:
                out.append((start, i - 1))
            start = None
    if start is not None and len(profile) - start >= min_len:
        out.append((start, len(profile) - 1))
    return out


def chin_row(rgb: np.ndarray, opaque: np.ndarray) -> int:
    """Lowest skin-coloured row in the middle of a front view (hair can hang lower at the sides)."""
    w = rgb.shape[1]
    mid = slice(int(w * 0.3), int(w * 0.7))
    r, g, b = (rgb[:, mid, i].astype(int) for i in range(3))
    skin = (r > 150) & (r > g) & (g > b) & (r - b > 40) & opaque[:, mid]
    return int(np.nonzero(skin.any(axis=1))[0].max())


def sample_head(rgba: np.ndarray, center_x: float, chin_bottom: float) -> np.ndarray:
    """Game-sized head frame sampled from one sheet cell (coordinates in sheet px)."""
    out = np.zeros((FRAME_H, FRAME_W, 4), dtype=np.uint8)
    block = 1 / SCALE
    half = block * SAMPLE_CORE / 2
    h, w = rgba.shape[:2]
    for ty in range(FRAME_H):
        cy = chin_bottom + (ty + 0.5 - (PIN_Y + 2)) * block
        for tx in range(FRAME_W):
            cx = center_x + (tx + 0.5 - (PIN_X - 0.5)) * block
            y0, y1 = int(round(cy - half)), int(round(cy + half))
            x0, x1 = int(round(cx - half)), int(round(cx + half))
            if y1 <= 0 or x1 <= 0 or y0 >= h or x0 >= w:
                continue
            core = rgba[max(y0, 0) : y1, max(x0, 0) : x1].reshape(-1, 4)
            solid = core[core[:, 3] > 128]
            if len(solid) * 2 < len(core):
                continue
            out[ty, tx, :3] = np.median(solid[:, :3], axis=0).round()
            out[ty, tx, 3] = 255
    return out


def main() -> int:
    views = list(VIEW_COLUMNS)
    order: list[str] = []
    frames: list[list[np.ndarray]] = []

    for sheet, head_ids in SHEETS.items():
        rgba = np.asarray(key_out_magenta(Image.open(SRC_DIR / sheet)))
        opaque = rgba[..., 3] > 128
        rows = runs(opaque.sum(axis=1) > 2, 40)
        if len(rows) != len(head_ids):
            raise SystemExit(f"{sheet}: expected {len(head_ids)} rows of heads, found {len(rows)}")

        for (y0, y1), head_id in zip(rows, head_ids):
            band = opaque[y0 : y1 + 1]
            cells = runs(band.sum(axis=0) > 0, 40)
            if len(cells) != 4:
                raise SystemExit(f"{sheet} ({head_id}): expected 4 views, found {len(cells)}")
            fx0, fx1 = cells[VIEW_COLUMNS["front"]]
            chin = y0 + chin_row(rgba[y0 : y1 + 1, fx0 : fx1 + 1, :3], band[:, fx0 : fx1 + 1])

            row_frames = []
            for view in views:
                x0, x1 = cells[VIEW_COLUMNS[view]]
                # Only this head: neighbours and stray specks outside its box stay out.
                cell = np.zeros_like(rgba)
                cell[y0 : y1 + 1, x0 : x1 + 1] = rgba[y0 : y1 + 1, x0 : x1 + 1]
                row_frames.append(sample_head(cell, (x0 + x1 + 1) / 2, chin + 1))
            order.append(head_id)
            frames.append(row_frames)
            print(f"{head_id:12s} <- {sheet} rows {y0}-{y1}, chin at {chin}")

    atlas = np.zeros((FRAME_H * len(order), FRAME_W * len(views), 4), dtype=np.uint8)
    heads: dict[str, dict[str, dict[str, int]]] = {}
    for r, (head_id, row_frames) in enumerate(zip(order, frames)):
        heads[head_id] = {}
        for c, (view, frame) in enumerate(zip(views, row_frames)):
            atlas[r * FRAME_H : (r + 1) * FRAME_H, c * FRAME_W : (c + 1) * FRAME_W] = frame
            heads[head_id][view] = {"x": c * FRAME_W, "y": r * FRAME_H, "w": FRAME_W, "h": FRAME_H}

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    Image.fromarray(atlas, "RGBA").save(OUT_DIR / "cabecas.png", optimize=True)
    meta = {
        "schema": "astro-game.heads.v2",
        "frame": [FRAME_W, FRAME_H],
        "columns": views,
        "pin": {view: [PIN_X, PIN_Y] for view in views},
        "note": "Built by scripts/build_head_sheets.py from public/assets/cabecas/equipe*.png. "
        "Draw a head at (anchor.x - pin.x, anchor.y - pin.y) over the uniform frame.",
        "order": order,
        "heads": heads,
    }
    (OUT_DIR / "cabecas.json").write_text(json.dumps(meta, indent=1) + "\n", encoding="utf-8")
    print(f"atlas {atlas.shape[1]}x{atlas.shape[0]} -> {OUT_DIR.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
