/* ACE Websites — UI behaviour
   Sticky-header state, scroll reveals, active nav link, mobile menu.
   No dependencies. Everything degrades to a plain, fully visible page
   if this fails. */

(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* --- header state ---------------------------------------------------- */

  var header = document.querySelector(".site-header");
  var ticking = false;

  function updateScrollState() {
    var y = window.scrollY || document.documentElement.scrollTop || 0;

    header.classList.toggle("is-scrolled", y > 8);
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateScrollState);
    },
    { passive: true }
  );
  window.addEventListener("resize", updateScrollState);
  updateScrollState();

  /* --- snappier in-page scrolling -------------------------------------- */

  var scrollFrame = null;

  function headerOffset() {
    var h = document.querySelector(".site-header");
    return (h ? h.offsetHeight : 0) + 14;
  }

  document.addEventListener("click", function (event) {
    if (event.defaultPrevented || !event.target.closest) return;
    var link = event.target.closest('a[href^="#"]');
    if (!link) return;

    var hash = link.getAttribute("href");
    if (!hash || hash === "#") return;

    var target = document.querySelector(hash);
    if (!target) return;

    event.preventDefault();

    var startY = window.scrollY || document.documentElement.scrollTop || 0;
    var endY = Math.max(0, target.getBoundingClientRect().top + startY - headerOffset());
    var maxY = document.documentElement.scrollHeight - window.innerHeight;
    if (endY > maxY) endY = maxY;

    if (scrollFrame !== null) {
      window.cancelAnimationFrame(scrollFrame);
      scrollFrame = null;
    }

    if (reduceMotion.matches || Math.abs(endY - startY) < 2) {
      window.scrollTo(0, endY);
    } else {
      var distance = Math.abs(endY - startY);
      var duration = Math.min(650, Math.max(300, 300 + distance * 0.12));
      var startTime = null;

      var step = function (now) {
        if (startTime === null) startTime = now;
        var progress = Math.min((now - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        window.scrollTo(0, startY + (endY - startY) * eased);
        scrollFrame = progress < 1 ? window.requestAnimationFrame(step) : null;
      };
      scrollFrame = window.requestAnimationFrame(step);
    }

    if (window.history.pushState) window.history.pushState(null, "", hash);
  });

  /* --- scroll reveals -------------------------------------------------- */

  var GROUPS = [
    ".hero",
    ".section-head",
    ".grid-3",
    ".service-list",
    ".includes",
    ".steps",
    ".faq",
    ".contact-panel",
  ];

  GROUPS.forEach(function (selector) {
    document.querySelectorAll(selector).forEach(function (group) {
      Array.prototype.forEach.call(group.children, function (child, index) {
        child.classList.add("reveal");
        child.style.setProperty("--d", Math.min(index, 5));
      });
    });
  });

  var revealables = document.querySelectorAll(".reveal");
  var revealObserver = null;

  if (!("IntersectionObserver" in window) || reduceMotion.matches) {
    revealables.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.05 }
    );

    revealables.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* Re-run the fade-in when the page is restored from the back/forward
     cache (e.g. returning from a sample site), so it plays on every
     visit, not just the first. */

  window.addEventListener("pageshow", function (event) {
    if (!event.persisted) return;
    revealables.forEach(function (el) {
      el.classList.remove("is-visible");
    });
    if (revealObserver) {
      revealables.forEach(function (el) {
        revealObserver.observe(el);
      });
    } else {
      revealables.forEach(function (el) {
        el.classList.add("is-visible");
      });
    }
  });

  /* --- active nav link ------------------------------------------------- */

  var navLinks = document.querySelectorAll('.nav a[href^="#"], .nav-menu a[href^="#"]');

  if ("IntersectionObserver" in window) {
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var hash = "#" + entry.target.id;
          navLinks.forEach(function (link) {
            link.classList.toggle("is-active", link.getAttribute("href") === hash);
          });
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );

    document.querySelectorAll("main section[id]").forEach(function (section) {
      navObserver.observe(section);
    });
  }

  /* --- mobile menu ----------------------------------------------------- */

  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("nav-menu");

  if (toggle && menu) {
    function setMenu(open) {
      menu.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    }

    toggle.addEventListener("click", function () {
      setMenu(!menu.classList.contains("is-open"));
    });

    menu.addEventListener("click", function (event) {
      if (event.target.closest("a")) setMenu(false);
    });

    document.addEventListener("click", function (event) {
      if (!menu.classList.contains("is-open")) return;
      if (event.target.closest(".nav-menu") || event.target.closest(".nav-toggle")) return;
      setMenu(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setMenu(false);
    });
  }

  /* --- showcase: auto-marquee; manual scroll loops forever too ----------- */

  var showcase = document.querySelector(".showcase-wrap");
  if (showcase) {
    var sets = showcase.querySelectorAll(".showcase-set");
    var period = 0;

    function measurePeriod() {
      period = sets.length > 1 ? sets[1].offsetLeft - sets[0].offsetLeft : 0;
    }
    measurePeriod();
    window.addEventListener("load", measurePeriod);
    window.addEventListener("resize", measurePeriod);

    var resumeTimer = null;
    showcase.addEventListener(
      "scroll",
      function () {
        /* one set + gap is identical content — jump back a period seamlessly */
        if (period > 0 && showcase.scrollLeft >= period) {
          showcase.scrollLeft -= period;
        }
        showcase.classList.add("is-user-scrolled");
        if (resumeTimer) window.clearTimeout(resumeTimer);
        resumeTimer = window.setTimeout(function () {
          resumeTimer = null;
          showcase.classList.remove("is-user-scrolled");
        }, 800);
      },
      { passive: true }
    );

    /* scrolling back past the start jumps to the twin copy so the
       browser's own wheel delta then continues from there — no hard edge */
    showcase.addEventListener(
      "wheel",
      function (event) {
        if (period <= 0) return;
        var goingBack = event.deltaX < 0 || (event.shiftKey && event.deltaY < 0);
        if (goingBack && showcase.scrollLeft <= 0) {
          showcase.scrollLeft = period;
        }
      },
      { passive: true }
    );
  }
})();
