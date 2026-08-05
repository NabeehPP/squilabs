/* ==========================================================================
   SQUILABS — premium-home.js
   Motion layer for the redesigned homepage only. Vanilla JS, no
   dependencies. Every function checks its own elements exist first, so
   this file is safe to include on pages that don't have every section.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initNavScroll();
  initMobileNav();
  initReveal();
  initMagnetic();
  initMouseGlow();
  initParallax();
  initMarqueeClone();
  initTestimonialRotator();
  initWorkFilter();
  initYear();
});

/* --------------------------------------------------------------------------
   Floating nav: solidify background + shadow once the page has scrolled
   past the hero glow, so it reads clearly over any section behind it.
   -------------------------------------------------------------------------- */
function initNavScroll() {
  const nav = document.getElementById("navFloat");
  if (!nav) return;

  const onScroll = () => {
    nav.classList.toggle("is-scrolled", window.scrollY > 40);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* --------------------------------------------------------------------------
   Mobile nav: full-screen overlay, staggered link entrance handled by CSS
   transition-delay set inline per link.
   -------------------------------------------------------------------------- */
function initMobileNav() {
  const burger = document.getElementById("navBurger");
  const overlay = document.getElementById("navOverlay");
  if (!burger || !overlay) return;

  const links = overlay.querySelectorAll("a");
  links.forEach((link, i) => {
    link.style.transitionDelay = `${i * 60}ms`;
  });

  function open() {
    overlay.classList.add("is-open");
    document.body.classList.add("nav-locked");
  }
  function close() {
    overlay.classList.remove("is-open");
    document.body.classList.remove("nav-locked");
  }

  burger.addEventListener("click", () => {
    overlay.classList.contains("is-open") ? close() : open();
  });
  links.forEach((link) => link.addEventListener("click", close));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

/* --------------------------------------------------------------------------
   Fade-up reveal on scroll, staggered via the --i custom property already
   set inline on each element in the HTML.
   -------------------------------------------------------------------------- */
function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  items.forEach((el) => observer.observe(el));
}

/* --------------------------------------------------------------------------
   Magnetic buttons: elements pull gently toward the cursor while it's
   within a small radius around them, and spring back on leave. Skipped
   entirely for reduced-motion and on coarse (touch) pointers, where a
   hover-based effect has no meaning.
   -------------------------------------------------------------------------- */
function initMagnetic() {
  const targets = document.querySelectorAll("[data-magnetic]");
  if (!targets.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  if (reduceMotion || isCoarsePointer) return;

  const strength = 0.35; // fraction of the offset actually applied

  targets.forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      const offsetX = e.clientX - (rect.left + rect.width / 2);
      const offsetY = e.clientY - (rect.top + rect.height / 2);
      el.style.transform = `translate(${offsetX * strength}px, ${offsetY * strength}px)`;
    });
    el.addEventListener("mouseleave", () => {
      el.style.transform = "translate(0, 0)";
    });
  });
}

/* --------------------------------------------------------------------------
   Mouse-reactive glow in the hero: updates CSS custom properties rather
   than inline background position, so the actual paint stays on the
   compositor and doesn't jank the scroll.
   -------------------------------------------------------------------------- */
function initMouseGlow() {
  const hero = document.getElementById("heroPremium");
  const glow = document.getElementById("heroGlow2");
  if (!hero || !glow) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  let ticking = false;
  let lastX = 0;
  let lastY = 0;

  hero.addEventListener("mousemove", (e) => {
    const rect = hero.getBoundingClientRect();
    lastX = ((e.clientX - rect.left) / rect.width) * 100;
    lastY = ((e.clientY - rect.top) / rect.height) * 100;
    if (!ticking) {
      requestAnimationFrame(() => {
        glow.style.setProperty("--mx", `${lastX}%`);
        glow.style.setProperty("--my", `${lastY}%`);
        ticking = false;
      });
      ticking = true;
    }
  });
}

/* --------------------------------------------------------------------------
   Soft parallax on the hero's deck-fan cards while scrolling — a subtle
   depth cue, capped and throttled to rAF so it stays smooth.
   -------------------------------------------------------------------------- */
function initParallax() {
  const fan = document.querySelector(".deck-fan");
  if (!fan) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  let ticking = false;

  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const offset = Math.min(window.scrollY * 0.12, 60);
        fan.style.transform = `translate(-50%, calc(-50% + ${offset}px))`;
        ticking = false;
      });
    },
    { passive: true }
  );
}

/* --------------------------------------------------------------------------
   Marquee: duplicate the track content once so the CSS scroll animation
   (translateX 0 → -50%) loops seamlessly with no visible seam.
   -------------------------------------------------------------------------- */
function initMarqueeClone() {
  const track = document.querySelector("[data-marquee-track]");
  if (!track) return;
  track.innerHTML += track.innerHTML;
}

/* --------------------------------------------------------------------------
   Testimonial rotator: crossfades between slides, auto-advances, pauses
   on hover/focus, and supports direct navigation via the dots.
   -------------------------------------------------------------------------- */
function initTestimonialRotator() {
  const root = document.getElementById("testimonialRotator");
  if (!root) return;

  const slides = Array.from(root.querySelectorAll("[data-slide]"));
  const dotsWrap = root.querySelector("[data-testimonial-dots]");
  if (!slides.length || !dotsWrap) return;

  let index = 0;
  let timer = null;
  const interval = 6000;

  const dots = slides.map((_, i) => {
    const dot = document.createElement("button");
    dot.setAttribute("aria-label", `Show testimonial ${i + 1}`);
    if (i === 0) dot.classList.add("is-active");
    dot.addEventListener("click", () => goTo(i));
    dotsWrap.appendChild(dot);
    return dot;
  });

  function goTo(i) {
    slides[index].classList.remove("is-active");
    dots[index].classList.remove("is-active");
    index = (i + slides.length) % slides.length;
    slides[index].classList.add("is-active");
    dots[index].classList.add("is-active");
  }

  function start() {
    stop();
    timer = setInterval(() => goTo(index + 1), interval);
  }
  function stop() {
    if (timer) clearInterval(timer);
  }

  root.addEventListener("mouseenter", stop);
  root.addEventListener("mouseleave", start);
  root.addEventListener("focusin", stop);
  root.addEventListener("focusout", start);

  start();
}

/* --------------------------------------------------------------------------
   Featured work filter: toggles which work cards are visible based on the
   active filter pill. Purely presentational — filtering happens client
   side against each card's data-category attribute.
   -------------------------------------------------------------------------- */
function initWorkFilter() {
  const bar = document.getElementById("workFilterBar");
  const grid = document.getElementById("workGrid");
  if (!bar || !grid) return;

  const buttons = Array.from(bar.querySelectorAll("[data-filter]"));
  const cards = Array.from(grid.querySelectorAll("[data-category]"));
  const empty = document.getElementById("workEmpty");

  function applyFilter(filter) {
    let visibleCount = 0;
    cards.forEach((card) => {
      const match = filter === "all" || card.dataset.category === filter;
      card.classList.toggle("is-hidden", !match);
      if (match) visibleCount++;
    });
    if (empty) empty.hidden = visibleCount !== 0;
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      applyFilter(btn.dataset.filter);
    });
  });
}

/* --------------------------------------------------------------------------
   Footer year
   -------------------------------------------------------------------------- */
function initYear() {
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
}
