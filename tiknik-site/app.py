import hmac
import os
import sqlite3
import subprocess

from flask import Flask, abort, g, jsonify, redirect, render_template, request, session, url_for, flash
from werkzeug.utils import secure_filename

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "tiknik.db")
PRODUCTS_DIR = os.path.join(BASE_DIR, "static", "img", "products")
WSGI_FILE = "/var/www/tiknik_pythonanywhere_com_wsgi.py"

ALLOWED_EXT = {"jpg", "jpeg", "png", "webp"}
MAX_PHOTOS = 10
MODES = ("Sale", "Rent", "Both", "Custom")

# Set in the PythonAnywhere WSGI file (never commit them). Empty ADMIN_PASSWORD disables admin login.
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY") or os.urandom(32)


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

    db.execute(
        """CREATE TABLE IF NOT EXISTS item_photos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_id INTEGER NOT NULL,
            filename TEXT NOT NULL,
            position INTEGER NOT NULL DEFAULT 0,
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

    db.execute(
        """CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )"""
    )
    db.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('usd_rate', '400')")
    db.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('rub_rate', '4.2')")

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

    db.commit()
    db.close()


# ---------------------------------------------------------------------------
# Shared query helpers
# ---------------------------------------------------------------------------

def get_categories(db):
    return db.execute("SELECT slug, name FROM categories ORDER BY position").fetchall()


def get_setting(db, key, default=None):
    row = db.execute("SELECT value FROM settings WHERE key = ?", (key,)).fetchone()
    return row["value"] if row else default


# ---------------------------------------------------------------------------
# Public routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    db = get_db()
    categories = [dict(c) for c in get_categories(db)]
    usd_rate = get_setting(db, "usd_rate", "400")
    rub_rate = get_setting(db, "rub_rate", "4.2")
    return render_template("index.html", categories=categories, usd_rate=usd_rate, rub_rate=rub_rate)


@app.route("/api/categories")
def api_categories():
    db = get_db()
    return jsonify([dict(c) for c in get_categories(db)])


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
    items = db.execute("SELECT * FROM items ORDER BY id").fetchall()
    photos_by_item = {}
    for p in db.execute("SELECT item_id, filename FROM item_photos ORDER BY item_id, position"):
        photos_by_item.setdefault(p["item_id"], []).append(p["filename"])

    result = []
    for it in items:
        d = dict(it)
        d["photos"] = photos_by_item.get(it["id"], [])
        result.append(d)
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
    categories = get_categories(db)
    usd_rate = get_setting(db, "usd_rate", "400")
    rub_rate = get_setting(db, "rub_rate", "4.2")

    items = db.execute("SELECT * FROM items ORDER BY category, id").fetchall()
    photos_by_item = {}
    for p in db.execute("SELECT id, item_id, filename FROM item_photos ORDER BY item_id, position"):
        photos_by_item.setdefault(p["item_id"], []).append({"id": p["id"], "filename": p["filename"]})

    item_list = []
    for it in items:
        d = dict(it)
        d["photos"] = photos_by_item.get(it["id"], [])
        item_list.append(d)

    return render_template(
        "admin.html",
        items=item_list,
        categories=categories,
        max_photos=MAX_PHOTOS,
        modes=MODES,
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

    current_count = db.execute(
        "SELECT COUNT(*) AS c FROM item_photos WHERE item_id = ?", (item_id,)
    ).fetchone()["c"]
    next_position = db.execute(
        "SELECT COALESCE(MAX(position), -1) AS m FROM item_photos WHERE item_id = ?", (item_id,)
    ).fetchone()["m"] + 1

    files = request.files.getlist("photos")
    added, skipped = 0, 0

    for f in files:
        if not f or not f.filename:
            continue
        ext = f.filename.rsplit(".", 1)[-1].lower() if "." in f.filename else ""
        if ext not in ALLOWED_EXT:
            skipped += 1
            continue
        if current_count + added >= MAX_PHOTOS:
            skipped += 1
            continue

        filename = secure_filename(f"item-{item_id}-{next_position + added + 1}-{f.filename}")
        f.save(os.path.join(PRODUCTS_DIR, filename))
        db.execute(
            "INSERT INTO item_photos (item_id, filename, position) VALUES (?,?,?)",
            (item_id, filename, next_position + added),
        )
        added += 1

    db.commit()

    if added:
        flash(f"Added {added} photo(s).", "ok")
    if skipped:
        flash(f"Skipped {skipped} file(s) — unsupported type or over the {MAX_PHOTOS}-photo limit.", "error")
    return redirect(url_for("admin"))


@app.route("/admin/remove-photo/<int:photo_id>", methods=["POST"])
def admin_remove_photo(photo_id):
    if not admin_logged_in():
        return redirect(url_for("admin_login"))

    db = get_db()
    photo = db.execute("SELECT * FROM item_photos WHERE id = ?", (photo_id,)).fetchone()
    if photo:
        path = os.path.join(PRODUCTS_DIR, photo["filename"])
        if os.path.exists(path):
            os.remove(path)
        db.execute("DELETE FROM item_photos WHERE id = ?", (photo_id,))
        db.commit()
        flash("Photo removed.", "ok")
    return redirect(url_for("admin"))


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
    price_raw = (request.form.get("price") or "").strip()

    if not name:
        flash("Name is required.", "error")
        return redirect(url_for("admin"))

    if mode not in MODES:
        mode = "Sale"

    valid_slugs = {c["slug"] for c in get_categories(db)}
    if category not in valid_slugs:
        flash("Unknown category — item left in its previous category.", "error")
        category = None  # leave unchanged below

    price = None
    if price_raw:
        try:
            price = int(float(price_raw))
        except ValueError:
            price = None

    if category:
        db.execute(
            "UPDATE items SET name=?, description=?, mode=?, price=?, category=? WHERE id=?",
            (name, description, mode, price, category, item_id),
        )
    else:
        db.execute(
            "UPDATE items SET name=?, description=?, mode=?, price=? WHERE id=?",
            (name, description, mode, price, item_id),
        )
    db.commit()
    flash("Saved.", "ok")
    return redirect(url_for("admin"))


@app.route("/admin/update-category/<slug>", methods=["POST"])
def admin_update_category(slug):
    if not admin_logged_in():
        return redirect(url_for("admin_login"))

    db = get_db()
    cat = db.execute("SELECT slug FROM categories WHERE slug = ?", (slug,)).fetchone()
    if not cat:
        flash("Category not found.", "error")
        return redirect(url_for("admin"))

    name = (request.form.get("name") or "").strip()
    if not name:
        flash("Category name can't be empty.", "error")
        return redirect(url_for("admin"))

    db.execute("UPDATE categories SET name = ? WHERE slug = ?", (name, slug))
    db.commit()
    flash("Category renamed.", "ok")
    return redirect(url_for("admin"))


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
    return redirect(url_for("admin"))


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

    os.utime(WSGI_FILE)  # touching the WSGI file makes PythonAnywhere reload the app
    return output + "\nReloaded.", 200, {"Content-Type": "text/plain; charset=utf-8"}


init_db()

if __name__ == "__main__":
    app.run(debug=True)
