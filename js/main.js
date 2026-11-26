/* Rahul Mendigeri — portfolio interactions (vanilla JS) */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var themeToggle = document.querySelector("[data-theme-toggle]");

  /* ---------------------------------------------------------------- Theme */

  function applyTheme(theme, persist) {
    root.setAttribute("data-theme", theme);

    if (persist) {
      try {
        localStorage.setItem("theme", theme);
      } catch (error) {
        /* storage may be unavailable */
      }
    }

    if (themeToggle) {
      var isDark = theme === "dark";
      themeToggle.setAttribute("aria-pressed", String(isDark));
      themeToggle.setAttribute(
        "aria-label",
        isDark ? "Switch to light theme" : "Switch to dark theme"
      );
    }

    if (themeMeta) {
      themeMeta.setAttribute("content", theme === "dark" ? "#0a0a0a" : "#ffffff");
    }
  }

  applyTheme(root.getAttribute("data-theme") || "light", false);

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark", true);
    });
  }

  /* ------------------------------------------------- Header + scroll line */

  var header = document.querySelector(".site-header");
  var progress = document.querySelector(".scroll-progress");
  var scrollQueued = false;

  function onScrollFrame() {
    var y = window.scrollY || window.pageYOffset || 0;

    if (header) {
      header.classList.toggle("is-scrolled", y > 10);
    }

    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = "scaleX(" + (max > 0 ? Math.min(y / max, 1) : 0) + ")";
    }

    scrollQueued = false;
  }

  function requestScrollUpdate() {
    if (!scrollQueued) {
      scrollQueued = true;
      window.requestAnimationFrame(onScrollFrame);
    }
  }

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate);
  onScrollFrame();

  /* ------------------------------------------------------- Mobile menu */

  var menuToggle = document.querySelector(".nav-toggle");
  var mobileMenu = document.getElementById("mobile-menu");

  function openMenu() {
    root.classList.add("menu-open");
    if (menuToggle) {
      menuToggle.setAttribute("aria-expanded", "true");
    }
    if (mobileMenu) {
      mobileMenu.setAttribute("aria-hidden", "false");
      var firstLink = mobileMenu.querySelector("a");
      if (firstLink) {
        firstLink.focus({ preventScroll: true });
      }
    }
  }

  function closeMenu(returnFocus) {
    if (!root.classList.contains("menu-open")) {
      return;
    }

    root.classList.remove("menu-open");
    if (menuToggle) {
      menuToggle.setAttribute("aria-expanded", "false");
      if (returnFocus) {
        menuToggle.focus({ preventScroll: true });
      }
    }
    if (mobileMenu) {
      mobileMenu.setAttribute("aria-hidden", "true");
    }
  }

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", function () {
      if (root.classList.contains("menu-open")) {
        closeMenu(false);
      } else {
        openMenu();
      }
    });

    mobileMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        closeMenu(false);
      });
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeMenu(true);
    }
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth >= 992) {
      closeMenu(false);
    }
  });

  /* ----------------------------------------------------------- Scrollspy */

  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll(".nav-links .navlink[href^='#']")
  );
  var spySections = navLinks
    .map(function (link) {
      return document.querySelector(link.getAttribute("href"));
    })
    .filter(Boolean);

  if (spySections.length && "IntersectionObserver" in window) {
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }
          var id = "#" + entry.target.id;
          navLinks.forEach(function (link) {
            link.classList.toggle("is-active", link.getAttribute("href") === id);
          });
        });
      },
      { rootMargin: "-42% 0px -52% 0px", threshold: 0 }
    );

    spySections.forEach(function (section) {
      spy.observe(section);
    });
  }

  /* ------------------------------------------------------- Reveal on scroll */

  var revealItems = document.querySelectorAll("[data-reveal]");

  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    revealItems.forEach(function (item) {
      item.classList.add("is-visible");
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    revealItems.forEach(function (item) {
      revealObserver.observe(item);
    });
  }

  /* ------------------------------------------------------------ Counters */

  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var suffix = el.getAttribute("data-suffix") || "";

    if (isNaN(target)) {
      return;
    }

    if (reduceMotion.matches) {
      el.textContent = target.toFixed(decimals) + suffix;
      return;
    }

    var duration = 1500;
    var startedAt = null;

    function tick(now) {
      if (startedAt === null) {
        startedAt = now;
      }
      var progressValue = Math.min((now - startedAt) / duration, 1);
      var eased = 1 - Math.pow(1 - progressValue, 3);
      el.textContent = (target * eased).toFixed(decimals) + suffix;

      if (progressValue < 1) {
        window.requestAnimationFrame(tick);
      }
    }

    window.requestAnimationFrame(tick);
  }

  var counters = document.querySelectorAll("[data-count]");

  if (counters.length && "IntersectionObserver" in window && !reduceMotion.matches) {
    var counterObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );

    counters.forEach(function (counter) {
      counterObserver.observe(counter);
    });
  }

  /* -------------------------------------------------------- Copy email */

  var toast = document.querySelector("[data-toast]");
  var toastTimer;

  function showToast(message) {
    if (!toast) {
      return;
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2600);
  }

  function fallbackCopy(text) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (error) {
      ok = false;
    }
    area.remove();
    return ok;
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(
        function () {
          return true;
        },
        function () {
          return fallbackCopy(text);
        }
      );
    }
    return Promise.resolve(fallbackCopy(text));
  }

  document.querySelectorAll("[data-copy]").forEach(function (button) {
    button.addEventListener("click", function () {
      copyText(button.getAttribute("data-copy")).then(function (ok) {
        if (ok) {
          button.classList.add("is-copied");
          window.setTimeout(function () {
            button.classList.remove("is-copied");
          }, 2000);
          showToast("Email copied — talk soon");
        } else {
          showToast("Copy failed — email me at rahulmendigeri@gmail.com");
        }
      });
    });
  });

  /* ----------------------------------------------------- Year + local time */

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  var clock = document.querySelector("[data-clock]");
  if (clock) {
    var timeFormat = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });

    var updateClock = function () {
      clock.textContent = timeFormat.format(new Date());
    };

    updateClock();
    window.setInterval(updateClock, 30000);
  }
})();
