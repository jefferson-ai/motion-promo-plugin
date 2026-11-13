# Draws stand-in pictures so a new project renders before real captures exist:
#   python3 scripts/make-placeholders.py
# public/app/screen.png (a phone screen), icon.png, piece-1..4.png (UI cards). Each says REPLACE so it can't slip
# into a real video: swap them for real captures from the app (see reference/playbook.md, "Real product footage").
from PIL import Image, ImageDraw
import os
os.makedirs("public/app", exist_ok=True)
BLUE, INK, PAPER, LINE = (61, 102, 197), (23, 40, 68), (255, 255, 255), (220, 228, 240)

def card(w, h, title, rows, path):
    im = Image.new("RGB", (w, h), PAPER); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, w - 1, h - 1], outline=LINE, width=4)
    d.text((40, 30), title, fill=INK, font_size=46)
    for i in range(rows):
        y = 110 + i * 70
        d.rounded_rectangle([40, y, w - 40, y + 24], 12, fill=LINE)
        d.rounded_rectangle([40, y, 40 + (w - 80) * (0.8 - i * 0.18), y + 24], 12, fill=BLUE)
    d.text((w - 260, h - 60), "REPLACE", fill=(200, 60, 60), font_size=40)
    im.save(path)

screen = Image.new("RGB", (1206, 2622), (244, 246, 251)); d = ImageDraw.Draw(screen)
d.text((80, 180), "9:41", fill=INK, font_size=50)
d.text((80, 340), "Total balance", fill=(89, 109, 140), font_size=56)
d.text((80, 420), "2,400.00", fill=INK, font_size=150)
for i in range(6):
    y = 760 + i * 260
    d.rounded_rectangle([60, y, 1146, y + 220], 48, fill=PAPER, outline=LINE, width=4)
    d.ellipse([110, y + 50, 230, y + 170], fill=(185, 200, 232))
    d.rounded_rectangle([280, y + 70, 760, y + 110], 20, fill=LINE)
    d.text((880, y + 70), f"-{(i + 1) * 37}.00", fill=INK, font_size=56)
d.text((330, 2440), "REPLACE with a real capture", fill=(200, 60, 60), font_size=48)
screen.save("public/app/screen.png")

icon = Image.new("RGB", (512, 512), BLUE); d = ImageDraw.Draw(icon)
d.rounded_rectangle([140, 140, 372, 372], 40, outline=PAPER, width=28)
icon.save("public/app/icon.png")

card(1100, 460, "Budget", 4, "public/app/piece-1.png")
card(1050, 190, "Goal: New laptop", 1, "public/app/piece-2.png")
card(1050, 190, "Goal: Holiday", 1, "public/app/piece-3.png")
card(1050, 520, "Where it went", 5, "public/app/piece-4.png")
print("placeholders written to public/app/")
