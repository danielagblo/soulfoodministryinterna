(function () {
  document.querySelectorAll(".thumb").forEach(function (button) {
    var fire = document.createElement("span");
    fire.className = "fire";
    fire.setAttribute("aria-hidden", "true");
    button.appendChild(fire);
  });
  var COUNT = document.querySelectorAll(".slide").length;
  var nav = document.getElementById("site-nav");
  var toggle = document.querySelector(".menu-toggle");
  var live = document.getElementById("arm-live");

  function indexFromHash() {
    var raw = (location.hash || "").replace("#", "");
    if (!/^\d+$/.test(raw)) return 0;
    var index = Number(raw);
    return index >= 0 && index < COUNT ? index : 0;
  }

  function closeMenu() {
    if (!nav || !toggle) return;
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }

  function visibleCount() {
    if (window.matchMedia("(max-width: 860px)").matches) return 3;
    if (window.matchMedia("(max-width: 1100px)").matches) return 4;
    return 5;
  }

  function layoutReel(index) {
    var track = document.querySelector(".reel-track");
    if (!track) return;
    var visible = visibleCount();
    var shift = (visible - 1) / 2 - index;
    track.style.transform = "translateX(calc(" + shift + " * (var(--thumb) + var(--gap))))";
  }

  function enterScene(index) {
    var next = document.querySelector('.slide[data-index="' + index + '"]');
    if (!next) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll(".slide").forEach(function (slide) {
        slide.classList.remove("is-current", "is-leaving", "is-entering");
      });
      next.classList.add("is-current");
      return;
    }
    document.querySelectorAll(".slide").forEach(function (slide) {
      slide.classList.remove("is-entering");
      if (slide !== next && slide.classList.contains("is-current")) slide.classList.add("is-leaving");
    });
    next.classList.remove("is-leaving");
    void next.offsetWidth;
    next.classList.add("is-current", "is-entering");
    next.addEventListener("animationend", function done() {
      next.classList.remove("is-entering");
      document.querySelectorAll(".slide").forEach(function (slide) {
        if (slide !== next) slide.classList.remove("is-current", "is-leaving");
      });
    }, { once: true });
  }

  function selectScene(index, historyMode) {
    index = Number(index);
    if (index < 0 || index >= COUNT || Number.isNaN(index)) return;
    var id = String(index);
    var previous = document.documentElement.getAttribute("data-scene");
    document.documentElement.setAttribute("data-scene", id);
    var boot = document.getElementById("boot-slide");
    if (boot) boot.textContent = "";
    document.querySelectorAll("[data-select]").forEach(function (el) {
      var on = el.getAttribute("data-select") === id;
      if (el.classList.contains("thumb")) {
        if (on) el.setAttribute("aria-current", "true");
        else el.removeAttribute("aria-current");
      } else {
        el.setAttribute("aria-pressed", on ? "true" : "false");
      }
    });
    enterScene(index);
    layoutReel(index);
    mountFire();
    if (live) live.textContent = "Photo " + (index + 1) + " of " + COUNT;
    if (historyMode === "push" && previous !== id) {
      history.pushState({ scene: id }, "", index === 0 ? location.pathname + location.search : "#" + id);
    }
  }

  function step(direction) {
    var current = Number(document.documentElement.getAttribute("data-scene") || "0");
    if (Number.isNaN(current)) current = 0;
    selectScene((current + direction + COUNT) % COUNT, "push");
  }

  document.addEventListener("click", function (event) {
    var trigger = event.target.closest("[data-select]");
    if (trigger) {
      event.preventDefault();
      selectScene(trigger.getAttribute("data-select"), "push");
      closeMenu();
      return;
    }
    if (event.target.closest("[data-step]")) {
      step(Number(event.target.closest("[data-step]").getAttribute("data-step")));
    }
  });

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  if (nav) {
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a") && !event.target.closest("[data-select]")) closeMenu();
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeMenu();
  });

  var waButton = document.querySelector(".whatsapp");
  var waDialog = document.getElementById("wa-form");
  if (waButton && waDialog) {
    var waForm = waDialog.querySelector("form");
    waButton.addEventListener("click", function () {
      closeMenu();
      waDialog.showModal();
    });
    waDialog.querySelector("[data-wa-close]").addEventListener("click", function () {
      waDialog.close();
    });
    waForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = new FormData(waForm);
      var lines = waForm.getAttribute("data-wa") === "admission"
        ? [
            data.get("topic"),
            "Name: " + data.get("name"),
            "Phone: " + data.get("phone"),
            "Course: " + data.get("course"),
            "Start: " + data.get("start"),
            "Experience: " + data.get("experience"),
            "Area: " + data.get("area")
          ]
        : [
            data.get("topic"),
            "About: " + data.get("about"),
            "Name: " + data.get("name"),
            "Phone: " + data.get("phone")
          ];
      var note = String(data.get("note") || "").trim();
      if (note) lines.push("Message: " + note);
      window.open("https://wa.me/233244889424?text=" + encodeURIComponent(lines.join("\n")), "_blank", "noopener");
      waDialog.close();
    });
  }

  if (!COUNT) return;

  function mountFire() {
    var host = document.querySelector(".thumb[aria-current='true'] .fire");
    if (host && flameCanvas && host.firstChild !== flameCanvas) host.appendChild(flameCanvas);
  }

  var flameCanvas = null;

  function startFire() {
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var size = 360;
    var canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    canvas.setAttribute("aria-hidden", "true");
    var ctx = canvas.getContext("2d", { willReadFrequently: true });
    flameCanvas = canvas;
    var video = document.createElement("video");
    video.src = "images/fire-ring.mp4";
    video.muted = true;
    video.defaultMuted = true;
    video.loop = !reduce;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("aria-hidden", "true");
    video.style.cssText = "position:fixed;left:-2400px;top:0;width:360px;height:360px;pointer-events:none";
    document.body.appendChild(video);
    var frame = ctx.createImageData(size, size);
    var running = true;
    function paint() {
      if (!running || video.readyState < 2) {
        if (running) requestAnimationFrame(paint);
        return;
      }
      var ringScale = 90 / 83;
      var draw = size * ringScale;
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(video, size / 2 - 176 * ringScale, size / 2 - 184 * ringScale, draw, draw);
      var src = ctx.getImageData(0, 0, size, size).data;
      var data = frame.data;
      for (var i = 0; i < src.length; i += 4) {
        var lum = src[i];
        if (src[i + 1] > lum) lum = src[i + 1];
        if (src[i + 2] > lum) lum = src[i + 2];
        var alpha = lum <= 18 ? 0 : lum >= 52 ? 255 : ((lum - 18) * 255) / 34;
        var px = (i >> 2) % size;
        var py = (i >> 2) / size | 0;
        var dist = Math.sqrt((px - size / 2) * (px - size / 2) + (py - size / 2) * (py - size / 2));
        if (dist < 114) alpha = 0;
        else if (dist < 124) alpha *= (dist - 114) / 10;
        if (alpha > 0 && lum < 130) {
          var heat = (lum - 18) / 112;
          data[i] = 255;
          data[i + 1] = Math.max(0, Math.round(heat * 48));
          data[i + 2] = 0;
        } else {
          data[i] = src[i];
          data[i + 1] = src[i + 1];
          data[i + 2] = src[i + 2];
        }
        data[i + 3] = alpha;
      }
      ctx.putImageData(frame, 0, 0);
      if (reduce) {
        running = false;
        video.pause();
        return;
      }
      requestAnimationFrame(paint);
    }
    mountFire();
    requestAnimationFrame(paint);
    var play = video.play();
    if (play && play.catch) play.catch(function () {});
  }

  startFire();
  startStorm();

  function startStorm() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var stage = document.querySelector(".stage");
    if (!stage) return;
    var canvas = document.createElement("canvas");
    canvas.className = "storm";
    canvas.setAttribute("aria-hidden", "true");
    var reel = stage.querySelector(".reel");
    if (reel) stage.insertBefore(canvas, reel);
    else stage.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    var strikes = [];
    var wait = 0;
    var dpr = 1;
    var REF_W = 1920;
    var REF_H = 1080;

    function px(css) {
      return css * dpr;
    }

    function fit() {
      var rect = stage.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(1, Math.round(rect.width * dpr));
      var h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w;
      canvas.height = h;
      strikes.length = 0;
    }

    function split(points, displace) {
      if (displace < px(REF_H * 0.01)) return points;
      var next = [points[0]];
      for (var i = 0; i < points.length - 1; i++) {
        var a = points[i];
        var b = points[i + 1];
        var mx = (a.x + b.x) / 2 + (Math.random() - 0.5) * displace;
        var my = (a.y + b.y) / 2;
        next.push({ x: mx, y: my }, b);
      }
      return split(next, displace * 0.55);
    }

    function makeBolt(x, y, endX, endY) {
      var pts = split([{ x: x, y: y }, { x: endX, y: endY }], px(REF_W * 0.042));
      pts[0].y = 0;
      var forks = [];
      var forksWanted = 2 + Math.floor(Math.random() * 2);
      for (var n = 0; n < forksWanted; n++) {
        var at = 2 + Math.floor(Math.random() * Math.max(1, pts.length - 4));
        var from = pts[at];
        var dir = Math.random() < 0.5 ? -1 : 1;
        var drop = (endY - from.y) * (0.42 + Math.random() * 0.35);
        forks.push(split(
          [from, { x: from.x + dir * px(REF_W * (0.018 + Math.random() * 0.04)), y: from.y + drop }],
          px(REF_W * 0.022)
        ));
      }
      return { pts: pts, forks: forks };
    }

    function spawn() {
      var bolts = [];
      var count = 1 + (Math.random() < 0.45 ? 1 : 0);
      for (var i = 0; i < count; i++) {
        var x = canvas.width * (0.08 + Math.random() * 0.84);
        var endX = x + (Math.random() - 0.5) * px(REF_W * 0.1);
        var endY = px(REF_H * (0.52 + Math.random() * 0.28));
        bolts.push(makeBolt(x, 0, endX, endY));
      }
      strikes.push({ bolts: bolts, born: performance.now(), life: 420 + Math.random() * 160 });
    }

    function glow(power) {
      if (power < 0.06) return 1;
      if (power < 0.16) return 0.18;
      if (power < 0.28) return 0.92;
      return Math.max(0, 1 - (power - 0.28) / 0.72);
    }

    function strokeTaper(pts, color, width) {
      ctx.strokeStyle = color;
      for (var i = 1; i < pts.length; i++) {
        var t = i / (pts.length - 1);
        ctx.beginPath();
        ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
        ctx.lineTo(pts[i].x, pts[i].y);
        ctx.lineWidth = Math.max(0.7, width * (1 - t * 0.78));
        ctx.stroke();
      }
    }

    function paintBolt(bolt, alpha, scale) {
      var span = px(REF_W);
      strokeTaper(bolt.pts, "rgba(140, 186, 255," + (alpha * 0.55) + ")", Math.max(3.5, span * 0.0032) * scale);
      strokeTaper(bolt.pts, "rgba(244, 250, 255," + alpha + ")", Math.max(1.2, span * 0.0011) * scale);
      strokeTaper(bolt.pts, "rgba(255,255,255," + alpha + ")", Math.max(0.6, span * 0.00045) * scale);
      for (var f = 0; f < bolt.forks.length; f++) {
        var fork = bolt.forks[f];
        strokeTaper(fork, "rgba(168, 206, 255," + (alpha * 0.5) + ")", Math.max(2, span * 0.0016) * scale);
        strokeTaper(fork, "rgba(255,255,255," + alpha + ")", Math.max(0.45, span * 0.00032) * scale);
      }
    }

    function frame(now) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = strikes.length - 1; i >= 0; i--) {
        var age = (now - strikes[i].born) / strikes[i].life;
        if (age >= 1) {
          strikes.splice(i, 1);
          continue;
        }
        var alpha = glow(age);
        ctx.fillStyle = "rgba(210, 226, 255," + (alpha * 0.1) + ")";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowColor = "rgba(210, 230, 255, 0.9)";
        ctx.shadowBlur = 6 * (px(REF_W) / 1400);
        for (var b = 0; b < strikes[i].bolts.length; b++) paintBolt(strikes[i].bolts[b], alpha, 1);
        ctx.restore();
      }
      if (!strikes.length) {
        wait = window.setTimeout(function () {
          spawn();
          requestAnimationFrame(frame);
        }, 1600 + Math.random() * 2600);
        return;
      }
      requestAnimationFrame(frame);
    }

    fit();
    window.addEventListener("resize", fit);
    window.setTimeout(function () {
      spawn();
      requestAnimationFrame(frame);
    }, 700);
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "ArrowRight") step(1);
    if (event.key === "ArrowLeft") step(-1);
  });

  window.addEventListener("popstate", function () {
    selectScene(indexFromHash(), "none");
  });

  window.addEventListener("resize", function () {
    var current = Number(document.documentElement.getAttribute("data-scene") || "0");
    layoutReel(Number.isNaN(current) ? 0 : current);
  });

  selectScene(indexFromHash(), "none");
})();
