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
  var I18N = window.TIKNIK_I18N || {};

  function t(key, fallback) {
    return I18N[key] || fallback;
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
    var found = (window.TIKNIK_CATEGORIES || []).find(function (c) {
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

  function formatPrice(item) {
    if (item.mode === "Custom" || !item.price) {
      return t("price_on_request", "Price on request");
    }
    var display;
    if (activeCurrency === "USD") {
      display = "$" + niceRound(item.price / RATES.USD).toLocaleString("en-US");
    } else if (activeCurrency === "RUB") {
      display = niceRound(item.price / RATES.RUB).toLocaleString("en-US") + " ₽";
    } else {
      display = item.price.toLocaleString("en-US") + " ֏";
    }
    if (item.mode === "Rent") return display + t("per_day", " / day");
    return display;
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
    render();
    // If a product detail view is open, refresh its price too.
    if (overlay && !overlay.classList.contains("translate-x-full") && currentOpenItem) {
      document.getElementById("product-price").textContent = formatPrice(currentOpenItem);
    }
  }

  currencyBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setCurrency(btn.getAttribute("data-currency"));
    });
  });

  function modeLabel(mode) {
    return t("mode_" + mode, mode);
  }

  function photoUrl(filename) {
    return "/static/img/products/" + filename;
  }

  function cardHtml(item) {
    var thumb = item.photos && item.photos.length ? item.photos[0] : null;
    var media = thumb
      ? '<img src="' + photoUrl(thumb) + '" alt="' + item.name + '" class="w-full h-full object-cover">'
      : iconSvg(item.category);
    return (
      '<div class="fade-in group border border-charcoal/15 bg-cream hover:border-charcoal/40 transition flex flex-col cursor-pointer" data-cat="' +
      item.category +
      '" data-id="' +
      item.id +
      '">' +
      '<div class="aspect-[3/4] bg-cream-dark flex items-center justify-center text-charcoal/25 group-hover:text-charcoal/40 transition relative overflow-hidden">' +
      media +
      '<span class="absolute top-2 right-2 text-[10px] tracking-wide uppercase bg-cream/90 border border-charcoal/20 text-ink/70 px-2 py-1">' +
      modeLabel(item.mode) +
      "</span>" +
      "</div>" +
      '<div class="px-4 py-3 flex-1 flex flex-col">' +
      '<p class="text-[10px] uppercase tracking-widest text-gold mb-1">' +
      categoryName(item.category) +
      "</p>" +
      '<h3 class="font-serif text-lg text-charcoal leading-snug mb-1">' +
      item.name +
      "</h3>" +
      '<p class="text-xs text-ink/60 leading-relaxed mb-3 flex-1">' +
      (item.description || "") +
      "</p>" +
      '<p class="text-sm text-charcoal font-medium">' +
      formatPrice(item) +
      "</p>" +
      "</div>" +
      "</div>"
    );
  }

  function render() {
    var filtered =
      activeCategory === "all"
        ? items
        : items.filter(function (it) {
            return it.category === activeCategory;
          });

    if (!filtered.length) {
      grid.innerHTML = "";
      emptyMsg.classList.remove("hidden");
      return;
    }
    emptyMsg.classList.add("hidden");
    grid.innerHTML = filtered.map(cardHtml).join("");
  }

  tabs.forEach(function (btn) {
    btn.addEventListener("click", function () {
      tabs.forEach(function (b) {
        b.removeAttribute("data-active");
      });
      btn.setAttribute("data-active", "true");
      activeCategory = btn.getAttribute("data-category");
      render();
    });
  });

  grid.addEventListener("click", function (e) {
    var card = e.target.closest("[data-id]");
    if (card) openProduct(parseInt(card.getAttribute("data-id"), 10));
  });

  fetch("/api/items?lang=" + encodeURIComponent(LANG))
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      items = data;
      render();
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

  function renderGalleryMain() {
    if (galleryPhotos.length) {
      mainImage.src = photoUrl(galleryPhotos[galleryIndex]);
      mainImage.classList.remove("hidden");
      mainIconWrap.classList.add("hidden");
    } else {
      mainImage.classList.add("hidden");
      mainIconWrap.classList.remove("hidden");
    }
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
      .map(function (fn, i) {
        return (
          '<button data-i="' +
          i +
          '" class="thumb-btn shrink-0 w-16 h-20 md:w-full md:h-24 overflow-hidden border transition ' +
          (i === galleryIndex ? "border-charcoal" : "border-charcoal/15 hover:border-charcoal/40") +
          '"><img src="' +
          photoUrl(fn) +
          '" class="w-full h-full object-cover" alt=""></button>'
        );
      })
      .join("");
    thumbsWrap.querySelectorAll(".thumb-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        galleryIndex = parseInt(btn.getAttribute("data-i"), 10);
        renderGalleryMain();
        renderThumbs();
      });
    });
  }

  function goTo(delta) {
    if (!galleryPhotos.length) return;
    galleryIndex = (galleryIndex + delta + galleryPhotos.length) % galleryPhotos.length;
    renderGalleryMain();
    renderThumbs();
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
    itemCounter.textContent = multi ? productIndex + 1 + " / " + productList.length : "";
  }

  function navigateProductItem(delta) {
    if (productList.length < 2) return;
    productIndex = (productIndex + delta + productList.length) % productList.length;
    openProduct(productList[productIndex].id, true);
  }

  function openProduct(id, keepList) {
    var item = items.find(function (it) {
      return it.id === id;
    });
    if (!item) return;

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

    currentOpenItem = item;
    galleryPhotos = item.photos || [];
    galleryIndex = 0;

    document.getElementById("product-category").textContent = categoryName(item.category);
    document.getElementById("product-name").textContent = item.name;
    document.getElementById("product-price").textContent = formatPrice(item);
    document.getElementById("product-description").textContent = item.description || "";
    mainIconWrap.innerHTML = iconSvg(item.category, "w-20 h-20");

    renderGalleryMain();
    renderThumbs();
    renderItemNav();

    overlay.classList.remove("translate-x-full");
    document.body.style.overflow = "hidden";
    if (location.hash !== "#item-" + id) {
      history.pushState({ item: id }, "", "#item-" + id);
    }
  }

  function closeProduct() {
    overlay.classList.add("translate-x-full");
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
  var touchStartX = null;
  mainImageWrap.addEventListener("touchstart", function (e) {
    touchStartX = e.touches[0].clientX;
  });
  mainImageWrap.addEventListener("touchend", function (e) {
    if (touchStartX === null) return;
    var dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) goTo(dx < 0 ? 1 : -1);
    touchStartX = null;
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
    if (!galleryPhotos.length) return;
    zoomImage.src = photoUrl(galleryPhotos[galleryIndex]);
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

  mainImageWrap.addEventListener("dblclick", function () {
    openZoom();
  });

  // Double-tap detection for touch devices.
  var lastTapTime = 0;
  mainImageWrap.addEventListener("touchend", function () {
    var now = Date.now();
    if (now - lastTapTime < 300) {
      openZoom();
    }
    lastTapTime = now;
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
})();
