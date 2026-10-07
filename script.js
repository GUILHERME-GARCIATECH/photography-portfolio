const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -6%" },
);

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".site-nav");
const mobileMenu = window.matchMedia("(max-width: 900px)");
const mobileGallery = window.matchMedia("(max-width: 620px)");
const header = document.querySelector("[data-header]");

function syncNavigation() {
  navigation.inert = mobileMenu.matches && !navigation.classList.contains("is-open");
}

function setMenu(open) {
  menuButton.setAttribute("aria-expanded", String(open));
  navigation.classList.toggle("is-open", open);
  document.body.classList.toggle("menu-open", open);
  syncNavigation();
  if (open) header.classList.remove("is-hidden");
  if (open) navigation.querySelector("a").focus();
}

mobileMenu.addEventListener("change", () => { setMenu(false); });
syncNavigation();

menuButton.addEventListener("click", () => {
  setMenu(menuButton.getAttribute("aria-expanded") !== "true");
});

navigation.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMenu(false));
});

// Duplicate only the lettering, clipping black text to each photograph's bounds.
// This keeps the colors neutral instead of inverting the image's purple tones.
const asaTitle = document.querySelector(".hero-title__asa");
const heroFrames = [...document.querySelectorAll(".hero-frame")];
const asaOverlays = heroFrames.map(() => {
  const overlay = asaTitle.cloneNode(true);
  overlay.classList.add("hero-title__asa--overlay");
  overlay.setAttribute("aria-hidden", "true");
  asaTitle.parentElement.append(overlay);
  return overlay;
});

function updateTitleClipping() {
  const titleBounds = asaTitle.getBoundingClientRect();
  heroFrames.forEach((frame, index) => {
    const bounds = frame.getBoundingClientRect();
    // Negative insets preserve glyphs that extend beyond the tight line box
    // (the .72 line-height and negative letter-spacing), up to the photo edges.
    const top = bounds.top - titleBounds.top;
    const right = titleBounds.right - bounds.right;
    const bottom = titleBounds.bottom - bounds.bottom;
    const left = bounds.left - titleBounds.left;
    asaOverlays[index].style.clipPath = `inset(${top}px ${right}px ${bottom}px ${left}px)`;
  });
}

const nextLink = document.querySelector(".works-next");
const secondPhoto = document.querySelectorAll(".works-photo")[1];
const about = document.querySelector("#sobre");

function updateNextLink() {
  const visible = mobileGallery.matches &&
    secondPhoto.getBoundingClientRect().top <= window.innerHeight * .6 &&
    about.getBoundingClientRect().top > window.innerHeight && !lightbox.open;
  nextLink.classList.toggle("is-visible", visible);
  nextLink.inert = !visible;
  nextLink.setAttribute("aria-hidden", String(!visible));
}

nextLink.addEventListener("click", () => {
  about.focus({ preventScroll: true });
});
let lastScroll = 0;
let ticking = false;

function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const currentScroll = window.scrollY;
    if (!document.body.classList.contains("menu-open")) {
      header.classList.toggle("is-hidden", currentScroll > lastScroll && currentScroll > 180);
    }
    lastScroll = Math.max(0, currentScroll);

    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll("[data-parallax]").forEach((element) => {
        const speed = Number(element.dataset.parallax);
        element.style.translate = `0 ${currentScroll * speed}px`;
      });
    }
    updateTitleClipping();
    updateNextLink();
    ticking = false;
  });
}

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);
window.addEventListener("load", onScroll);
asaTitle.addEventListener("animationend", onScroll);
heroFrames.forEach((frame) => frame.addEventListener("animationend", onScroll));
document.fonts.ready.then(onScroll);

// Keep the clipping aligned while the opening text and photographs animate.
const introStarted = performance.now();
function updateIntroClipping(time) {
  updateTitleClipping();
  if (time - introStarted < 2800) requestAnimationFrame(updateIntroClipping);
}
requestAnimationFrame(updateIntroClipping);

const lightbox = document.querySelector("[data-lightbox-dialog]");
const lightboxImage = lightbox.querySelector("img");
const lightboxClose = lightbox.querySelector(".lightbox-close");

document.querySelectorAll("[data-lightbox]").forEach((button) => {
  button.addEventListener("click", () => {
    const sourceImage = button.querySelector("img");
    lightboxImage.src = button.dataset.lightbox;
    lightboxImage.alt = sourceImage.alt;
    lightbox.showModal();
    updateNextLink();
  });
});

lightboxClose.addEventListener("click", () => lightbox.close());
lightbox.addEventListener("close", updateNextLink);
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) lightbox.close();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
    setMenu(false);
    menuButton.focus();
  }
  if (event.key === "Tab" && mobileMenu.matches && navigation.classList.contains("is-open")) {
    const links = [...navigation.querySelectorAll("a")];
    const controls = [menuButton, ...links];
    const index = controls.indexOf(document.activeElement);
    if (event.shiftKey && index <= 0) {
      event.preventDefault();
      controls.at(-1).focus();
    } else if (!event.shiftKey && (index === controls.length - 1 || index < 0)) {
      event.preventDefault();
      menuButton.focus();
    }
  }
});

onScroll();
