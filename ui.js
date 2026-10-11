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
})();
