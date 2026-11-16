// Client reviews: cards from /api/reviews (only ones approved in /admin), and the "Leave a review"
// form — name, a few words, up to three photos. Photos are scaled down in the browser before they
// are sent, so even phone camera originals upload quickly and take little space on the server.
(function () {
  "use strict";

  var track = document.getElementById("reviews-track"); // only there once a review is published

  var LANG = window.TIKNIK_LANG || "en";
  var I18N = (window.TIKNIK_I18N || {})[LANG] || {};
  var MAX_PHOTOS = 3;
  var MAX_SIDE = 1600;

  function t(key, fallback) {
    return I18N[key] || fallback;
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function photoUrl(file) {
    return "/static/img/reviews/" + encodeURIComponent(file);
  }

  // ---- Cards ----
  // Each review is a spread: its photo large, the words beside it. Long words end with "Read more";
  // the photo or "Read more" opens the review whole (all photos, the full text, the dress it's about).
  var reviews = [];

  function cardHtml(r, i) {
    var photo = r.photos.length
      ? '<button type="button" class="rv-photo js-rv-open" data-i="' + i + '" aria-label="' + esc(r.name) + '">' +
        '<img src="' + photoUrl(r.photos[0]) + '" alt="" loading="lazy">' +
        (r.photos.length > 1 ? '<span class="rv-dots">' + new Array(r.photos.length + 1).join("<i></i>") + "</span>" : "") +
        "</button>"
      : "";
    return (
      '<article class="rv' + (r.photos.length ? "" : " rv--text") + (r.text.length < 150 ? " rv--short" : "") + '">' +
      photo +
      '<div class="rv-body">' +
      '<p class="rv-quote">' + esc(r.text) + "</p>" +
      '<button type="button" class="rv-more js-rv-open" data-i="' + i + '" hidden>' + esc(t("review_more", "Read more")) + "</button>" +
      '<div class="rv-sign"><p class="rv-name">' + esc(r.name) + "</p>" +
      (r.item ? '<a href="#item-' + r.item_id + '" class="rv-item">' + esc(r.item) + "</a>" : "") +
      "</div></div></article>"
    );
  }

  var nav = document.getElementById("rv-nav");
  var count = document.getElementById("rv-count");

  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }

  // Which card is at the start of the row, for the counter and the arrows.
  function currentIndex() {
    var cards = track.children;
    var start = track.getBoundingClientRect().left + parseFloat(getComputedStyle(track).paddingLeft);
    var best = 0;
    var bestDist = Infinity;
    for (var k = 0; k < cards.length; k++) {
      var d = Math.abs(cards[k].getBoundingClientRect().left - start);
      if (d < bestDist) {
        bestDist = d;
        best = k;
      }
    }
    return best;
  }

  function updateNav() {
    if (!nav) return;
    var scrollable = track.scrollWidth > track.clientWidth + 2;
    nav.hidden = !scrollable;
    if (!scrollable) return;
    var k = currentIndex();
    count.textContent = pad(k + 1) + " / " + pad(reviews.length);
    nav.querySelector('[data-dir="-1"]').disabled = track.scrollLeft < 4;
    nav.querySelector('[data-dir="1"]').disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
  }

  // "Read more" only where the words don't fit.
  function markLong() {
    track.querySelectorAll(".rv").forEach(function (card) {
      var q = card.querySelector(".rv-quote");
      card.querySelector(".rv-more").hidden = q.scrollHeight <= q.clientHeight + 2;
    });
  }

  // Computers: a wall of reviews in columns, read left to right (the order set in /admin), the first
  // eight and then "All reviews". Phones: a row to swipe, two in view.
  var WALL_LIMIT = 8;
  var showAll = false;
  var wallCols = -1;
  var allBtn = null;

  function columnsFor(w) {
    return w >= 1100 ? 4 : w >= 768 ? 3 : 0;
  }

  function render() {
    document.getElementById("reviews-empty").classList.toggle("hidden", reviews.length > 0);
    track.classList.toggle("hidden", !reviews.length);
    var cols = columnsFor(window.innerWidth);
    wallCols = cols;
    track.classList.toggle("rv-wall", cols > 0);
    if (!cols) {
      track.innerHTML = reviews.map(cardHtml).join("");
    } else {
      var shown = showAll ? reviews.length : Math.min(WALL_LIMIT, reviews.length);
      var html = [];
      for (var c = 0; c < cols; c++) {
        var cards = "";
        for (var i = c; i < shown; i += cols) cards += cardHtml(reviews[i], i);
        html.push('<div class="rv-col">' + cards + "</div>");
      }
      track.innerHTML = html.join("");
    }
    if (!allBtn) {
      allBtn = document.createElement("button");
      allBtn.type = "button";
      allBtn.className = "rv-all";
      allBtn.addEventListener("click", function () {
        showAll = true;
        render();
      });
      track.parentNode.insertBefore(allBtn, track.nextSibling);
    }
    allBtn.textContent = t("review_all", "All reviews") + " · " + reviews.length;
    allBtn.hidden = !cols || showAll || reviews.length <= WALL_LIMIT;
    requestAnimationFrame(function () {
      markLong();
      updateNav();
    });
  }

  if (nav) nav.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-dir]");
    if (!btn) return;
    var cards = track.children;
    var k = Math.max(0, Math.min(cards.length - 1, currentIndex() + parseInt(btn.getAttribute("data-dir"), 10)));
    track.scrollTo({ left: cards[k].offsetLeft - parseFloat(getComputedStyle(track).paddingLeft) });
  });
  if (track) {
    var navTimer;
    track.addEventListener("scroll", function () {
      clearTimeout(navTimer);
      navTimer = setTimeout(updateNav, 80);
    });
  }

  // ---- One review, opened ----
  var view = document.getElementById("review-view");
  var viewImg = document.getElementById("rv-view-img");
  var viewCount = document.getElementById("rv-view-count");
  var openR = null;
  var openP = 0;

  function showPhoto(p) {
    openP = (p + openR.photos.length) % openR.photos.length;
    viewImg.style.opacity = "0";
    var src = photoUrl(openR.photos[openP]);
    var pre = new Image();
    pre.onload = pre.onerror = function () {
      viewImg.src = src;
      viewImg.style.opacity = "1";
    };
    pre.src = src;
    viewCount.textContent = openP + 1 + " / " + openR.photos.length;
  }

  function openReview(i) {
    openR = reviews[i];
    if (!openR || !view) return;
    view.classList.toggle("no-photo", !openR.photos.length);
    view.classList.toggle("one-photo", openR.photos.length < 2);
    if (openR.photos.length) showPhoto(0);
    document.getElementById("rv-view-quote").textContent = openR.text;
    document.getElementById("rv-view-name").textContent = openR.name;
    var dress = document.getElementById("rv-view-dress");
    dress.hidden = !openR.item;
    if (openR.item) {
      dress.setAttribute("href", "#item-" + openR.item_id);
      document.getElementById("rv-view-dress-name").textContent = openR.item;
    }
    if (view.showModal) view.showModal();
    else view.setAttribute("open", "");
  }

  function closeReview() {
    if (view.close) view.close();
    else view.removeAttribute("open");
  }

  if (track) track.addEventListener("click", function (e) {
    var opener = e.target.closest(".js-rv-open");
    if (opener) openReview(parseInt(opener.getAttribute("data-i"), 10));
  });
  if (view) {
    view.querySelector(".rv-close").addEventListener("click", closeReview);
    view.querySelector(".rv-view-prev").addEventListener("click", function () { showPhoto(openP - 1); });
    view.querySelector(".rv-view-next").addEventListener("click", function () { showPhoto(openP + 1); });
    view.addEventListener("keydown", function (e) {
      if (!openR || openR.photos.length < 2) return;
      if (e.key === "ArrowLeft") showPhoto(openP - 1);
      if (e.key === "ArrowRight") showPhoto(openP + 1);
    });
    // Swipe between photos on phones.
    var x0 = null;
    viewImg.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    viewImg.addEventListener("touchend", function (e) {
      if (x0 === null || !openR || openR.photos.length < 2) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) showPhoto(openP + (dx < 0 ? 1 : -1));
      x0 = null;
    });
    // "View the dress": close the review; the link itself opens the piece.
    document.getElementById("rv-view-dress").addEventListener("click", closeReview);
  }

  if (track) fetch("/api/reviews")
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      reviews = data || [];
      render();
    })
    .catch(function () {
      render();
    });
  if (track) window.addEventListener("resize", function () {
    if (reviews.length && columnsFor(window.innerWidth) !== wallCols) render();
    markLong();
    updateNav();
  });

  // ---- Form ----
  var dialog = document.getElementById("review-dialog");
  var form = document.getElementById("review-form");
  var filesInput = document.getElementById("review-files");
  var previews = document.getElementById("review-previews");
  var status = document.getElementById("review-status");
  var picked = []; // [{blob, url}]

  function openDialog(itemId) {
    status.classList.add("hidden");
    if (itemId && form.elements.item_id) form.elements.item_id.value = String(itemId);
    if (dialog.open) return;
    if (dialog.showModal) dialog.showModal();
    else dialog.setAttribute("open", "");
  }
  document.querySelectorAll(".js-review-open").forEach(function (btn) {
    btn.addEventListener("click", function () {
      openDialog();
    });
  });
  // A link to send clients: /#review opens the form, /#review-12 opens it about dress 12.
  function openFromHash() {
    var m = /^#review(?:-(\d+))?$/.exec(location.hash);
    if (m) openDialog(m[1]);
  }
  openFromHash();
  document.addEventListener("tiknik:items-ready", openFromHash);
  window.addEventListener("hashchange", openFromHash);
  form.querySelector(".js-review-close").addEventListener("click", function () {
    dialog.close();
  });
  dialog.addEventListener("click", function (e) {
    if (e.target === dialog) dialog.close();
  });

  function shrink(file) {
    if (!window.createImageBitmap) return Promise.resolve(file);
    return createImageBitmap(file)
      .then(function (bmp) {
        var scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
        var canvas = document.createElement("canvas");
        canvas.width = Math.round(bmp.width * scale);
        canvas.height = Math.round(bmp.height * scale);
        var ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
        return new Promise(function (resolve) {
          canvas.toBlob(function (blob) {
            resolve(blob || file);
          }, "image/jpeg", 0.85);
        });
      })
      .catch(function () {
        return file;
      });
  }

  function renderPreviews() {
    previews.innerHTML = picked
      .map(function (p, i) {
        return (
          '<div class="relative w-16 h-20 bg-cream-dark overflow-hidden">' +
          '<img src="' + p.url + '" class="w-full h-full object-cover" alt="">' +
          '<button type="button" class="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-charcoal/70 text-cream text-xs leading-none" data-i="' + i + '" aria-label="×">&times;</button>' +
          "</div>"
        );
      })
      .join("");
  }

  filesInput.addEventListener("change", function () {
    var files = Array.prototype.slice.call(filesInput.files, 0, MAX_PHOTOS - picked.length);
    filesInput.value = "";
    Promise.all(files.map(shrink)).then(function (blobs) {
      blobs.forEach(function (blob) {
        picked.push({ blob: blob, url: URL.createObjectURL(blob) });
      });
      renderPreviews();
    });
  });

  previews.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-i]");
    if (!btn) return;
    var removed = picked.splice(parseInt(btn.getAttribute("data-i"), 10), 1)[0];
    URL.revokeObjectURL(removed.url);
    renderPreviews();
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var data = new FormData();
    data.append("name", form.elements.name.value);
    data.append("text", form.elements.text.value);
    data.append("item_id", form.elements.item_id ? form.elements.item_id.value : "");
    data.append("website", form.elements.website.value);
    picked.forEach(function (p, i) {
      data.append("photos", p.blob, "photo-" + (i + 1) + ".jpg");
    });
    var btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    fetch("/api/review", { method: "POST", body: data })
      .then(function (res) {
        return res.json();
      })
      .then(function (body) {
        if (!body.ok) throw new Error(body.error || "error");
        form.reset();
        picked.forEach(function (p) {
          URL.revokeObjectURL(p.url);
        });
        picked = [];
        renderPreviews();
        status.textContent = t("review_thanks", "Thank you!");
        status.className = "text-sm text-center text-green-800";
        setTimeout(function () {
          if (dialog.open) dialog.close();
        }, 2800);
      })
      .catch(function (err) {
        var key = { name_text: "required_error", busy: "busy_error" }[err.message] || "send_error";
        status.textContent = t(key, "Something went wrong. Please try again.");
        status.className = "text-sm text-center text-red-700";
      })
      .then(function () {
        btn.disabled = false;
      });
  });
})();
