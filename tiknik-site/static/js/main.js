(function () {
  "use strict";

  var grid = document.getElementById("catalog-grid");
  var emptyMsg = document.getElementById("catalog-empty");
  var tabs = document.querySelectorAll(".tab-btn");
  var currencyBtns = document.querySelectorAll(".currency-btn");
  var items = [];
  var activeCategory = "all";
  var activeCurrency = "USD";
  var RATES = window.TIKNIK_RATES || { USD: 400, RUB: 4.2 };
  var LANG = window.TIKNIK_LANG || "en";
  var I18N = window.TIKNIK_I18N || {}; // { en: {...}, ru: {...}, hy: {...} }
  // The product view's dial can switch the card to another language without a reload;
  // the rest of the page follows when the card is closed.
  var cardLang = LANG;

  function t(key, fallback) {
    return (I18N[cardLang] || {})[key] || fallback;
  }

  var ICONS = {
    corsets:
      '<path d="M8 4c-1.3 3-1.3 5 0 8s1.3 5 0 8"/><path d="M16 4c1.3 3 1.3 5 0 8s-1.3 5 0 8"/><path d="M8 4h8"/><path d="M8 20h8"/><path d="M10 8h4"/><path d="M10 12h4"/><path d="M10 16h4"/>',
    skirts:
      '<path d="M9 3h6l1 4"/><path d="M8 7h8l4 13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1L8 7z"/><path d="M8 7c2 2 6 2 8 0"/>',
    veils:
      '<path d="M12 3v3"/><path d="M4 20c1-7 4-11 8-11s7 4 8 11"/><path d="M4 20h16"/><path d="M8 20c.5-4 2-6 4-6s3.5 2 4 6"/>',
    "wedding-dresses":
      '<path d="M9 3h6l1.5 5"/><path d="M7.5 8h9L20 20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1L7.5 8z"/><path d="M7.5 8c2 2 7 2 9 0"/>',
    accessories:
      '<path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z"/>',
    rental:
      '<circle cx="8" cy="8" r="4"/><path d="M11 11l9 9"/><path d="M17 17l2-2"/><path d="M14 20l2-2"/>',
    "made-to-order":
      '<path d="M4 20l3-1 10-10-2-2L5 17l-1 3z"/><path d="M14 5l2 2"/><circle cx="18" cy="5" r="1.5"/>',
  };

  function iconSvg(slug, sizeClass) {
    var path = ICONS[slug] || ICONS.accessories;
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" ' +
      'stroke-linecap="round" stroke-linejoin="round" class="' +
      (sizeClass || "w-10 h-10 sm:w-12 sm:h-12") +
      '">' +
      path +
      "</svg>"
    );
  }

  function categoryName(slug) {
    var found = (categoriesByLang[cardLang] || window.TIKNIK_CATEGORIES || []).find(function (c) {
      return c.slug === slug;
    });
    return found ? found.name : slug;
  }

  // ------------------------------------------------------------------
  // Currency — converted client-side from the AMD price, then rounded to
  // a clean, "sticker" number (no cents/kopecks), the way clothing sites
  // such as ASOS show a fixed-looking price per currency rather than a
  // literal cents-accurate conversion.
  // ------------------------------------------------------------------
  function niceRound(value) {
    if (value < 50) return Math.round(value);
    if (value < 500) return Math.round(value / 5) * 5;
    if (value < 5000) return Math.round(value / 10) * 10;
    return Math.round(value / 100) * 100;
  }

  function formatAmount(amd) {
    if (activeCurrency === "USD") return "$" + niceRound(amd / RATES.USD).toLocaleString("en-US");
    if (activeCurrency === "RUB") return niceRound(amd / RATES.RUB).toLocaleString("en-US") + " ₽";
    return amd.toLocaleString("en-US") + " ֏";
  }

  // Product view: the main price large, the rental (or "price on request") on a quiet line under it.
  function priceHtml(item) {
    var p = cardPrices(item);
    if (!p.main) return '<span class="price-request">' + esc(p.sub || t("price_on_request", "Price on request")) + "</span>";
    return '<span class="price-main">' + esc(p.main) + "</span>" + (p.sub ? '<span class="price-sub">' + esc(p.sub) + "</span>" : "");
  }

  function setCurrency(code) {
    activeCurrency = code;
    currencyBtns.forEach(function (btn) {
      if (btn.getAttribute("data-currency") === code) {
        btn.setAttribute("data-active", "true");
      } else {
        btn.removeAttribute("data-active");
      }
    });
    render("currency");
    // If a product detail view is open, refresh its price too.
    if (overlay && !overlay.classList.contains("translate-x-full") && currentOpenItem) {
      document.getElementById("product-price").innerHTML = priceHtml(currentOpenItem);
      renderProductCart(currentOpenItem);
    }
    if (dial) dial.set("cur", code, true);
    updateDialLegend();
    if (document.body.classList.contains("cart-open")) renderCart();
  }

  currencyBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setCurrency(btn.getAttribute("data-currency"));
    });
  });

  function modeLabel(mode) {
    return t("mode_" + mode, mode);
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  // The item's parameters as [label, value] pairs (the server only sends filled-in ones).
  function filledAttrs(item) {
    return item.attrs || [];
  }

  // The first photo (not video) is the catalog thumbnail.
  function mainPhoto(item) {
    return cardPhotos(item)[0] || null;
  }

  function photoUrl(filename) {
    return "/static/img/products/" + filename;
  }

  // The small copy of a photo for cards and thumbnails (the full photo if there's none yet).
  function smallUrl(m) {
    return m.thumb ? "/static/img/products/thumbs/" + m.thumb : photoUrl(m.file);
  }

  // Photos (not videos) of an item.
  function cardPhotos(item) {
    return (item.media || []).filter(function (m) {
      return !m.video;
    });
  }

  // Which photo each catalog card is showing (by item id), so re-rendering keeps it.
  var cardPhotoIndex = {};

  var CHEVRON_LEFT = '<svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M15 5l-7 7 7 7"/></svg>';
  var CHEVRON_RIGHT = '<svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 5l7 7-7 7"/></svg>';

  // A thin line under the photo shows which of the photos is showing (works for 2 photos or 20).
  function cardProgressHtml(count, index) {
    return '<span style="width:' + (100 / count).toFixed(3) + "%;transform:translateX(" + index * 100 + '%)"></span>';
  }

  function cardMediaHtml(item) {
    var photos = cardPhotos(item);
    if (!photos.length) return iconSvg(item.category);
    if (photos.length === 1) {
      return '<img src="' + smallUrl(photos[0]) + '" alt="' + esc(item.name) + '" loading="lazy" class="pcard-img w-full h-full object-cover">';
    }
    var index = Math.min(cardPhotoIndex[item.id] || 0, photos.length - 1);
    var n = photos.length;
    return (
      '<div class="card-track" style="transform:translateX(' + -index * 100 + '%)">' +
      photos
        .map(function (m, i) {
          // Only the shown photo and its neighbours load; the rest load as the card is flipped.
          var near = i === index || i === (index + 1) % n || i === (index + n - 1) % n;
          return '<img class="pcard-img" ' + (near ? 'src="' : 'data-src="') + smallUrl(m) + '" alt="' + (i === index ? esc(item.name) : "") +
            '"' + (i === index ? "" : ' loading="lazy"') + ' draggable="false">';
        })
        .join("") +
      "</div>" +
      '<button type="button" class="card-nav left-3" data-dir="-1" aria-label="‹">' + CHEVRON_LEFT + "</button>" +
      '<button type="button" class="card-nav right-3" data-dir="1" aria-label="›">' + CHEVRON_RIGHT + "</button>" +
      '<div class="card-progress" aria-hidden="true">' + cardProgressHtml(n, index) + "</div>"
    );
  }

  // Phones: a small bag on the photo's corner. Computers: "Buy" / "Rent" appear over the photo on hover.
  var BAG_ICON =
    '<svg viewBox="0 0 24 24" class="card-cart-bag" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round">' +
    '<path d="M5 8h14l-1.2 12H6.2L5 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>' +
    '<svg viewBox="0 0 24 24" class="card-cart-check" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M5 8h14l-1.2 12H6.2L5 8z" stroke-width="1.4"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8" stroke-width="1.4"/><path d="M9.3 14l2 2 3.6-4"/></svg>';

  function canCart(item) {
    return item.mode === "Sale" || item.mode === "Rent" || item.mode === "Both";
  }

  function cartKinds(item) {
    return { Sale: ["buy"], Rent: ["rent"], Both: ["buy", "rent"] }[item.mode] || [];
  }

  function cardCartButton(item) {
    if (!canCart(item)) return "";
    var inCart = itemInCart(item.id);
    var label = inCart ? t("in_cart", "In your cart") : t("add_to_cart", "Add to Cart");
    return (
      '<button type="button" class="card-cart' + (inCart ? " in-cart" : "") + '" data-cart-id="' + item.id +
      '" aria-label="' + esc(label) + '" title="' + esc(label) + '">' + BAG_ICON + "</button>"
    );
  }

  function quickAddHtml(item) {
    var kinds = cartKinds(item);
    if (!kinds.length) return "";
    return (
      '<div class="quick-add" data-quick-id="' + item.id + '">' +
      kinds
        .map(function (kind) {
          var inCart = cartIndex(item.id, kind) !== -1;
          var label = kinds.length === 1 && kind === "buy" ? t("add_to_cart", "Add to Cart") : t("add_" + kind, kind);
          return '<button type="button" class="js-quick' + (inCart ? " in" : "") + '" data-kind="' + kind + '">' +
            esc(inCart ? t("in_cart", "In your cart ✓") : label) + "</button>";
        })
        .join("") +
      "</div>"
    );
  }

  // The first two parameters (usually fabric and colour) as one quiet line; the rest are in the product view.
  function cardAttrs(item) {
    return filledAttrs(item)
      .slice(0, 2)
      .map(function (p) {
        return p[1];
      })
      .join(", ");
  }

  // The price beside the name, and the rental (or "made to order") on the line under it.
  function cardPrices(item) {
    var buy = (item.mode === "Sale" || item.mode === "Both") && item.price;
    var rent = (item.mode === "Rent" || item.mode === "Both") && item.rent_price;
    var rentText = rent ? formatAmount(item.rent_price) + t("per_day", " / day") : "";
    if (buy) return { main: formatAmount(item.price), sub: rent ? t("card_or_rent", "or rent {p}").replace("{p}", rentText) : "" };
    if (rent) return { main: rentText, sub: t("card_rental", "for rent") };
    return { main: "", sub: item.mode === "Custom" ? t("price_on_request", "Price on request") : "" };
  }

  function cardHtml(item) {
    var p = cardPrices(item);
    var attrs = cardAttrs(item);
    return (
      '<article class="pcard group" data-cat="' + item.category + '" data-id="' + item.id + '">' +
      '<div class="card-media pcard-media text-charcoal/25">' +
      cardMediaHtml(item) +
      cardCartButton(item) +
      quickAddHtml(item) +
      "</div>" +
      '<div class="pcard-info">' +
      '<div class="pcard-row">' +
      '<h3 class="pcard-name">' + esc(item.name) + "</h3>" +
      (p.main ? '<span class="pcard-price">' + esc(p.main) + "</span>" : "") +
      "</div>" +
      (attrs || p.sub
        ? '<div class="pcard-row pcard-sub">' +
          '<span class="pcard-attrs">' + esc(attrs) + "</span>" +
          (p.sub ? '<span class="pcard-note">' + esc(p.sub) + "</span>" : "") +
          "</div>"
        : "") +
      "</div>" +
      "</article>"
    );
  }

  // reason: "load", "tab" or "currency" — passed on to add-ons such as static/js/motion.js.
  function render(reason) {
    var filtered =
      activeCategory === "all"
        ? items
        : items.filter(function (it) {
            return it.category === activeCategory;
          });

    if (!filtered.length) {
      grid.innerHTML = "";
      emptyMsg.classList.remove("hidden");
    } else {
      emptyMsg.classList.add("hidden");
      grid.innerHTML = filtered.map(cardHtml).join("");
    }
    document.dispatchEvent(new CustomEvent("tiknik:catalog-rendered", { detail: { reason: reason || "load" } }));
  }

  tabs.forEach(function (btn) {
    btn.addEventListener("click", function () {
      tabs.forEach(function (b) {
        b.removeAttribute("data-active");
      });
      btn.setAttribute("data-active", "true");
      activeCategory = btn.getAttribute("data-category");
      render("tab");
    });
  });

  // ---- Catalog cards: arrows (desktop) or a swipe (phone) flip through an item's photos
  // right on the card; a plain click/tap still opens the item, at the photo being shown. ----
  function showCardPhoto(card, index, animate) {
    var id = parseInt(card.getAttribute("data-id"), 10);
    var track = card.querySelector(".card-track");
    if (!track) return;
    var imgs = track.querySelectorAll("img");
    var n = imgs.length;
    index = ((index % n) + n) % n;
    cardPhotoIndex[id] = index;
    [index - 1, index, index + 1].forEach(function (i) {
      var img = imgs[(i + n) % n];
      if (img && img.hasAttribute("data-src")) {
        img.src = img.getAttribute("data-src");
        img.removeAttribute("data-src");
      }
    });
    track.style.transition = animate === false ? "none" : "";
    track.style.transform = "translateX(" + -index * 100 + "%)";
    card.querySelector(".card-progress").innerHTML = cardProgressHtml(n, index);
  }

  var suppressClickUntil = 0;
  grid.addEventListener("click", function (e) {
    var card = e.target.closest("[data-id]");
    if (!card) return;
    var quick = e.target.closest(".js-quick");
    if (quick) {
      var quickId = parseInt(card.getAttribute("data-id"), 10);
      var kind = quick.getAttribute("data-kind");
      if (cartIndex(quickId, kind) !== -1) openCart();
      else addToCart(quickId, kind, quick);
      return;
    }
    if (e.target.closest(".quick-add")) return; // the gap between the two buttons
    var bag = e.target.closest(".card-cart");
    if (bag) {
      var bagId = parseInt(bag.getAttribute("data-cart-id"), 10);
      if (itemInCart(bagId)) {
        openCart();
      } else {
        var bagItem = findItem(items, bagId);
        addToCart(bagId, bagItem.mode === "Rent" ? "rent" : "buy", bag);
      }
      return;
    }
    var nav = e.target.closest(".card-nav");
    if (nav) {
      var id = parseInt(card.getAttribute("data-id"), 10);
      showCardPhoto(card, (cardPhotoIndex[id] || 0) + parseInt(nav.getAttribute("data-dir"), 10));
      return;
    }
    if (Date.now() < suppressClickUntil) return; // that tap was the end of a swipe
    var itemId = parseInt(card.getAttribute("data-id"), 10);
    var it = findItem(items, itemId);
    var photos = it ? cardPhotos(it) : [];
    var shown = photos[cardPhotoIndex[itemId] || 0];
    openProduct(itemId, false, shown ? shown.file : null, card.querySelector(".card-media"));
  });

  var swipe = null;
  grid.addEventListener("touchstart", function (e) {
    var media = e.target.closest(".card-media");
    var track = media && media.querySelector(".card-track");
    if (!track || e.touches.length !== 1) return;
    swipe = { card: media.closest("[data-id]"), track: track, width: media.clientWidth,
              x: e.touches[0].clientX, y: e.touches[0].clientY, dx: 0, horizontal: null };
  }, { passive: true });
  grid.addEventListener("touchmove", function (e) {
    if (!swipe) return;
    var dx = e.touches[0].clientX - swipe.x;
    var dy = e.touches[0].clientY - swipe.y;
    if (swipe.horizontal === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      swipe.horizontal = Math.abs(dx) > Math.abs(dy);
    }
    if (!swipe.horizontal) return;
    swipe.dx = dx;
    var index = cardPhotoIndex[parseInt(swipe.card.getAttribute("data-id"), 10)] || 0;
    swipe.track.style.transition = "none";
    swipe.track.style.transform = "translateX(calc(" + -index * 100 + "% + " + dx + "px))";
  }, { passive: true });
  grid.addEventListener("touchend", function () {
    if (!swipe) return;
    var s = swipe;
    swipe = null;
    if (!s.horizontal) return;
    suppressClickUntil = Date.now() + 400;
    var index = cardPhotoIndex[parseInt(s.card.getAttribute("data-id"), 10)] || 0;
    var dir = Math.abs(s.dx) > Math.min(40, s.width * 0.15) ? (s.dx < 0 ? 1 : -1) : 0;
    s.track.style.transition = "";
    showCardPhoto(s.card, index + dir);
  });

  fetch("/api/items?lang=" + encodeURIComponent(LANG))
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      items = data;
      itemsByLang[LANG] = data;
      render("load");
      // A shared /item/<id> link: show that piece (the address becomes the usual #item-<id> one).
      if (window.TIKNIK_OPEN_ITEM && !location.hash) {
        history.replaceState(null, "", langUrl(LANG) + "#item-" + window.TIKNIK_OPEN_ITEM);
      }
      // Deep-link support: open directly if the page was loaded with #item-<id>
      maybeOpenFromHash();
    })
    .catch(function () {
      grid.innerHTML =
        '<p class="col-span-full text-center text-sm text-ink/50 py-10">' +
        t("load_error", "Unable to load the catalog right now.") +
        "</p>";
    });

  // ------------------------------------------------------------------
  // Product detail overlay (full-screen gallery, no page reload)
  // ------------------------------------------------------------------
  var overlay = document.getElementById("product-overlay");
  var mainImage = document.getElementById("product-main-image");
  var mainVideo = document.getElementById("product-main-video");
  var mainIconWrap = document.getElementById("product-main-icon");
  var thumbsWrap = document.getElementById("product-thumbs");
  var prevBtn = document.getElementById("product-prev");
  var nextBtn = document.getElementById("product-next");
  var closeBtn = document.getElementById("product-close");
  var mainImageWrap = document.getElementById("product-main-image-wrap");
  var itemPrevBtn = document.getElementById("product-item-prev");
  var itemNextBtn = document.getElementById("product-item-next");
  var itemCounter = document.getElementById("product-item-counter");

  var galleryPhotos = [];
  var galleryIndex = 0;
  var productList = [];
  var productIndex = -1;
  var currentOpenItem = null;
  var itemsByLang = {};
  var categoriesByLang = {};
  categoriesByLang[LANG] = window.TIKNIK_CATEGORIES || [];

  function currentIsVideo() {
    return galleryPhotos.length && galleryPhotos[galleryIndex].video;
  }

  function renderGalleryMain() {
    var current = galleryPhotos[galleryIndex];
    var isVideo = !!(current && current.video);
    mainVideo.pause();
    if (isVideo) {
      if (mainVideo.getAttribute("src") !== photoUrl(current.file)) mainVideo.src = photoUrl(current.file);
    } else {
      mainVideo.removeAttribute("src");
      mainVideo.load();
    }
    if (current && !isVideo) mainImage.src = photoUrl(current.file);
    mainImage.classList.toggle("hidden", !current || isVideo);
    mainVideo.classList.toggle("hidden", !isVideo);
    mainIconWrap.classList.toggle("hidden", !!current);
    mainImageWrap.classList.toggle("cursor-zoom-in", !isVideo);
    var multi = galleryPhotos.length > 1;
    prevBtn.classList.toggle("hidden", !multi);
    nextBtn.classList.toggle("hidden", !multi);
  }

  function renderThumbs() {
    if (galleryPhotos.length < 2) {
      thumbsWrap.innerHTML = "";
      thumbsWrap.classList.add("hidden");
      return;
    }
    thumbsWrap.classList.remove("hidden");
    thumbsWrap.innerHTML = galleryPhotos
      .map(function (m, i) {
        var preview = m.video
          ? '<video src="' +
            photoUrl(m.file) +
            '#t=0.1" muted playsinline preload="metadata" class="w-full h-full object-cover pointer-events-none"></video>' +
            '<span class="absolute inset-0 flex items-center justify-center"><span class="w-7 h-7 rounded-full bg-cream/85 text-charcoal text-[10px] flex items-center justify-center pl-0.5">&#9654;</span></span>'
          : '<img src="' + smallUrl(m) + '" class="w-full h-full object-cover" alt="">';
        return (
          '<button data-i="' +
          i +
          '" class="thumb-btn' + (i === galleryIndex ? " on" : "") + '" aria-label="' + (i + 1) + '">' +
          preview +
          "</button>"
        );
      })
      .join("");
    thumbsWrap.querySelectorAll(".thumb-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var i = parseInt(btn.getAttribute("data-i"), 10);
        slideTo(i, i > galleryIndex ? 1 : -1);
      });
    });
  }

  function goTo(delta) {
    if (!galleryPhotos.length) return;
    slideTo((galleryIndex + delta + galleryPhotos.length) % galleryPhotos.length, delta > 0 ? 1 : -1);
  }

  // Change the large photo with a short slide: the current one leaves quickly towards where the
  // finger went (or the arrow pointed), the next arrives from the other side and settles softly
  // once it has loaded. Videos and reduced-motion just switch.
  var EASE_OUT = "cubic-bezier(.16, 1, .3, 1)";
  var sliding = false;
  var reduceGalleryMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resetMainImageStyle() {
    mainImage.style.transition = "";
    mainImage.style.transform = "";
    mainImage.style.opacity = "";
  }

  function slideTo(index, dir) {
    if (index === galleryIndex || !galleryPhotos.length) {
      settleDrag();
      return;
    }
    var current = galleryPhotos[galleryIndex];
    var next = galleryPhotos[index];
    if (sliding || reduceGalleryMotion || current.video || next.video || mainImage.classList.contains("hidden")) {
      galleryIndex = index;
      resetMainImageStyle();
      renderGalleryMain();
      renderThumbs();
      return;
    }
    sliding = true;
    new Image().src = photoUrl(next.file); // start loading while the current photo leaves
    mainImage.style.transition = "transform .2s cubic-bezier(.4, 0, 1, 1), opacity .2s linear";
    mainImage.style.transform = "translateX(" + -dir * 22 + "%)";
    mainImage.style.opacity = "0";
    setTimeout(function () {
      galleryIndex = index;
      renderGalleryMain();
      renderThumbs();
      mainImage.style.transition = "none";
      mainImage.style.transform = "translateX(" + dir * 18 + "%)";
      var arrived = false;
      var arrive = function () {
        if (arrived) return;
        arrived = true;
        requestAnimationFrame(function () {
          mainImage.style.transition = "transform .55s " + EASE_OUT + ", opacity .45s " + EASE_OUT;
          mainImage.style.transform = "";
          mainImage.style.opacity = "";
          sliding = false;
        });
      };
      if (mainImage.complete && mainImage.naturalWidth) arrive();
      else {
        mainImage.addEventListener("load", arrive, { once: true });
        setTimeout(arrive, 700);
      }
    }, 200);
  }

  // A drag that didn't go far enough: the photo slides back into place.
  function settleDrag() {
    if (sliding) return;
    mainImage.style.transition = "transform .35s " + EASE_OUT + ", opacity .35s " + EASE_OUT;
    mainImage.style.transform = "";
    mainImage.style.opacity = "";
  }

  function computeProductList() {
    return activeCategory === "all"
      ? items.slice()
      : items.filter(function (it) {
          return it.category === activeCategory;
        });
  }

  function renderItemNav() {
    var multi = productList.length > 1;
    itemPrevBtn.classList.toggle("hidden", !multi);
    itemNextBtn.classList.toggle("hidden", !multi);
    itemPrevBtn.classList.toggle("flex", multi);
    itemNextBtn.classList.toggle("flex", multi);
    itemCounter.textContent = multi ? productIndex + 1 + " / " + productList.length : "";
  }

  function navigateProductItem(delta) {
    if (productList.length < 2) return;
    productIndex = (productIndex + delta + productList.length) % productList.length;
    openProduct(productList[productIndex].id, true);
  }

  function findItem(list, id) {
    return (list || []).find(function (it) {
      return it.id === id;
    });
  }

  // Name, category, price, parameters and description, in the card's current language.
  function fillProductText(item) {
    document.getElementById("product-category").textContent = categoryName(item.category);
    document.getElementById("product-name").textContent = item.name;
    var priceEl = document.getElementById("product-price");
    priceEl.innerHTML = priceHtml(item);
    priceEl.classList.toggle("hidden", cartKinds(item).length > 0);
    // "Fittings & delivery": the piece's own text when set in /admin, else the standard facts
    var delivery = document.getElementById("product-delivery");
    delivery.textContent = item.delivery || "";
    delivery.classList.toggle("hidden", !item.delivery);
    document.getElementById("product-delivery-default").classList.toggle("hidden", !!item.delivery);
    var craft = [];
    if (item.hours) craft.push(t("handmade_hours", "About {n} hours of handwork").replace("{n}", item.hours));
    if (item.edition === 1) craft.push(t("edition_one", "One of a kind"));
    else if (item.edition > 1) craft.push(t("edition_n", "Only {n} made").replace("{n}", item.edition));
    var craftEl = document.getElementById("product-craft");
    craftEl.innerHTML = craft.map(function (c) {
      return '<span class="block">' + esc(c) + "</span>";
    }).join("");
    craftEl.classList.toggle("hidden", !craft.length);
    var attrsEl = document.getElementById("product-attrs");
    var pairs = filledAttrs(item);
    attrsEl.innerHTML = pairs
      .map(function (p) {
        return (
          '<dt class="text-[13px] text-ink/55">' +
          esc(p[0]) +
          '</dt><dd class="text-charcoal/85">' +
          esc(p[1]) +
          "</dd>"
        );
      })
      .join("");
    attrsEl.classList.toggle("hidden", !pairs.length);
    document.getElementById("product-attrs-section").classList.toggle("hidden", !pairs.length);
    document.getElementById("product-description").textContent = item.description || "";
    document.getElementById("product-description-section").classList.toggle("hidden", !(item.description || "").trim());
    renderProductCart(item);
  }

  function openProduct(id, keepList, startPhoto, sourceEl) {
    var item = findItem(items, id);
    if (!item) return;
    var wasClosed = overlay.classList.contains("translate-x-full");

    if (!keepList) {
      productList = computeProductList();
      productIndex = productList.findIndex(function (it) {
        return it.id === id;
      });
      if (productIndex === -1) {
        productList = [item];
        productIndex = 0;
      }
    }

    currentOpenItem = findItem(itemsByLang[cardLang], id) || item;
    galleryPhotos = item.media || [];
    sliding = false;
    resetMainImageStyle();
    galleryIndex = Math.max(0, galleryPhotos.findIndex(function (m) {
      return m.file === startPhoto;
    }));

    fillProductText(currentOpenItem);
    mainIconWrap.innerHTML = iconSvg(item.category, "w-20 h-20");

    renderGalleryMain();
    renderThumbs();
    renderItemNav();

    overlay.classList.remove("translate-x-full");
    document.body.style.overflow = "hidden";
    if (wasClosed && dial) dial.intro();
    if (location.hash !== "#item-" + id) {
      history.pushState({ item: id }, "", "#item-" + id);
    }
    document.dispatchEvent(new CustomEvent("tiknik:product-open", {
      detail: { id: id, source: sourceEl || null, wasClosed: wasClosed },
    }));
  }

  var closing = false;

  function closeProduct() {
    // The card was switched to another language: show the whole site in it.
    if (cardLang !== LANG) {
      reloadInCardLang("#catalog");
      return;
    }
    var motion = window.TiknikMotion;
    if (motion && motion.closeProduct && !overlay.classList.contains("translate-x-full")) {
      if (closing) return;
      closing = true;
      var finished = false;
      var finish = function () {
        if (finished) return;
        finished = true;
        closing = false;
        finishClose();
      };
      try {
        motion.closeProduct(currentOpenItem ? currentOpenItem.id : null, finish);
      } catch (e) {
        finish();
      }
      setTimeout(finish, 1500); // never leave the product view stuck open
      return;
    }
    finishClose();
  }

  function finishClose() {
    overlay.classList.add("translate-x-full");
    mainVideo.pause();
    document.body.style.overflow = "";
    closeZoom();
    if (location.hash.indexOf("#item-") === 0) {
      history.pushState("", document.title, window.location.pathname + window.location.search);
    }
  }

  function maybeOpenFromHash() {
    var match = /^#item-(\d+)$/.exec(location.hash);
    if (match) openProduct(parseInt(match[1], 10));
  }

  closeBtn.addEventListener("click", closeProduct);
  document.getElementById("product-cta").addEventListener("click", function (e) {
    if (cardLang !== LANG) {
      e.preventDefault();
      reloadInCardLang("#contact");
      return;
    }
    closeProduct(); // then the link scrolls to the form
  });

  // ------------------------------------------------------------------
  // Language inside the product view (driven by the dial)
  // ------------------------------------------------------------------
  function langUrl(lang) {
    return lang === "en" ? "/?lang=en" : "/" + lang + "/";
  }

  // Share a piece: its own link (/item/<id>) shows that piece's photo and name in link previews
  // (Instagram, WhatsApp, Telegram). Phones get the system share sheet; computers copy the link.
  var shareBtn = document.getElementById("product-share");
  if (shareBtn) {
    shareBtn.addEventListener("click", function () {
      if (!currentOpenItem) return;
      var url = location.origin + (cardLang === "en" ? "" : "/" + cardLang) + "/item/" + currentOpenItem.id;
      if (navigator.share) {
        navigator.share({ title: currentOpenItem.name + " — Tiknik", url: url }).catch(function () {});
        return;
      }
      var label = shareBtn.querySelector("[data-t]");
      var copied = function () {
        label.textContent = t("link_copied", "Link copied");
        setTimeout(function () {
          label.textContent = t("share", "Share");
        }, 2000);
      };
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(copied, function () {
          window.prompt("", url);
        });
      } else {
        window.prompt("", url);
      }
    });
  }

  // The address already shows the card's language (see setCardLang), so going "to" it would only
  // change the #hash and not load anything: set the address, then reload.
  function reloadInCardLang(anchor) {
    history.replaceState(null, "", langUrl(cardLang) + anchor);
    location.reload();
  }

  function loadLang(lang) {
    if (itemsByLang[lang] && categoriesByLang[lang]) return Promise.resolve();
    var q = "?lang=" + encodeURIComponent(lang);
    return Promise.all([
      fetch("/api/items" + q).then(function (r) { return r.json(); }),
      fetch("/api/categories" + q).then(function (r) { return r.json(); }),
    ]).then(function (res) {
      itemsByLang[lang] = res[0];
      categoriesByLang[lang] = res[1];
    });
  }

  function setCardLang(lang) {
    return loadLang(lang)
      .then(function () {
        cardLang = lang;
        document.documentElement.lang = lang;
        overlay.querySelectorAll("[data-t]").forEach(function (el) {
          el.textContent = t(el.getAttribute("data-t"), el.textContent);
        });
        if (lang === "hy" && !document.getElementById("armenian-fonts")) {
          var link = document.createElement("link");
          link.id = "armenian-fonts";
          link.rel = "stylesheet";
          link.href = "https://fonts.googleapis.com/css2?family=Noto+Sans+Armenian:wght@300;400;500&family=Noto+Serif+Armenian:wght@400;500;600&display=swap";
          document.head.appendChild(link);
        }
        updateDialLegend();
        if (currentOpenItem) {
          currentOpenItem = findItem(itemsByLang[lang], currentOpenItem.id) || currentOpenItem;
          fillProductText(currentOpenItem);
        }
        // Remember the choice (same cookie the server sets) and keep the address shareable.
        document.cookie = "lang=" + lang + "; path=/; max-age=31536000; samesite=lax";
        history.replaceState(history.state, "", langUrl(lang) + location.hash);
      })
      .catch(function () {
        if (dial) dial.set("lang", cardLang, true); // couldn't load it: turn the ring back
      });
  }

  // ------------------------------------------------------------------
  // The dial: the logo's key in its double oval. Turn (drag) the outer
  // ring to change language, the inner ring to change currency; tapping
  // a label turns it to the top. Whatever sits at the top is selected.
  // ------------------------------------------------------------------
  function createDial(svg, rings) {
    var NS = "http://www.w3.org/2000/svg";
    var CX = 100;
    var CY = 120;
    var labelsG = svg.querySelector(".dial-labels");
    var dotsG = svg.querySelector(".dial-dots");
    var key = svg.querySelector(".dial-key");
    var animating = false;

    function point(ring, deg) {
      var a = (deg * Math.PI) / 180;
      return [CX + ring.rx * Math.sin(a), CY - ring.ry * Math.cos(a)];
    }

    Object.keys(rings).forEach(function (name) {
      var ring = rings[name];
      ring.step = 360 / ring.options.length;
      ring.offset = ring.target = 0;
      ring.labels = ring.options.map(function (opt, i) {
        var el = document.createElementNS(NS, "text");
        el.setAttribute("class", "dial-label " + name);
        el.textContent = opt.label;
        labelsG.appendChild(el);
        return el;
      });
      // Small dots between the labels, so the turning is visible.
      ring.dots = [];
      for (var d = 0; d < 360; d += 15) {
        var nearLabel = ring.options.some(function (o, i) {
          return Math.abs(((((d - i * ring.step) % 360) + 540) % 360) - 180) < 16;
        });
        if (nearLabel) continue;
        var dot = document.createElementNS(NS, "circle");
        dot.setAttribute("r", name === "lang" ? 1.8 : 1.5);
        dot.setAttribute("class", "dial-dot");
        dotsG.appendChild(dot);
        ring.dots.push({ el: dot, base: d });
      }
    });

    function draw() {
      Object.keys(rings).forEach(function (name) {
        var ring = rings[name];
        ring.labels.forEach(function (el, i) {
          var p = point(ring, i * ring.step + ring.offset);
          el.setAttribute("x", p[0].toFixed(2));
          el.setAttribute("y", p[1].toFixed(2));
        });
        ring.dots.forEach(function (dot) {
          var p = point(ring, dot.base + ring.offset);
          dot.el.setAttribute("cx", p[0].toFixed(2));
          dot.el.setAttribute("cy", p[1].toFixed(2));
        });
      });
    }

    function tick() {
      var moving = false;
      Object.keys(rings).forEach(function (name) {
        var ring = rings[name];
        if (ring.dragging) return;
        var diff = ring.target - ring.offset;
        if (Math.abs(diff) < 0.05) {
          ring.offset = ring.target;
        } else {
          ring.offset += diff * 0.14;
          moving = true;
        }
      });
      draw();
      animating = moving;
      if (moving) requestAnimationFrame(tick);
    }

    function animate() {
      if (!animating) {
        animating = true;
        requestAnimationFrame(tick);
      }
    }

    function turnKey() {
      key.classList.remove("turn");
      void key.getBBox(); // restarts the animation
      key.classList.add("turn");
    }
    key.addEventListener("animationend", function (e) {
      if (e.animationName === "keyTurn") key.classList.remove("turn");
    });

    function markActive(ring) {
      ring.labels.forEach(function (el, i) {
        el.classList.toggle("active", i === ring.active);
      });
    }

    // Turn the ring so option i sits at the top, the short way round.
    function select(ring, i, notify) {
      var target = -i * ring.step;
      target += 360 * Math.round((ring.offset - target) / 360);
      ring.target = target;
      var changed = ring.active !== i;
      ring.active = i;
      markActive(ring);
      animate();
      if (changed && notify) {
        turnKey();
        ring.onSelect(ring.options[i].value);
      }
    }

    function nearestToTop(ring) {
      var n = ring.options.length;
      var i = Math.round(-ring.offset / ring.step);
      return ((i % n) + n) % n;
    }

    // Pointer position as an angle around the oval (0 = top, clockwise).
    function toSvg(e) {
      var pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      return pt.matrixTransform(svg.getScreenCTM().inverse());
    }
    function angleOf(ring, p) {
      return (Math.atan2((p.x - CX) / ring.rx, -(p.y - CY) / ring.ry) * 180) / Math.PI;
    }

    var drag = null;
    svg.addEventListener("pointerdown", function (e) {
      var p = toSvg(e);
      // Outside the middle oval = language ring; between it and the key = currency ring.
      var r = Math.sqrt(Math.pow((p.x - CX) / 72, 2) + Math.pow((p.y - CY) / 92, 2));
      if (r < 0.66) {
        turnKey();
        return;
      }
      var ring = r >= 1 ? rings.lang : rings.cur;
      drag = { ring: ring, last: angleOf(ring, p), moved: 0 };
      ring.dragging = true;
      ring.dragMoved = false;
      svg.setPointerCapture(e.pointerId);
      svg.classList.add("dragging");
    });
    svg.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var a = angleOf(drag.ring, toSvg(e));
      var delta = ((a - drag.last + 540) % 360) - 180;
      drag.last = a;
      drag.moved += Math.abs(delta);
      drag.ring.offset += delta;
      if (drag.moved > 4) drag.ring.dragMoved = true;
      draw();
    });
    function endDrag(e) {
      if (!drag) return;
      var ring = drag.ring;
      ring.dragging = false;
      svg.classList.remove("dragging");
      if (ring.dragMoved) {
        select(ring, nearestToTop(ring), true);
      } else {
        // A tap: turn the label nearest to the tapped spot to the top.
        var a = angleOf(ring, toSvg(e));
        var best = -1;
        var bestDist = 35;
        ring.options.forEach(function (o, i) {
          var dist = Math.abs(((((i * ring.step + ring.offset - a) % 360) + 540) % 360) - 180);
          if (dist < bestDist) {
            best = i;
            bestDist = dist;
          }
        });
        if (best !== -1) select(ring, best, true);
      }
      drag = null;
    }
    svg.addEventListener("pointerup", endDrag);
    svg.addEventListener("pointercancel", endDrag);

    svg.addEventListener("keydown", function (e) {
      var ring = { ArrowLeft: rings.lang, ArrowRight: rings.lang, ArrowUp: rings.cur, ArrowDown: rings.cur }[e.key];
      if (!ring) return;
      e.preventDefault();
      e.stopPropagation(); // the product view uses ←/→ for photos
      var dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
      var n = ring.options.length;
      select(ring, (ring.active + dir + n) % n, true);
    });

    return {
      set: function (name, value, animated) {
        var ring = rings[name];
        var i = ring.options.findIndex(function (o) {
          return o.value === value;
        });
        if (i === -1) return;
        select(ring, i, false);
        if (!animated) {
          ring.offset = ring.target;
          draw();
        }
      },
      // A welcoming half-turn of both rings, in opposite directions, when the card opens.
      intro: function () {
        if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        rings.lang.offset = rings.lang.target - 180;
        rings.cur.offset = rings.cur.target + 180;
        draw();
        animate();
      },
    };
  }

  var dial = null;
  var dialSvg = document.getElementById("product-dial");
  if (dialSvg) {
    var LANG_LABELS = window.TIKNIK_LANG_LABELS || {};
    dial = createDial(dialSvg, {
      lang: {
        rx: 81.5,
        ry: 102,
        options: (window.TIKNIK_LANGS || Object.keys(I18N)).map(function (l) {
          return { value: l, label: LANG_LABELS[l] || l.toUpperCase() };
        }),
        onSelect: setCardLang,
      },
      cur: {
        rx: 61.5,
        ry: 80,
        options: [
          { value: "USD", label: "$" },
          { value: "RUB", label: "₽" },
          { value: "AMD", label: "֏" },
        ],
        onSelect: setCurrency,
      },
    });
    dial.set("lang", LANG, false);
    dial.set("cur", activeCurrency, false);
  }

  // Under the dial, in words: which language and currency the rings are set to.
  var LANG_NAMES = { en: "English", ru: "Русский", hy: "Հայերեն" };
  var CURRENCY_NAMES = { USD: "USD $", RUB: "RUB ₽", AMD: "AMD ֏" };
  function updateDialLegend() {
    var l = document.getElementById("dial-lang-name");
    var c = document.getElementById("dial-cur-name");
    if (l) l.textContent = LANG_NAMES[cardLang] || cardLang;
    if (c) c.textContent = CURRENCY_NAMES[activeCurrency] || activeCurrency;
  }
  updateDialLegend();

  // The words beside the small dial change the choice on a click.
  function nextOf(list, value) {
    return list[(list.indexOf(value) + 1) % list.length];
  }
  document.getElementById("dial-lang-btn").addEventListener("click", function () {
    var next = nextOf(window.TIKNIK_LANGS || ["en", "ru", "hy"], cardLang);
    if (dial) dial.set("lang", next, true);
    setCardLang(next);
  });
  document.getElementById("dial-cur-btn").addEventListener("click", function () {
    setCurrency(nextOf(["USD", "RUB", "AMD"], activeCurrency));
  });
  prevBtn.addEventListener("click", function () {
    goTo(-1);
  });
  nextBtn.addEventListener("click", function () {
    goTo(1);
  });
  itemPrevBtn.addEventListener("click", function () {
    navigateProductItem(-1);
  });
  itemNextBtn.addEventListener("click", function () {
    navigateProductItem(1);
  });

  window.addEventListener("popstate", function () {
    if (/^#item-\d+$/.test(location.hash)) {
      maybeOpenFromHash();
    } else {
      closeProduct();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (!zoomOverlay.classList.contains("hidden")) {
      if (e.key === "Escape") closeZoom();
      return;
    }
    if (overlay.classList.contains("translate-x-full")) return;
    if (e.key === "ArrowLeft") goTo(-1);
    if (e.key === "ArrowRight") goTo(1);
    if (e.key === "Escape") closeProduct();
  });

  // Touch swipe on the main image (mobile) — only when not zoomed.
  // Touch on the large photo. A swipe (the finger moved sideways) drags the photo and changes it;
  // a tap is a touch that barely moved; two taps close together open the zoom view. Swipes never
  // count as taps, so flicking through photos can't open the zoom by accident.
  var touch = null;
  var lastTap = { time: 0, x: 0, y: 0 };
  mainImageWrap.addEventListener("touchstart", function (e) {
    if (e.touches.length !== 1 || e.target.closest("button")) {
      touch = null;
      return;
    }
    touch = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now(), dx: 0, horizontal: null };
  }, { passive: true });
  mainImageWrap.addEventListener("touchmove", function (e) {
    if (!touch) return;
    touch.dx = e.touches[0].clientX - touch.x;
    var dy = e.touches[0].clientY - touch.y;
    if (touch.horizontal === null && (Math.abs(touch.dx) > 8 || Math.abs(dy) > 8)) {
      touch.horizontal = Math.abs(touch.dx) > Math.abs(dy);
    }
    if (!touch.horizontal || sliding || galleryPhotos.length < 2 || currentIsVideo()) return;
    var w = mainImageWrap.clientWidth || 1;
    mainImage.style.transition = "none";
    mainImage.style.transform = "translateX(" + touch.dx + "px)";
    mainImage.style.opacity = String(1 - Math.min(0.5, Math.abs(touch.dx) / w));
  }, { passive: true });
  mainImageWrap.addEventListener("touchend", function (e) {
    if (!touch) return;
    var t = touch;
    touch = null;
    var end = e.changedTouches[0];
    var moved = Math.max(Math.abs(end.clientX - t.x), Math.abs(end.clientY - t.y));
    if (t.horizontal) {
      lastTap.time = 0;
      var w = mainImageWrap.clientWidth || 1;
      if (Math.abs(t.dx) > Math.min(60, w * 0.18) && galleryPhotos.length > 1) goTo(t.dx < 0 ? 1 : -1);
      else settleDrag();
      return;
    }
    if (moved > 10 || Date.now() - t.t > 350) {
      lastTap.time = 0;
      return;
    }
    var now = Date.now();
    var near = Math.abs(end.clientX - lastTap.x) < 40 && Math.abs(end.clientY - lastTap.y) < 40;
    if (now - lastTap.time < 320 && near) {
      lastTap.time = 0;
      openZoom();
    } else {
      lastTap = { time: now, x: end.clientX, y: end.clientY };
    }
  });
  mainImageWrap.addEventListener("touchcancel", function () {
    touch = null;
    settleDrag();
  });

  // ------------------------------------------------------------------
  // Full-screen zoom viewer — double-click / double-tap the main photo.
  // Mouse wheel + pinch to zoom, drag to pan, no page reload.
  // ------------------------------------------------------------------
  var zoomOverlay = document.getElementById("zoom-overlay");
  var zoomImage = document.getElementById("zoom-image");
  var zoomCloseBtn = document.getElementById("zoom-close");

  var MIN_SCALE = 1;
  var MAX_SCALE = 4;
  var zoomScale = 1;
  var zoomTx = 0;
  var zoomTy = 0;

  function applyZoomTransform() {
    zoomImage.style.transform = "translate(" + zoomTx + "px, " + zoomTy + "px) scale(" + zoomScale + ")";
    zoomImage.style.cursor = zoomScale > 1 ? "grab" : "zoom-out";
  }

  function clampPan() {
    // Keep the image from being dragged entirely off-screen.
    var maxX = (zoomImage.clientWidth * (zoomScale - 1)) / 2 + 400;
    var maxY = (zoomImage.clientHeight * (zoomScale - 1)) / 2 + 400;
    zoomTx = Math.max(-maxX, Math.min(maxX, zoomTx));
    zoomTy = Math.max(-maxY, Math.min(maxY, zoomTy));
  }

  function requestOverlayFullscreen() {
    var el = zoomOverlay;
    var req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (req) {
      try {
        var result = req.call(el);
        if (result && result.catch) result.catch(function () {});
      } catch (err) {
        /* Fullscreen not available (e.g. iOS Safari) — the fixed overlay already covers the full viewport. */
      }
    }
  }

  function exitOverlayFullscreen() {
    var isFs = document.fullscreenElement || document.webkitFullscreenElement;
    if (!isFs) return;
    var exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (exit) {
      try {
        var result = exit.call(document);
        if (result && result.catch) result.catch(function () {});
      } catch (err) {
        /* ignore */
      }
    }
  }

  function openZoom() {
    // Videos have their own fullscreen button in the player controls.
    if (!galleryPhotos.length || currentIsVideo()) return;
    zoomImage.src = photoUrl(galleryPhotos[galleryIndex].file);
    // Open fitted to the screen (not pre-zoomed) — double-click/scroll/pinch zoom in from here.
    zoomScale = 1;
    zoomTx = 0;
    zoomTy = 0;
    applyZoomTransform();
    zoomOverlay.classList.remove("hidden");
    zoomOverlay.classList.add("flex");
    requestOverlayFullscreen();
  }

  function closeZoom() {
    zoomOverlay.classList.add("hidden");
    zoomOverlay.classList.remove("flex");
    zoomScale = 1;
    zoomTx = 0;
    zoomTy = 0;
    exitOverlayFullscreen();
  }

  document.addEventListener("fullscreenchange", function () {
    if (!document.fullscreenElement && !zoomOverlay.classList.contains("hidden")) {
      closeZoom();
    }
  });
  document.addEventListener("webkitfullscreenchange", function () {
    if (!document.webkitFullscreenElement && !zoomOverlay.classList.contains("hidden")) {
      closeZoom();
    }
  });

  function setZoom(newScale, originXRatio, originYRatio) {
    newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
    if (newScale === 1) {
      zoomTx = 0;
      zoomTy = 0;
    }
    zoomScale = newScale;
    clampPan();
    applyZoomTransform();
  }

  mainImageWrap.addEventListener("dblclick", function (e) {
    if (e.target.closest("button")) return; // fast clicks on the arrows are not a zoom
    openZoom();
  });


  zoomCloseBtn.addEventListener("click", closeZoom);
  zoomOverlay.addEventListener("click", function (e) {
    if (e.target === zoomOverlay) {
      if (zoomScale > 1) {
        setZoom(1);
      } else {
        closeZoom();
      }
    }
  });
  zoomImage.addEventListener("dblclick", function () {
    setZoom(zoomScale > 1 ? 1 : 2.4);
  });

  zoomOverlay.addEventListener(
    "wheel",
    function (e) {
      e.preventDefault();
      var delta = e.deltaY < 0 ? 0.35 : -0.35;
      setZoom(zoomScale + delta);
    },
    { passive: false }
  );

  // Drag to pan (mouse).
  var isPanning = false;
  var panStartX = 0;
  var panStartY = 0;
  zoomImage.addEventListener("mousedown", function (e) {
    if (zoomScale <= 1) return;
    isPanning = true;
    panStartX = e.clientX - zoomTx;
    panStartY = e.clientY - zoomTy;
    zoomImage.style.cursor = "grabbing";
  });
  window.addEventListener("mousemove", function (e) {
    if (!isPanning) return;
    zoomTx = e.clientX - panStartX;
    zoomTy = e.clientY - panStartY;
    clampPan();
    applyZoomTransform();
  });
  window.addEventListener("mouseup", function () {
    isPanning = false;
    if (zoomScale > 1) zoomImage.style.cursor = "grab";
  });

  // Touch: single-finger pan, two-finger pinch zoom.
  var touchPoints = [];
  var pinchStartDist = 0;
  var pinchStartScale = 1;
  var panTouchStartX = 0;
  var panTouchStartY = 0;

  function touchDist(touches) {
    var dx = touches[0].clientX - touches[1].clientX;
    var dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  zoomOverlay.addEventListener(
    "touchstart",
    function (e) {
      touchPoints = e.touches;
      if (e.touches.length === 2) {
        pinchStartDist = touchDist(e.touches);
        pinchStartScale = zoomScale;
      } else if (e.touches.length === 1 && zoomScale > 1) {
        panTouchStartX = e.touches[0].clientX - zoomTx;
        panTouchStartY = e.touches[0].clientY - zoomTy;
      }
    },
    { passive: true }
  );

  zoomOverlay.addEventListener(
    "touchmove",
    function (e) {
      if (e.touches.length === 2) {
        e.preventDefault();
        var newDist = touchDist(e.touches);
        var ratio = newDist / (pinchStartDist || newDist);
        setZoom(pinchStartScale * ratio);
      } else if (e.touches.length === 1 && zoomScale > 1) {
        e.preventDefault();
        zoomTx = e.touches[0].clientX - panTouchStartX;
        zoomTy = e.touches[0].clientY - panTouchStartY;
        clampPan();
        applyZoomTransform();
      }
    },
    { passive: false }
  );

  // ------------------------------------------------------------------
  // Quote / fitting request form
  // ------------------------------------------------------------------
  var form = document.getElementById("quote-form");
  var status = document.getElementById("quote-status");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = Object.fromEntries(new FormData(form).entries());
      status.textContent = t("sending", "Sending…");
      status.className = "sm:col-span-2 text-sm mt-1 text-ink/60";

      fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
        .then(function (res) {
          return res.json().then(function (body) {
            return { ok: res.ok, body: body };
          });
        })
        .then(function (result) {
          if (result.ok && result.body.ok) {
            status.textContent = t(
              "sent",
              "Thank you — we've received your request and will be in touch shortly."
            );
            status.className = "sm:col-span-2 text-sm mt-1 text-green-800";
            form.reset();
          } else {
            // The only validation error the server sends is "name and contact are required".
            status.textContent = t("required_error", (result.body && result.body.error) || "Something went wrong.");
            status.className = "sm:col-span-2 text-sm mt-1 text-red-700";
          }
        })
        .catch(function () {
          status.textContent = t("send_error", "Something went wrong. Please try again.");
          status.className = "sm:col-span-2 text-sm mt-1 text-red-700";
        });
    });
  }
  // ------------------------------------------------------------------
  // Header: catalog section links (drop-down and phone menu) and the phone menu itself
  // ------------------------------------------------------------------
  var menuToggle = document.getElementById("menu-toggle");
  var mobileMenu = document.getElementById("mobile-menu");

  function setMenu(open) {
    if (!mobileMenu) return;
    mobileMenu.classList.toggle("hidden", !open);
    menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
  }
  if (menuToggle) {
    menuToggle.addEventListener("click", function () {
      setMenu(mobileMenu.classList.contains("hidden"));
    });
    mobileMenu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
  }

  // "Catalog → Corsets" opens the catalog with that tab chosen (the link itself scrolls there).
  document.querySelectorAll(".js-cat-link").forEach(function (link) {
    link.addEventListener("click", function () {
      var tab = document.querySelector('.tab-btn[data-category="' + link.getAttribute("data-cat") + '"]');
      if (tab) tab.click();
    });
  });

  // ------------------------------------------------------------------
  // Cart — no accounts: it's kept in this browser and sent as an order
  // request; prices are checked again on the server.
  // ------------------------------------------------------------------
  var CART_KEY = "tiknik_cart";
  var cartPanel = document.getElementById("cart-panel");
  var cartLinesEl = document.getElementById("cart-lines");
  var cartForm = document.getElementById("cart-form");
  var cartStatus = document.getElementById("cart-status");
  var cartCount = document.getElementById("cart-count");
  var cart = loadCart();

  function loadCart() {
    try {
      var stored = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      return Array.isArray(stored)
        ? stored.filter(function (l) {
            return l && typeof l.id === "number" && (l.kind === "buy" || l.kind === "rent");
          })
        : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (e) {
      /* private mode etc. — the cart still works for this visit */
    }
    updateCartCount();
    refreshCardCartButtons();
  }

  function itemInCart(id) {
    return cart.some(function (l) {
      return l.id === id;
    });
  }

  function refreshCardCartButtons() {
    grid.querySelectorAll(".quick-add").forEach(function (bar) {
      var item = findItem(items, parseInt(bar.getAttribute("data-quick-id"), 10));
      if (item) bar.outerHTML = quickAddHtml(item);
    });
    grid.querySelectorAll(".card-cart").forEach(function (btn) {
      var inCart = itemInCart(parseInt(btn.getAttribute("data-cart-id"), 10));
      var label = inCart ? t("in_cart", "In your cart") : t("add_to_cart", "Add to Cart");
      if (inCart && !btn.classList.contains("in-cart")) {
        btn.classList.remove("pop");
        void btn.offsetWidth;
        btn.classList.add("pop");
      }
      btn.classList.toggle("in-cart", inCart);
      btn.setAttribute("aria-label", label);
      btn.setAttribute("title", label);
    });
  }

  function updateCartCount(bump) {
    cartCount.textContent = cart.length;
    cartCount.classList.toggle("hidden", !cart.length);
    if (bump) {
      cartCount.classList.remove("bump");
      void cartCount.offsetWidth;
      cartCount.classList.add("bump");
    }
  }

  function cartIndex(id, kind) {
    return cart.findIndex(function (l) {
      return l.id === id && l.kind === kind;
    });
  }

  function addToCart(id, kind, fromEl) {
    if (cartIndex(id, kind) === -1) cart.push({ id: id, kind: kind, days: 1 });
    saveCart();
    updateCartCount(true);
    if (currentOpenItem) renderProductCart(currentOpenItem);
    addSound();
    var target = cartTarget();
    // catalog: threads fly to the header bag, then the bar appears; product view: just the bar
    if (target.rising) showCartToast();
    else setTimeout(showCartToast, threadsToCart(fromEl, target));
  }

  // ---- "Added to your cart": a bar at the bottom (also over the product view) with View cart ----
  var cartToast = document.getElementById("cart-toast");
  var toastTimer = 0;
  function showCartToast() {
    cartToast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      cartToast.classList.remove("show");
    }, 6000);
  }
  document.getElementById("cart-toast-open").addEventListener("click", function () {
    cartToast.classList.remove("show");
    openCart();
  });

  // Adding to the cart: two threads twisted round each other travel along a soft arc from the
  // button into the cart — the header bag in the catalog, the bag on the bottom bar in the product
  // view — drawn as they go and pulled through after, like thread through a needle's eye.
  // Normal pace (about 1.4 s), not a flash. Skipped for reduced motion.
  function cartTarget() {
    var header = document.getElementById("cart-open");
    var r = header.getBoundingClientRect();
    var overlayOpen = !overlay.classList.contains("translate-x-full");
    if (!overlayOpen && r.width && r.bottom > 0) return { el: header, rect: r };
    var icon = document.getElementById("cart-toast-icon");
    return { el: icon, rect: icon.getBoundingClientRect(), rising: true };
  }

  function threadsToCart(fromEl, target) {
    if (!fromEl || reduceGalleryMotion || !document.body.animate) return 0;
    var a = fromEl.getBoundingClientRect();
    var b = target.rect;
    var p0 = [a.left + a.width / 2, a.top + a.height / 2];
    var p3 = [b.left + b.width / 2, b.top + b.height / 2 - (target.rising ? 14 : 0)];
    // a soft S-curve that stays on screen: out to the side from the button, then up into the bag
    // from below (the cart is near the top in the catalog, near the bottom in the product view)
    var dy = p3[1] - p0[1];
    var side = (p3[0] >= p0[0] ? 1 : -1) * Math.min(160, Math.abs(p3[0] - p0[0]) * 0.35 + 60);
    var p1 = [p0[0] + side, p0[1] + dy * 0.15];
    var p2 = [p3[0] - side * 0.4, p3[1] - dy * 0.45];
    p1[1] = Math.max(16, Math.min(window.innerHeight - 16, p1[1]));
    p2[1] = Math.max(16, Math.min(window.innerHeight - 16, p2[1]));
    function bez(t, i) {
      var u = 1 - t;
      return u * u * u * p0[i] + 3 * u * u * t * p1[i] + 3 * u * t * t * p2[i] + t * t * t * p3[i];
    }
    // two strands twisted round the arc (offset along its normal), the twist fading at both ends
    function strand(phase, turns, amp) {
      var d = "", n = 90;
      for (var k = 0; k <= n; k++) {
        var t = k / n, e = 0.001;
        var x = bez(t, 0), y = bez(t, 1);
        var dx = bez(Math.min(1, t + e), 0) - bez(Math.max(0, t - e), 0);
        var dy = bez(Math.min(1, t + e), 1) - bez(Math.max(0, t - e), 1);
        var len = Math.sqrt(dx * dx + dy * dy) || 1;
        var off = amp * Math.sin(Math.PI * t) * Math.sin(phase + t * Math.PI * 2 * turns);
        d += (k ? "L" : "M") + (x - (dy / len) * off).toFixed(1) + " " + (y + (dx / len) * off).toFixed(1);
      }
      return d;
    }
    var NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "thread-layer");
    document.body.appendChild(svg);
    var duration = 1400;
    [[0, "#A48F66", 1.1], [Math.PI, "#C9B48A", 0.9], [Math.PI / 2, "#2E2C29", 0.5]].forEach(function (s, i) {
      var path = document.createElementNS(NS, "path");
      path.setAttribute("d", strand(s[0], 4.5, i === 2 ? 3 : 7));
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", s[1]);
      path.setAttribute("stroke-width", String(s[2]));
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("opacity", i === 2 ? "0.45" : "0.95");
      svg.appendChild(path);
      var len = path.getTotalLength();
      var seg = len * 0.42; // a length of thread travelling along the arc
      path.style.strokeDasharray = seg + " " + (len + seg);
      path.animate([{ strokeDashoffset: seg }, { strokeDashoffset: -len }], {
        duration: duration, delay: i * 40, easing: "cubic-bezier(.55, 0, .25, 1)", fill: "forwards",
      });
    });
    setTimeout(function () {
      target.el.classList.remove("cart-catch");
      void target.el.offsetWidth;
      target.el.classList.add("cart-catch");
    }, duration - 120);
    setTimeout(function () {
      svg.remove();
    }, duration + 200);
    return duration;
  }

  // Sound: a short, soft "added" cue — a muted tap and a light two-note confirmation, very quiet.
  var audioCtx = null;
  function addSound() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      var ctx = audioCtx, now = ctx.currentTime + 0.01;
      var master = ctx.createGain();
      master.gain.value = 0.5;
      var lp = ctx.createBiquadFilter();
      lp.type = "lowpass"; lp.frequency.value = 3200;
      master.connect(lp); lp.connect(ctx.destination);
      [[880, 0, 0.05], [1318.5, 0.075, 0.04]].forEach(function (n) {
        var t = now + n[1];
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "triangle"; o.frequency.value = n[0];
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(n[2], t + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
        o.connect(g); g.connect(master);
        o.start(t); o.stop(t + 0.3);
      });
    } catch (e) {
      /* no Web Audio: silent */
    }
  }

  function lineAmount(item, line) {
    if (line.kind === "buy") return item.price || null;
    return item.rent_price ? item.rent_price * line.days : null;
  }

  // Buttons in the product view: Buy / Rent depending on the item's mode.
  function renderProductCart(item) {
    var box = document.getElementById("product-cart");
    var kinds = cartKinds(item);
    var cta = document.getElementById("product-cta");
    cta.classList.toggle("hidden", !kinds.length); // made to order: the big button below is the fitting
    if (!kinds.length) {
      box.innerHTML = '<a href="#contact" class="pdp-btn primary js-pdp-cta"><span>' + esc(t("cta_book_quote", "Book a Fitting or Request a Quote")) + "</span></a>";
      return;
    }
    box.innerHTML = kinds
      .map(function (kind, i) {
        var label = kinds.length === 1 && kind === "buy" ? t("add_to_cart", "Add to Cart") : t("add_" + kind, kind);
        var amount = kind === "buy"
          ? (item.price ? formatAmount(item.price) : "")
          : (item.rent_price ? formatAmount(item.rent_price) + t("per_day", " / day") : "");
        var inCart = cartIndex(item.id, kind) !== -1;
        return (
          '<button type="button" class="pdp-btn ' + (i === 0 ? "primary" : "secondary") + (inCart ? " in js-view-cart" : " js-add-cart") +
          '" data-kind="' + kind + '"><span>' + esc(inCart ? t("in_cart", "In your cart ✓") : label) + "</span>" +
          (amount ? '<span class="amt">' + esc(amount) + "</span>" : "") + "</button>"
        );
      })
      .join("");
  }

  document.getElementById("product-cart").addEventListener("click", function (e) {
    var add = e.target.closest(".js-add-cart");
    if (add && currentOpenItem) addToCart(currentOpenItem.id, add.getAttribute("data-kind"), add);
    if (e.target.closest(".js-view-cart")) openCart();
    if (e.target.closest(".js-pdp-cta")) {
      e.preventDefault();
      document.getElementById("product-cta").click();
    }
  });

  function renderCart() {
    var list = itemsByLang[cardLang] || items;
    if (list.length) {
      // Forget items that no longer exist on the site.
      cart = cart.filter(function (l) {
        return findItem(items, l.id);
      });
    }
    var total = 0;
    cartLinesEl.innerHTML = cart
      .map(function (line, i) {
        var item = findItem(list, line.id);
        if (!item) return "";
        var amount = lineAmount(item, line);
        total += amount || 0;
        var thumb = mainPhoto(item);
        var days = line.kind === "rent"
          ? '<div class="flex items-center gap-2 mt-2 text-xs text-ink/60">' +
            '<button type="button" class="qty-btn js-days" data-i="' + i + '" data-d="-1">−</button>' +
            '<span class="min-w-[3.5rem] text-center">' + line.days + " " + esc(t(line.days === 1 ? "cart_day" : "cart_days", "days")) + "</span>" +
            '<button type="button" class="qty-btn js-days" data-i="' + i + '" data-d="1">+</button></div>'
          : "";
        return (
          '<li class="cart-line flex gap-4 py-4" style="--i:' + i + '">' +
          '<div class="w-16 h-20 shrink-0 bg-cream-dark overflow-hidden">' +
          (thumb ? '<img src="' + smallUrl(thumb) + '" alt="" class="w-full h-full object-cover">' : "") +
          "</div>" +
          '<div class="flex-1 min-w-0">' +
          (item.mode === "Both"
            ? '<div class="kind-switch" role="group">' +
              ["buy", "rent"].map(function (k) {
                return '<button type="button" class="js-kind' + (line.kind === k ? " on" : "") + '" data-i="' + i + '" data-k="' + k + '">' +
                  esc(t(k === "buy" ? "cart_buy_label" : "cart_rent_label", k)) + "</button>";
              }).join("") + "</div>"
            : '<p class="text-xs text-gold">' + esc(t(line.kind === "buy" ? "cart_buy_label" : "cart_rent_label", "")) + "</p>") +
          '<p class="font-serif text-lg text-charcoal leading-snug truncate">' + esc(item.name) + "</p>" +
          days +
          '<button type="button" class="js-remove text-[11px] text-ink/45 hover:text-charcoal underline underline-offset-2 mt-2" data-i="' + i + '">' + esc(t("cart_remove", "Remove")) + "</button>" +
          "</div>" +
          '<p class="text-sm text-charcoal whitespace-nowrap">' + (amount ? formatAmount(amount) : esc(t("price_on_request", "Price on request"))) + "</p>" +
          "</li>"
        );
      })
      .join("");
    var empty = !cart.length;
    document.getElementById("cart-empty").classList.toggle("hidden", !empty || !cartDoneHidden());
    cartForm.classList.toggle("hidden", empty);
    document.getElementById("cart-total").textContent = total ? formatAmount(total) : "—";
    updateCartCount();
  }

  function cartDoneHidden() {
    return document.getElementById("cart-done").classList.contains("hidden");
  }

  cartLinesEl.addEventListener("click", function (e) {
    var btn = e.target.closest(".js-days, .js-remove, .js-kind");
    if (!btn) return;
    var i = parseInt(btn.getAttribute("data-i"), 10);
    if (btn.classList.contains("js-kind")) {
      var kind = btn.getAttribute("data-k");
      if (cart[i].kind === kind) return;
      var other = cartIndex(cart[i].id, kind);
      if (other !== -1) {
        cart.splice(i, 1); // that option is already in the cart: keep just the one line
      } else {
        cart[i].kind = kind;
        cart[i].days = cart[i].days || 1;
      }
    } else if (btn.classList.contains("js-remove")) {
      cart.splice(i, 1);
    } else {
      cart[i].days = Math.max(1, Math.min(60, cart[i].days + parseInt(btn.getAttribute("data-d"), 10)));
    }
    saveCart();
    renderCart();
    if (currentOpenItem) renderProductCart(currentOpenItem);
  });

  function openCart() {
    document.getElementById("cart-done").classList.add("hidden");
    cartStatus.classList.add("hidden");
    renderCart();
    // opening: a gold stitch runs down the panel's edge and the lines arrive one by one
    cartPanel.classList.add("opening");
    setTimeout(function () {
      cartPanel.classList.remove("opening");
    }, 1400);
    document.body.classList.add("cart-open");
    document.body.style.overflow = "hidden";
  }

  function closeCart() {
    document.body.classList.remove("cart-open");
    if (overlay.classList.contains("translate-x-full")) document.body.style.overflow = "";
  }

  document.getElementById("cart-open").addEventListener("click", openCart);
  document.getElementById("cart-close").addEventListener("click", closeCart);
  document.getElementById("cart-backdrop").addEventListener("click", closeCart);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && document.body.classList.contains("cart-open")) {
      e.stopImmediatePropagation();
      closeCart();
    }
  }, true);

  cartForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var data = Object.fromEntries(new FormData(cartForm).entries());
    data.items = cart;
    var btn = cartForm.querySelector("button[type=submit]");
    btn.disabled = true;
    cartStatus.classList.add("hidden");
    fetch("/api/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
      .then(function (res) {
        return res.json();
      })
      .then(function (body) {
        if (!body.ok) throw new Error(body.error || "error");
        cart = [];
        saveCart();
        cartForm.reset();
        renderCart();
        document.getElementById("cart-done-text").textContent = t("cart_sent", "Thank you!").replace("{n}", body.number || "");
        document.getElementById("cart-done").classList.remove("hidden");
        document.getElementById("cart-empty").classList.add("hidden");
        if (currentOpenItem) renderProductCart(currentOpenItem);
      })
      .catch(function (err) {
        var key = { name_contact: "required_error", busy: "busy_error" }[err.message] || "send_error";
        cartStatus.textContent = t(key, "Something went wrong. Please try again.");
        cartStatus.className = "text-sm text-center text-red-700";
      })
      .then(function () {
        btn.disabled = false;
      });
  });

  updateCartCount();
})();
