// Client reviews: cards from /api/reviews (only ones approved in /admin), and the "Leave a review"
// form — name, a few words, up to three photos. Photos are scaled down in the browser before they
// are sent, so even phone camera originals upload quickly and take little space on the server.
(function () {
  "use strict";

  var track = document.getElementById("reviews-track");
  if (!track) return;

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
  var reviews = [];

  function cardHtml(r, i) {
    var photo = r.photos.length
      ? '<div class="review-photo" data-i="' + i + '" data-p="0"><img src="' + photoUrl(r.photos[0]) + '" alt="" loading="lazy">' +
        (r.photos.length > 1 ? '<span class="count">1 / ' + r.photos.length + "</span>" : "") + "</div>"
      : "";
    return (
      '<article class="review-card' + (r.photos.length ? "" : " text-only") + '">' +
      photo +
      '<div class="px-6 py-6 flex-1 flex flex-col">' +
      '<span class="font-serif text-5xl leading-none text-gold/70 -mb-3 select-none" aria-hidden="true">“</span>' +
      '<p class="review-quote font-serif text-[17px] leading-relaxed text-charcoal/90 whitespace-pre-line flex-1">' + esc(r.text) + "</p>" +
      '<p class="mt-5 font-serif italic text-base text-ink/70">' + esc(r.name) + "</p>" +
      "</div></article>"
    );
  }

  function render() {
    document.getElementById("reviews-empty").classList.toggle("hidden", reviews.length > 0);
    track.classList.toggle("hidden", !reviews.length);
    track.innerHTML = reviews.map(cardHtml).join("");
    // Few cards: centre them instead of leaving them against the left edge.
    requestAnimationFrame(function () {
      track.classList.toggle("centered", track.scrollWidth <= track.clientWidth + 1);
    });
  }

  // Tapping a photo shows the review's next photo.
  track.addEventListener("click", function (e) {
    var box = e.target.closest(".review-photo");
    if (!box) return;
    var r = reviews[parseInt(box.getAttribute("data-i"), 10)];
    if (r.photos.length < 2) return;
    var p = (parseInt(box.getAttribute("data-p"), 10) + 1) % r.photos.length;
    box.setAttribute("data-p", p);
    var img = box.querySelector("img");
    img.style.opacity = "0";
    setTimeout(function () {
      img.src = photoUrl(r.photos[p]);
      img.onload = function () {
        img.style.opacity = "1";
      };
    }, 180);
    box.querySelector(".count").textContent = p + 1 + " / " + r.photos.length;
  });

  fetch("/api/reviews")
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
  window.addEventListener("resize", function () {
    track.classList.toggle("centered", track.scrollWidth <= track.clientWidth + 1);
  });

  // ---- Form ----
  var dialog = document.getElementById("review-dialog");
  var form = document.getElementById("review-form");
  var filesInput = document.getElementById("review-files");
  var previews = document.getElementById("review-previews");
  var status = document.getElementById("review-status");
  var picked = []; // [{blob, url}]

  document.getElementById("review-open").addEventListener("click", function () {
    status.classList.add("hidden");
    if (dialog.showModal) dialog.showModal();
    else dialog.setAttribute("open", "");
  });
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
