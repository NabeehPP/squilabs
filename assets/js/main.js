/* ==========================================================================
   SQUILABS — main.js
   Vanilla JS only. Modular, defensive (checks elements exist before wiring).
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initSidebar();
  initRipple();
  initReveal();
  initCounters();
  initFaq();
  initProjectFilters();
  initBlogFilters();
  initContactForm();
  initYear();
});

/* --------------------------------------------------------------------------
   Sidebar: desktop collapse + mobile drawer
   -------------------------------------------------------------------------- */
function initSidebar() {
  const sidebar = document.querySelector(".sidebar");
  const collapseBtn = document.querySelector(".sidebar-collapse-btn");
  const mobileBtn = document.querySelector(".mobile-menu-btn");
  const scrim = document.querySelector(".sidebar-scrim");
  if (!sidebar) return;

  // Desktop collapse — persisted for the session
  if (collapseBtn) {
    const stored = sessionStorage.getItem("squilabs-sidebar-collapsed");
    if (stored === "true") sidebar.classList.add("is-collapsed");

    collapseBtn.addEventListener("click", () => {
      sidebar.classList.toggle("is-collapsed");
      sessionStorage.setItem(
        "squilabs-sidebar-collapsed",
        sidebar.classList.contains("is-collapsed")
      );
    });
  }

  // Mobile drawer
  if (mobileBtn && scrim) {
    const open = () => {
      sidebar.classList.add("is-open");
      scrim.classList.add("is-visible");
    };
    const close = () => {
      sidebar.classList.remove("is-open");
      scrim.classList.remove("is-visible");
    };
    mobileBtn.addEventListener("click", open);
    scrim.addEventListener("click", close);
    sidebar.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", close);
    });
  }
}

/* --------------------------------------------------------------------------
   Button ripple effect
   -------------------------------------------------------------------------- */
function initRipple() {
  document.querySelectorAll(".btn").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      const rect = this.getBoundingClientRect();
      const ripple = document.createElement("span");
      const size = Math.max(rect.width, rect.height);
      ripple.className = "ripple";
      ripple.style.width = ripple.style.height = size + "px";
      ripple.style.left = e.clientX - rect.left - size / 2 + "px";
      ripple.style.top = e.clientY - rect.top - size / 2 + "px";
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    });
  });
}

/* --------------------------------------------------------------------------
   Fade-in on scroll (IntersectionObserver)
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

  items.forEach((el, i) => {
    // stagger children of grids that opt in via .reveal-stagger wrapper
    el.style.setProperty("--i", el.dataset.i || 0);
    observer.observe(el);
  });
}

/* --------------------------------------------------------------------------
   Animated counters — triggers once each stat scrolls into view
   -------------------------------------------------------------------------- */
function initCounters() {
  const counters = document.querySelectorAll("[data-counter]");
  if (!counters.length) return;

  const animate = (el) => {
    const target = parseFloat(el.dataset.counter);
    const suffix = el.dataset.suffix || "";
    const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals, 10) : 0;
    const duration = 1400;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const value = target * eased;
      el.textContent = value.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(decimals) + suffix;
    };
    requestAnimationFrame(step);
  };

  if (!("IntersectionObserver" in window)) {
    counters.forEach(animate);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach((el) => observer.observe(el));
}

/* --------------------------------------------------------------------------
   FAQ accordion
   -------------------------------------------------------------------------- */
function initFaq() {
  document.querySelectorAll(".faq-item").forEach((item) => {
    const question = item.querySelector(".faq-question");
    const answer = item.querySelector(".faq-answer");
    if (!question || !answer) return;

    question.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");

      // close siblings within the same faq list for a clean accordion feel
      const list = item.closest(".faq-list");
      if (list) {
        list.querySelectorAll(".faq-item.is-open").forEach((openItem) => {
          if (openItem !== item) {
            openItem.classList.remove("is-open");
            openItem.querySelector(".faq-answer").style.maxHeight = null;
          }
        });
      }

      item.classList.toggle("is-open", !isOpen);
      answer.style.maxHeight = !isOpen ? answer.scrollHeight + "px" : null;
    });
  });
}

/* --------------------------------------------------------------------------
   Projects page: sliding-indicator category filter
   -------------------------------------------------------------------------- */
function initProjectFilters() {
  const buttons = document.querySelectorAll("[data-filter]");
  const cards = document.querySelectorAll("[data-category]");
  if (!buttons.length || !cards.length) return;
 
  const track = document.querySelector("[data-segmented-filter]");
  const indicator = document.querySelector("[data-segmented-indicator]");
 
  // Slide the pill indicator under whichever button is active, sized and
  // positioned to that button's own box (not a fixed width).
  function moveIndicator(btn) {
    if (!track || !indicator) return;
    const trackRect = track.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    indicator.style.width = `${btnRect.width}px`;
    indicator.style.transform = `translateX(${btnRect.left - trackRect.left}px)`;
  }
 
  const activeBtn = document.querySelector("[data-filter].is-active") || buttons[0];
  // Measure after layout has settled (fonts, etc.) rather than on load.
  requestAnimationFrame(() => moveIndicator(activeBtn));
 
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      moveIndicator(btn);
      const filter = btn.dataset.filter;
 
      cards.forEach((card) => {
        const match = filter === "all" || card.dataset.category === filter;
        card.style.display = match ? "" : "none";
      });
    });
  });
 
  // Keep the indicator aligned if the layout reflows (e.g. window resize).
  window.addEventListener("resize", () => {
    const current = document.querySelector("[data-filter].is-active");
    if (current) moveIndicator(current);
  });
}

/* --------------------------------------------------------------------------
   Blog page: search + category filter
   -------------------------------------------------------------------------- */
function initBlogFilters() {
  const searchInput = document.querySelector("[data-blog-search]");
  const catButtons = document.querySelectorAll("[data-blog-cat]");
  const cards = document.querySelectorAll("[data-blog-card]");
  if (!cards.length) return;

  let activeCat = "all";

  const applyFilters = () => {
    const query = (searchInput ? searchInput.value : "").trim().toLowerCase();
    cards.forEach((card) => {
      const title = card.dataset.title.toLowerCase();
      const cat = card.dataset.blogCard;
      const matchesCat = activeCat === "all" || cat === activeCat;
      const matchesQuery = !query || title.includes(query);
      card.style.display = matchesCat && matchesQuery ? "" : "none";
    });
  };

  if (searchInput) searchInput.addEventListener("input", applyFilters);

  catButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      catButtons.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      activeCat = btn.dataset.blogCat;
      applyFilters();
    });
  });
}

/* --------------------------------------------------------------------------
   Contact form — front-end only demo submit
   -------------------------------------------------------------------------- */
function initContactForm() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;
  const status = form.querySelector(".form-status");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector("button[type='submit']");
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Sending…";
    submitBtn.disabled = true;

    setTimeout(() => {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      if (status) {
        status.textContent = "Message received — we reply within one business day.";
        status.classList.add("is-visible");
      }
      form.reset();
    }, 900);
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

/* --------------------------------------------------------------------------
float effect for buttons
   -------------------------------------------------------------------------- */
document.querySelectorAll(".tag").forEach((tag) => {

    const xTo = gsap.quickTo(tag, "x", {
        duration: 0.45,
        ease: "power3.out"
    });

    const yTo = gsap.quickTo(tag, "y", {
        duration: 0.45,
        ease: "power3.out"
    });

    const rotateTo = gsap.quickTo(tag, "rotation", {
        duration: 0.45,
        ease: "power3.out"
    });

    const scaleTo = gsap.quickTo(tag, "scale", {
        duration: 0.35,
        ease: "power2.out"
    });

    tag.addEventListener("mouseenter", () => {
        scaleTo(1.04);
    });

    tag.addEventListener("mousemove", (e) => {

        const rect = tag.getBoundingClientRect();

        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        xTo(x * 0.28);
        yTo(y * 0.28);

        rotateTo(x * 0.05);
    });

    tag.addEventListener("mouseleave", () => {

        xTo(0);
        yTo(0);
        rotateTo(0);
        scaleTo(1);

    });

});