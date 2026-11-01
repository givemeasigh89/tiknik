// Motion layer (GSAP). Loaded only while "Animations" is on in /admin; the site works the same
// without it. Everything is set up inside one gsap.matchMedia() handler, so visitors who ask
// their system for reduced motion get none of it, and mm.revert() undoes all of it.
//
//   1. Product view: the card's photo flies into the large photo (FLIP), and back on close.
//   2. "How it works": the section pins and page scroll turns the key through the photos.
//   3. Hero: the photo and the line under it reveal on load; the photo drifts slower than the page.
//   4. A gold thread sewn down the left margin from About to the fitting form as the page scrolls.
//
// Kept deliberately few: motion that answers what the visitor does, plus one moment on arrival.
// (Headings rising word by word and the catalog arriving in a wave were tried and taken out —
// effects on every section read as a template. They're in git history before tag before-review.)
(function () {
  "use strict";

  var root = document.documentElement;
  if (!window.gsap || !window.ScrollTrigger) {
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  var header = document.querySelector("header");
  var headerHeight = function () {
    return header ? header.offsetHeight : 0;
  };

  var mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", function () {
    root.classList.add("motion");
    var cleanups = [];

    // ---------------------------------------------------------------- 3. Hero
    var hero = document.querySelector(".hero-bg");
    var intro = document.getElementById("intro");
    if (hero) {
      var heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
      // The photo is visible from the first moment (it's the page's main picture); it only settles in.
      heroTl.fromTo(hero, { scale: 1.06 }, { scale: 1, duration: 1.8, ease: "power2.out" });
      if (intro) heroTl.from(intro.children, { y: 26, autoAlpha: 0, stagger: 0.12, duration: 0.9 }, "-=1.2");
      // Parallax: the photo moves slower than the page as it scrolls away.
      gsap.to(hero, {
        yPercent: 16,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
      });
    }

    // The catalog changes height when its tab changes: trigger positions below it move.
    var onCatalog = function () {
      refreshSoon();
    };
    document.addEventListener("tiknik:catalog-rendered", onCatalog);
    cleanups.push(function () {
      document.removeEventListener("tiknik:catalog-rendered", onCatalog);
    });

    // ---------------------------------------------------------------- 2. Process ring on scroll
    var process = document.getElementById("process");
    var ring = window.TiknikProcess;
    if (process && ring) {
      ring.setAutoplay(false);
      var span = (ring.photos - 1) * ring.stepDegrees; // 0° → the last photo
      ScrollTrigger.create({
        trigger: process,
        start: function () {
          return "top " + headerHeight() + "px";
        },
        end: function () {
          return "+=" + Math.round(window.innerHeight * 1.8);
        },
        pin: true,
        anticipatePin: 1,
        snap: { snapTo: 1 / (ring.photos - 1), duration: { min: 0.2, max: 0.6 }, delay: 0.08, ease: "power1.inOut" },
        onUpdate: function (self) {
          ring.turnTo(self.progress * span);
        },
      });
      cleanups.push(function () {
        ring.setAutoplay(true);
      });
    }

    // ---------------------------------------------------------------- 1. Product view
    var overlay = document.getElementById("product-overlay");
    var mainWrap = document.getElementById("product-main-image-wrap");
    var mainImage = document.getElementById("product-main-image");
    var detailEls = [
      "#product-category", "#product-name", "#product-price", "#product-dial",
      "#product-attrs", "#product-description", "#product-cart", "#product-cta",
    ]
      .map(function (s) {
        return document.querySelector(s);
      })
      .filter(Boolean);
    var thumbs = document.getElementById("product-thumbs");

    function visibleRect(el) {
      if (!el) return null;
      var r = el.getBoundingClientRect();
      var onScreen = r.width > 0 && r.bottom > headerHeight() && r.top < window.innerHeight;
      return onScreen ? r : null;
    }

    // A photo that travels from rect `from` to rect `to`: the clone is laid out at its final
    // place and size, then transformed back to where it starts (FLIP) and released.
    // The photo currently showing in a card (cards with several photos slide a strip of them).
    function cardImage(media) {
      var box = media.getBoundingClientRect();
      var best = null;
      media.querySelectorAll("img").forEach(function (img) {
        var r = img.getBoundingClientRect();
        if (Math.abs(r.left - box.left) < 2 && img.currentSrc) best = img;
      });
      return best;
    }

    function flyPhoto(src, from, to, duration, onDone) {
      var clone = document.createElement("img");
      clone.src = src;
      clone.alt = "";
      clone.className = "motion-fly";
      gsap.set(clone, { left: to.left, top: to.top, width: to.width, height: to.height });
      document.body.appendChild(clone);
      return gsap.from(clone, {
        x: from.left - to.left,
        y: from.top - to.top,
        scaleX: from.width / to.width,
        scaleY: from.height / to.height,
        transformOrigin: "0 0",
        duration: duration,
        ease: "power3.inOut",
        onComplete: function () {
          if (onDone) onDone(clone);
          else clone.remove();
        },
      });
    }

    // Keep the flown photo on top until the large photo has loaded, then fade it away.
    function handOver(clone) {
      var done = false;
      var finish = function () {
        if (done) return;
        done = true;
        gsap.set(mainWrap, { clearProps: "opacity,visibility" });
        gsap.to(clone, { autoAlpha: 0, duration: 0.35, onComplete: function () { clone.remove(); } });
      };
      if (mainImage.complete && mainImage.naturalWidth) finish();
      else {
        mainImage.addEventListener("load", finish, { once: true });
        setTimeout(finish, 2500);
      }
    }

    function revealDetails(delay) {
      gsap.fromTo(
        detailEls,
        { y: 26, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.7, ease: "power3.out", stagger: 0.06, delay: delay, clearProps: "transform,opacity,visibility" }
      );
      if (thumbs) {
        gsap.fromTo(thumbs.children, { autoAlpha: 0, x: 16 }, { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.04, delay: delay + 0.1, clearProps: "all" });
      }
    }

    function onProductOpen(e) {
      var d = e.detail || {};
      if (!d.wasClosed) {
        // Prev / next item inside the view: a soft cross-fade.
        gsap.fromTo(mainWrap, { autoAlpha: 0.2 }, { autoAlpha: 1, duration: 0.5, ease: "power2.out", clearProps: "opacity,visibility" });
        revealDetails(0);
        return;
      }
      overlay.scrollTop = 0;
      gsap.fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45, ease: "power2.out", clearProps: "opacity,visibility" });
      var from = d.source && visibleRect(d.source);
      var hasPhoto = !mainImage.classList.contains("hidden") && mainImage.getAttribute("src");
      var shown = from && cardImage(d.source);
      if (from && hasPhoto && shown) {
        gsap.set(mainWrap, { autoAlpha: 0 });
        flyPhoto(shown.currentSrc, from, mainWrap.getBoundingClientRect(), 0.8, handOver);
        revealDetails(0.3);
      } else {
        gsap.fromTo(mainWrap, { scale: 1.04, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.9, ease: "power3.out", clearProps: "transform,opacity,visibility" });
        revealDetails(0.15);
      }
    }
    document.addEventListener("tiknik:product-open", onProductOpen);

    window.TiknikMotion = {
      // Called by main.js before the product view hides; `done` finishes the close.
      closeProduct: function (id, done) {
        var card = id != null && document.querySelector('#catalog-grid [data-id="' + id + '"] .card-media');
        var to = visibleRect(card);
        var hasPhoto = !mainImage.classList.contains("hidden") && mainImage.getAttribute("src");
        var finish = function () {
          done();
          gsap.set(overlay, { clearProps: "all" });
        };
        if (to && hasPhoto) {
          var from = mainWrap.getBoundingClientRect();
          gsap.to(overlay, { autoAlpha: 0, duration: 0.4, ease: "power2.out" });
          flyPhoto(mainImage.src, from, to, 0.7, function (clone) {
            clone.remove();
            finish();
          });
        } else {
          gsap.to(overlay, { autoAlpha: 0, y: 24, duration: 0.35, ease: "power2.in", onComplete: finish });
        }
      },
    };
    cleanups.push(function () {
      document.removeEventListener("tiknik:product-open", onProductOpen);
      delete window.TiknikMotion;
    });

    // ---------------------------------------------------------------- 4. The thread
    // One gold thread runs down the left margin from "About" to the fitting form, sewn as the page
    // scrolls: a tiny needle leads it, it loops a stitch at each section's heading and ties a knot
    // at the end. The scroll is the needle: the story is sewn together as it's read.
    var threadSections = ["about", "reviews", "delivery", "contact"]
      .map(function (id) {
        return document.getElementById(id);
      })
      .filter(Boolean);
    var thread = null;
    function buildThread() {
      if (thread) thread.layer.remove();
      thread = null;
      if (threadSections.length < 2) return;
      var NS = "http://www.w3.org/2000/svg";
      var docTop = function (el) {
        return el.getBoundingClientRect().top + window.scrollY;
      };
      var vw = document.documentElement.clientWidth;
      var inner = threadSections[0].querySelector(".max-w-\\[1180px\\]") || threadSections[0];
      var margin = Math.max(0, inner.getBoundingClientRect().left);
      var mx = vw < 640 ? 9 : Math.max(18, Math.min(margin * 0.45, 90)); // the thread's lane
      var amp = vw < 640 ? 3 : Math.min(14, mx * 0.35); // how far it wanders
      var y0 = docTop(threadSections[0]) + 40;
      var last = threadSections[threadSections.length - 1];
      var yEnd = docTop(last) + Math.min(last.offsetHeight * 0.45, 260);

      // points down the lane, wandering gently, with a loop at each heading
      var d = "M" + mx + " " + y0;
      var y = y0;
      var side = 1;
      threadSections.forEach(function (sec, i) {
        var h = sec.querySelector("h2") || sec;
        var hy = Math.max(y + 40, docTop(h) + h.offsetHeight / 2);
        if (i === threadSections.length - 1) hy = Math.min(hy, yEnd - 40);
        // wander down to the heading in soft S-bends
        var steps = Math.max(1, Math.round((hy - y) / 260));
        for (var k = 1; k <= steps; k++) {
          var ny = y + ((hy - y) * k) / steps;
          var cy = (ny - (y + ((hy - y) * (k - 1)) / steps)) / 2;
          d += " C" + (mx + amp * side) + " " + (ny - cy * 1.4) + " " + (mx + amp * side) + " " + (ny - cy * 0.6) + " " + mx + " " + ny;
          side = -side;
        }
        // a stitch loop: out to the right and round
        var r = vw < 640 ? 4 : 8;
        d += " c" + r * 1.6 + " " + -r * 0.2 + " " + r * 1.8 + " " + r * 1.6 + " " + r * 0.6 + " " + r * 1.7 +
             " c" + -r * 1.1 + " " + r * 0.1 + " " + -r * 1.1 + " " + -r * 1.2 + " " + -r * 0.6 + " " + -r * 0.5;
        y = hy + r * 0.5;
      });
      if (yEnd > y + 20) d += " C" + (mx - amp) + " " + (y + (yEnd - y) * 0.4) + " " + (mx + amp) + " " + (y + (yEnd - y) * 0.7) + " " + mx + " " + yEnd;

      var top = Math.floor(y0 - 20);
      var layer = document.createElementNS(NS, "svg");
      layer.setAttribute("class", "page-thread");
      layer.setAttribute("aria-hidden", "true");
      layer.style.top = top + "px";
      layer.style.height = Math.ceil(yEnd - top + 30) + "px";
      layer.setAttribute("viewBox", "0 " + top + " " + vw + " " + Math.ceil(yEnd - top + 30));
      var path = document.createElementNS(NS, "path");
      path.setAttribute("d", d);
      path.setAttribute("class", "page-thread-line");
      var knot = document.createElementNS(NS, "circle");
      knot.setAttribute("class", "page-thread-knot");
      knot.setAttribute("cx", mx); knot.setAttribute("cy", yEnd); knot.setAttribute("r", vw < 640 ? 2.2 : 3);
      var needle = document.createElementNS(NS, "line");
      needle.setAttribute("class", "page-thread-needle");
      layer.appendChild(path); layer.appendChild(knot); layer.appendChild(needle);
      document.body.appendChild(layer);

      // length along the thread for each height, so the tip can follow the reader
      var len = path.getTotalLength();
      var samples = [];
      for (var s = 0; s <= 400; s++) {
        var p = path.getPointAtLength((len * s) / 400);
        samples.push([p.y, (len * s) / 400]);
      }
      path.style.strokeDasharray = len + " " + len;
      thread = { layer: layer, path: path, needle: needle, knot: knot, len: len, samples: samples, yEnd: yEnd };
      drawThread();
    }
    function lengthAt(yy) {
      var best = 0;
      for (var i = 0; i < thread.samples.length; i++) {
        if (thread.samples[i][0] <= yy) best = Math.max(best, thread.samples[i][1]);
      }
      return best;
    }
    var shown = 0;
    function drawThread() {
      if (!thread) return;
      var target = lengthAt(window.scrollY + window.innerHeight * 0.62);
      shown = target; // follows the reader both ways
      thread.path.style.strokeDashoffset = String(thread.len - shown);
      var tip = thread.path.getPointAtLength(Math.max(0, shown));
      var back = thread.path.getPointAtLength(Math.max(0, shown - 1.5));
      var ang = Math.atan2(tip.y - back.y, tip.x - back.x);
      var nl = window.innerWidth < 640 ? 9 : 15;
      thread.needle.setAttribute("x1", tip.x); thread.needle.setAttribute("y1", tip.y);
      thread.needle.setAttribute("x2", tip.x + Math.cos(ang) * nl); thread.needle.setAttribute("y2", tip.y + Math.sin(ang) * nl);
      var done = shown >= thread.len - 1;
      thread.needle.style.opacity = shown > 2 && !done ? "1" : "0";
      thread.knot.style.opacity = done ? "1" : "0";
    }
    var threadRaf = 0;
    function onThreadScroll() {
      if (threadRaf) return;
      threadRaf = requestAnimationFrame(function () {
        threadRaf = 0;
        drawThread();
      });
    }
    window.addEventListener("scroll", onThreadScroll, { passive: true });
    ScrollTrigger.addEventListener("refresh", buildThread);
    cleanups.push(function () {
      window.removeEventListener("scroll", onThreadScroll);
      ScrollTrigger.removeEventListener("refresh", buildThread);
      if (thread) thread.layer.remove();
    });

    // Layout changes after load (images, reviews, fonts) move trigger positions: refresh, debounced.
    var refreshTimer = 0;
    function refreshSoon() {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(function () {
        ScrollTrigger.refresh();
      }, 150);
    }
    window.addEventListener("load", refreshSoon);
    var lastHeight = 0;
    var ro = window.ResizeObserver &&
      new ResizeObserver(function () {
        var h = document.body.scrollHeight;
        if (Math.abs(h - lastHeight) > 40) {
          lastHeight = h;
          refreshSoon();
        }
      });
    if (ro) ro.observe(document.body);

    return function () {
      root.classList.remove("motion");
      window.removeEventListener("load", refreshSoon);
      if (ro) ro.disconnect();
      cleanups.forEach(function (fn) {
        fn();
      });
    };
  });

})();
