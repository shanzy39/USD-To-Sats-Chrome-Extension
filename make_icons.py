"""Generate icon PNGs for the USD to Sats extension."""

from PIL import Image, ImageDraw, ImageFont
import os

OUT_DIR = os.path.join(os.path.dirname(__file__), "icons")
os.makedirs(OUT_DIR, exist_ok=True)

# Bitcoin orange background, white "$→S" symbol
BG = (247, 147, 26, 255)   # Bitcoin orange
FG = (255, 255, 255, 255)  # White


def find_font(size):
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/SFNS.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


def make_icon(size):
    img = Image.new("RGBA", (size, size), BG)
    draw = ImageDraw.Draw(img)

    # Rounded-corner mask
    radius = max(2, size // 6)
    mask = Image.new("L", (size, size), 0)
    mdraw = ImageDraw.Draw(mask)
    mdraw.rounded_rectangle((0, 0, size, size), radius=radius, fill=255)

    rounded = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    rounded.paste(img, (0, 0), mask)

    draw = ImageDraw.Draw(rounded)
    text = "$→S"
    font_size = max(8, int(size * 0.45))
    font = find_font(font_size)

    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = (size - tw) // 2 - bbox[0]
    y = (size - th) // 2 - bbox[1]
    draw.text((x, y), text, fill=FG, font=font)

    return rounded


for s in (16, 48, 128):
    out = os.path.join(OUT_DIR, f"icon{s}.png")
    make_icon(s).save(out, "PNG")
    print("wrote", out)
