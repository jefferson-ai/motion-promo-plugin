# Turns a reference video into contact sheets (a grid of frames) so it can be studied as stills.
#   npm run sheet -- references/ad.mp4 [frames per second, default 2]
# Writes out/sheets/<video name>/sheet-01.jpg, … (12 frames per sheet: 4 columns for landscape, 6 for vertical)
# and prints each sheet's time range. Needs Pillow (pip install pillow).
import os, subprocess, sys, tempfile, glob
from PIL import Image, ImageDraw

if len(sys.argv) < 2:
    sys.exit("usage: python3 scripts/contact-sheet.py <video> [fps]")
video = sys.argv[1]
rate = float(sys.argv[2]) if len(sys.argv) > 2 else 2.0
name = os.path.splitext(os.path.basename(video))[0]
out = os.path.join("out", "sheets", name)
os.makedirs(out, exist_ok=True)

with tempfile.TemporaryDirectory() as tmp:
    # Remotion's bundled ffmpeg has no `fps` filter; the output option -r does the same job.
    subprocess.run(["npx", "remotion", "ffmpeg", "-v", "error", "-i", video, "-r", str(rate),
                    "-vf", "scale=iw/2:ih/2", os.path.join(tmp, "%04d.jpeg")], check=True)
    frames = sorted(glob.glob(os.path.join(tmp, "*.jpeg")))
    if not frames:
        sys.exit("no frames extracted")
    w, h = Image.open(frames[0]).size
    cols = 4 if w >= h else 6
    rows = 3 if w >= h else 2
    per = cols * rows
    thumb_w = 480 if w >= h else 300
    thumb_h = round(h * thumb_w / w)
    for n in range(0, len(frames), per):
        batch = frames[n:n + per]
        sheet = Image.new("RGB", (cols * thumb_w, ((len(batch) - 1) // cols + 1) * (thumb_h + 28)), "white")
        draw = ImageDraw.Draw(sheet)
        for i, f in enumerate(batch):
            x, y = (i % cols) * thumb_w, (i // cols) * (thumb_h + 28)
            sheet.paste(Image.open(f).resize((thumb_w, thumb_h)), (x, y + 28))
            draw.text((x + 6, y + 6), f"{(n + i) / rate:.1f}s", fill="black")
        path = os.path.join(out, f"sheet-{n // per + 1:02d}.jpg")
        sheet.save(path, quality=82)
        print(f"{path}  {n / rate:.1f}s – {(n + len(batch) - 1) / rate:.1f}s")
