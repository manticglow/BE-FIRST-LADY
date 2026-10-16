#!/usr/bin/env python3
"""
توليد أيقونات PWA بكل الأحجام من اللوقو
"""
from PIL import Image, ImageDraw
import os

LOGO_PATH = "public/images/logo.png"
OUT_DIR = "public/icons"
os.makedirs(OUT_DIR, exist_ok=True)

# ألوان الهوية
CREAM = (251, 247, 239)  # #fbf7ef
GOLD_DEEP = (125, 97, 59)  # #7d613b
GOLD_LIGHT = (201, 169, 110)  # #c9a96e

# الأحجام المطلوبة لـ PWA
SIZES = [
    (72, False),    # android
    (96, False),    # android
    (128, False),   # desktop
    (144, False),   # windows tile
    (152, False),   # ipad
    (167, False),   # ipad pro
    (180, False),   # iphone (apple-touch-icon)
    (192, False),   # android (required)
    (192, True),    # maskable
    (384, False),   # splash
    (512, False),   # android (required)
    (512, True),    # maskable
]

logo = Image.open(LOGO_PATH).convert("RGBA")

for size, maskable in SIZES:
    # خلفية كريمية بتدرّج ذهبي خفيف
    bg = Image.new("RGBA", (size, size), CREAM)
    draw = ImageDraw.Draw(bg)

    # دائرة ذهبية ناعمة في الخلفية
    pad = size // 8
    draw.ellipse([pad, pad, size - pad, size - pad], fill=GOLD_LIGHT + (30,))

    # اللوقو
    # maskable يحتاج هامش أكبر (safe zone 80%)
    if maskable:
        logo_size = int(size * 0.60)
    else:
        logo_size = int(size * 0.78)

    logo_resized = logo.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
    offset = (size - logo_size) // 2
    bg.paste(logo_resized, (offset, offset), logo_resized)

    suffix = "-maskable" if maskable else ""
    filename = f"icon-{size}{suffix}.png"
    bg.save(os.path.join(OUT_DIR, filename), "PNG", optimize=True)
    print(f"✓ {filename}")

# favicon
for s in [16, 32, 48, 64]:
    bg = Image.new("RGBA", (s, s), CREAM)
    logo_small = logo.resize((int(s * 0.85), int(s * 0.85)), Image.Resampling.LANCZOS)
    offset = (s - int(s * 0.85)) // 2
    bg.paste(logo_small, (offset, offset), logo_small)
    bg.save(f"public/favicon-{s}.png", "PNG", optimize=True)

# صورة شاشة الفتح iOS
splash = Image.new("RGB", (2048, 2732), CREAM)  # iPad Pro portrait
logo_splash = logo.resize((600, 600), Image.Resampling.LANCZOS)
splash.paste(logo_splash, ((2048 - 600) // 2, (2732 - 600) // 2), logo_splash)
splash.save("public/apple-splash.png", "PNG", optimize=True, quality=85)

print("\n✓ كل الأيقونات تم توليدها")
