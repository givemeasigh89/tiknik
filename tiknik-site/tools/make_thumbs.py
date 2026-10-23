"""Make the small copies of product photos that catalog cards and thumbnails use.

New uploads get theirs from the admin page (made in the browser). This fills in any that are
missing — e.g. photos uploaded before thumbnails existed. It only adds files, never changes the
original photos, and skips photos that already have a thumbnail, so it is safe to run any time.
The /deploy endpoint runs it after each update; by hand, in a PythonAnywhere Bash console:

    cd ~/tiknik-repo/tiknik-site && python3 tools/make_thumbs.py
"""
import os
import sys

from PIL import Image, ImageOps

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRODUCTS = os.path.join(BASE, "static", "img", "products")
THUMBS = os.path.join(PRODUCTS, "thumbs")
MAX_SIDE = 700
QUALITY = 80
IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp"}


def main():
    os.makedirs(THUMBS, exist_ok=True)
    made = 0
    for name in sorted(os.listdir(PRODUCTS)):
        path = os.path.join(PRODUCTS, name)
        base, ext = os.path.splitext(name)
        if ext.lower() not in IMAGE_EXT or not os.path.isfile(path) or os.path.getsize(path) == 0:
            continue
        out = os.path.join(THUMBS, base + ".jpg")
        if os.path.exists(out):
            continue
        try:
            with Image.open(path) as im:
                im.draft("RGB", (MAX_SIDE, MAX_SIDE))  # decode big JPEGs at reduced size
                im = ImageOps.exif_transpose(im).convert("RGB")
                im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
                im.save(out + ".tmp", "JPEG", quality=QUALITY, optimize=True, progressive=True)
            os.replace(out + ".tmp", out)
            made += 1
        except Exception as e:  # one bad file shouldn't stop the rest
            print(f"skipped {name}: {e}", file=sys.stderr)
    print(f"thumbnails made: {made}")


if __name__ == "__main__":
    main()
