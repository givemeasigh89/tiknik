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

  // ---- Reviews: the brides ----
  // One grid of equal tiles, in the order set in /admin. A tile is her photo (or, without photos, her
  // words set large on the page) and, under it, always the start of her words in quotes, her name and
  // the dress — so it's plain each tile is a review. A tap opens it whole (all photos, full text, the dress).
  var reviews = [];
  var showAll = false;
  var moreBtn = null;

  function limit() {
    return window.innerWidth >= 768 ? 8 : 4;
  }

  function excerpt(text, n) {
    var s = String(text).replace(/\s+/g, " ").trim();
    return s.length > n ? s.slice(0, n).replace(/[\s,.;:!?)(-]+\S*$/, "") + "…" : s;
  }

  function tileHtml(r, i) {
    var media = r.photos.length
      ? '<span class="rb-media"><img src="' + photoUrl(r.photos[0]) + '" alt="" loading="lazy">' +
        '<span class="rb-read">' + esc(t("review_read", "Read the review")) + "</span></span>"
      : '<span class="rb-media rb-media--words"><span class="rb-q">' + esc(excerpt(r.text, 230)) + "</span>" +
        '<span class="rb-read">' + esc(t("review_read", "Read the review")) + "</span></span>";
    return '<button type="button" class="rb-tile" data-i="' + i + '">' + media +
      (r.photos.length ? '<span class="rb-quote">«' + esc(excerpt(r.text, 90)) + "»</span>" : "") +
      '<span class="rb-sign"><span class="rb-name">' + esc(r.name) + "</span>" +
      (r.item ? '<span class="rb-dress">' + esc(r.item) + "</span>" : "") + "</span></button>";
  }

  function render() {
    document.getElementById("reviews-empty").classList.toggle("hidden", reviews.length > 0);
    track.classList.toggle("hidden", !reviews.length);
    if (!reviews.length) return;
    var shown = showAll ? reviews.length : Math.min(limit(), reviews.length);
    track.innerHTML = '<div class="rb-grid">' + reviews.slice(0, shown).map(tileHtml).join("") + "</div>";
    if (!moreBtn) {
      moreBtn = document.createElement("button");
      moreBtn.type = "button";
      moreBtn.className = "rb-more";
      moreBtn.addEventListener("click", function () {
        showAll = true;
        render();
      });
      track.parentNode.insertBefore(moreBtn, track.nextSibling);
    }
    moreBtn.textContent = t("review_all", "All reviews") + " · " + reviews.length;
    moreBtn.hidden = showAll || reviews.length <= limit();
  }

  if (track) {
    track.addEventListener("click", function (e) {
      var tile = e.target.closest(".rb-tile");
      if (tile) openReview(parseInt(tile.getAttribute("data-i"), 10));
    });
    var lastLimit = limit();
    window.addEventListener("resize", function () {
      if (reviews.length && limit() !== lastLimit) {
        lastLimit = limit();
        render();
      }
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
