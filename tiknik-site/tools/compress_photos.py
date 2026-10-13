"""Shrink oversized catalog photos in place.

Filenames stay the same, so the database needs no changes. Photos are scaled down to at most
MAX_SIDE px on the long side and re-saved at QUALITY — plenty for the site's full-screen zoom.

Run in a PythonAnywhere Bash console (Pillow is preinstalled there):

    cd ~/tiknik-repo/tiknik-site
    python3 tools/compress_photos.py              # dry run: lists what would be shrunk
    python3 tools/compress_photos.py --apply      # does it
"""
import os
import sys

from PIL import Image, ImageOps

FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static", "img", "products")
MAX_SIDE = 2000
QUALITY = 82
MIN_BYTES = 800 * 1024  # files smaller than this are left alone
FORMATS = {"jpg": "JPEG", "jpeg": "JPEG", "png": "PNG", "webp": "WEBP"}


def mb(n):
    return f"{n / (1024 * 1024):.1f} MB"


def shrink(path, fmt):
    tmp = path + ".tmp"
    with Image.open(path) as im:
        im.draft("RGB", (MAX_SIDE, MAX_SIDE))  # decode big JPEGs at reduced size — far less CPU
        im = ImageOps.exif_transpose(im)  # bake in the phone's rotation, since EXIF isn't kept
        im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
        if fmt == "JPEG" and im.mode != "RGB":
            im = im.convert("RGB")
        if fmt == "PNG":
            im.save(tmp, fmt, optimize=True)
        else:
            im.save(tmp, fmt, quality=QUALITY, optimize=True)
    if os.path.getsize(tmp) < os.path.getsize(path):
        os.replace(tmp, path)
    else:
        os.remove(tmp)


def main():
    apply = "--apply" in sys.argv
    before = after = 0
    for name in sorted(os.listdir(FOLDER)):
        path = os.path.join(FOLDER, name)
        fmt = FORMATS.get(name.rsplit(".", 1)[-1].lower())
        if not fmt or not os.path.isfile(path):
            continue
        size = os.path.getsize(path)
        if size == 0:
            print(f"  EMPTY  {name} — 0 bytes, broken upload: remove it in /admin and upload again")
            continue
        if size < MIN_BYTES:
            continue
        before += size
        if not apply:
            print(f"  {mb(size):>9}  {name}")
            after += size
            continue
        try:
            shrink(path, fmt)
        except Exception as e:  # one bad file shouldn't stop the rest
            print(f"  FAILED {name}: {e}")
        new = os.path.getsize(path)
        after += new
        print(f"  {mb(size):>9} -> {mb(new):>8}  {name}")

    if apply:
        print(f"\nDone: {mb(before)} -> {mb(after)}, freed {mb(before - after)}.")
    else:
        print(f"\n{mb(before)} in photos over {mb(MIN_BYTES)}. Run again with --apply to shrink them.")


if __name__ == "__main__":
    main()
