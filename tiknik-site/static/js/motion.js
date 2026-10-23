// Motion layer (GSAP). Loaded only while "Animations" is on in /admin; the site works the same
// without it. Everything is set up inside one gsap.matchMedia() handler, so visitors who ask
// their system for reduced motion get none of it, and mm.revert() undoes all of it.
//
//   1. Product view: the card's photo flies into the large photo (FLIP), and back on close.
//   2. Section headings rise in word by word (SplitText) as they scroll into view.
//   3. Catalog cards arrive in a soft wave (ScrollTrigger.batch).
//   4. "How it works": the section pins and page scroll turns the key through the photos.
//   5. Hero: the photo and logo strip reveal on load; the photo drifts slower than the page.
(function () {
  "use strict";

  var root = document.documentElement;
  if (!window.gsap || !window.ScrollTrigger || !window.SplitText) {
    root.classList.remove("motion-boot");
    return;
  }
  gsap.registerPlugin(ScrollTrigger, SplitText);

  var header = document.querySelector("header");
  var headerHeight = function () {
    return header ? header.offsetHeight : 0;
  };

  var mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", function () {
    root.classList.add("motion");
    var cleanups = [];

    // ---------------------------------------------------------------- 5. Hero
    var hero = document.querySelector(".hero-bg");
    var intro = document.getElementById("intro");
    root.classList.remove("motion-boot");
    if (hero) {
      var heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
      heroTl.fromTo(hero, { autoAlpha: 0, scale: 1.08 }, { autoAlpha: 1, scale: 1, duration: 1.8, ease: "power2.out" });
      if (intro) heroTl.from(intro.children, { y: 26, autoAlpha: 0, stagger: 0.12, duration: 0.9 }, "-=1.2");
      // Parallax: the photo moves slower than the page as it scrolls away.
      gsap.to(hero, {
        yPercent: 16,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
      });
    }

    // ---------------------------------------------------------------- 3. Catalog cards
    var grid = document.getElementById("catalog-grid");
    var cardTriggers = [];
    function animateCards(reason) {
      cardTriggers.forEach(function (t) {
        t.kill();
      });
      cardTriggers = [];
      if (!grid || reason === "currency") return; // same cards, new prices: no wave
      var cards = Array.prototype.slice.call(grid.children);
      if (!cards.length) return;
      gsap.set(cards, { autoAlpha: 0, y: 46 });
      cardTriggers = ScrollTrigger.batch(cards, {
        start: "top 94%",
        once: true,
        onEnter: function (batch) {
          gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.85, ease: "power3.out", stagger: 0.09, overwrite: true, clearProps: "transform" });
        },
      });
    }
    function onCatalog(e) {
      animateCards(e.detail && e.detail.reason);
      refreshSoon();
    }
    document.addEventListener("tiknik:catalog-rendered", onCatalog);
    cleanups.push(function () {
      document.removeEventListener("tiknik:catalog-rendered", onCatalog);
      gsap.set(grid ? grid.children : [], { clearProps: "all" });
    });

    // ---------------------------------------------------------------- 4. Process ring on scroll
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

    // ---------------------------------------------------------------- 2. Headings, word by word
    var splits = [];
    function splitHeadings() {
      var headings = document.querySelectorAll(
        "#catalog h2, #process h2, #about h2, #reviews h2, #delivery h2, #contact h2"
      );
      headings.forEach(function (h) {
        splits.push(
          SplitText.create(h, {
            type: "words,lines",
            mask: "lines",
            autoSplit: true,
            onSplit: function (self) {
              return gsap.from(self.words, {
                yPercent: 115,
                duration: 0.95,
                ease: "power4.out",
                stagger: 0.06,
                scrollTrigger: { trigger: h, start: "top 88%", once: true },
              });
            },
          })
        );
      });
      // The small gold line above each heading and the About text follow a beat later.
      var followers = gsap.utils.toArray("#about .order-2 > :not(h2)");
      headings.forEach(function (h) {
        var eyebrow = h.previousElementSibling;
        if (eyebrow && eyebrow.matches("p.text-gold")) followers.push(eyebrow);
      });
      followers.forEach(function (el) {
        gsap.from(el, {
          y: 18,
          autoAlpha: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        });
      });
      ScrollTrigger.sort(); // created after the pin above: keep refresh order top-to-bottom
      refreshSoon();
    }
    // Split once the web fonts are in, so the lines break where they finally will.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(splitHeadings);
    else splitHeadings();
    cleanups.push(function () {
      splits.forEach(function (s) {
        s.revert();
      });
    });

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
          if (onDone) onDone();
          clone.remove();
        },
      });
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
      if (from && hasPhoto) {
        gsap.set(mainWrap, { autoAlpha: 0 });
        flyPhoto(mainImage.src, from, mainWrap.getBoundingClientRect(), 0.8, function () {
          gsap.set(mainWrap, { clearProps: "opacity,visibility" });
        });
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
          flyPhoto(mainImage.src, from, to, 0.7, finish);
        } else {
          gsap.to(overlay, { autoAlpha: 0, y: 24, duration: 0.35, ease: "power2.in", onComplete: finish });
        }
      },
    };
    cleanups.push(function () {
      document.removeEventListener("tiknik:product-open", onProductOpen);
      delete window.TiknikMotion;
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

  // Reduced motion (or anything above failing): never leave the hero hidden.
  root.classList.remove("motion-boot");
})();
