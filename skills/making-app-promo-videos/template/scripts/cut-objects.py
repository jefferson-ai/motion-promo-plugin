# Cuts each object out of a picture with a plain pale background into its own transparent PNG.
# usage: python3 scripts/cut-objects.py <picture> <output folder>   (needs Pillow)
import sys
from collections import deque
from PIL import Image, ImageFilter, ImageDraw
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB")
W, H = im.size
px = im.load()

def mask_for(sat_min, dark_max, close):
    """White where a pixel is coloured enough or dark enough to be part of an object; holes filled."""
    mask = Image.new("L", (W, H), 0); m = mask.load()
    for y in range(H):
        for x in range(W):
            r, g, b = px[x, y]
            if max(r, g, b) - min(r, g, b) > sat_min or min(r, g, b) < dark_max: m[x, y] = 255
    mask = mask.filter(ImageFilter.MaxFilter(close)).filter(ImageFilter.MinFilter(close))
    mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
    outside = mask.copy(); ImageDraw.floodfill(outside, (0, 0), 128)
    return outside.point(lambda v: 0 if v == 128 else 255)

strict = mask_for(22, 150, 5).load()   # certain: separates objects that touch, but nibbles pale areas
loose = mask_for(11, 205, 5).load()    # generous: keeps the pale paper, but can join neighbours

# 1. Number the separate objects in the strict mask.
label = [[0] * W for _ in range(H)]; sizes = {}; n = 0
for y0 in range(H):
    for x0 in range(W):
        if strict[x0, y0] and not label[y0][x0]:
            n += 1; label[y0][x0] = n; stack = [(x0, y0)]; count = 0
            while stack:
                x, y = stack.pop(); count += 1
                for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
                    nx, ny = x+dx, y+dy
                    if 0 <= nx < W and 0 <= ny < H and strict[nx, ny] and not label[ny][nx]:
                        label[ny][nx] = n; stack.append((nx, ny))
            sizes[n] = count
keep = {k for k, c in sizes.items() if c > 1500}
# 2. Grow every object outwards into the generous mask, all at the same speed, so neighbours meet halfway.
queue = deque()
for y in range(H):
    for x in range(W):
        if label[y][x] in keep: queue.append((x, y))
        else: label[y][x] = 0
while queue:
    x, y = queue.popleft()
    for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
        nx, ny = x+dx, y+dy
        if 0 <= nx < W and 0 <= ny < H and loose[nx, ny] and not label[ny][nx]:
            label[ny][nx] = label[y][x]; queue.append((nx, ny))
# 3. Save each one, enlarged 3x with a smooth edge.
SCALE = 3
order = sorted(keep, key=lambda k: next((y // 140, x) for y in range(H) for x in range(W) if label[y][x] == k))
for i, k in enumerate(order):
    pts = [(x, y) for y in range(H) for x in range(W) if label[y][x] == k]
    xs = [x for x, _ in pts]; ys = [y for _, y in pts]
    box = (max(0, min(xs)-4), max(0, min(ys)-4), min(W, max(xs)+5), min(H, max(ys)+5))
    piece = Image.new("L", (W, H), 0); p = piece.load()
    for x, y in pts: p[x, y] = 255
    size = ((box[2]-box[0])*SCALE, (box[3]-box[1])*SCALE)
    alpha = piece.crop(box).resize(size, Image.BICUBIC)
    # blur then sharpen the edge again: rounds off the pixel steps and pulls the edge in past the pale fringe
    alpha = alpha.filter(ImageFilter.GaussianBlur(4)).point(lambda v: max(0, min(255, int((v - 138) * 4.2))))
    rgb = im.crop(box).resize(size, Image.LANCZOS).filter(ImageFilter.UnsharpMask(2, 60, 2))
    rgb.putalpha(alpha)
    rgb.save(f"{out}/note{i+1}.png")
    print(i+1, box, rgb.size, len(pts))
