/* ==========================================================================
   SQUILABS — deck-gallery.js
   Launch Deck–style inline deck preview + optional lightbox expand.
   Vanilla JS, no dependencies.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initDeckPreview();
  initDeckGallery();
});

/* --------------------------------------------------------------------------
   Inline deck preview ([data-deck-preview])
   -------------------------------------------------------------------------- */
function initDeckPreview() {
  const preview = document.querySelector("[data-deck-preview]");
  if (!preview) return;

  const slides = Array.from(preview.querySelectorAll("[data-slide]"));
  if (!slides.length) return;

  const img = preview.querySelector("[data-deck-img]");
  const counter = preview.querySelector("[data-deck-counter]");
  const loader = preview.querySelector("[data-deck-loader]");
  const prevBtn = preview.querySelector("[data-deck-prev]");
  const nextBtn = preview.querySelector("[data-deck-next]");
  const frame = preview.querySelector(".deck-preview-frame");

  const srcs = slides.map((s) => s.src);
  const alts = slides.map((s) => s.alt || "");
  let currentIndex = 0;

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function updateCounter() {
    if (counter) {
      counter.textContent = `${pad(currentIndex + 1)} / ${pad(slides.length)}`;
    }
  }

  function showSlide(index) {
    currentIndex = (index + slides.length) % slides.length;
    img.classList.add("is-loading");

    const next = new Image();
    next.onload = () => {
      img.src = srcs[currentIndex];
      img.alt = alts[currentIndex];
      img.classList.remove("is-loading");
      if (loader) loader.classList.add("is-hidden");
    };
    next.onerror = () => {
      img.src = srcs[currentIndex];
      img.alt = alts[currentIndex];
      img.classList.remove("is-loading");
      if (loader) loader.classList.add("is-hidden");
    };
    next.src = srcs[currentIndex];

    updateCounter();
  }

  function step(delta) {
    showSlide(currentIndex + delta);
  }

  // Hide loader once first image is ready
  if (img.complete) {
    loader?.classList.add("is-hidden");
  } else {
    img.addEventListener("load", () => loader?.classList.add("is-hidden"), { once: true });
  }

  prevBtn?.addEventListener("click", () => step(-1));
  nextBtn?.addEventListener("click", () => step(1));

  preview.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });

  // Click frame to open lightbox at current slide
  frame?.addEventListener("click", () => {
    openLightbox(currentIndex);
  });

  frame?.setAttribute("tabindex", "0");
  frame?.setAttribute("role", "button");
  frame?.setAttribute("aria-label", "Open slide full size");
  frame?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openLightbox(currentIndex);
    }
  });

  updateCounter();

  /* Lightbox wired to the same slide list */
  let lightboxEl = null;

  function ensureLightbox() {
    if (lightboxEl) return lightboxEl;

    lightboxEl = document.createElement("div");
    lightboxEl.className = "lightbox";
    lightboxEl.setAttribute("data-lightbox", "");
    lightboxEl.setAttribute("aria-hidden", "true");
    lightboxEl.innerHTML = `
      <div class="lightbox-frame">
        <button class="lightbox-close" data-lightbox-close aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
        <button class="lightbox-prev" data-lightbox-prev aria-label="Previous slide">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <img data-lightbox-img src="" alt="">
        <button class="lightbox-next" data-lightbox-next aria-label="Next slide">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
        </button>
        <span class="lightbox-counter mono" data-lightbox-counter></span>
      </div>`;
    document.body.appendChild(lightboxEl);

    const lbImg = lightboxEl.querySelector("[data-lightbox-img]");
    const lbCounter = lightboxEl.querySelector("[data-lightbox-counter]");
    let lbIndex = 0;
    let lastFocused = null;

    function lbOpen(index) {
      lbIndex = (index + slides.length) % slides.length;
      lbImg.src = srcs[lbIndex];
      lbImg.alt = alts[lbIndex];
      if (lbCounter) lbCounter.textContent = `Slide ${lbIndex + 1} / ${slides.length}`;
      lastFocused = document.activeElement;
      lightboxEl.classList.add("is-open");
      document.body.classList.add("lightbox-locked");
      lightboxEl.querySelector("[data-lightbox-close]").focus();
    }

    function lbClose() {
      lightboxEl.classList.remove("is-open");
      document.body.classList.remove("lightbox-locked");
      lbImg.src = "";
      if (lastFocused) lastFocused.focus();
    }

    function lbStep(delta) {
      lbOpen(lbIndex + delta);
    }

    lightboxEl.querySelector("[data-lightbox-close]").addEventListener("click", lbClose);
    lightboxEl.querySelector("[data-lightbox-prev]").addEventListener("click", () => lbStep(-1));
    lightboxEl.querySelector("[data-lightbox-next]").addEventListener("click", () => lbStep(1));
    lightboxEl.addEventListener("click", (e) => {
      if (e.target === lightboxEl) lbClose();
    });

    document.addEventListener("keydown", (e) => {
      if (!lightboxEl.classList.contains("is-open")) return;
      if (e.key === "Escape") lbClose();
      if (e.key === "ArrowLeft") lbStep(-1);
      if (e.key === "ArrowRight") lbStep(1);
    });

    lightboxEl._open = lbOpen;
    return lightboxEl;
  }

  function openLightbox(index) {
    const lb = ensureLightbox();
    lb._open(index);
  }
}

/* --------------------------------------------------------------------------
   Legacy grid gallery ([data-deck-gallery]) — kept for backwards compat
   -------------------------------------------------------------------------- */
function initDeckGallery() {
  const gallery = document.querySelector("[data-deck-gallery]");
  const lightbox = document.querySelector("[data-lightbox]:not([data-deck-preview] *)");
  if (!gallery || !lightbox) return;

  const slides = Array.from(gallery.querySelectorAll(".deck-slide"));
  const frameImg = lightbox.querySelector("[data-lightbox-img]");
  const counter = lightbox.querySelector("[data-lightbox-counter]");
  const closeBtn = lightbox.querySelector("[data-lightbox-close]");
  const prevBtn = lightbox.querySelector("[data-lightbox-prev]");
  const nextBtn = lightbox.querySelector("[data-lightbox-next]");

  let currentIndex = 0;
  let lastFocused = null;

  const fullSrcs = slides.map((slide) => {
    const img = slide.querySelector("img");
    return img.dataset.full || img.src;
  });

  function openAt(index) {
    currentIndex = (index + slides.length) % slides.length;
    frameImg.src = fullSrcs[currentIndex];
    frameImg.alt = slides[currentIndex].querySelector("img").alt || "";
    if (counter) {
      counter.textContent = `Slide ${currentIndex + 1} / ${slides.length}`;
    }
    lastFocused = document.activeElement;
    lightbox.classList.add("is-open");
    document.body.classList.add("lightbox-locked");
    closeBtn.focus();
  }

  function close() {
    lightbox.classList.remove("is-open");
    document.body.classList.remove("lightbox-locked");
    frameImg.src = "";
    if (lastFocused) lastFocused.focus();
  }

  function step(delta) {
    openAt(currentIndex + delta);
  }

  slides.forEach((slide, index) => {
    slide.addEventListener("click", () => openAt(index));
    slide.setAttribute("tabindex", "0");
    slide.setAttribute("role", "button");
    slide.setAttribute("aria-label", `Open slide ${index + 1} of ${slides.length}`);
    slide.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openAt(index);
      }
    });
  });

  closeBtn.addEventListener("click", close);
  prevBtn.addEventListener("click", () => step(-1));
  nextBtn.addEventListener("click", () => step(1));

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) close();
  });

  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });
}
