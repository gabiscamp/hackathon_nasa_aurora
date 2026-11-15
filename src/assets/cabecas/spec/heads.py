"""Modular chibi heads for the headless NASA uniform: front + side (facing right) per head.
Head frames are 32x26 and share the uniform's coordinates: the neck pin is (16,22) front / (17,22) side,
exactly the uniform's head anchors, so a head is drawn at (anchor.x - pin.x, anchor.y - 22)."""
import json, sys
from pathlib import Path

W, H = 32, 26
PIN = {"front": (16, 22), "side": (17, 22)}

class Grid:
    def __init__(self): self.g = [["." for _ in range(W)] for _ in range(H)]
    def put(self, x, y, c):
        if 0 <= x < W and 0 <= y < H: self.g[y][x] = c
    def get(self, x, y): return self.g[y][x] if 0 <= x < W and 0 <= y < H else None
    def rect(self, x0, y0, x1, y1, c):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1): self.put(x, y, c)
    def ellipse(self, cx, cy, rx, ry, c, test=None):
        for y in range(H):
            for x in range(W):
                dx, dy = (x + .5 - cx) / rx, (y + .5 - cy) / ry
                if dx * dx + dy * dy <= 1 and (test is None or test(x, y, dx, dy)): self.put(x, y, c)
    def recolor(self, frm, to, test):
        for y in range(H):
            for x in range(W):
                if self.g[y][x] == frm and test(x, y): self.g[y][x] = to
    def rows(self): return ["".join(r) for r in self.g]

# ---------------------------------------------------------------- faces
def face_front(G):
    G.rect(14, 20, 17, 22, "S")                                         # neck
    G.ellipse(16, 15.6, 7.6, 6.4, "s")
    G.ellipse(16, 15.6, 7.6, 6.4, "S", lambda x, y, dx, dy: dy > .86)

def eyes_front(G):
    for ex in (12, 18):
        G.rect(ex, 14, ex + 2, 14, "e")
        G.put(ex, 15, "Q"); G.put(ex + 1, 15, "I"); G.put(ex + 2, 15, "e")
        G.rect(ex, 16, ex + 2, 17, "I")
        G.rect(ex, 18, ex + 2, 18, "i")
    G.put(11, 14, "e"); G.put(21, 14, "e")
    for x in (10, 11, 20, 21): G.put(x, 19, "p")

def face_side(G):
    G.rect(16, 20, 19, 22, "S")
    G.ellipse(18.3, 15.6, 6.6, 6.4, "s")
    G.ellipse(18.3, 15.6, 6.6, 6.4, "S", lambda x, y, dx, dy: dy > .86)
    G.put(25, 16, "s")                                                   # tiny nose

def eyes_side(G):
    G.rect(20, 14, 21, 14, "e"); G.put(22, 14, "e")
    G.put(20, 15, "Q"); G.put(21, 15, "I")
    G.rect(20, 16, 21, 17, "I")
    G.rect(20, 18, 21, 18, "i")
    G.put(21, 19, "p"); G.put(22, 19, "p")

def ear_side(G, x=15):
    G.put(x, 15, "s"); G.put(x, 16, "S"); G.put(x + 1, 15, "S")

# ---------------------------------------------------------------- hairstyles
def bob_front(G):
    G.ellipse(16, 12.6, 10, 9.3, "h", lambda x, y, dx, dy: y <= 12)
    for y in range(11, 22):
        for x in range(6, 10):
            if y <= 18 or (y <= 20 and x >= 7) or (y == 21 and x == 8): G.put(x, y, "h")
        for x in range(22, 26):
            if y <= 18 or (y <= 20 and x <= 24) or (y == 21 and x == 23): G.put(x, y, "h")
    spikes = {10: 13, 11: 12, 12: 12, 13: 12, 14: 11, 15: 13, 16: 13, 17: 11, 18: 12, 19: 12, 20: 12, 21: 13}
    for x in range(9, 23):
        for y in range(8, spikes.get(x, 11) + 1): G.put(x, y, "h")
    G.put(16, 2, "h"); G.put(17, 2, "h"); G.put(15, 3, "h"); G.put(18, 3, "j")
    for x, y0 in ((10, 13), (15, 13), (16, 13), (21, 13)):
        xx = x + (1 if x in (10, 15) else -1); G.put(xx, y0 - 1, "j"); G.put(xx, y0 - 2, "j")
    G.recolor("h", "j", lambda x, y: x >= 24 or (y >= 19 and x in (7, 8, 23, 24)))
    G.recolor("j", "J", lambda x, y: y >= 20 and x in (6, 7, 24, 25))
    for x, y in ((9, 7), (10, 6), (11, 6), (12, 5), (13, 5), (17, 5), (18, 5), (19, 6), (20, 6), (21, 7), (8, 9), (8, 10)):
        G.put(x, y, "H")

def bob_side(G):
    G.ellipse(17, 12.6, 10, 9.3, "h", lambda x, y, dx, dy: y <= 12)
    for y in range(11, 22):                                              # back of the bob, down to the jaw
        for x in range(7, 16):
            if y <= 18 or (y <= 20 and x >= 8) or (y == 21 and x in (9, 10)): G.put(x, y, "h")
    for x in range(17, 26):                                              # fringe over the forehead
        for y in range(8, {23: 13, 24: 12, 25: 11, 20: 12, 21: 12, 22: 11}.get(x, 11) + 1): G.put(x, y, "h")
    for y in range(11, 20): G.put(16, y, "h"); G.put(17, y, "h") if y <= 18 else None   # lock before the ear
    G.put(17, 2, "h"); G.put(18, 2, "h"); G.put(16, 3, "h"); G.put(19, 3, "j")
    G.put(22, 12, "j"); G.put(22, 11, "j"); G.put(19, 11, "j"); G.put(19, 10, "j")
    G.recolor("h", "j", lambda x, y: x <= 8 or (y >= 19 and x <= 11) or y >= 20)
    G.recolor("j", "J", lambda x, y: y >= 20 and x <= 10)
    for x, y in ((12, 5), (13, 4), (14, 4), (15, 4), (19, 4), (20, 5), (21, 5), (22, 6), (10, 7), (11, 6)):
        G.put(x, y, "H")

def short_front(G):
    G.ellipse(16, 12, 9.2, 8.6, "h", lambda x, y, dx, dy: y <= 12)
    for x, y in ((10, 4), (12, 3), (14, 2), (17, 2), (19, 3), (21, 4), (13, 3), (18, 3)): G.put(x, y, "h")   # spiky top
    for x in range(8, 25):                                               # short messy fringe
        for y in range(9, {10: 12, 13: 12, 16: 12, 19: 12, 22: 12}.get(x, 11) + 1): G.put(x, y, "h")
    for y in range(11, 15): G.put(8, y, "h"); G.put(23, y, "h")          # sideburns
    G.put(7, 15, "s"); G.put(7, 16, "S"); G.put(24, 15, "s"); G.put(24, 16, "S")   # ears
    G.recolor("h", "j", lambda x, y: x >= 22 or (y >= 11 and x in (11, 14, 17, 20)))
    for x, y in ((11, 5), (12, 5), (13, 4), (14, 4), (17, 4), (18, 4), (19, 5)): G.put(x, y, "H")

def short_side(G):
    G.ellipse(17, 12, 9.2, 8.6, "h", lambda x, y, dx, dy: y <= 12)
    for y in range(11, 17):
        for x in range(9, 16): G.put(x, y, "h")                          # short back / nape
    for x, y in ((10, 4), (12, 3), (14, 2), (17, 2), (19, 3), (8, 7), (8, 9), (9, 5)): G.put(x, y, "h")
    for x in range(18, 26):
        for y in range(9, {21: 12, 24: 12}.get(x, 11) + 1): G.put(x, y, "h")
    G.recolor("h", "j", lambda x, y: x <= 10 or y >= 15 or (y >= 10 and x in (20, 23)))
    for x, y in ((13, 4), (14, 4), (15, 4), (17, 4), (18, 4), (19, 5), (12, 5)): G.put(x, y, "H")

def _curls(G, cx, cy, rx, ry, light_side):
    """Scalloped curly silhouette + clustered shading instead of a dot pattern."""
    import math
    for k in range(18):                                                  # bumps around the outline
        ang = k / 18 * 2 * math.pi
        bx, by = cx + math.cos(ang) * rx, cy + math.sin(ang) * ry
        if math.sin(ang) < 0.25: G.ellipse(bx, by, 1.9, 1.9, "h")
    for y in range(H):
        for x in range(W):
            if G.get(x, y) != "h": continue
            if (x - cx) * light_side > 5 or y >= 15: G.put(x, y, "j")
    for x, y in light_clusters(cx, cy, light_side):
        if G.get(x, y) == "h": G.put(x, y, "H")
    for x, y in ((cx + 2, cy - 4), (cx - 3, cy - 1), (cx + 5, cy - 1), (cx, cy + 2), (cx - 6, cy + 3)):
        for dx, dy in ((0, 0), (1, 0), (0, 1)):
            if G.get(int(x + dx), int(y + dy)) == "h": G.put(int(x + dx), int(y + dy), "j")

def light_clusters(cx, cy, side):
    s = -side
    return [(int(cx + s * 5), int(cy - 6)), (int(cx + s * 4), int(cy - 6)), (int(cx + s * 6), int(cy - 5)),
            (int(cx + s * 1), int(cy - 8)), (int(cx), int(cy - 8)), (int(cx + s * 7), int(cy - 2)),
            (int(cx + s * 7), int(cy - 3)), (int(cx + s * 2), int(cy - 4))]

def afro_front(G):
    G.ellipse(16, 11.4, 10.6, 8.6, "h", lambda x, y, dx, dy: not (y >= 12 and 9 <= x <= 22))
    for x in range(8, 24):
        for y in range(8, (10 if 10 <= x <= 21 else 11) + 1): G.put(x, y, "h")
    for y in range(12, 16): G.put(7, y, "h"); G.put(24, y, "h"); G.put(6, y, "h"); G.put(25, y, "h")
    _curls(G, 16, 11.4, 10.6, 8.6, 1)

def afro_side(G):
    G.ellipse(15.5, 11.4, 10.4, 8.6, "h", lambda x, y, dx, dy: not (y >= 12 and x >= 15))
    for x in range(14, 25):
        for y in range(8, (10 if x >= 18 else 11) + 1): G.put(x, y, "h")
    for y in range(11, 17):
        for x in range(6, 14): G.put(x, y, "h")
    _curls(G, 15.5, 11.4, 10.4, 8.6, -1)
    ear_side(G)

def pony_front(G):
    G.ellipse(16, 12.2, 9.4, 9, "h", lambda x, y, dx, dy: y <= 11)
    for x in range(9, 23):                                               # swept fringe, longer on the right
        for y in range(8, (11 if x < 17 else 12) + 1): G.put(x, y, "h")
    for y in range(11, 17): G.put(8, y, "h"); G.put(23, y, "h")
    for y in range(12, 21): G.put(25, y, "h"); G.put(24, y, "h") if y <= 18 else None   # tail peeking out
    G.put(24, 11, "t"); G.put(25, 11, "t")                               # hair tie
    G.put(7, 15, "s"); G.put(7, 16, "S")
    G.recolor("h", "j", lambda x, y: x >= 23 or (y >= 10 and x in (12, 16, 19)))
    for x, y in ((10, 6), (11, 5), (12, 5), (13, 4), (14, 4), (15, 4), (18, 5), (19, 5)): G.put(x, y, "H")
    for x, y in ((12, 17), (13, 18), (19, 17), (20, 18)): G.put(x, y, "f") if G.get(x, y) == "s" else None

def pony_side(G):
    G.ellipse(17, 12.2, 9.4, 9, "h", lambda x, y, dx, dy: y <= 12)
    for y in range(11, 16):
        for x in range(10, 16): G.put(x, y, "h")
    for x in range(18, 26):
        for y in range(8, (11 if x < 23 else 12) + 1): G.put(x, y, "h")
    G.put(8, 9, "t"); G.put(8, 10, "t"); G.put(9, 9, "t"); G.put(9, 10, "t")     # hair tie at the back
    for y, x0, x1 in ((9, 5, 7), (10, 4, 7), (11, 4, 7), (12, 4, 7), (13, 4, 6), (14, 4, 6), (15, 4, 6),
                      (16, 5, 6), (17, 5, 6), (18, 5, 6), (19, 6, 6)):
        for x in range(x0, x1 + 1): G.put(x, y, "h")
    G.recolor("h", "j", lambda x, y: x <= 5 or (y >= 13 and x <= 7) or (y >= 10 and x in (20, 23)))
    for x, y in ((12, 5), (13, 4), (14, 4), (15, 4), (19, 4), (20, 5), (6, 10), (6, 11)): G.put(x, y, "H")
    for x, y in ((21, 17), (23, 17), (22, 18)): G.put(x, y, "f") if G.get(x, y) == "s" else None

STYLES = {"bob": (bob_front, bob_side), "curto": (short_front, short_side),
          "afro": (afro_front, afro_side), "rabo": (pony_front, pony_side)}

HEADS = {
    "cabeca-1": {"style": "bob", "palette": {
        "h": "#cdb592", "H": "#efe2c6", "j": "#9b8368", "J": "#6f5c4a", "s": "#fde7d8", "S": "#f0c6b2",
        "e": "#1f2a5c", "I": "#3366cc", "i": "#86b6f2", "p": "#f6b0ab"}},
    "cabeca-2": {"style": "curto", "palette": {
        "h": "#5a3b2a", "H": "#8d6246", "j": "#3a2519", "J": "#24160f", "s": "#e8b48f", "S": "#cc916c",
        "e": "#2a1d14", "I": "#6b4226", "i": "#b07d50", "p": "#e59a85"}},
    "cabeca-3": {"style": "afro", "palette": {
        "h": "#3d2e28", "H": "#715a4e", "j": "#241a17", "J": "#140e0d", "s": "#9c6646", "S": "#7d4e33",
        "e": "#120c0a", "I": "#4a2c1a", "i": "#94603a", "p": "#b56a52"}},
    "cabeca-4": {"style": "rabo", "palette": {
        "h": "#d0682e", "H": "#f3a565", "j": "#9c4620", "J": "#6e2f14", "s": "#fde3cf", "S": "#f2c2a6",
        "e": "#1e3a2a", "I": "#2f8f4f", "i": "#80d39b", "p": "#f5a99a", "f": "#d9926e", "t": "#3a7bd5"}},
}

def build(style):
    front, side = STYLES[style]
    gf = Grid(); face_front(gf); front(gf); eyes_front(gf)
    gs = Grid(); face_side(gs); ear_side(gs); side(gs); eyes_side(gs)
    return gf.rows(), gs.rows()

def spec_for(name, rows_front, rows_side, palette, rows_back=None):
    pal = {"k": "#1b1d2a", "Q": "#ffffff"}; pal.update(palette)
    return {"schema": "codeart2d.pixelspec.v1", "name": name, "canvas": [W, H], "anchor_px": [16, 24],
            "palette": pal, "outline": {"mode": "solid", "color": "k"},
            "poses": dict({"front": rows_front, "side": rows_side}, **({"back": rows_back} if rows_back else {})),
            "layers": [{"name": "cabeca", "origin": [0, 0], "rows": "front"}],
            "frames": [{"name": "front"}, {"name": "side", "layers": {"cabeca": {"rows": "side"}}}]
                      + ([{"name": "back", "layers": {"cabeca": {"rows": "back"}}}] if rows_back else [])}

if __name__ == "__main__":
    out = Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
    for name, cfg in HEADS.items():
        f, s = build(cfg["style"])
        (out / f"{name}.pixelspec.json").write_text(json.dumps(spec_for(name, f, s, cfg["palette"]), indent=1), encoding="utf-8")
        print("wrote", name)

def helmet_spec(project):
    """The approved helmet re-painted alone (same code and coordinates as the full sprites), as a head."""
    here = Path(__file__).resolve().parent
    front_src = (here / "nasa_astronaut.py").read_text()
    header = front_src.split("# --- life-support backpack")[0]
    helmet = front_src.split("# --- helmet")[1].split('rows = ["".join(r) for r in g]')[0]
    helmet = "\n".join(l for l in helmet.splitlines() if "neck ring" not in l)
    ns = {}
    exec(header.replace("H = 32, 47", "H = 32, 26").replace("W, H = 32, 47", "W, H = 32, 26") + helmet + '\nrows = ["".join(r) for r in g]', ns)
    front_rows = ns["rows"]
    side_src = (here / "nasa_walk_side.py").read_text()
    body = side_src.split("    # helmet\n")[1].split("    return")[0]
    body = "\n".join(l[4:] for l in body.splitlines() if "rect(12, 22, 22, 23" not in l)
    ns2 = {}
    exec(header.replace("W, H = 32, 47", "W, H = 32, 26") + body + '\nrows = ["".join(r) for r in g]', ns2)
    side_rows = ns2["rows"]
    full_front = json.loads((Path(project) / "characters/astronauta-nasa/spec/astronauta-nasa-v1.pixelspec.json").read_text())
    spec = spec_for("capacete", front_rows, side_rows, {})
    spec["palette"] = dict(full_front["palette"])
    return spec

# ---------------------------------------------------------------- back views (seen from behind)
PIN["back"] = (16, 22)

def face_back(G):
    G.rect(14, 19, 17, 22, "S")                                         # nape / neck
    G.ellipse(16, 15.6, 7.6, 6.4, "s")

def bob_back(G):
    G.ellipse(16, 12.6, 10, 9.3, "h")
    for y in range(11, 22):
        for x in range(6, 26):
            if y <= 18 or (y <= 20 and 7 <= x <= 24) or (y == 21 and x in (8, 9, 12, 13, 18, 19, 22, 23)): G.put(x, y, "h")
    G.put(16, 2, "h"); G.put(17, 2, "h"); G.put(15, 3, "h"); G.put(18, 3, "j")
    for x, y0, y1 in ((10, 13, 17), (13, 10, 15), (16, 12, 19), (19, 9, 14), (22, 13, 18), (12, 16, 20), (20, 16, 20)):
        for y in range(y0, y1 + 1): G.put(x, y, "j")                    # strands of varied length
    G.recolor("h", "j", lambda x, y: x >= 24 or y >= 19)
    G.recolor("j", "J", lambda x, y: y >= 20)
    for x, y in ((9, 7), (10, 6), (11, 6), (12, 5), (13, 5), (14, 5), (17, 5), (18, 5), (19, 5), (20, 6), (21, 6), (22, 7)):
        G.put(x, y, "H")

def short_back(G):
    G.ellipse(16, 12, 9.2, 8.6, "h")
    for x, y in ((10, 4), (12, 3), (14, 2), (17, 2), (19, 3), (21, 4), (13, 3), (18, 3)): G.put(x, y, "h")
    for y in range(12, 18):
        for x in range(9, 23): G.put(x, y, "h")
    for x in (10, 12, 14, 16, 18, 20, 22): G.put(x, 18, "h") if x % 4 == 2 else None   # ragged nape
    G.put(7, 14, "s"); G.put(7, 15, "S"); G.put(24, 14, "s"); G.put(24, 15, "S")         # ears
    G.recolor("h", "j", lambda x, y: x >= 22 or y >= 16 or (y >= 8 and x in (12, 16, 20)))
    for x, y in ((11, 5), (12, 5), (13, 4), (14, 4), (17, 4), (18, 4), (19, 5)): G.put(x, y, "H")

def afro_back(G):
    G.ellipse(16, 11.4, 10.6, 8.6, "h")
    for y in range(12, 19):
        for x in range(7, 25): G.put(x, y, "h")
    _curls(G, 16, 11.4, 10.6, 8.6, 1)

def pony_back(G):
    G.ellipse(16, 12.2, 9.4, 9, "h")
    for y in range(11, 17):
        for x in range(8, 24): G.put(x, y, "h")
    G.recolor("h", "j", lambda x, y: x >= 22 or y >= 15 or (y >= 6 and x in (12, 20)))
    G.rect(14, 8, 17, 9, "t")                                            # hair tie
    for y, x0, x1 in ((10, 13, 18), (11, 13, 18), (12, 13, 18), (13, 13, 18), (14, 14, 18), (15, 14, 17),
                      (16, 14, 17), (17, 14, 17), (18, 14, 17), (19, 14, 17), (20, 15, 17), (21, 15, 16), (22, 15, 16), (23, 15, 15)):
        for x in range(x0, x1 + 1): G.put(x, y, "h")                    # ponytail, lighter than the head
    for y in range(10, 21): G.put(14 if y < 14 else 15, y, "H")          # its highlight
    for y in range(10, 23): G.put(18 if y < 14 else (17 if y < 21 else 16), y, "j")
    G.recolor("h", "J", lambda x, y: y >= 15 and (x <= 12 or x >= 19))
    for x, y in ((11, 5), (12, 5), (13, 4), (14, 4), (18, 5), (19, 5)): G.put(x, y, "H")

BACK = {"bob": bob_back, "curto": short_back, "afro": afro_back, "rabo": pony_back}

def build_back(style):
    g = Grid(); face_back(g); BACK[style](g); return g.rows()

def helmet_back():
    g = Grid()
    g.ellipse(16, 13, 11, 11, "W")
    g.ellipse(16, 13, 11, 11, "w", lambda x, y, dx, dy: dx * .6 + dy * .8 > .55)
    g.ellipse(16, 13, 11, 11, "x", lambda x, y, dx, dy: dx * .6 + dy * .8 > .85)
    for (x0, x1) in ((4, 6), (25, 27)):                                  # lamps on the sides
        g.rect(x0, 10, x1, 13, "x"); g.put(x0 + 1, 11, "l"); g.put(x0 + 1, 12, "l")
    g.rect(8, 16, 24, 16, "x")                                           # rear seam band
    for x in (12, 13, 14): g.put(x, 4, "Q")
    g.put(11, 5, "Q")
    return g.rows()

def write_all(out_dir, project="."):
    out = Path(out_dir); out.mkdir(parents=True, exist_ok=True)
    for name, cfg in HEADS.items():
        f, s = build(cfg["style"])
        spec = spec_for(name, f, s, cfg["palette"], build_back(cfg["style"]))
        (out / f"{name}.pixelspec.json").write_text(json.dumps(spec, indent=1), encoding="utf-8")
    helm = helmet_spec(project)
    helm["poses"]["back"] = helmet_back()
    helm["frames"].append({"name": "back", "layers": {"cabeca": {"rows": "back"}}})
    (out / "capacete.pixelspec.json").write_text(json.dumps(helm, indent=1), encoding="utf-8")
    apply_manual(out)
    print("wrote", list(HEADS) + ["capacete"])

def apply_manual(out):
    """Pixel edits the user made by hand (heads-manual.json) win over the generated poses."""
    manual = out / "heads-manual.json"
    if not manual.exists():
        return
    for name, views in json.loads(manual.read_text(encoding="utf-8"))["poses"].items():
        path = out / f"{name}.pixelspec.json"
        spec = json.loads(path.read_text(encoding="utf-8"))
        spec["poses"].update(views)
        path.write_text(json.dumps(spec, indent=1), encoding="utf-8")
