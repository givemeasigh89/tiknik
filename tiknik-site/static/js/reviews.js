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

  // ---- Reviews: one at a time ----
  // A spread: the client's photo large, her words beside it, the dress she wore. Under it, a row of
  // everyone who wrote (their photo or the dress's), so it's clear there are more and any can be opened.
  // Arrows, the row, keys and a swipe on the photo move between reviews; the photo opens the review whole.
  var reviews = [];
  var cur = 0;
  var curPhoto = 0;

  function initial(name) {
    return (String(name).trim()[0] || "·").toUpperCase();
  }

  // The picture for a review: her own photo, else the dress she's writing about.
  function pictureOf(r) {
    if (r.photos.length) return { src: photoUrl(r.photos[0]), dress: false };
    if (r.item_photo) return { src: "/static/img/products/" + encodeURIComponent(r.item_photo), dress: true };
    return null;
  }

  var L_ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>';
  var R_ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>';

  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function build() {
    track.innerHTML =
      '<div class="rvx-strip" role="tablist">' +
      reviews
        .map(function (r, i) {
          var pic = pictureOf(r);
          return '<button type="button" class="rvx-thumb" role="tab" data-i="' + i + '" aria-label="' + esc(r.name) + '">' +
            (pic ? '<img src="' + pic.src + '" alt="" loading="lazy">' : '<span class="rvx-initial">' + esc(initial(r.name)) + "</span>") +
            '<span class="rvx-thumb-name">' + esc(r.name) + "</span></button>";
        })
        .join("") +
      "</div>" +
      '<div class="rvx-stage">' +
      '<button type="button" class="rvx-photo" aria-label="' + esc(t("review_more", "Read more")) + '"><img alt=""><span class="rvx-caption"></span><span class="rvx-dots"></span></button>' +
      '<div class="rvx-text" aria-live="polite">' +
      '<p class="rvx-quote"></p>' +
      '<button type="button" class="rvx-more" hidden>' + esc(t("review_more", "Read more")) + "</button>" +
      '<p class="rvx-name"></p>' +
      '<a class="rvx-dress" href="#"></a>' +
      '<div class="rvx-nav">' +
      '<button type="button" class="rv-arrow rvx-prev" aria-label="' + esc(t("prev", "Previous")) + '">' + L_ARROW + "</button>" +
      '<span class="rvx-count"></span>' +
      '<button type="button" class="rv-arrow rvx-next" aria-label="' + esc(t("next", "Next")) + '">' + R_ARROW + "</button>" +
      "</div></div></div>";
  }

  function show(i, dir) {
    cur = (i + reviews.length) % reviews.length;
    curPhoto = 0;
    var r = reviews[cur];
    var stage = track.querySelector(".rvx-stage");
    var pic = pictureOf(r);
    stage.classList.toggle("no-pic", !pic);
    stage.classList.remove("is-in");
    stage.style.setProperty("--dir", dir || 1);
    var img = stage.querySelector(".rvx-photo img");
    var apply = function () {
      if (pic) img.src = pic.src;
      stage.querySelector(".rvx-caption").textContent = pic && pic.dress && r.item ? t("review_dress_photo", "Dress: {name}").replace("{name}", r.item) : "";
      stage.querySelector(".rvx-dots").innerHTML = r.photos.length > 1 ? new Array(r.photos.length + 1).join("<i></i>") : "";
      var q = stage.querySelector(".rvx-quote");
      q.textContent = r.text;
      q.classList.toggle("is-short", r.text.length < 160);
      stage.querySelector(".rvx-name").textContent = r.name;
      var dress = stage.querySelector(".rvx-dress");
      dress.hidden = !r.item;
      if (r.item) {
        dress.setAttribute("href", "#item-" + r.item_id);
        dress.innerHTML = "<span>" + esc(t("review_dress", "View the dress")) + "</span> <b>" + esc(r.item) + "</b>";
      }
      stage.querySelector(".rvx-count").textContent = pad(cur + 1) + " / " + pad(reviews.length);
      requestAnimationFrame(function () {
        stage.querySelector(".rvx-more").hidden = q.scrollHeight <= q.clientHeight + 2;
        stage.classList.add("is-in");
      });
    };
    // Let the old one fade before the new one comes in (the first time, straight away).
    if (stage.dataset.ready) {
      setTimeout(apply, reducedMotion ? 0 : 220);
    } else {
      stage.dataset.ready = "1";
      apply();
    }
    track.querySelectorAll(".rvx-thumb").forEach(function (b, k) {
      b.classList.toggle("is-active", k === cur);
      b.setAttribute("aria-selected", k === cur ? "true" : "false");
    });
    var active = track.querySelector(".rvx-thumb.is-active");
    var strip = track.querySelector(".rvx-strip");
    if (active && strip.scrollWidth > strip.clientWidth) {
      strip.scrollTo({ left: active.offsetLeft - strip.clientWidth / 2 + active.offsetWidth / 2, behavior: reducedMotion ? "auto" : "smooth" });
    }
  }

  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function render() {
    document.getElementById("reviews-empty").classList.toggle("hidden", reviews.length > 0);
    track.classList.toggle("hidden", !reviews.length);
    if (!reviews.length) return;
    build();
    track.classList.toggle("single", reviews.length < 2);
    show(0);
  }

  if (track) {
    track.addEventListener("click", function (e) {
      if (e.target.closest(".rvx-prev")) return show(cur - 1, -1);
      if (e.target.closest(".rvx-next")) return show(cur + 1, 1);
      var thumb = e.target.closest(".rvx-thumb");
      if (thumb) {
        var k = parseInt(thumb.getAttribute("data-i"), 10);
        if (k !== cur) show(k, k > cur ? 1 : -1);
        return;
      }
      if (e.target.closest(".rvx-photo, .rvx-more")) openReview(cur);
    });
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") show(cur - 1, -1);
      if (e.key === "ArrowRight") show(cur + 1, 1);
    });
    // Swipe across the review on phones.
    var sx = null;
    var sy = null;
    track.addEventListener("touchstart", function (e) {
      if (!e.target.closest(".rvx-stage")) return;
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
    }, { passive: true });
    track.addEventListener("touchend", function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      var dy = e.changedTouches[0].clientY - sy;
      sx = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) show(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
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
