(function () {
  document.documentElement.classList.add("js");

  var nav = document.getElementById("site-nav");
  var toggle = document.querySelector(".menu-toggle");

  function closeMenu() {
    if (!nav || !toggle) return;
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeMenu();
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeMenu();
  });

  var gatherings = [
    { key: "sunday", name: "Revelation Service", days: [0], start: 8 * 60, end: 12 * 60 + 30 },
    { key: "counsel", name: "One-to-one counselling", days: [1, 4, 6], start: 9 * 60, end: 12 * 60 + 30 },
    { key: "evening", name: "Evening Service", days: [1, 2, 3, 4, 5, 6], start: 17 * 60 + 30, end: 20 * 60 }
  ];
  var weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function accraParts(date) {
    var fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Accra",
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    });
    var parts = {};
    fmt.formatToParts(date).forEach(function (part) {
      if (part.type !== "literal") parts[part.type] = part.value;
    });
    var name = String(parts.weekday || "").replace(/[^A-Za-z]/g, "").slice(0, 3);
    return {
      dow: { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[name],
      y: Number(parts.year),
      m: Number(parts.month),
      d: Number(parts.day),
      mins: Number(parts.hour) * 60 + Number(parts.minute)
    };
  }

  function clock(mins) {
    var h = Math.floor(mins / 60);
    var m = mins % 60;
    var suffix = h >= 12 ? "p.m." : "a.m.";
    var hour = h % 12;
    if (hour === 0) hour = 12;
    return hour + ":" + (m < 10 ? "0" : "") + m + " " + suffix;
  }

  function nextGathering(now) {
    var i;
    for (i = 0; i < gatherings.length; i += 1) {
      var current = gatherings[i];
      if (current.days.indexOf(now.dow) !== -1 && now.mins >= current.start && now.mins < current.end) {
        return {
          state: "now",
          key: current.key,
          kicker: "Happening now",
          detail: current.name + ", until " + clock(current.end)
        };
      }
    }
    var best = null;
    gatherings.forEach(function (item) {
      item.days.forEach(function (day) {
        var delta = ((day - now.dow + 7) % 7) * 1440 + item.start - now.mins;
        if (delta <= 0) delta += 7 * 1440;
        if (!best || delta < best.delta) best = { item: item, day: day, delta: delta };
      });
    });
    var today = best.day === now.dow && best.delta < 1440;
    var tomorrow = best.day === (now.dow + 1) % 7 && best.delta < 2880;
    return {
      state: "next",
      key: best.item.key,
      kicker: today ? "Today" : tomorrow ? "Tomorrow" : weekdays[best.day],
      detail: best.item.name + ", " + clock(best.item.start) + " to " + clock(best.item.end)
    };
  }

  function paintGathering() {
    var info = nextGathering(accraParts(new Date()));
    document.querySelectorAll("[data-next-kicker]").forEach(function (el) {
      el.textContent = info.kicker;
    });
    document.querySelectorAll("[data-next-detail]").forEach(function (el) {
      el.textContent = info.detail;
    });
    document.querySelectorAll("[data-gathering]").forEach(function (el) {
      var on = el.getAttribute("data-gathering") === info.key;
      el.classList.toggle("is-now", info.state === "now" && on);
      el.classList.toggle("is-next", info.state === "next" && on);
    });
  }

  if (document.querySelector("[data-next-kicker], [data-gathering]")) {
    paintGathering();
    setInterval(paintGathering, 30000);
  }

  function stamp(parts, addDays) {
    var date = new Date(Date.UTC(parts.y, parts.m - 1, parts.d + addDays));
    var month = String(date.getUTCMonth() + 1);
    var day = String(date.getUTCDate());
    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;
    return date.getUTCFullYear() + month + day;
  }

  function calendarUrl(kind) {
    var now = accraParts(new Date());
    var add = (7 - now.dow) % 7;
    var endHour = kind === "class" ? 13 * 60 : 12 * 60 + 30;
    if (add === 0 && now.mins >= endHour) add = 7;
    var day = stamp(now, add);
    var start = kind === "class" ? "T080000" : "T080000";
    var end = kind === "class" ? "T130000" : "T123000";
    var text = kind === "class"
      ? "Soul Food ICT College — Sunday class"
      : "Revelation Service — Soul Food Ministries";
    var details = kind === "class"
      ? "Sunday class, 8:00 a.m. to 1:00 p.m., once a week at Lapaz. Ask which cohort is open."
      : "Sunday, 8:00 a.m. to 12:30 p.m. at Soul Food Ministries. Ask the ministry to confirm the current week.";
    var params = new URLSearchParams({
      action: "TEMPLATE",
      text: text,
      dates: day + start + "/" + day + end,
      ctz: "Africa/Accra",
      location: "Lapaz Race Course, Container, Lapaz, Accra",
      details: details,
      recur: "RRULE:FREQ=WEEKLY;BYDAY=SU"
    });
    return "https://calendar.google.com/calendar/render?" + params.toString().replace("%2F", "/");
  }

  document.querySelectorAll("[data-calendar]").forEach(function (link) {
    link.setAttribute("href", calendarUrl(link.getAttribute("data-calendar")));
  });

  document.addEventListener("click", function (event) {
    var copy = event.target.closest("[data-copy]");
    if (!copy) return;
    var label = copy.querySelector("[data-copy-label]") || copy;
    var previous = label.textContent;
    var done = function () {
      label.textContent = "Copied";
      setTimeout(function () { label.textContent = previous; }, 1600);
    };
    var text = "Lapaz Race Course, Container, Lapaz, Accra";
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () {
        copyFallback(text, done);
      });
    } else {
      copyFallback(text, done);
    }
  });

  function copyFallback(text, done) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-999px";
    document.body.appendChild(area);
    area.select();
    try {
      if (document.execCommand("copy")) done();
    } catch (error) {
      /* Leave the label as it was. */
    }
    area.remove();
  }

  var waDialog = document.getElementById("wa-form");
  if (!waDialog) return;
  var waForm = waDialog.querySelector("form");

  document.addEventListener("click", function (event) {
    if (!event.target.closest("[data-wa-open]")) return;
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

  var motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!motion.matches) {
    var frames = [];
    document.querySelectorAll(".sheet-hero.bleed, .stage-photo, .house figure, .portrait").forEach(function (frame) {
      if (!frame.querySelector("img")) return;
      frame.classList.add("px-frame");
      frames.push(frame);
    });
    document.querySelectorAll(".gallery img").forEach(function (img) {
      var frame = document.createElement("div");
      frame.className = "px-frame" + (img.classList.contains("gallery-wide") ? " px-wide" : "");
      img.parentNode.insertBefore(frame, img);
      frame.appendChild(img);
      frames.push(frame);
    });

    var ticking = false;
    function paintParallax() {
      var viewH = window.innerHeight || 800;
      var strength = viewH < 860 ? 0.08 : 0.15;
      frames.forEach(function (frame) {
        var rect = frame.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > viewH) return;
        var fromMid = rect.top + rect.height / 2 - viewH / 2;
        var max = rect.height * 0.05;
        var shift = Math.max(-max, Math.min(max, -fromMid * strength));
        frame.style.setProperty("--py", shift.toFixed(1) + "px");
      });
      ticking = false;
    }
    function requestParallax() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(paintParallax);
    }
    paintParallax();
    window.addEventListener("scroll", requestParallax, { passive: true });
    window.addEventListener("resize", requestParallax);
  }

  var blocks = document.querySelectorAll("main > *, .site-foot > div");
  var viewH = window.innerHeight || 800;
  blocks.forEach(function (el, index) {
    el.classList.add("reveal");
    if (motion.matches || el.getBoundingClientRect().top < viewH * 0.92) {
      el.classList.add("is-in");
    } else {
      el.style.transitionDelay = (index % 4) * 80 + "ms";
    }
  });
  if (!motion.matches && "IntersectionObserver" in window) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        seen.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
    blocks.forEach(function (el) {
      if (!el.classList.contains("is-in")) seen.observe(el);
    });
  }
})();
