"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    Array.from(parent.querySelectorAll(selector));


  /* =========================
     LOADING SCREEN + FOOTER
  ========================= */

  const loader = $("#page-loader");
  const yearNode = $("#current-year");

  if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
  }

  let loaderHidden = false;

  function hideLoader() {
    if (!loader || loaderHidden) return;

    loaderHidden = true;
    loader.classList.add("is-hidden");

    window.setTimeout(() => loader.remove(), reducedMotion ? 0 : 500);
  }

  const MIN_LOADING_TIME = 3500;

  const loadingStartedAt = Date.now();

  function hideLoaderAfterMinimum() {
    const remaining = MIN_LOADING_TIME - (Date.now() - loadingStartedAt);

    window.setTimeout(hideLoader, Math.max(0, remaining));
  }

  window.addEventListener("load", hideLoaderAfterMinimum, { once: true });
  window.setTimeout(hideLoaderAfterMinimum, 10000);


  /* ==========================================
     CIRCULAR THEME TRANSITION
     Reveals the fully updated page from the toggle
  ========================================== */

  const themeToggle = $("#theme-toggle");
  const themeToggleLabel = $("#theme-toggle-label");
  const themeColorMeta = $("#theme-color-meta");

  let currentTheme =
    root.dataset.theme === "light" ? "light" : "dark";

  let themeBusy = false;

  function updateThemeControl(theme) {
    const isLight = theme === "light";

    const label = isLight
      ? "Switch to dark mode"
      : "Switch to light mode";

    if (themeToggle) {
      themeToggle.checked = isLight;
      themeToggle.setAttribute("aria-label", label);
    }

    if (themeToggleLabel) {
      themeToggleLabel.textContent = label;
    }

    if (themeColorMeta) {
      themeColorMeta.setAttribute(
        "content",
        isLight ? "#e0e0e0" : "#242424"
      );
    }
  }

  function applyTheme(theme) {
    currentTheme = theme;
    root.dataset.theme = theme;
    updateThemeControl(theme);

    try {
      localStorage.setItem("portfolio-theme", theme);
    } catch {
      // Theme switching remains available without local storage.
    }
  }

  // Initialize the saved theme.
  root.dataset.theme = currentTheme;
  updateThemeControl(currentTheme);

  function switchTheme(nextTheme) {
    if (themeBusy || nextTheme === currentTheme) {
      updateThemeControl(currentTheme);
      return;
    }

    // Simple fallback for reduced-motion preferences or browsers
    // that do not support the View Transition API.
    if (
      reducedMotion ||
      typeof document.startViewTransition !== "function" ||
      !themeToggle
    ) {
      applyTheme(nextTheme);
      return;
    }

    themeBusy = true;
    themeToggle.disabled = true;

    // Keep the old toggle state in the old-page snapshot.
    updateThemeControl(currentTheme);

    // Calculate the actual center of the theme switch.
    const toggleTrack = themeToggle.closest(".toggle") || themeToggle;
    const rect = toggleTrack.getBoundingClientRect();

    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Calculate a circle large enough to cover every screen corner.
    const width = window.innerWidth;
    const height = window.innerHeight;

    const radius = Math.ceil(Math.max(
      Math.hypot(x, y),
      Math.hypot(width - x, y),
      Math.hypot(x, height - y),
      Math.hypot(width - x, height - y)
    )) + 20;

    root.style.setProperty("--theme-x", `${x}px`);
    root.style.setProperty("--theme-y", `${y}px`);
    root.style.setProperty("--theme-radius", `${radius}px`);

    // Stop individual CSS transitions from producing
    // an intermediate-colored page snapshot.
    root.classList.add("theme-no-transitions");

    let transition;

    try {
      transition = document.startViewTransition(() => {
        // The new page is captured with its final theme colors.
        applyTheme(nextTheme);
      });
    } catch (error) {
      // If transition creation fails, still switch themes.
      root.classList.remove("theme-no-transitions");
      applyTheme(nextTheme);
      themeToggle.disabled = false;
      themeBusy = false;
      return;
    }

    const finishTransition = () => {
      root.classList.remove("theme-no-transitions");

      themeToggle.disabled = false;
      themeBusy = false;

      root.style.removeProperty("--theme-x");
      root.style.removeProperty("--theme-y");
      root.style.removeProperty("--theme-radius");
    };

    // Clean up only when the circular reveal has finished.
    transition.finished.then(
      finishTransition,
      finishTransition
    );
  }

  themeToggle?.addEventListener("change", () => {
    const nextTheme = themeToggle.checked ? "light" : "dark";
    switchTheme(nextTheme);
  });

  /* =========================
     FAST TYPEWRITER ANIMATION
  ========================= */

  const roleNode = $("#role-rotator");
  const roles = [
    "an aspiring Automation VA",
    "an IT student"
  ];

  if (roleNode && !reducedMotion) {
    let roleIndex = 0;
    let charIndex = roles[0].length;
    let deleting = true;

    function typeRole() {
      if (!document.body.contains(roleNode)) return;

      const fullText = roles[roleIndex];

      if (deleting) {
        charIndex = Math.max(0, charIndex - 1);
        roleNode.textContent = fullText.slice(0, charIndex);

        if (charIndex === 0) {
          deleting = false;
          roleIndex = (roleIndex + 1) % roles.length;
          window.setTimeout(typeRole, 100);
          return;
        }

        window.setTimeout(typeRole, 22);
        return;
      }

      const nextText = roles[roleIndex];
      charIndex = Math.min(nextText.length, charIndex + 1);
      roleNode.textContent = nextText.slice(0, charIndex);

      if (charIndex >= nextText.length) {
        deleting = true;
        window.setTimeout(typeRole, 1000);
        return;
      }

      window.setTimeout(typeRole, 32);
    }

    window.setTimeout(typeRole, 1000);
  }


  /* =========================
     PORTRAIT FALLBACK
  ========================= */

  const profilePhoto = $(".profile-photo");
  const portraitFallback = $(".portrait-fallback");

  if (profilePhoto && portraitFallback) {
    profilePhoto.addEventListener("error", () => {
      profilePhoto.hidden = true;
      portraitFallback.hidden = false;
    });
  }


  /* =========================
     SOCIAL SHARE BUTTON
  ========================= */

  const socialFan = $("#social-fan");
  const shareToggle = $("#share-toggle");
  const socialLinks = $$(".social-link", socialFan || document);

  if (socialFan && shareToggle) {
    function setSocialOpen(open) {
      socialFan.classList.toggle("is-open", open);

      shareToggle.setAttribute("aria-expanded", String(open));
      shareToggle.setAttribute(
        "aria-label",
        open ? "Hide social links" : "Show social links"
      );
      shareToggle.title = open ? "Hide social links" : "Show social links";
    }

    // Desktop hover reveals LinkedIn and GitHub.
    socialFan.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse") setSocialOpen(true);
    });

    socialFan.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "mouse" &&
        !socialFan.contains(document.activeElement)) {
        setSocialOpen(false);
      }
    });

    // Keyboard users can reveal the links by focusing the share control.
    socialFan.addEventListener("focusin", () => setSocialOpen(true));

    socialFan.addEventListener("focusout", (event) => {
      if (!socialFan.contains(event.relatedTarget) &&
        !socialFan.matches(":hover")) {
        setSocialOpen(false);
      }
    });

    // On touchscreens, tap the share button to toggle the links.
    shareToggle.addEventListener("click", () => {
      setSocialOpen(!socialFan.classList.contains("is-open"));
    });

    document.addEventListener("pointerdown", (event) => {
      if (!socialFan.contains(event.target)) setSocialOpen(false);
    });

    socialLinks.forEach((link) => {
      link.addEventListener("click", () => setSocialOpen(false));
    });
  }


  /* =========================
     IMAGE FALLBACKS
  ========================= */

  $$(".project-image img").forEach((img) => {
    img.addEventListener("error", () => {
      if (img.dataset.fallback && !img.dataset.fallbackApplied) {
        img.dataset.fallbackApplied = "true";
        img.src = img.dataset.fallback;
        return;
      }

      img.hidden = true;

      const holder = img.closest(".project-image");
      const message = $(".media-empty", holder);

      holder?.classList.add("no-image");

      if (message) message.hidden = false;
    });
  });

  $$(".certificate-preview img").forEach((img) => {
    img.addEventListener("error", () => {
      img.hidden = true;

      const fallback = $(".preview-fallback", img.parentElement);

      if (fallback) fallback.hidden = false;
    });
  });

  $$(".tool-icon-shell img").forEach((img) => {
    img.addEventListener("error", () => {
      const item = img.closest(".tool-item");
      if (item) item.hidden = true;
    });
  });


  /* =========================
     PORTFOLIO BOARD POP-UP
  ========================= */

  const tabs = $$('.board-tab[role="tab"]');
  const panels = $$('.board-panel[role="tabpanel"]');
  const tabsContainer = $(".board-tabs");

  function moveTabIndicator(tab) {
    if (!tabsContainer || !tab) return;

    tabsContainer.style.setProperty(
      "--pill-left",
      `${tab.offsetLeft}px`
    );

    tabsContainer.style.setProperty(
      "--pill-top",
      `${tab.offsetTop}px`
    );

    tabsContainer.style.setProperty(
      "--pill-width",
      `${tab.offsetWidth}px`
    );

    tabsContainer.style.setProperty(
      "--pill-height",
      `${tab.offsetHeight}px`
    );
  }

  function activateTab(tab, moveFocus = false) {
    if (!tab) return;

    const selectedName = tab.dataset.tab;

    tabs.forEach((button) => {
      const active = button === tab;

      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
    });

    let activePanel = null;

    panels.forEach((panel) => {
      const active = panel.dataset.panel === selectedName;

      panel.hidden = !active;
      panel.classList.remove("pop-in");

      if (active) activePanel = panel;
    });

    // Pop the selected content into view.
    if (activePanel && !reducedMotion) {
      void activePanel.offsetWidth;
      activePanel.classList.add("pop-in");
    }

    // Keep the rounded tab highlight sliding smoothly.
    moveTabIndicator(tab);

    if (moveFocus) {
      tab.focus();
    }
  }

  // Clicking a tab changes the content underneath it.
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      activateTab(tab);
    });

    // Keyboard navigation remains supported.
    tab.addEventListener("keydown", (event) => {
      let nextIndex = index;

      if (event.key === "ArrowRight") {
        nextIndex = (index + 1) % tabs.length;
      } else if (event.key === "ArrowLeft") {
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = tabs.length - 1;
      } else {
        return;
      }

      event.preventDefault();
      activateTab(tabs[nextIndex], true);
    });
  });

  // Position the sliding highlight on the selected tab initially.
  requestAnimationFrame(() => {
    const activeTab = tabs.find(
      (tab) => tab.getAttribute("aria-selected") === "true"
    ) || tabs[0];

    if (activeTab) {
      moveTabIndicator(activeTab);
    }
  });

  // Keep the highlight aligned when the screen is resized.
  window.addEventListener("resize", () => {
    const activeTab = tabs.find(
      (tab) => tab.getAttribute("aria-selected") === "true"
    ) || tabs[0];

    if (activeTab) {
      moveTabIndicator(activeTab);
    }
  });


  /* =========================
     SECTION REVEAL ANIMATION
  ========================= */

  const revealTargets = $$(".about-card, .stats-row, .portfolio-board, .contact-layout");

  if ("IntersectionObserver" in window && !reducedMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });

    revealTargets.forEach((element) => revealObserver.observe(element));
  } else {
    revealTargets.forEach((element) => element.classList.add("is-visible"));
  }


  /* =========================
     ACTIVE NAVIGATION LINK
  ========================= */

  const navLinks = $$(".nav-link");

  const navContainer = $(".nav-links");

  function moveNavIndicator(link) {
    if (!navContainer || !link) return;

    navContainer.style.setProperty(
      "--nav-pill-left",
      `${link.offsetLeft}px`
    );

    navContainer.style.setProperty(
      "--nav-pill-top",
      `${link.offsetTop}px`
    );

    navContainer.style.setProperty(
      "--nav-pill-width",
      `${link.offsetWidth}px`
    );

    navContainer.style.setProperty(
      "--nav-pill-height",
      `${link.offsetHeight}px`
    );
  }

  /* Position the pill on the initial active link */
  requestAnimationFrame(() => {
    moveNavIndicator(
      navLinks.find(link => link.classList.contains("is-active")) ||
      navLinks[0]
    );
  });

  /* Recalculate the pill when the viewport changes */
  window.addEventListener("resize", () => {
    moveNavIndicator(
      navLinks.find(link => link.classList.contains("is-active")) ||
      navLinks[0]
    );
  });

  const sections = ["home", "about", "explore", "contact"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if ("IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;

      navLinks.forEach((link) => {
        const active = link.hash === `#${visible.target.id}`;

        link.classList.toggle("is-active", active);

        if (active) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });

      moveNavIndicator(
        navLinks.find(link => link.classList.contains("is-active"))
      );
    }, {
      rootMargin: "-25% 0px -60% 0px",
      threshold: [0, 0.15, 0.35, 0.6]
    });

    sections.forEach((section) => navObserver.observe(section));
  }


  /* =========================
     PROJECT IMAGE LIGHTBOX
  ========================= */

  const lightbox = $("#project-lightbox");
  const lightboxFrame = $("#lightbox-frame");
  const lightboxImage = $("#lightbox-image");
  const lightboxTitle = $("#lightbox-title");
  const lightboxClose = $("#lightbox-close");

  let lastProjectButton = null;
  let zoom = 1;
  let offsetX = 0;
  let offsetY = 0;
  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragOriginX = 0;
  let dragOriginY = 0;
  let baseImageWidth = 0;
  let baseImageHeight = 0;

  function updateLightboxTransform() {
    if (!lightboxImage) return;

    lightboxImage.style.transform =
      `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`;
  }

  function updateLightboxTransform() {
    if (!lightboxImage) return;

    lightboxImage.style.transform =
      `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${zoom})`;
  }

  function fitLightboxImage() {
    if (!lightboxImage || !lightboxImage.naturalWidth) return;

    const isMobile = window.innerWidth <= 520;

    const maxWidth = Math.min(
      window.innerWidth * (isMobile ? 0.96 : 0.92),
      1100
    ) - 2;

    const maxHeight = Math.min(
      window.innerHeight * (isMobile ? 0.62 : 0.68),
      isMobile ? 600 : 720
    ) - 2;

    const scale = Math.min(
      maxWidth / lightboxImage.naturalWidth,
      maxHeight / lightboxImage.naturalHeight,
      1
    );

    baseImageWidth = Math.max(
      1,
      Math.round(lightboxImage.naturalWidth * scale)
    );

    baseImageHeight = Math.max(
      1,
      Math.round(lightboxImage.naturalHeight * scale)
    );

    lightboxImage.style.width = `${baseImageWidth}px`;
    lightboxImage.style.height = `${baseImageHeight}px`;

    lightboxFrame.style.width = `${baseImageWidth + 2}px`;
    lightboxFrame.style.height = `${baseImageHeight + 2}px`;

    zoom = 1;
    offsetX = 0;
    offsetY = 0;

    updateLightboxTransform();
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;

    lightbox.hidden = true;
    document.body.classList.remove("modal-open");

    if (lightboxImage) {
      lightboxImage.removeAttribute("src");
      lightboxImage.style.transform = "";
    }

    lastProjectButton?.focus();
  }

  function openLightbox(button) {
    if (!lightbox || !lightboxImage || !lightboxTitle) return;

    const img = button.querySelector(".project-image img");

    if (!img || img.hidden || !img.src) return;

    lastProjectButton = button;

    lightboxImage.onload = () => {
      fitLightboxImage();
    };

    lightboxImage.onerror = () => {
      lightboxImage.onload = null;
      console.error("Could not load the project preview:", img.src);
    };

    lightboxImage.src = img.currentSrc || img.src;
    lightboxImage.alt = img.alt || "Project preview";

    lightboxTitle.textContent =
      button.dataset.projectTitle || "Project preview";

    lightbox.hidden = false;
    document.body.classList.add("modal-open");

    // Handle an image that has already loaded or is cached.
    if (lightboxImage.complete && lightboxImage.naturalWidth > 0) {
      fitLightboxImage();
    }

    lightboxClose?.focus();
  }

  $$(".project-card").forEach((button) => {
    button.addEventListener("click", () => openLightbox(button));
  });

  lightboxClose?.addEventListener("click", closeLightbox);

  lightbox?.addEventListener("pointerdown", (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox && !lightbox.hidden) {
      closeLightbox();
    }
  });

  lightboxFrame?.addEventListener("wheel", (event) => {
    if (!lightbox || lightbox.hidden) return;

    event.preventDefault();

    const delta = event.deltaY < 0 ? 0.15 : -0.15;

    zoom = Math.max(1, Math.min(3.2, +(zoom + delta).toFixed(2)));

    if (zoom === 1) {
      offsetX = 0;
      offsetY = 0;
    }

    updateLightboxTransform();
  }, { passive: false });

  lightboxImage?.addEventListener("pointerdown", (event) => {
    if (zoom <= 1) return;

    dragging = true;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragOriginX = offsetX;
    dragOriginY = offsetY;

    lightboxImage.setPointerCapture?.(event.pointerId);
  });

  lightboxImage?.addEventListener("pointermove", (event) => {
    if (!dragging) return;

    offsetX = dragOriginX + event.clientX - dragStartX;
    offsetY = dragOriginY + event.clientY - dragStartY;

    updateLightboxTransform();
  });

  const stopDragging = () => {
    dragging = false;
  };

  lightboxImage?.addEventListener("pointerup", stopDragging);
  lightboxImage?.addEventListener("pointercancel", stopDragging);


  /* =========================
     CONTACT FORM VALIDATION
     AND DIRECT SERVER SUBMISSION
  ========================= */

  const contactForm = $("#contact-form");
  const formStatus = $("#form-status");
  const sendButton = $("#send-message-button");
  const honeypot = $("#contact-website");

  const fields = {
    name: $("#contact-name"),
    email: $("#contact-email"),
    message: $("#contact-message")
  };

  const fieldMessages = {
    name: $("#name-error"),
    email: $("#email-error"),
    message: $("#message-error")
  };

  function setFieldError(name, message) {
    const field = fields[name];
    const errorNode = fieldMessages[name];

    if (!field || !errorNode) return;

    field.setAttribute("aria-invalid", message ? "true" : "false");
    errorNode.textContent = message;
  }

  function validateField(name) {
    const field = fields[name];

    if (!field) return false;

    const value = field.value.trim();
    let error = "";

    if (name === "name" && value.length < 2) {
      error = "Please enter your name (at least 2 characters).";
    } else if (
      name === "email" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)
    ) {
      error = "Please enter a valid email address, such as name@example.com.";
    } else if (name === "message" && value.length < 10) {
      error = "Please write at least 10 characters so I know how to help.";
    }

    setFieldError(name, error);
    return error === "";
  }

  Object.entries(fields).forEach(([name, field]) => {
    if (!field) return;

    field.addEventListener("blur", () => {
      field.dataset.touched = "true";
      validateField(name);
    });

    field.addEventListener("input", () => {
      if (field.dataset.touched === "true") {
        validateField(name);
      }

      if (formStatus) {
        formStatus.textContent = "";
        formStatus.removeAttribute("data-state");
      }

      if (sendButton?.classList.contains("is-sent")) {
        sendButton.classList.remove("is-sent");
        sendButton.setAttribute("aria-label", "Send message");
      }
    });
  });

  contactForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const validation = Object.keys(fields).map((name) => {
      if (fields[name]) fields[name].dataset.touched = "true";

      return { name, valid: validateField(name) };
    });

    const invalidField = validation.find((item) => !item.valid);

    if (invalidField) {
      if (formStatus) {
        formStatus.dataset.state = "error";
        formStatus.textContent =
          "Please check the highlighted fields and try again.";
      }

      fields[invalidField.name]?.focus();
      return;
    }

    if (sendButton) {
      sendButton.disabled = true;
      sendButton.classList.remove("is-sent");
      sendButton.classList.add("is-sending");
      sendButton.setAttribute("aria-label", "Sending message");
    }

    if (formStatus) {
      formStatus.dataset.state = "pending";
      formStatus.textContent = "Sending your message securely…";
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          name: fields.name.value.trim(),
          email: fields.email.value.trim(),
          message: fields.message.value.trim(),
          website: honeypot?.value.trim() || ""
        })
      });

      let result = {};

      try {
        result = await response.json();
      } catch {
        // The server may return an empty response.
      }

      if (!response.ok) {
        throw new Error(
          result.error ||
          "Your message could not be sent right now. Please try again."
        );
      }

      if (formStatus) {
        formStatus.dataset.state = "success";
        formStatus.textContent =
          "Message sent! Thanks for reaching out. I'll get back to you as soon as I can.";
      }

      if (sendButton) {
        sendButton.classList.remove("is-sending");
        sendButton.classList.add("is-sent");
        sendButton.setAttribute("aria-label", "Message sent");
      }

      contactForm.reset();

      Object.keys(fields).forEach((name) => {
        fields[name].dataset.touched = "false";
        setFieldError(name, "");
      });

      window.setTimeout(() => {
        if (!sendButton) return;

        sendButton.classList.remove("is-sent");
        sendButton.disabled = false;
        sendButton.setAttribute("aria-label", "Send message");
      }, 2300);

    } catch (error) {
      if (formStatus) {
        formStatus.dataset.state = "error";
        formStatus.textContent =
          error.message ||
          "We couldn't send your message. Please try again.";
      }

      if (sendButton) {
        sendButton.classList.remove("is-sending", "is-sent");
        sendButton.disabled = false;
        sendButton.setAttribute("aria-label", "Try sending message again");
      }
    }
  });
  const contactEmailRotator = document.getElementById("contactEmailRotator");

  const contactEmails = [
    "johndrey.va@gmail.com",
    "bataljohndrey@gmail.com"
  ];

  if (contactEmailRotator) {
    let emailIndex = 0;

    window.setInterval(() => {
      contactEmailRotator.classList.remove("is-visible");

      window.setTimeout(() => {
        emailIndex = (emailIndex + 1) % contactEmails.length;

        const email = contactEmails[emailIndex];

        contactEmailRotator.textContent = email;
        contactEmailRotator.href = `mailto:${email}`;
        contactEmailRotator.classList.add("is-visible");
      }, 350);
    }, 5000);
  }
});