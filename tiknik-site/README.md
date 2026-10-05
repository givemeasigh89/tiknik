# Tiknik — Bespoke Bridal & Couture (pilot site)

Mobile-first, single-page site: Flask + SQLite backend, Tailwind CSS (CDN) + vanilla JS frontend.

## Structure

```
tiknik/
├── app.py                 # Flask app: routes, SQLite init + seed data, API, admin
├── requirements.txt
├── tiknik.db               # created automatically on first run (not in repo)
├── templates/
│   ├── index.html           # single-page site (Jinja + Tailwind CDN)
│   ├── admin.html            # /admin — manage photos, text, prices, sections
│   └── admin_login.html      # /admin/login — password gate
└── static/
    ├── js/main.js           # catalog fetch/filter, product view, zoom, quote form
    └── img/
        ├── (logo + atelier photography, cropped)
        └── products/          # created automatically — uploaded item photos land here
```

## Run locally

```bash
pip install -r requirements.txt
python app.py
```

Open http://127.0.0.1:5000 — the SQLite DB and its 24 seed catalog items are created automatically the first time the app runs.

## API

- `GET /api/categories` — the catalog sections (editable from `/admin`).
- `GET /api/items` — all catalog items (id, name, category, description, mode, price, photos). The frontend fetches this once and filters client-side, so tapping a category is instant (no reload, no network wait).
- `GET /api/settings` — currently just `{usd_rate}`, used by the frontend's currency toggle.
- `POST /api/inquiry` — booking / quote requests from the contact form (`name`, `contact`, `category`, `message`). Stored in the `inquiries` table in the same SQLite file.

## Deploying on PythonAnywhere (free tier)

1. Upload the `tiknik` folder (Files tab, or `git clone` if you push this to a repo).
2. **Web** tab → **Add a new web app** → **Manual configuration** → Python 3.10+.
3. In the WSGI config file PythonAnywhere gives you, replace the contents with:

   ```python
   import sys
   path = '/home/<your-username>/tiknik'
   if path not in sys.path:
       sys.path.append(path)
   from app import app as application
   ```

4. **Virtualenv**: create one and `pip install -r requirements.txt` inside it (Bash console: `mkvirtualenv --python=/usr/bin/python3.10 tiknik-env && pip install -r requirements.txt`), then point the Web tab's "Virtualenv" field at it.
5. **Static files** mapping (Web tab → Static files):
   - URL `/static/` → Directory `/home/<your-username>/tiknik/static/`
6. Reload the web app. The SQLite file (`tiknik.db`) is created next to `app.py` on first request — make sure the `tiknik` folder is writable (it is, by default, under your own PythonAnywhere account).

### Updating an already-deployed site (code-only changes)

When only the code changes (not the brand photos), replace just these files on PythonAnywhere and keep everything else — `tiknik.db`, `static/img/` — untouched:

```
app.py
templates/index.html
templates/admin.html
templates/admin_login.html
static/js/main.js
```

In the Bash console: upload the new zip to your home folder, then

```bash
cd ~
unzip -o tiknik-site.zip
```

`-o` overwrites only the files the zip actually contains — your database and uploaded photos are never touched because they're excluded from the zip. Reload the web app afterwards.

The app adds any new database tables/columns it needs automatically on first request after a redeploy (see `init_db()` in `app.py`) — no manual migration step, and nothing in `tiknik.db` is ever dropped or reseeded once it has data.

## Managing the catalog (no code editing needed)

A built-in admin page handles everything — no PythonAnywhere file editing, no code:

1. Go to `https://<your-username>.pythonanywhere.com/admin`.
2. Sign in with the admin password. It is set as `ADMIN_PASSWORD` (together with `SECRET_KEY`) via `os.environ[...]` in the PythonAnywhere WSGI file — never in the code. If it isn't set, admin login is disabled.
3. From there you can:
   - **Set the USD rate** — prices are entered in AMD; the site shows a USD price too (switchable by visitors via an AMD/USD toggle above the catalog), automatically converted using this rate. Update it whenever the rate changes — there's no live/automatic lookup, since that would depend on external services PythonAnywhere's free tier can't reliably reach.
   - **Rename a catalog section** (e.g. "Corsets" → something else) — the new name appears everywhere on the site immediately.
   - For each item:
     - **Photos** — up to 10 per item (JPG/PNG/WEBP). Upload several at once. **Drag a thumbnail to reorder** — the first photo is the catalog thumbnail and the main photo on the product page; the order saves automatically as soon as you drop it. Hover a thumbnail and click **Remove** to delete one.
     - **Details** — name, description (line breaks you type are preserved exactly on the site), price, Sale/Rent/Both/Custom status, and **section** — move an item to a different catalog section right from its own dropdown, no need to delete/recreate it.

Changes appear on the live site immediately, no reload needed. You can share the `/admin` link + password with anyone (a partner, a photographer) so they can manage the catalog themselves without touching PythonAnywhere or any code.

Uploaded photos are saved to `static/img/products/` and tracked in the `item_photos` table (one row per photo, in display order).

## The product page

Tapping any catalog card opens a full-screen product view — no page reload — with a large photo, a scrollable thumbnail rail, and the item's name/price/description (with line breaks preserved). Photos can be browsed with the on-image arrow buttons, the keyboard's left/right arrow keys, or a swipe on touch devices. "Prev item / Next item" links at the top move to the previous/next item in the currently open section (or the whole catalog, if no filter is active).

**Zooming a photo**: double-click (or double-tap on touch) the main photo to open it full-screen, fitted to the screen (phone or laptop) — not pre-zoomed. From there: scroll/pinch to zoom in further, drag to pan, double-click/tap again to reset back to the fitted view, Esc or the × button to close. Where the browser supports it, the overlay also requests true browser fullscreen (hiding the address bar/chrome); where it doesn't (e.g. iOS Safari), it still fills the entire screen, just within the browser's normal view. No page reload — it's all within the product view.

Closing the product view (or pressing Escape) returns to the catalog exactly where it was.

## Currency

Prices are entered once, in AMD, in `/admin`. Visitors can switch the displayed currency between **USD (default), RUB and AMD** using the toggle above the catalog grid. Converted prices are rounded to a clean, "sticker" number — no odd cents or kopecks (e.g. $365, not $362.50) — the way other clothing sites display a fixed-looking price per currency rather than a literal exact conversion. Both rates (AMD per $1, AMD per ₽1) are set in `/admin` → Currency, and are not fetched live — update them there periodically (e.g. to match a bank's published rate) to keep converted prices accurate.

## Editing the seed catalog

The 24 starting catalog items live in `SEED_ITEMS` in `app.py` and are only used the very first time the app runs (to populate an empty database) — editing them later has no effect on a live site, since all real edits should go through `/admin` instead.
