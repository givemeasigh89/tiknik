import hmac
import itertools
import json
import os
import re
import secrets
import sqlite3
import subprocess
import time

from flask import Flask, abort, g, jsonify, make_response, redirect, render_template, request, session, url_for, flash
from werkzeug.utils import secure_filename
from werkzeug.middleware.proxy_fix import ProxyFix

import content_translations
from i18n import JS_KEYS, LANG_LABELS, LANGS, translator

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "tiknik.db")
PRODUCTS_DIR = os.path.join(BASE_DIR, "static", "img", "products")
# Small copies of product photos for catalog cards and thumbnails (made in the admin's browser on
# upload, or by tools/make_thumbs.py for older photos). Pages fall back to the full photo without one.
THUMBS_DIR = os.path.join(PRODUCTS_DIR, "thumbs")
MAX_THUMB_KB = 400
REVIEWS_DIR = os.path.join(BASE_DIR, "static", "img", "reviews")
WSGI_FILE = "/var/www/tiknik_pythonanywhere_com_wsgi.py"

# The fixed item attributes the catalog used to have (columns on `items`). Item parameters
# now live in `item_attrs`, one row per parameter, so each item can have its own set;
# these are only used to migrate old data and as the starting set for new items.
ATTRS = ("fabric", "colour", "lace", "made_to", "occasions")

# Their labels in every language — also how they used to be written as "Label: value"
# lines inside descriptions.
LEGACY_ATTR_LABELS = {
    "en": {"fabric": "Fabric", "colour": "Colour", "lace": "Lace", "made_to": "Made to", "occasions": "Occasions"},
    "ru": {"fabric": "Ткань", "colour": "Цвет", "lace": "Кружево", "made_to": "Пошив", "occasions": "Поводы"},
    "hy": {"fabric": "Կտոր", "colour": "Գույն", "lace": "Ժանյակ", "made_to": "Կարվում է", "occasions": "Առիթներ"},
}

ALLOWED_EXT = {"jpg", "jpeg", "png", "webp"}
VIDEO_EXT = {"mp4", "webm", "mov"}
MAX_PHOTOS = 20
MAX_VIDEOS = 3
# Free PythonAnywhere accounts get 512 MB of disk in total (code included), so videos are capped.
MAX_VIDEO_MB = 30

MAX_REVIEW_PHOTOS = 3
MAX_REVIEW_PHOTO_MB = 6  # the site shrinks photos in the browser first, so real ones are far smaller
MAX_REVIEW_CHARS = 800
ORDER_STATUSES = ("new", "confirmed", "done", "cancelled")
DEFAULT_INSTAGRAM = "https://www.instagram.com/tiknik.yvn/"
MODES = ("Sale", "Rent", "Both", "Custom")

# Set in the PythonAnywhere WSGI file (never commit them). Empty ADMIN_PASSWORD disables admin login.
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")

app = Flask(__name__)
# PythonAnywhere sits behind a proxy: trust its X-Forwarded-Proto so external links are https.
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)
app.secret_key = os.environ.get("SECRET_KEY") or os.urandom(32)
app.config["MAX_CONTENT_LENGTH"] = 100 * 1024 * 1024


# ---------------------------------------------------------------------------
# DB helpers
# ---------------------------------------------------------------------------

def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


@app.teardown_appcontext
def close_db(exception=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


# ---------------------------------------------------------------------------
# Default data (used only to seed empty tables on first run — never
# re-applied once the tables already have rows, so live edits made from
# /admin are never overwritten by redeploys)
# ---------------------------------------------------------------------------

DEFAULT_CATEGORIES = [
    ("corsets", "Corsets"),
    ("skirts", "Skirts"),
    ("veils", "Veils"),
    ("wedding-dresses", "Wedding Dresses"),
    ("accessories", "Accessories"),
    ("rental", "Rental"),
    ("made-to-order", "Made to Order"),
]

# (name, category slug, description, mode, price in AMD or None)
SEED_ITEMS = [
    ("Ivory Silk Corset", "corsets", "Boned corset in ivory silk with fine lace trim.", "Both", 145000),
    ("Blush Boned Corset", "corsets", "Sheer lace overlay corset, fitted to the body.", "Rent", 132000),
    ("Charcoal Satin Corset", "corsets", "Structured satin corset with back lacing.", "Sale", 98000),
    ("Lace Overlay Corset", "corsets", "Sheer lace overlay corset, fitted to the body.", "Both", 132000),
    ("Pearl-Trim Corset", "corsets", "Hand-sewn pearl trim along a sweetheart neckline.", "Custom", None),
    ("Silk Tulle Midi Skirt", "skirts", "Layered tulle midi, soft A-line silhouette.", "Rent", 68000),
    ("Satin Wrap Skirt", "skirts", "Bias-cut satin wrap skirt with side slit.", "Sale", 54000),
    ("Chiffon Maxi Skirt", "skirts", "Floor-length chiffon with a fitted waistband.", "Both", 76000),
    ("Tiered Lace Skirt", "skirts", "Three-tier vintage lace skirt.", "Rent", 71000),
    ("Classic Tulle Veil", "veils", "Single-layer cathedral veil, raw edge.", "Rent", 32000),
    ("Lace-Edge Veil", "veils", "Fingertip veil finished with Chantilly lace edge.", "Sale", 28000),
    ("Drop Veil", "veils", "Short drop veil, blusher included.", "Both", 24000),
    ("Madeleine Gown", "wedding-dresses", "Fabric: Batiste\nColour: Milky white\nLace: Vintage lace, early 1980s\nMade to: Individual measurements\nOccasions: Pre-wedding photoshoots, engagement parties, weddings\n\nA vintage-inspired bridal gown crafted from soft milky batiste and finished with original vintage lace dating from the early 1980s. The softly structured silhouette and delicate lace detailing give the dress a timeless, understated character — designed for brides who appreciate authentic vintage materials and considered craftsmanship.", "Custom", None),
    ("Ivory Mermaid Gown", "wedding-dresses", "Fitted mermaid silhouette in ivory crepe with a chapel train.", "Both", 420000),
    ("Classic Ballgown", "wedding-dresses", "Full ballgown skirt with structured corseted bodice.", "Rent", 380000),
    ("Minimalist Slip Gown", "wedding-dresses", "Bias-cut silk slip gown, old-money minimalism.", "Sale", 310000),
    ("Boho Lace Gown", "wedding-dresses", "Relaxed lace gown with bell sleeves.", "Both", 295000),
    ("Pearl Hairpins (Set of 3)", "accessories", "Hand-set freshwater pearl hairpins.", "Sale", 18000),
    ("Satin Gloves", "accessories", "Opera-length satin gloves, ivory.", "Rent", 12000),
    ("Crystal Belt", "accessories", "Thin crystal-embellished waist belt.", "Both", 26000),
    ("Silk Garter", "accessories", "Ivory silk garter with lace trim.", "Sale", 9000),
    ("Rental Starter Set", "rental", "Corset + skirt rental bundle, 3-day rental.", "Rent", 110000),
    ("Weekend Rental Gown", "rental", "Any in-stock gown, 3-day weekend rental.", "Rent", 150000),
    ("Bespoke Bridal Commission", "made-to-order", "Fully custom gown built to your measurements and sketch.", "Custom", None),
]


def _table_columns(db, table):
    return {row["name"] for row in db.execute(f"PRAGMA table_info({table})")}


def init_db():
    os.makedirs(PRODUCTS_DIR, exist_ok=True)
    os.makedirs(THUMBS_DIR, exist_ok=True)
    os.makedirs(REVIEWS_DIR, exist_ok=True)
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row

    db.execute(
        """CREATE TABLE IF NOT EXISTS categories (
            slug TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            position INTEGER NOT NULL
        )"""
    )
    if db.execute("SELECT COUNT(*) AS c FROM categories").fetchone()["c"] == 0:
        for i, (slug, name) in enumerate(DEFAULT_CATEGORIES):
            db.execute("INSERT INTO categories (slug, name, position) VALUES (?,?,?)", (slug, name, i))

    db.execute(
        """CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            mode TEXT NOT NULL DEFAULT 'Sale',
            price INTEGER,
            image TEXT
        )"""
    )
    item_cols = _table_columns(db, "items")
    if "image" not in item_cols:
        db.execute("ALTER TABLE items ADD COLUMN image TEXT")

    # `price` is the sale price; `rent_price` is the rental price per day.
    if "rent_price" not in _table_columns(db, "items"):
        db.execute("ALTER TABLE items ADD COLUMN rent_price INTEGER")
    # Handmade facts shown in the product view when filled in: hours of handwork, pieces made.
    for col in ("hours", "edition"):
        if col not in _table_columns(db, "items"):
            db.execute(f"ALTER TABLE items ADD COLUMN {col} INTEGER")

    for attr in ATTRS:
        if attr not in _table_columns(db, "items"):
            db.execute(f"ALTER TABLE items ADD COLUMN {attr} TEXT")

    # Translations: English lives in name/description/attrs, other languages in *_<lang> columns.
    if "delivery" not in _table_columns(db, "items"):
        db.execute("ALTER TABLE items ADD COLUMN delivery TEXT")  # per-item "Fittings & delivery" text
    for table, fields in (("categories", ("name",)), ("items", ("name", "description", "delivery") + ATTRS)):
        cols = _table_columns(db, table)
        for field in fields:
            for lang in LANGS[1:]:
                if f"{field}_{lang}" not in cols:
                    db.execute(f"ALTER TABLE {table} ADD COLUMN {field}_{lang} TEXT")

    db.execute(
        """CREATE TABLE IF NOT EXISTS item_photos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_id INTEGER NOT NULL,
            filename TEXT NOT NULL,
            position INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (item_id) REFERENCES items (id)
        )"""
    )
    if "kind" not in _table_columns(db, "item_photos"):
        db.execute("ALTER TABLE item_photos ADD COLUMN kind TEXT NOT NULL DEFAULT 'photo'")

    db.execute(
        """CREATE TABLE IF NOT EXISTS item_attrs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_id INTEGER NOT NULL,
            position INTEGER NOT NULL DEFAULT 0,
            label TEXT, label_ru TEXT, label_hy TEXT,
            value TEXT, value_ru TEXT, value_hy TEXT,
            FOREIGN KEY (item_id) REFERENCES items (id)
        )"""
    )

    db.execute(
        """CREATE TABLE IF NOT EXISTS inquiries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            contact TEXT NOT NULL,
            category TEXT,
            message TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )"""
    )

    if "status" not in _table_columns(db, "inquiries"):
        db.execute("ALTER TABLE inquiries ADD COLUMN status TEXT NOT NULL DEFAULT 'new'")

    # Cart orders: who, how to reach them, and a snapshot of what they asked for at what price.
    db.execute(
        """CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            contact TEXT NOT NULL,
            note TEXT,
            items TEXT NOT NULL,
            total INTEGER,
            status TEXT NOT NULL DEFAULT 'new',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )"""
    )

    # Client reviews; shown on the site only once approved in /admin.
    db.execute(
        """CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            text TEXT NOT NULL,
            photos TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )"""
    )

    db.execute(
        """CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )"""
    )
    db.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('usd_rate', '400')")
    db.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('rub_rate', '4.2')")
    db.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('instagram', ?)", (DEFAULT_INSTAGRAM,))
    db.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('whatsapp', '')")
    db.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('motion', '1')")
    db.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('hours', '')")

    if db.execute("SELECT COUNT(*) AS c FROM items").fetchone()["c"] == 0:
        for name, category, description, mode, price in SEED_ITEMS:
            db.execute(
                "INSERT INTO items (name, category, description, mode, price) VALUES (?,?,?,?,?)",
                (name, category, description, mode, price),
            )

    # One-off migration: any item with a legacy single `image` value but no
    # rows in item_photos yet gets that image copied in as photo #1.
    legacy_items = db.execute(
        "SELECT id, image FROM items WHERE image IS NOT NULL AND image != ''"
    ).fetchall()
    for row in legacy_items:
        has_photos = db.execute(
            "SELECT COUNT(*) AS c FROM item_photos WHERE item_id = ?", (row["id"],)
        ).fetchone()["c"]
        if not has_photos:
            db.execute(
                "INSERT INTO item_photos (item_id, filename, position) VALUES (?,?,0)",
                (row["id"], row["image"]),
            )

    # One-off: fill in the initial RU/HY translations. Flagged in settings so translations
    # cleared later in /admin are never filled back in.
    if not db.execute("SELECT 1 FROM settings WHERE key = 'translations_seeded'").fetchone():
        for slug, (ru, hy) in content_translations.CATEGORIES.items():
            db.execute(
                "UPDATE categories SET name_ru = COALESCE(NULLIF(name_ru, ''), ?), "
                "name_hy = COALESCE(NULLIF(name_hy, ''), ?) WHERE slug = ?",
                (ru, hy, slug),
            )
        for item_id, (en_name, tr) in content_translations.ITEMS.items():
            for lang, (name, description) in tr.items():
                db.execute(
                    f"UPDATE items SET name_{lang} = COALESCE(NULLIF(name_{lang}, ''), ?), "
                    f"description_{lang} = COALESCE(NULLIF(description_{lang}, ''), ?) "
                    "WHERE id = ? AND name = ?",
                    (name, description, item_id, en_name),
                )
        db.execute("INSERT INTO settings (key, value) VALUES ('translations_seeded', '1')")

    # One-off: move "Fabric: …"-style lines out of descriptions into the attribute fields.
    if not db.execute("SELECT 1 FROM settings WHERE key = 'attrs_extracted'").fetchone():
        for it in db.execute("SELECT * FROM items").fetchall():
            for lang in LANGS:
                sfx = "" if lang == "en" else f"_{lang}"
                found, rest = split_legacy_attrs(it[f"description{sfx}"], LEGACY_ATTR_LABELS[lang])
                found = {a: v for a, v in found.items() if not (it[f"{a}{sfx}"] or "").strip()}
                if found:
                    sets = ", ".join(f"{a}{sfx} = ?" for a in found)
                    db.execute(f"UPDATE items SET {sets}, description{sfx} = ? WHERE id = ?",
                               (*found.values(), rest, it["id"]))
        db.execute("INSERT INTO settings (key, value) VALUES ('attrs_extracted', '1')")

    # One-off: rental items used to keep their per-day price in `price`.
    if not db.execute("SELECT 1 FROM settings WHERE key = 'rent_price_split'").fetchone():
        db.execute("UPDATE items SET rent_price = price, price = NULL WHERE mode = 'Rent' AND rent_price IS NULL")
        db.execute("INSERT INTO settings (key, value) VALUES ('rent_price_split', '1')")

    # One-off: move the fixed attribute columns into per-item parameter rows.
    if not db.execute("SELECT 1 FROM settings WHERE key = 'attrs_to_rows'").fetchone():
        for it in db.execute("SELECT * FROM items").fetchall():
            position = 0
            for a in ATTRS:
                values = [(it[a if lang == "en" else f"{a}_{lang}"] or "").strip() for lang in LANGS]
                if any(values):
                    labels = [LEGACY_ATTR_LABELS[lang][a] for lang in LANGS]
                    db.execute(
                        "INSERT INTO item_attrs (item_id, position, label, label_ru, label_hy, value, value_ru, value_hy) "
                        "VALUES (?,?,?,?,?,?,?,?)",
                        (it["id"], position, *labels, *values),
                    )
                    position += 1
        db.execute("INSERT INTO settings (key, value) VALUES ('attrs_to_rows', '1')")

    db.commit()
    db.close()


def split_legacy_attrs(text, labels):
    """Pull "Label: value" lines for known attribute labels out of a description."""
    found, kept = {}, []
    for line in (text or "").splitlines():
        m = re.match(r"\s*([^:՝]+?)\s*[:՝]\s*(.+?)\s*$", line)
        attr = next((a for a, label in labels.items() if m and m.group(1).lower() == label.lower()), None)
        if attr and attr not in found:
            found[attr] = m.group(2)
        else:
            kept.append(line)
    return found, "\n".join(kept).strip()


# ---------------------------------------------------------------------------
# Shared query helpers
# ---------------------------------------------------------------------------

def get_categories(db):
    return db.execute("SELECT * FROM categories ORDER BY position").fetchall()


def localized(row, field, lang):
    """The field in `lang`, falling back to English when there's no translation."""
    if lang != "en":
        value = row[f"{field}_{lang}"]
        if value and value.strip():
            return value
    return row[field]


def public_categories(db, lang):
    return [{"slug": c["slug"], "name": localized(c, "name", lang)} for c in get_categories(db)]


def request_lang():
    lang = request.args.get("lang", "en")
    return lang if lang in LANGS else "en"


def get_setting(db, key, default=None):
    row = db.execute("SELECT value FROM settings WHERE key = ?", (key,)).fetchone()
    return row["value"] if row else default


def make_category_slug(db, name):
    # "all" is the frontend's built-in "show everything" tab, so never use it as a slug.
    base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "section"
    slug, n = base, 2
    while slug == "all" or db.execute("SELECT 1 FROM categories WHERE slug = ?", (slug,)).fetchone():
        slug = f"{base}-{n}"
        n += 1
    return slug


def parse_price(raw):
    raw = (raw or "").strip()
    if not raw:
        return None
    try:
        return int(float(raw))
    except ValueError:
        return None


def thumb_name(filename):
    return os.path.splitext(filename)[0] + ".jpg"


def remove_photo_files(filename):
    for path in (os.path.join(PRODUCTS_DIR, filename), os.path.join(THUMBS_DIR, thumb_name(filename))):
        if os.path.exists(path):
            os.remove(path)


def delete_item(db, item_id):
    """Delete an item with its photos, videos and parameters."""
    for photo in db.execute("SELECT filename FROM item_photos WHERE item_id = ?", (item_id,)).fetchall():
        remove_photo_files(photo["filename"])
    db.execute("DELETE FROM item_photos WHERE item_id = ?", (item_id,))
    db.execute("DELETE FROM item_attrs WHERE item_id = ?", (item_id,))
    db.execute("DELETE FROM items WHERE id = ?", (item_id,))


def attrs_by_item(db):
    result = {}
    for row in db.execute("SELECT * FROM item_attrs ORDER BY item_id, position, id"):
        result.setdefault(row["item_id"], []).append(row)
    return result


def known_param_labels(db):
    """Parameter labels already in use, with their RU / HY translations: {"Fabric": {"ru": "Ткань", "hy": "Կտոր"}}."""
    known_labels = {}
    for a in db.execute("SELECT label, label_ru, label_hy FROM item_attrs WHERE TRIM(COALESCE(label, '')) != '' ORDER BY id"):
        known = known_labels.setdefault(a["label"].strip(), {"ru": "", "hy": ""})
        for lang in LANGS[1:]:
            known[lang] = known[lang] or (a[f"label_{lang}"] or "").strip()
    for a in ATTRS:
        known = known_labels.setdefault(LEGACY_ATTR_LABELS["en"][a], {"ru": "", "hy": ""})
        for lang in LANGS[1:]:
            known[lang] = known[lang] or LEGACY_ATTR_LABELS[lang][a]
    return known_labels


def uploads_size_mb():
    total = 0
    for entry in os.scandir(PRODUCTS_DIR):
        if entry.is_file():
            total += entry.stat().st_size
    return total / (1024 * 1024)


def back_to_admin(anchor=None):
    return redirect(url_for("admin") + (f"#{anchor}" if anchor else ""))


# ---------------------------------------------------------------------------
# Public routes
# ---------------------------------------------------------------------------

@app.route("/favicon.ico")
def favicon():
    return app.send_static_file("img/icon-192.png")


@app.route("/robots.txt")
def robots():
    return "User-agent: *\nDisallow: /admin\n", 200, {"Content-Type": "text/plain; charset=utf-8"}


@app.route("/item/<int:item_id>")
@app.route("/<lang>/item/<int:item_id>")
def item_page(item_id, lang="en"):
    """Shareable link to one piece: the site with that piece's preview (Instagram, WhatsApp, …)
    and its product view opened."""
    if lang not in LANGS:
        abort(404)
    return index(lang=None if lang == "en" else lang, item_id=item_id)


@app.route("/")
@app.route("/<lang>/")
def index(lang=None, item_id=None):
    # English lives at "/", the others at "/ru/" and "/hy/".
    if lang is not None and lang not in LANGS[1:]:
        abort(404)
    if lang is None:
        # "/?lang=en" is the language switcher's English link: show English and remember it.
        # Otherwise send visitors to their remembered language, or on a first visit, their browser's.
        if request.args.get("lang") != "en" and item_id is None:
            preferred = request.cookies.get("lang") or request.accept_languages.best_match(LANGS)
            if preferred in LANGS[1:]:
                return redirect(url_for("index", lang=preferred))
        lang = "en"

    db = get_db()
    t = translator(lang)

    # Link preview (Open Graph): the site, or one piece when the link is /item/<id>.
    preview = {"title": t("title"), "description": t("meta_description"),
               "image": url_for("static", filename="img/og.jpg", _external=True)}
    if item_id is not None:
        it = db.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
        if not it:
            abort(404)
        photo = db.execute("SELECT filename FROM item_photos WHERE item_id = ? AND kind = 'photo' "
                           "ORDER BY position LIMIT 1", (item_id,)).fetchone()
        preview["title"] = f"{localized(it, 'name', lang)} — Tiknik"
        desc = (localized(it, "description", lang) or "").strip()
        preview["description"] = (desc[:180] + "…") if len(desc) > 180 else (desc or t("meta_description"))
        if photo:
            preview["image"] = url_for("static", filename="img/products/" + photo["filename"], _external=True)
    preview["url"] = request.url

    resp = make_response(render_template(
        "index.html",
        preview=preview,
        open_item=item_id,
        hours=get_setting(db, "hours", ""),
        lang=lang,
        langs=LANGS,
        lang_labels=LANG_LABELS,
        t=t,
        # Every language, so the product view's dial can switch language without a reload.
        js_i18n={l: {key: translator(l)(key) for key in JS_KEYS} for l in LANGS},
        categories=public_categories(db, lang),
        usd_rate=get_setting(db, "usd_rate", "400"),
        rub_rate=get_setting(db, "rub_rate", "4.2"),
        instagram=get_setting(db, "instagram", DEFAULT_INSTAGRAM),
        whatsapp=get_setting(db, "whatsapp", ""),
        motion=get_setting(db, "motion", "1") == "1",
    ))
    resp.set_cookie("lang", lang, max_age=365 * 24 * 3600, samesite="Lax")
    return resp


@app.route("/api/categories")
def api_categories():
    db = get_db()
    return jsonify(public_categories(db, request_lang()))


@app.route("/api/settings")
def api_settings():
    db = get_db()
    return jsonify({
        "usd_rate": float(get_setting(db, "usd_rate", "400")),
        "rub_rate": float(get_setting(db, "rub_rate", "4.2")),
    })


@app.route("/api/items")
def api_items():
    db = get_db()
    lang = request_lang()
    items = db.execute("SELECT * FROM items ORDER BY id").fetchall()
    media_by_item = {}
    thumbs = set(os.listdir(THUMBS_DIR)) if os.path.isdir(THUMBS_DIR) else set()
    for p in db.execute("SELECT item_id, filename, kind FROM item_photos ORDER BY item_id, position"):
        small = thumb_name(p["filename"])
        media_by_item.setdefault(p["item_id"], []).append({
            "file": p["filename"], "video": p["kind"] == "video",
            "thumb": small if p["kind"] == "photo" and small in thumbs else None,
        })
    attrs = attrs_by_item(db)

    result = []
    for it in items:
        pairs = []
        for a in attrs.get(it["id"], []):
            label, value = (localized(a, "label", lang) or "").strip(), (localized(a, "value", lang) or "").strip()
            if label and value:
                pairs.append([label, value])
        result.append({
            "id": it["id"],
            "name": localized(it, "name", lang),
            "description": localized(it, "description", lang),
            "delivery": (localized(it, "delivery", lang) or "").strip(),
            "attrs": pairs,
            "category": it["category"],
            "mode": it["mode"],
            "price": it["price"],
            "rent_price": it["rent_price"],
            "hours": it["hours"],
            "edition": it["edition"],
            "media": media_by_item.get(it["id"], []),
        })
    return jsonify(result)


@app.route("/api/inquiry", methods=["POST"])
def api_inquiry():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    contact = (data.get("contact") or "").strip()
    category = (data.get("category") or "").strip()
    message = (data.get("message") or "").strip()

    if not name or not contact:
        return jsonify({"ok": False, "error": "Please share your name and a way to reach you."}), 400

    db = get_db()
    db.execute(
        "INSERT INTO inquiries (name, contact, category, message) VALUES (?,?,?,?)",
        (name, contact, category, message),
    )
    db.commit()
    return jsonify({"ok": True})


# ---------------------------------------------------------------------------
# Cart orders and reviews (public, no accounts)
#
# Nobody signs up and nothing is paid on the site: a cart order is a request with a name and a
# way to reach the person, and Tiknik confirms size, dates and payment with them directly.
# Prices are always taken from the database, never from what the browser sends.
# ---------------------------------------------------------------------------

_recent_posts = {}  # (ip, kind) -> [timestamps], a small brake on spam


def too_many_posts(kind, limit, window_seconds):
    ip = request.headers.get("X-Real-IP") or request.remote_addr or "?"
    now = time.time()
    stamps = [t for t in _recent_posts.get((ip, kind), []) if now - t < window_seconds]
    if len(stamps) >= limit:
        _recent_posts[(ip, kind)] = stamps
        return True
    stamps.append(now)
    _recent_posts[(ip, kind)] = stamps
    return False


def clean_text(value, max_len):
    return (value or "").strip()[:max_len]


@app.route("/api/order", methods=["POST"])
def api_order():
    data = request.get_json(silent=True) or {}
    if data.get("website"):  # hidden field only bots fill in
        return jsonify({"ok": True})
    name = clean_text(data.get("name"), 120)
    contact = clean_text(data.get("contact"), 160)
    note = clean_text(data.get("note"), 1500)
    lines_in = data.get("items") or []
    if not name or not contact:
        return jsonify({"ok": False, "error": "name_contact"}), 400
    if not isinstance(lines_in, list) or not lines_in or len(lines_in) > 30:
        return jsonify({"ok": False, "error": "empty"}), 400
    if too_many_posts("order", 5, 600):
        return jsonify({"ok": False, "error": "busy"}), 429

    db = get_db()
    lines, total = [], 0
    for line in lines_in:
        if not isinstance(line, dict):
            continue
        try:
            item_id = int(line.get("id"))
            days = max(1, min(60, int(line.get("days") or 1)))
        except (TypeError, ValueError):
            continue
        kind = line.get("kind")
        it = db.execute("SELECT id, name, mode, price, rent_price FROM items WHERE id = ?", (item_id,)).fetchone()
        if not it:
            continue
        if kind == "buy" and it["mode"] in ("Sale", "Both"):
            price = it["price"]
            amount = price
        elif kind == "rent" and it["mode"] in ("Rent", "Both"):
            price = it["rent_price"]
            amount = price * days if price is not None else None
        else:
            continue
        lines.append({"id": it["id"], "name": it["name"], "kind": kind,
                      "days": days if kind == "rent" else None, "price": price, "amount": amount})
        total += amount or 0
    if not lines:
        return jsonify({"ok": False, "error": "empty"}), 400

    cur = db.execute(
        "INSERT INTO orders (name, contact, note, items, total) VALUES (?,?,?,?,?)",
        (name, contact, note, json.dumps(lines, ensure_ascii=False), total),
    )
    db.commit()
    return jsonify({"ok": True, "number": cur.lastrowid})


# Only real images are accepted, recognised by their first bytes (not by the file name).
IMAGE_SIGNATURES = ((b"\xff\xd8\xff", "jpg"), (b"\x89PNG\r\n\x1a\n", "png"))


def image_kind(head):
    for sig, ext in IMAGE_SIGNATURES:
        if head.startswith(sig):
            return ext
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return "webp"
    return None


@app.route("/api/reviews")
def api_reviews():
    db = get_db()
    rows = db.execute("SELECT id, name, text, photos, created_at FROM reviews WHERE status = 'approved' "
                      "ORDER BY created_at DESC, id DESC").fetchall()
    return jsonify([{"id": r["id"], "name": r["name"], "text": r["text"], "photos": json.loads(r["photos"] or "[]"),
                     "date": (r["created_at"] or "")[:10]} for r in rows])


@app.route("/api/review", methods=["POST"])
def api_review():
    if request.form.get("website"):
        return jsonify({"ok": True})
    name = clean_text(request.form.get("name"), 80)
    text = clean_text(request.form.get("text"), MAX_REVIEW_CHARS)
    if not name or not text:
        return jsonify({"ok": False, "error": "name_text"}), 400
    files = [f for f in request.files.getlist("photos") if f and f.filename][:MAX_REVIEW_PHOTOS]
    if too_many_posts("review", 3, 3600):
        return jsonify({"ok": False, "error": "busy"}), 429

    saved = []
    for f in files:
        data = f.read(MAX_REVIEW_PHOTO_MB * 1024 * 1024 + 1)
        ext = image_kind(data[:16])
        if not ext or len(data) > MAX_REVIEW_PHOTO_MB * 1024 * 1024:
            continue
        filename = f"review-{secrets.token_hex(8)}.{ext}"
        with open(os.path.join(REVIEWS_DIR, filename), "wb") as out:
            out.write(data)
        saved.append(filename)

    db = get_db()
    db.execute("INSERT INTO reviews (name, text, photos) VALUES (?,?,?)", (name, text, json.dumps(saved)))
    db.commit()
    return jsonify({"ok": True})


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------

def admin_logged_in():
    return session.get("admin_ok") is True


@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if request.method == "POST":
        given = request.form.get("password") or ""
        if ADMIN_PASSWORD and hmac.compare_digest(given.encode(), ADMIN_PASSWORD.encode()):
            session["admin_ok"] = True
            return redirect(url_for("admin"))
        flash("Incorrect password.", "error")
    return render_template("admin_login.html")


@app.route("/admin/logout")
def admin_logout():
    session.pop("admin_ok", None)
    return redirect(url_for("admin_login"))


@app.route("/admin")
def admin():
    if not admin_logged_in():
        return redirect(url_for("admin_login"))

    db = get_db()
    categories = [dict(c) for c in get_categories(db)]
    usd_rate = get_setting(db, "usd_rate", "400")
    rub_rate = get_setting(db, "rub_rate", "4.2")

    items = db.execute("SELECT * FROM items ORDER BY category, id").fetchall()
    photos_by_item = {}
    for p in db.execute("SELECT id, item_id, filename, kind FROM item_photos ORDER BY item_id, position"):
        photos_by_item.setdefault(p["item_id"], []).append(
            {"id": p["id"], "filename": p["filename"], "video": p["kind"] == "video"})
    attrs = attrs_by_item(db)

    def untranslated(row, field, lang):
        return bool((row[field] or "").strip()) and not (row[f"{field}_{lang}"] or "").strip()

    item_list = []
    for it in items:
        d = dict(it)
        media = photos_by_item.get(it["id"], [])
        d["media"] = media
        d["photo_count"] = sum(not m["video"] for m in media)
        d["video_count"] = len(media) - d["photo_count"]
        d["thumb"] = next((m["filename"] for m in media if not m["video"]), None)
        d["attrs"] = [dict(a) for a in attrs.get(it["id"], [])]
        # A language is "missing" when the name, or any filled-in English text, has no translation.
        d["missing_langs"] = [
            lang for lang in LANGS[1:]
            if not (it[f"name_{lang}"] or "").strip()
            or untranslated(it, "description", lang)
            or any((a["value"] or "").strip() and (untranslated(a, "label", lang) or untranslated(a, "value", lang))
                   for a in attrs.get(it["id"], []))
        ]
        item_list.append(d)

    # Parameter labels already in use, so the admin can pick one and get its translations filled in.
    known_labels = known_param_labels(db)

    known_slugs = {c["slug"] for c in categories}
    counts = {c["slug"]: 0 for c in categories}
    for it in item_list:
        if it["category"] in counts:
            counts[it["category"]] += 1
    unsorted = [it for it in item_list if it["category"] not in known_slugs]

    orders = []
    for o in db.execute("SELECT * FROM orders ORDER BY id DESC LIMIT 200"):
        d = dict(o)
        d["lines"] = json.loads(o["items"] or "[]")
        orders.append(d)
    inquiries = [dict(r) for r in db.execute("SELECT * FROM inquiries ORDER BY id DESC LIMIT 200")]
    category_names = {c["slug"]: c["name"] for c in categories}
    reviews = []
    for r in db.execute("SELECT * FROM reviews ORDER BY status = 'approved', id DESC"):
        d = dict(r)
        d["photos"] = json.loads(r["photos"] or "[]")
        reviews.append(d)

    return render_template(
        "admin.html",
        orders=orders,
        inquiries=inquiries,
        category_names=category_names,
        order_statuses=ORDER_STATUSES,
        reviews=reviews,
        instagram=get_setting(db, "instagram", DEFAULT_INSTAGRAM),
        whatsapp=get_setting(db, "whatsapp", ""),
        hours=get_setting(db, "hours", ""),
        motion=get_setting(db, "motion", "1") == "1",
        items=item_list,
        unsorted=unsorted,
        counts=counts,
        categories=categories,
        max_photos=MAX_PHOTOS,
        max_videos=MAX_VIDEOS,
        max_video_mb=MAX_VIDEO_MB,
        uploads_mb=uploads_size_mb(),
        modes=MODES,
        known_labels=known_labels,
        default_params=[LEGACY_ATTR_LABELS["en"][a] for a in ATTRS],
        usd_rate=usd_rate,
        rub_rate=rub_rate,
    )


@app.route("/admin/upload/<int:item_id>", methods=["POST"])
def admin_upload(item_id):
    if not admin_logged_in():
        return redirect(url_for("admin_login"))

    db = get_db()
    item = db.execute("SELECT id FROM items WHERE id = ?", (item_id,)).fetchone()
    if not item:
        flash("Item not found.", "error")
        return redirect(url_for("admin"))

    counts = {"photo": 0, "video": 0}
    for row in db.execute("SELECT kind, COUNT(*) AS c FROM item_photos WHERE item_id = ? GROUP BY kind", (item_id,)):
        counts[row["kind"]] = row["c"]
    limits = {"photo": MAX_PHOTOS, "video": MAX_VIDEOS}
    position = db.execute(
        "SELECT COALESCE(MAX(position), -1) AS m FROM item_photos WHERE item_id = ?", (item_id,)
    ).fetchone()["m"] + 1

    added = {"photo": 0, "video": 0}
    problems = []
    thumbs = iter(request.files.getlist("thumbs"))  # one per photo, in order (videos have none)

    for f in request.files.getlist("photos"):
        if not f or not f.filename:
            continue
        ext = f.filename.rsplit(".", 1)[-1].lower() if "." in f.filename else ""
        kind = "photo" if ext in ALLOWED_EXT else "video" if ext in VIDEO_EXT else None
        if not kind:
            problems.append(f"{f.filename}: unsupported file type")
            continue
        if counts[kind] + added[kind] >= limits[kind]:
            problems.append(f"{f.filename}: over the {limits[kind]}-{kind} limit")
            continue
        if kind == "video":
            f.stream.seek(0, os.SEEK_END)
            size_mb = f.stream.tell() / (1024 * 1024)
            f.stream.seek(0)
            if size_mb > MAX_VIDEO_MB:
                problems.append(f"{f.filename}: {size_mb:.0f} MB, the limit is {MAX_VIDEO_MB} MB")
                continue

        filename = secure_filename(f"item-{item_id}-{position + 1}-{f.filename}")
        f.save(os.path.join(PRODUCTS_DIR, filename))
        if kind == "photo":
            th = next(thumbs, None)
            data = th.read(MAX_THUMB_KB * 1024 + 1) if th else b""
            if data[:3] == b"\xff\xd8\xff" and len(data) <= MAX_THUMB_KB * 1024:
                with open(os.path.join(THUMBS_DIR, thumb_name(filename)), "wb") as out:
                    out.write(data)
        db.execute(
            "INSERT INTO item_photos (item_id, filename, position, kind) VALUES (?,?,?,?)",
            (item_id, filename, position, kind),
        )
        position += 1
        added[kind] += 1

    db.commit()

    if added["photo"] or added["video"]:
        parts = [f"{n} {k}{'' if n == 1 else 's'}" for k, n in added.items() if n]
        flash(f"Added {' and '.join(parts)}.", "ok")
    if problems:
        flash("Skipped — " + "; ".join(problems) + ".", "error")
    return back_to_admin(f"item-{item_id}")


@app.errorhandler(413)
def upload_too_large(e):
    flash("Upload too large — send fewer files at once (100 MB max per upload).", "error")
    return back_to_admin()


@app.route("/admin/remove-photo/<int:photo_id>", methods=["POST"])
def admin_remove_photo(photo_id):
    if not admin_logged_in():
        return redirect(url_for("admin_login"))

    db = get_db()
    photo = db.execute("SELECT * FROM item_photos WHERE id = ?", (photo_id,)).fetchone()
    if photo:
        remove_photo_files(photo["filename"])
        db.execute("DELETE FROM item_photos WHERE id = ?", (photo_id,))
        db.commit()
        flash("Photo removed.", "ok")
        return back_to_admin(f"item-{photo['item_id']}")
    return back_to_admin()


@app.route("/admin/reorder-photos/<int:item_id>", methods=["POST"])
def admin_reorder_photos(item_id):
    if not admin_logged_in():
        return jsonify({"ok": False, "error": "Not signed in."}), 403

    data = request.get_json(silent=True) or {}
    order = data.get("order") or []
    if not isinstance(order, list) or not order:
        return jsonify({"ok": False, "error": "Nothing to reorder."}), 400

    db = get_db()
    owned_ids = {
        row["id"]
        for row in db.execute("SELECT id FROM item_photos WHERE item_id = ?", (item_id,))
    }
    if set(order) != owned_ids:
        return jsonify({"ok": False, "error": "Photo list does not match this item."}), 400

    for position, photo_id in enumerate(order):
        db.execute(
            "UPDATE item_photos SET position = ? WHERE id = ? AND item_id = ?",
            (position, photo_id, item_id),
        )
    db.commit()
    return jsonify({"ok": True})


@app.route("/admin/update/<int:item_id>", methods=["POST"])
def admin_update_item(item_id):
    if not admin_logged_in():
        return redirect(url_for("admin_login"))

    db = get_db()
    item = db.execute("SELECT id FROM items WHERE id = ?", (item_id,)).fetchone()
    if not item:
        flash("Item not found.", "error")
        return redirect(url_for("admin"))

    name = (request.form.get("name") or "").strip()
    description = request.form.get("description") or ""
    mode = request.form.get("mode") or "Sale"
    category = (request.form.get("category") or "").strip()
    price = parse_price(request.form.get("price"))
    rent_price = parse_price(request.form.get("rent_price"))
    hours = parse_price(request.form.get("hours"))
    edition = parse_price(request.form.get("edition"))

    if not name:
        flash("Name is required.", "error")
        return back_to_admin(f"item-{item_id}")

    if mode not in MODES:
        mode = "Sale"

    valid_slugs = {c["slug"] for c in get_categories(db)}
    if category not in valid_slugs:
        flash("Unknown category — item left in its previous category.", "error")
        category = None  # leave unchanged below

    if category:
        db.execute(
            "UPDATE items SET name=?, description=?, mode=?, price=?, rent_price=?, category=? WHERE id=?",
            (name, description, mode, price, rent_price, category, item_id),
        )
    else:
        db.execute(
            "UPDATE items SET name=?, description=?, mode=?, price=?, rent_price=? WHERE id=?",
            (name, description, mode, price, rent_price, item_id),
        )
    for lang in LANGS[1:]:
        db.execute(
            f"UPDATE items SET name_{lang}=?, description_{lang}=?, delivery_{lang}=? WHERE id=?",
            ((request.form.get(f"name_{lang}") or "").strip(), request.form.get(f"description_{lang}") or "",
             request.form.get(f"delivery_{lang}") or "", item_id),
        )
    db.execute("UPDATE items SET delivery = ? WHERE id = ?", (request.form.get("delivery") or "", item_id))
    db.execute("UPDATE items SET hours = ?, edition = ? WHERE id = ?",
               (hours if hours and hours > 0 else None, edition if edition and edition > 0 else None, item_id))
    save_item_attrs(db, item_id)
    db.commit()
    flash("Saved.", "ok")
    return back_to_admin(f"item-{item_id}")


ATTR_FIELDS = ("label", "label_ru", "label_hy", "value", "value_ru", "value_hy")


def save_item_attrs(db, item_id, known_labels=None):
    """Replace an item's parameters with the rows posted from its admin card (p_label, p_value_ru, …).

    With known_labels, missing RU / HY labels are filled in from labels used before."""
    columns = [request.form.getlist(f"p_{field}") for field in ATTR_FIELDS]
    db.execute("DELETE FROM item_attrs WHERE item_id = ?", (item_id,))
    position = 0
    for row in itertools.zip_longest(*columns, fillvalue=""):
        row = [v.strip() for v in row]
        known = (known_labels or {}).get(row[0])
        if known:
            row[1] = row[1] or known["ru"]
            row[2] = row[2] or known["hy"]
        if any(row):
            db.execute(
                f"INSERT INTO item_attrs (item_id, position, {', '.join(ATTR_FIELDS)}) VALUES (?,?,?,?,?,?,?,?)",
                (item_id, position, *row),
            )
            position += 1


@app.route("/admin/add-item", methods=["POST"])
def admin_add_item():
    if not admin_logged_in():
        return redirect(url_for("admin_login"))

    db = get_db()
    name = (request.form.get("name") or "").strip()
    category = (request.form.get("category") or "").strip()
    mode = request.form.get("mode") or "Sale"
    if mode not in MODES:
        mode = "Sale"

    if not name:
        flash("Name is required.", "error")
        return back_to_admin("add-item")
    if category not in {c["slug"] for c in get_categories(db)}:
        flash("Pick a section for the new item.", "error")
        return back_to_admin("add-item")

    cur = db.execute(
        "INSERT INTO items (name, category, description, mode, price, rent_price) VALUES (?,?,?,?,?,?)",
        (name, category, request.form.get("description") or "", mode,
         parse_price(request.form.get("price")), parse_price(request.form.get("rent_price"))),
    )
    save_item_attrs(db, cur.lastrowid, known_param_labels(db))
    db.commit()
    flash(f"“{name}” added — now fill in its parameters and upload photos.", "ok")
    return back_to_admin(f"item-{cur.lastrowid}")


@app.route("/admin/delete-item/<int:item_id>", methods=["POST"])
def admin_delete_item(item_id):
    if not admin_logged_in():
        return redirect(url_for("admin_login"))

    db = get_db()
    item = db.execute("SELECT name FROM items WHERE id = ?", (item_id,)).fetchone()
    if item:
        delete_item(db, item_id)
        db.commit()
        flash(f"“{item['name']}” deleted.", "ok")
    return back_to_admin("items")


@app.route("/admin/update-category/<slug>", methods=["POST"])
def admin_update_category(slug):
    if not admin_logged_in():
        return redirect(url_for("admin_login"))

    db = get_db()
    cat = db.execute("SELECT slug FROM categories WHERE slug = ?", (slug,)).fetchone()
    if not cat:
        flash("Section not found.", "error")
        return back_to_admin("sections")

    name = (request.form.get("name") or "").strip()
    if not name:
        flash("Section name can't be empty.", "error")
        return back_to_admin("sections")

    db.execute(
        "UPDATE categories SET name = ?, name_ru = ?, name_hy = ? WHERE slug = ?",
        (name, (request.form.get("name_ru") or "").strip(), (request.form.get("name_hy") or "").strip(), slug),
    )
    db.commit()
    flash("Section saved.", "ok")
    return back_to_admin("sections")


@app.route("/admin/add-category", methods=["POST"])
def admin_add_category():
    if not admin_logged_in():
        return redirect(url_for("admin_login"))

    db = get_db()
    name = (request.form.get("name") or "").strip()
    if not name:
        flash("Section name can't be empty.", "error")
        return back_to_admin("sections")

    position = db.execute("SELECT COALESCE(MAX(position), -1) + 1 AS p FROM categories").fetchone()["p"]
    db.execute(
        "INSERT INTO categories (slug, name, name_ru, name_hy, position) VALUES (?,?,?,?,?)",
        (make_category_slug(db, name), name, (request.form.get("name_ru") or "").strip(),
         (request.form.get("name_hy") or "").strip(), position),
    )
    db.commit()
    flash(f"Section “{name}” added.", "ok")
    return back_to_admin("sections")


@app.route("/admin/move-category/<slug>/<direction>", methods=["POST"])
def admin_move_category(slug, direction):
    if not admin_logged_in():
        return redirect(url_for("admin_login"))

    db = get_db()
    slugs = [c["slug"] for c in get_categories(db)]
    if slug in slugs:
        i = slugs.index(slug)
        j = i - 1 if direction == "up" else i + 1
        if 0 <= j < len(slugs):
            slugs[i], slugs[j] = slugs[j], slugs[i]
            for position, s in enumerate(slugs):
                db.execute("UPDATE categories SET position = ? WHERE slug = ?", (position, s))
            db.commit()
    return back_to_admin("sections")


@app.route("/admin/delete-category/<slug>", methods=["POST"])
def admin_delete_category(slug):
    if not admin_logged_in():
        return redirect(url_for("admin_login"))

    db = get_db()
    cat = db.execute("SELECT name FROM categories WHERE slug = ?", (slug,)).fetchone()
    if not cat:
        flash("Section not found.", "error")
        return back_to_admin("sections")

    other_slugs = {c["slug"] for c in get_categories(db)} - {slug}
    if not other_slugs:
        flash("The catalog needs at least one section.", "error")
        return back_to_admin("sections")

    item_ids = [r["id"] for r in db.execute("SELECT id FROM items WHERE category = ?", (slug,))]
    target = request.form.get("items_to") or ""
    if item_ids:
        if target == "__delete__":
            for item_id in item_ids:
                delete_item(db, item_id)
        elif target in other_slugs:
            db.execute("UPDATE items SET category = ? WHERE category = ?", (target, slug))
        else:
            flash("Choose where this section's items should go.", "error")
            return back_to_admin("sections")

    db.execute("DELETE FROM categories WHERE slug = ?", (slug,))
    db.commit()
    flash(f"Section “{cat['name']}” deleted.", "ok")
    return back_to_admin("sections")


@app.route("/admin/settings", methods=["POST"])
def admin_settings():
    if not admin_logged_in():
        return redirect(url_for("admin_login"))

    db = get_db()
    usd_rate_raw = (request.form.get("usd_rate") or "").strip()
    rub_rate_raw = (request.form.get("rub_rate") or "").strip()
    try:
        usd_rate = float(usd_rate_raw)
        rub_rate = float(rub_rate_raw)
        if usd_rate <= 0 or rub_rate <= 0:
            raise ValueError
    except ValueError:
        flash("Rates must be positive numbers.", "error")
        return redirect(url_for("admin"))

    db.execute(
        "INSERT INTO settings (key, value) VALUES ('usd_rate', ?) "
        "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        (str(usd_rate),),
    )
    db.execute(
        "INSERT INTO settings (key, value) VALUES ('rub_rate', ?) "
        "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        (str(rub_rate),),
    )
    db.commit()
    flash(f"Rates updated — {usd_rate} ֏ per $1, {rub_rate} ֏ per ₽1.", "ok")
    return back_to_admin("rates")


@app.route("/admin/order/<int:order_id>/<action>", methods=["POST"])
def admin_order(order_id, action):
    if not admin_logged_in():
        return redirect(url_for("admin_login"))
    db = get_db()
    if action in ORDER_STATUSES:
        db.execute("UPDATE orders SET status = ? WHERE id = ?", (action, order_id))
    elif action == "delete":
        db.execute("DELETE FROM orders WHERE id = ?", (order_id,))
    db.commit()
    return back_to_admin("inbox")


@app.route("/admin/inquiry/<int:inquiry_id>/<action>", methods=["POST"])
def admin_inquiry(inquiry_id, action):
    if not admin_logged_in():
        return redirect(url_for("admin_login"))
    db = get_db()
    if action == "done":
        db.execute("UPDATE inquiries SET status = 'done' WHERE id = ?", (inquiry_id,))
    elif action == "new":
        db.execute("UPDATE inquiries SET status = 'new' WHERE id = ?", (inquiry_id,))
    elif action == "delete":
        db.execute("DELETE FROM inquiries WHERE id = ?", (inquiry_id,))
    db.commit()
    return back_to_admin("inbox")


@app.route("/admin/review/<int:review_id>/<action>", methods=["POST"])
def admin_review(review_id, action):
    if not admin_logged_in():
        return redirect(url_for("admin_login"))
    db = get_db()
    review = db.execute("SELECT * FROM reviews WHERE id = ?", (review_id,)).fetchone()
    if review:
        if action in ("approved", "pending"):
            db.execute("UPDATE reviews SET status = ? WHERE id = ?", (action, review_id))
            flash("Review published." if action == "approved" else "Review hidden from the site.", "ok")
        elif action == "delete":
            for filename in json.loads(review["photos"] or "[]"):
                path = os.path.join(REVIEWS_DIR, os.path.basename(filename))
                if os.path.exists(path):
                    os.remove(path)
            db.execute("DELETE FROM reviews WHERE id = ?", (review_id,))
            flash("Review deleted.", "ok")
        db.commit()
    return back_to_admin("reviews")


@app.route("/admin/motion", methods=["POST"])
def admin_motion():
    if not admin_logged_in():
        return redirect(url_for("admin_login"))
    db = get_db()
    on = request.form.get("motion") == "1"
    db.execute("INSERT INTO settings (key, value) VALUES ('motion', ?) "
               "ON CONFLICT(key) DO UPDATE SET value = excluded.value", ("1" if on else "0",))
    db.commit()
    flash("Animations are on." if on else "Animations are off — the site is back to the plain version.", "ok")
    return back_to_admin("motion")


@app.route("/admin/contacts", methods=["POST"])
def admin_contacts():
    if not admin_logged_in():
        return redirect(url_for("admin_login"))
    db = get_db()
    instagram = (request.form.get("instagram") or "").strip()
    if instagram and not instagram.startswith(("https://", "http://")):
        instagram = "https://www.instagram.com/" + instagram.lstrip("@").strip("/") + "/"
    whatsapp = re.sub(r"[^\d]", "", request.form.get("whatsapp") or "")
    hours = (request.form.get("hours") or "").strip()[:80]
    for key, value in (("instagram", instagram), ("whatsapp", whatsapp), ("hours", hours)):
        db.execute("INSERT INTO settings (key, value) VALUES (?, ?) "
                   "ON CONFLICT(key) DO UPDATE SET value = excluded.value", (key, value))
    db.commit()
    flash("Contacts saved.", "ok")
    return back_to_admin("contacts")


# ---------------------------------------------------------------------------
# Auto-deploy (called by GitHub Actions on push to main)
# ---------------------------------------------------------------------------

@app.route("/deploy", methods=["POST"])
def deploy():
    secret = os.environ.get("DEPLOY_SECRET", "")
    given = request.headers.get("X-Deploy-Secret", "")
    if not secret or not hmac.compare_digest(given.encode(), secret.encode()):
        abort(404)

    result = subprocess.run(
        ["git", "pull", "--ff-only"],
        cwd=BASE_DIR, capture_output=True, text=True, timeout=120,
    )
    output = result.stdout + result.stderr
    if result.returncode != 0:
        return output, 500, {"Content-Type": "text/plain; charset=utf-8"}

    # Fill in any missing photo thumbnails (needs Pillow, which PythonAnywhere's system Python has).
    for python in ("/usr/bin/python3", "python3"):
        try:
            thumbs = subprocess.run([python, os.path.join(BASE_DIR, "tools", "make_thumbs.py")],
                                    cwd=BASE_DIR, capture_output=True, text=True, timeout=240)
        except (OSError, subprocess.TimeoutExpired) as e:
            output += f"\nthumbnails ({python}): {e}"
            continue
        output += "\n" + (thumbs.stdout + thumbs.stderr).strip()
        if thumbs.returncode == 0:
            break

    os.utime(WSGI_FILE)  # touching the WSGI file makes PythonAnywhere reload the app
    return output + "\nReloaded.", 200, {"Content-Type": "text/plain; charset=utf-8"}


init_db()

if __name__ == "__main__":
    app.run(debug=True)
