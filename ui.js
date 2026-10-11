/* ACE Websites — UI behaviour
   Sticky-header state, scroll progress, one-shot reveals,
   active nav link, mobile menu. No dependencies.
   Everything degrades to a plain, fully visible page if this fails. */

(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* --- header state + scroll progress ---------------------------------- */

  var header = document.querySelector(".site-header");
  var ticking = false;

  function updateScrollState() {
    var y = window.scrollY || document.documentElement.scrollTop || 0;
    var max = document.documentElement.scrollHeight - window.innerHeight;

    header.classList.toggle("is-scrolled", y > 8);
    header.style.setProperty("--p", max > 0 ? Math.min(y / max, 1) : 0);
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

  if (!("IntersectionObserver" in window) || reduceMotion.matches) {
    revealables.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    var revealObserver = new IntersectionObserver(
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

  /* --- showcase: two-finger scroll stops the marquee ------------------- */

  var showcase = document.querySelector(".showcase-wrap");
  if (showcase) {
    showcase.addEventListener(
      "scroll",
      function () {
        showcase.classList.add("is-user-scrolled");
      },
      { passive: true }
    );
  }
})();
