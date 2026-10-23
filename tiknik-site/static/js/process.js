// The "How it works" ring: the logo's key travels around the oval like a clock hand and
// the photo inside follows it — drag clockwise to go forward through the making of a piece,
// anticlockwise to go back. Photos blend into each other as the key moves, with a little
// film look (blur, grain, warm light leak) that grows with the speed of the turn.
(function () {
  "use strict";

  var ring = document.getElementById("process-ring");
  if (!ring) return;

  var photos = Array.prototype.slice.call(ring.querySelectorAll(".process-photo"));
  var frame = ring.querySelector(".process-frame");
  var grain = ring.querySelector(".process-grain");
  var leak = ring.querySelector(".process-leak");
  var svg = ring.querySelector(".process-svg");
  var marksG = svg.querySelector(".pr-marks");
  var progress = svg.querySelector(".pr-progress");
  var key = svg.querySelector(".pr-key");
  var keyFlip = key.querySelector(".pr-key-flip");
  var stageEls = Array.prototype.slice.call(document.querySelectorAll(".process-stage"));
  var chips = Array.prototype.slice.call(document.querySelectorAll(".process-chip"));

  var N = photos.length; // 12
  var STEP = 360 / N; // degrees per photo
  // Which stage each photo belongs to, and the photo each stage starts at.
  var STAGE_OF = [0, 0, 1, 1, 2, 2, 2, 3, 3, 4, 4, 4];
  var STAGE_START = [0, 2, 4, 7, 9];
  var NUMERALS = ["I", "II", "III", "IV", "V"];

  var CX = 100, CY = 120, TRACK_RX = 87.5, TRACK_RY = 107.5;
  var KEY_RX = 95.5, KEY_RY = 115.5; // the key's tip rests on the outer double line
  var NS = "http://www.w3.org/2000/svg";
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var angle = 0; // where the key is, in degrees clockwise from the top (not wrapped)
  var target = 0;
  var velocity = 0; // smoothed degrees per frame, drives the film effect
  var dragging = false;
  var running = false;
  var shownPhoto = -1;
  var shownStage = -1;

  function mod(n, m) {
    return ((n % m) + m) % m;
  }

  function pointAt(deg, rx, ry) {
    var a = (deg * Math.PI) / 180;
    return [CX + rx * Math.sin(a), CY - ry * Math.cos(a)];
  }

  // ---- Marks around the track: a numeral where each stage starts, a dot for the other photos,
  // and fine dots between them like a watch bezel. ----
  var marks = [];
  for (var i = 0; i < N; i++) {
    var p = pointAt(i * STEP, TRACK_RX, TRACK_RY);
    var stage = STAGE_START.indexOf(i);
    var el;
    if (stage !== -1) {
      el = document.createElementNS(NS, "text");
      el.setAttribute("class", "pr-num");
      el.textContent = NUMERALS[stage];
    } else {
      el = document.createElementNS(NS, "circle");
      el.setAttribute("class", "pr-dot");
      el.setAttribute("r", "1.6");
      el.setAttribute("cx", p[0].toFixed(2));
      el.setAttribute("cy", p[1].toFixed(2));
    }
    el.setAttribute("x", p[0].toFixed(2));
    el.setAttribute("y", p[1].toFixed(2));
    marksG.appendChild(el);
    marks.push(el);
    for (var f = 1; f < 4; f++) {
      var q = pointAt(i * STEP + (f * STEP) / 4, TRACK_RX, TRACK_RY);
      var fine = document.createElementNS(NS, "circle");
      fine.setAttribute("class", "pr-dot");
      fine.setAttribute("r", ".7");
      fine.setAttribute("cx", q[0].toFixed(2));
      fine.setAttribute("cy", q[1].toFixed(2));
      marksG.appendChild(fine);
    }
  }

  // ---- Drawing ----
  function render() {
    var pos = angle / STEP; // fractional photo position
    var a = mod(Math.floor(pos), N);
    var b = mod(a + 1, N);
    var frac = pos - Math.floor(pos);

    // Blend photo a into photo b, each drifting a little in the direction of travel.
    photos.forEach(function (img, i) {
      if (i === a || i === b) return;
      if (img.style.opacity !== "0") {
        img.style.opacity = "0";
        img.style.zIndex = "0";
      }
    });
    photos[a].style.opacity = "1";
    photos[a].style.zIndex = "1";
    photos[a].style.transform = "scale(1.1) translate3d(" + (-frac * 3).toFixed(2) + "%, 0, 0)";
    if (b !== a) {
      photos[b].style.opacity = frac.toFixed(3);
      photos[b].style.zIndex = "2";
      photos[b].style.transform = "scale(1.1) translate3d(" + ((1 - frac) * 3).toFixed(2) + "%, 0, 0)";
    }

    // Film look while turning: motion blur, faded colour, flickering grain, warm light leak.
    var v = Math.min(Math.abs(velocity), 12);
    frame.style.filter = v > 0.05
      ? "blur(" + (v * 0.32).toFixed(2) + "px) saturate(" + (1 - v * 0.045).toFixed(2) + ") sepia(" + (v * 0.03).toFixed(2) + ")"
      : "";
    leak.style.opacity = Math.min(0.55, v * 0.06).toFixed(3);
    grain.style.opacity = (0.07 + Math.min(0.2, v * 0.025)).toFixed(3);
    if (v > 0.05) {
      grain.style.transform = "translate(" + (Math.random() * 20 - 10).toFixed(1) + "%, " + (Math.random() * 20 - 10).toFixed(1) + "%)";
    }

    // The key: tip on the outer line, pointing in at the photo it shows.
    var k = pointAt(angle, KEY_RX, KEY_RY);
    key.setAttribute("transform", "translate(" + k[0].toFixed(2) + " " + k[1].toFixed(2) + ") rotate(" + angle.toFixed(2) + ")");

    // Gold progress line from the top round to the key.
    var sweep = mod(angle, 360);
    var d = "";
    for (var s = 0; s <= 64; s++) {
      var pt = pointAt((sweep * s) / 64, TRACK_RX + 5.5, TRACK_RY + 5.5);
      d += (s ? " L" : "M") + pt[0].toFixed(2) + " " + pt[1].toFixed(2);
    }
    progress.setAttribute("d", sweep > 0.5 ? d : "");

    // Highlight the nearest photo's mark and show its stage's text.
    var nearest = mod(Math.round(pos), N);
    if (nearest !== shownPhoto) {
      if (shownPhoto !== -1) marks[shownPhoto].classList.remove("on");
      marks[nearest].classList.add("on");
      shownPhoto = nearest;
      showStage(STAGE_OF[nearest]);
    }
  }

  function showStage(stage) {
    if (stage === shownStage) return;
    var first = shownStage === -1;
    shownStage = stage;
    stageEls.forEach(function (el, i) {
      el.classList.toggle("is-active", i === stage);
    });
    chips.forEach(function (el, i) {
      el.classList.toggle("is-active", i === stage);
    });
    // The key turns in its lock as a new stage opens.
    if (first) return;
    keyFlip.style.transform = "scaleX(-1)";
    setTimeout(function () {
      keyFlip.style.transform = "";
    }, 260);
  }

  // ---- Motion: ease the key towards its target, then stop the loop ----
  function tick() {
    var prev = angle;
    if (!dragging) {
      var diff = target - angle;
      if (Math.abs(diff) < 0.02) {
        angle = target;
      } else {
        angle += diff * (reduceMotion ? 1 : 0.075);
      }
    }
    velocity = velocity * 0.8 + (angle - prev) * 0.2;
    render();
    if (dragging || angle !== target || Math.abs(velocity) > 0.02) {
      requestAnimationFrame(tick);
    } else {
      velocity = 0;
      render();
      running = false;
    }
  }

  function wake() {
    if (!running) {
      running = true;
      requestAnimationFrame(tick);
    }
  }

  function goToPhoto(index) {
    // The nearest way round to that photo, so the key never spins the long way.
    var base = index * STEP;
    target = base + 360 * Math.round((angle - base) / 360);
    wake();
  }

  function step(dir) {
    target = Math.round(target / STEP) * STEP + dir * STEP;
    wake();
  }

  // ---- Dragging: grab the key (finger or mouse) and turn it round the oval; with a mouse the
  // photo can be dragged round too. On touch, a sideways swipe over the photo also turns it,
  // while vertical swipes there still scroll the page. ----
  function toSvg(e) {
    var pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }
  function angleOf(p) {
    return (Math.atan2((p.x - CX) / TRACK_RX, -(p.y - CY) / TRACK_RY) * 180) / Math.PI;
  }

  var drag = null;
  ring.addEventListener("pointerdown", function (e) {
    if (e.button !== undefined && e.button !== 0) return;
    var onKey = !!(e.target.closest && e.target.closest(".pr-key"));
    drag = { touch: e.pointerType === "touch" && !onKey, lastAngle: angleOf(toSvg(e)), lastX: e.clientX };
    dragging = true;
    pauseAutoplay();
    if (!drag.touch) {
      ring.setPointerCapture(e.pointerId);
      ring.classList.add("dragging");
    }
    wake();
  });
  ring.addEventListener("pointermove", function (e) {
    if (!drag) return;
    if (drag.touch) {
      angle -= (e.clientX - drag.lastX) * (360 / ring.clientWidth) * 0.35;
      drag.lastX = e.clientX;
    } else {
      var a = angleOf(toSvg(e));
      angle += mod(a - drag.lastAngle + 180, 360) - 180;
      drag.lastAngle = a;
    }
    target = angle;
  });
  function endDrag() {
    if (!drag) return;
    drag = null;
    dragging = false;
    ring.classList.remove("dragging");
    // Settle on the nearest photo, carrying a little of the throw.
    target = Math.round((angle + velocity * 6) / STEP) * STEP;
    wake();
  }
  // iOS ignores touch-action on SVG, so stop the page from scrolling when the key is grabbed.
  key.addEventListener("touchstart", function (e) {
    e.preventDefault();
  }, { passive: false });
  ring.addEventListener("pointerup", endDrag);
  ring.addEventListener("pointercancel", endDrag);

  ring.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") step(1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") step(-1);
    else return;
    e.preventDefault();
    pauseAutoplay();
  });

  document.querySelectorAll(".process-step").forEach(function (btn) {
    btn.addEventListener("click", function () {
      step(parseInt(btn.getAttribute("data-dir"), 10));
      pauseAutoplay();
    });
  });
  chips.forEach(function (chip, i) {
    chip.addEventListener("click", function () {
      goToPhoto(STAGE_START[i]);
      pauseAutoplay();
    });
  });

  // ---- Autoplay: while the section is on screen, the key moves on by itself every few
  // seconds; it pauses while someone is hovering or turning it, and resumes when they leave. ----
  var visible = false;
  var hovering = false;
  var resumeAt = 0;
  var autoplayOff = false;
  setInterval(function () {
    if (autoplayOff || reduceMotion || !visible || hovering || dragging || document.hidden || Date.now() < resumeAt) return;
    step(1);
  }, 4200);
  function pauseAutoplay() {
    resumeAt = Date.now() + 9000;
    ring.classList.add("touched"); // the key's "grab me" pulse has done its job
  }
  ring.addEventListener("mouseenter", function () {
    hovering = true;
  });
  ring.addEventListener("mouseleave", function () {
    hovering = false;
    resumeAt = Date.now() + 9000;
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
    }, { threshold: 0.4 }).observe(ring);
  }

  // For add-ons (static/js/motion.js): turn the key from page scroll instead of the timer.
  window.TiknikProcess = {
    photos: N,
    stepDegrees: STEP,
    // Ease the key to `deg`, the nearest way round from where it is now.
    turnTo: function (deg) {
      if (dragging) return;
      target = deg + 360 * Math.round((angle - deg) / 360);
      wake();
    },
    setAutoplay: function (on) {
      autoplayOff = !on;
    },
  };

  render();
})();
