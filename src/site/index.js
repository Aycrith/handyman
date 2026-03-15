/**
 * src/site/index.js - Handyman landing-page orchestration.
 *
 * Animation stack:
 *  - Lenis (smooth scroll)
 *  - GSAP + ScrollTrigger (all animations)
 *
 * Runtime globals are prepared by src/runtime-globals.js before this module runs.
 */

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const Lenis = window.Lenis;
const SplitType = window.SplitType;

/* ─────────────────────────────────────────────────────────
   UTILITIES
───────────────────────────────────────────────────────── */

const $ = (selector, ctx = document) => ctx.querySelector(selector);
const $$ = (selector, ctx = document) => [...ctx.querySelectorAll(selector)];

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const IS_TOUCH = window.matchMedia('(pointer: coarse)').matches;
const IS_LOW_END_TOUCH = IS_TOUCH && navigator.hardwareConcurrency <= 2;
const SHOULD_DISABLE_MOTION =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
  IS_LOW_END_TOUCH;

/* Set footer year */
const yearEl = $('#currentYear');
if (yearEl) yearEl.textContent = new Date().getFullYear();


/* ─────────────────────────────────────────────────────────
   LENIS — SMOOTH SCROLL
───────────────────────────────────────────────────────── */

let lenis;
let heroIntroTimeline = null;
let heroIntroStarted = false;

function dispatchHeroIntroStart() {
  if (window.__heroIntroStarted) return;
  window.__heroIntroStarted = true;
  window.__heroIntroStartedAt = performance.now();
  window.dispatchEvent(new CustomEvent('hero:intro-start', {
    detail: { startedAt: window.__heroIntroStartedAt },
  }));
}

function playHeroEntrance() {
  if (heroIntroStarted) return;
  heroIntroStarted = true;
  heroIntroTimeline?.play(0);
}

function dispatchHeroMagicPulse(source, detail = {}) {
  window.dispatchEvent(new CustomEvent('hero:magic-pulse', {
    detail: {
      source,
      strength: detail.strength ?? 0.18,
      durationMs: detail.durationMs ?? 760,
      anchorTool: detail.anchorTool ?? 'wrench',
      sparkCount: detail.sparkCount ?? 0,
    },
  }));
}

function dispatchHeroSectionTransition(progress, source = 'main-scroll') {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const state = clampedProgress > 0.74
    ? 'handedOff'
    : (clampedProgress > 0.04 ? 'compressing' : 'idle');
  window.dispatchEvent(new CustomEvent('hero:section-transition', {
    detail: {
      state,
      progress: Number(clampedProgress.toFixed(3)),
      source,
    },
  }));
}

function initLenis() {
  if (typeof Lenis === 'undefined') return;

  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: !prefersReducedMotion,
    smoothTouch: false,      // native touch scroll (Mantis pattern)
    touchMultiplier: 2,      // was 1.8
  });

  // Connect Lenis to GSAP ticker for frame-perfect sync
  if (typeof gsap !== 'undefined') {
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
}

initLenis();


/* ─────────────────────────────────────────────────────────
   GSAP — CORE SETUP
───────────────────────────────────────────────────────── */

if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
  console.warn('[handyman] GSAP or ScrollTrigger not loaded.');
}

gsap.registerPlugin(ScrollTrigger);

// Tell ScrollTrigger to use Lenis scroll position
if (lenis) {
  ScrollTrigger.scrollerProxy(document.body, {
    scrollTop(value) {
      if (arguments.length) {
        lenis.scrollTo(value, { immediate: true });
      } else {
        return lenis.animatedScroll;
      }
    },
    getBoundingClientRect() {
      return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
    },
    pinType: document.body.style.transform ? 'transform' : 'fixed',
  });

  // Drive --scene-warmth CSS var from Lenis smooth scroll progress
  // Using quickSetter for RAF-batched DOM writes (Active Theory pattern)
  const setWarmth = gsap.quickSetter(document.documentElement, '--scene-warmth', '');
  lenis.on('scroll', ({ progress }) => {
    setWarmth(progress.toFixed(3));

    // Scroll-position color breathing (Gap R5 — nohero.studio pattern)
    const bgStopsR = [10, 12, 10, 10, 14];
    const bgStopsG = [10, 11, 10, 10, 11];
    const rawIdx = Math.min(progress * 4, 3.99);
    const lo = Math.floor(rawIdx);
    const t = rawIdx - lo;
    const bgR = bgStopsR[lo] + (bgStopsR[lo + 1] - bgStopsR[lo]) * t;
    const bgG = bgStopsG[lo] + (bgStopsG[lo + 1] - bgStopsG[lo]) * t;
    document.documentElement.style.setProperty('--bg-breathe-r', bgR.toFixed(1));
    document.documentElement.style.setProperty('--bg-breathe-g', bgG.toFixed(1));

    // Particle density driven by scroll position
    const particleDensity = progress < 0.3 ? 0 : Math.min(1, (progress - 0.3) / 0.4);
    document.documentElement.style.setProperty('--section-particle-density', particleDensity.toFixed(3));

    ScrollTrigger.update();
  });
}


/* ─────────────────────────────────────────────────────────
   SCROLL PROGRESS BAR
───────────────────────────────────────────────────────── */

const progressBar = $('#scrollProgress');

if (progressBar) {
  gsap.to(progressBar, {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: {
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.1,
    },
  });
}


/* ─────────────────────────────────────────────────────────
   NAVIGATION — SCROLL STATE
───────────────────────────────────────────────────────── */

const nav = $('#nav');

if (nav) {
  ScrollTrigger.create({
    start: 'top -70',
    onUpdate(self) {
      nav.classList.toggle('nav--scrolled', self.progress > 0);
    },
  });

  // Smooth anchor navigation via Lenis
  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target && lenis) {
        e.preventDefault();
        lenis.scrollTo(target, { duration: 1.2, offset: -80 });
      }
    });
  });
}


/* Hero parallax background removed — replaced by Three.js 3D camera scroll. */


/* ─────────────────────────────────────────────────────────
   HERO ENTRANCE ANIMATION
   Staggered reveal — same pattern as Rorelp/Framer Motion
   stagger delays but done in GSAP timeline
───────────────────────────────────────────────────────── */

function initHeroEntrance() {
  if (prefersReducedMotion) {
    // Instantly show all hero elements
    gsap.set([
      '.hero__eyebrow', '.eyebrow-seg', '.eyebrow-dot',
      '.hero__title', '.hero__sub',
      '.hero__ctas', '.hero__trust', '#scrollCue',
    ], { opacity: 1, y: 0 });
    heroIntroStarted = true;
    return;
  }

  gsap.set('.hero__eyebrow', { opacity: 0 });
  gsap.set('.eyebrow-seg, .eyebrow-dot', { opacity: 0, y: 10 });
  gsap.set('.hero__title', { opacity: 0, y: typeof SplitType === 'undefined' ? 45 : 0 });
  gsap.set('.hero__sub', { opacity: 0, y: 22 });
  gsap.set('.hero__ctas', { opacity: 0, y: 18 });
  gsap.set('.hero__trust', { opacity: 0, y: 10 });
  gsap.set('#scrollCue', { opacity: 0, y: 8 });

  heroIntroTimeline = gsap.timeline({
    paused: true,
    defaults: { ease: 'power3.out' },
  });

  // Absolute timings keep the DOM reveal aligned with the scene director phases.
  heroIntroTimeline
    .set('.hero__eyebrow', { opacity: 1 }, 0.40)
    .to('.eyebrow-seg, .eyebrow-dot', {
      opacity: 1,
      y: 0,
      stagger: 0.10,
      duration: 0.34,
      ease: 'power2.out',
      clearProps: 'y',
    }, 0.40)
    .call(() => {
      dispatchHeroMagicPulse('director-intro-prepulse', {
        strength: 0.11,
        durationMs: 620,
        anchorTool: 'wrench',
        sparkCount: 0,
      });
    }, null, 0.52)
    .to('.hero__title', {
      opacity: 1,
      y: 0,
      duration: 0.66,
      ease: 'power3.out',
      clearProps: 'clip-path,y',
    }, 0.56)
    .to('.hero__sub', {
      opacity: 1,
      y: 0,
      duration: 0.54,
      clearProps: 'y',
    }, 0.94)
    .to('.hero__ctas', {
      opacity: 1,
      y: 0,
      duration: 0.48,
      clearProps: 'y',
    }, 1.18)
    .to('.hero__trust', {
      opacity: 1,
      y: 0,
      duration: 0.44,
      clearProps: 'y',
    }, 1.34)
    .to('#scrollCue', {
      opacity: 1,
      y: 0,
      duration: 0.40,
      clearProps: 'y',
    }, 1.52);

  if (window.__heroIntroStarted) {
    playHeroEntrance();
  } else {
    window.addEventListener('hero:intro-start', playHeroEntrance, { once: true });
    setTimeout(() => {
      if (!heroIntroStarted) {
        playHeroEntrance();
      }
    }, 3000); // Hard-cap: if scene never signals, force hero visible
  }
}

function initHeroCtaWake() {
  const ctas = document.querySelectorAll('.hero__ctas .btn, .nav__cta');
  if (!ctas.length) return;

  const dispatchWake = (active, source) => {
    window.dispatchEvent(new CustomEvent('hero:cta-wake', {
      detail: { active, source },
    }));
  };

  ctas.forEach((cta) => {
    const source = cta.classList.contains('nav__cta') ? 'nav-cta' : 'hero-cta';
    cta.addEventListener('mouseenter', () => dispatchWake(true, source));
    cta.addEventListener('mouseleave', () => dispatchWake(false, source));
    cta.addEventListener('focus', () => dispatchWake(true, source));
    cta.addEventListener('blur', () => dispatchWake(false, source));
    cta.addEventListener('click', () => {
      dispatchHeroMagicPulse(source, {
        strength: source === 'nav-cta' ? 0.16 : 0.20,
        durationMs: source === 'nav-cta' ? 680 : 760,
      });
    });
  });
}

function initHeroSectionTransitionSignal() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const emitFromScroll = () => {
    const heroScrollVh = window.scrollY / Math.max(1, window.innerHeight);
    const progress = (heroScrollVh - 0.12) / 0.18;
    dispatchHeroSectionTransition(progress);
  };

  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: '32% top',
      onUpdate: emitFromScroll,
      onRefresh: emitFromScroll,
      onLeave: () => dispatchHeroSectionTransition(1),
      onEnterBack: emitFromScroll,
    });
  } else {
    window.addEventListener('scroll', emitFromScroll, { passive: true });
  }

  window.addEventListener('resize', emitFromScroll);
  emitFromScroll();
}


/* ─────────────────────────────────────────────────────────
   SCROLL CUE FADE OUT
   Fades out as user starts scrolling
───────────────────────────────────────────────────────── */

const scrollCue = $('#scrollCue');

if (scrollCue && !prefersReducedMotion) {
  gsap.to(scrollCue, {
    opacity: 0,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: '18% top',
      scrub: true,
    },
  });
}


/* ─────────────────────────────────────────────────────────
   MOTION GRAMMAR SYSTEM
   4 canonical motion modes + section-fold mode.
   All section reveals must go through motionMode() dispatcher.
   Implements overflow:hidden mask technique (Amendment 1):
   words rise from below a clipping parent — NOT opacity fades.
───────────────────────────────────────────────────────── */

/**
 * Wraps each .split-word in a .split-line-wrap span (overflow:hidden mask).
 * Uses DOM manipulation (not innerHTML) to preserve aria-label.
 * The "stage curtain" — word is below it, rises through into view.
 */
function wrapSplitWords(container) {
  const words = $$('.split-word', container);
  words.forEach(word => {
    if (word.parentElement?.classList.contains('split-line-wrap')) return;
    const wrap = document.createElement('span');
    wrap.className = 'split-line-wrap';
    word.parentNode.insertBefore(wrap, word);
    wrap.appendChild(word);
  });
}

/**
 * cinematic-sweep: words rise through overflow:hidden mask.
 * NO opacity — the mask provides invisibility. This is the
 * "printing press" emergence seen on sr-seventy.one, Dragonfly.
 */
function cinematicSweep(els, opts = {}) {
  if (prefersReducedMotion) {
    gsap.set(els, { y: '0%' });
    return;
  }
  gsap.set(els, { y: '110%' });
  return gsap.to(els, {
    y: '0%',
    duration: opts.duration || 0.9,
    ease: opts.ease || 'power3.out',
    stagger: opts.stagger || 0.055,
    ...opts.tweenOpts,
  });
}

/**
 * precision-stagger: cards/elements enter with opacity + scale.
 * For lists, cards, grid items — controlled, deliberate.
 */
function precisionStagger(els, opts = {}) {
  if (prefersReducedMotion) {
    gsap.set(els, { opacity: 1, y: 0, scale: 1 });
    return;
  }
  gsap.set(els, { opacity: 0, y: opts.y ?? 28, scale: opts.scale ?? 0.97 });
  return gsap.to(els, {
    opacity: 1,
    y: 0,
    scale: 1,
    duration: opts.duration || 0.75,
    ease: opts.ease || 'expo.out',
    stagger: opts.stagger || 0.08,
    ...opts.tweenOpts,
  });
}

/**
 * velocity-scrub: scroll-scrubbed parallax motion.
 * Position tied directly to scroll progress.
 */
function velocityScrub(el, opts = {}) {
  if (prefersReducedMotion) return;
  return gsap.to(el, {
    y: opts.y || -60,
    ease: 'none',
    scrollTrigger: {
      trigger: opts.trigger || el,
      start: opts.start || 'top bottom',
      end: opts.end || 'bottom top',
      scrub: opts.scrub || 1.2,
    },
  });
}

/**
 * ambient-drift: slow float for background elements, CSS particles.
 * No scroll trigger — continuous motion.
 */
function ambientDrift(el, opts = {}) {
  if (prefersReducedMotion) return;
  return gsap.to(el, {
    y: opts.y || -20,
    duration: opts.duration || (4 + Math.random() * 2),
    yoyo: true,
    repeat: -1,
    ease: 'sine.inOut',
    delay: opts.delay || Math.random() * 2,
  });
}

/**
 * section-fold: clip-path collapses from center outward on entry.
 * The Dragonfly.xyz "fold open" technique — applies to section containers.
 */
function sectionFold(el, opts = {}) {
  if (prefersReducedMotion) {
    gsap.set(el, { clipPath: 'inset(0% 0% 0% 0%)' });
    return;
  }
  gsap.set(el, { clipPath: 'inset(8% 0% 8% 0%)' });
  return ScrollTrigger.create({
    trigger: el,
    start: opts.start || 'top 80%',
    once: true,
    onEnter() {
      gsap.to(el, {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: opts.duration || 1.2,
        ease: opts.ease || 'expo.out',
      });
    },
  });
}

/**
 * motionMode() — dispatch to canonical reveal mode.
 */
function motionMode(els, mode, opts = {}) {
  switch (mode) {
    case 'cinematic-sweep':   return cinematicSweep(els, opts);
    case 'precision-stagger': return precisionStagger(els, opts);
    case 'velocity-scrub':    return velocityScrub(els, opts);
    case 'ambient-drift':     return ambientDrift(els, opts);
    case 'section-fold':      return sectionFold(els, opts);
    default:
      console.warn('[motionMode] Unknown mode:', mode);
  }
}


/* ─────────────────────────────────────────────────────────
   SECTION REVEALS
   Generic .reveal elements fade+slide in on scroll
───────────────────────────────────────────────────────── */

function initSectionReveals() {
  if (prefersReducedMotion) {
    gsap.set('.reveal', { opacity: 1, y: 0 });
    return;
  }

  $$('.reveal').forEach((el) => {
    gsap.fromTo(el,
      { opacity: 0, y: 42 },
      {
        opacity: 1, y: 0,
        duration: 0.85,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 87%',
          toggleActions: 'play none none none',
          once: true,
          invalidateOnRefresh: true,
        },
      }
    );
  });
}


/* ─────────────────────────────────────────────────────────
   SERVICE CARDS — STAGGERED ENTRY
   Each card staggers 80ms apart
───────────────────────────────────────────────────────── */

function initServiceCards() {
  const cards = $$('.service-card');
  if (!cards.length) return;

  if (prefersReducedMotion) {
    gsap.set(cards, { opacity: 1, y: 0 });
    return;
  }

  // precision-stagger: cards enter with perspective-flip (B1)
  cards.forEach((card, i) => {
    gsap.set(card, { opacity: 0, y: 40, rotateX: -8, transformPerspective: 1200 });
    gsap.to(card, {
      opacity: 1,
      y: 0,
      rotateX: 0,
      duration: 0.75,
      delay: (i % 3) * 0.09 + Math.floor(i / 3) * 0.06,
      ease: 'power3.out',
      clearProps: 'rotateX,transformPerspective',
      scrollTrigger: {
        trigger: '.services__grid',
        start: 'top 82%',
        toggleActions: 'play none none none',
        once: true,
        invalidateOnRefresh: true,
      },
    });
  });
}


/* ─────────────────────────────────────────────────────────
   TESTIMONIALS — STAGGERED ENTRY
───────────────────────────────────────────────────────── */

function initTestimonials() {
  const blocks = $$('.testimonial');
  if (!blocks.length || prefersReducedMotion) return;

  blocks.forEach((block, i) => {
    gsap.fromTo(block,
      { opacity: 0, y: 38 },
      {
        opacity: 1, y: 0,
        duration: 0.75,
        delay: i * 0.12,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.testimonials__grid',
          start: 'top 87%',
          toggleActions: 'play none none none',
          once: true,
          invalidateOnRefresh: true,
        },
      }
    );
  });
}


/* ─────────────────────────────────────────────────────────
   COUNT-UP STATS ANIMATION
   Animates numeric counter from 0 to target value
───────────────────────────────────────────────────────── */

function initCountUp() {
  $$('.stat__num').forEach((el) => {
    const target = parseInt(el.dataset.target, 10);
    if (isNaN(target)) return;

    if (prefersReducedMotion) {
      el.textContent = target;
      return;
    }

    const counter = { val: 0 };

    ScrollTrigger.create({
      trigger: el,
      start: 'top 82%',
      once: true,
      onEnter() {
        gsap.to(counter, {
          val: target,
          duration: 1.8,
          ease: 'power2.out',
          onUpdate() {
            el.textContent = Math.round(counter.val);
          },
          onComplete() {
            el.textContent = target;
          },
        });
      },
    });
  });
}


/* ─────────────────────────────────────────────────────────
   PILLAR CARDS — STAGGERED ENTRY
───────────────────────────────────────────────────────── */

function initPillars() {
  const pillars = $$('.pillar');
  if (!pillars.length || prefersReducedMotion) return;

  pillars.forEach((p, i) => {
    gsap.fromTo(p,
      { opacity: 0, y: 36 },
      {
        opacity: 1, y: 0,
        duration: 0.75,
        delay: i * 0.14,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.pillars__grid',
          start: 'top 84%',
          toggleActions: 'play none none none',
          once: true,
          invalidateOnRefresh: true,
        },
      }
    );
  });
}


/* ─────────────────────────────────────────────────────────
   CTA BAND — SUBTLE SCALE-IN
───────────────────────────────────────────────────────── */

function initCtaBand() {
  const band = $('.cta-band__inner');
  if (!band || prefersReducedMotion) return;

  gsap.fromTo(band,
    { opacity: 0, y: 30 },
    {
      opacity: 1, y: 0,
      duration: 0.9,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.cta-band',
        start: 'top 80%',
        toggleActions: 'play none none none',
        once: true,
        invalidateOnRefresh: true,
      },
    }
  );
}


/* ─────────────────────────────────────────────────────────
   SECTION TITLE REVEAL — OVERFLOW MASK TECHNIQUE
   Replaces all per-section title reveals.
   Words rise from below overflow:hidden parent (Amendment 1).
───────────────────────────────────────────────────────── */

function initSectionTitleReveal(selectorOrEls, opts = {}) {
  if (prefersReducedMotion || typeof SplitType === 'undefined') {
    // Fall through to static state — all elements visible
    const targets = typeof selectorOrEls === 'string'
      ? $$(selectorOrEls)
      : Array.isArray(selectorOrEls) ? selectorOrEls : [selectorOrEls];
    targets.forEach(el => gsap.set(el, { opacity: 1 }));
    return;
  }

  const targets = typeof selectorOrEls === 'string'
    ? $$(selectorOrEls)
    : Array.isArray(selectorOrEls) ? selectorOrEls : [selectorOrEls];

  targets.forEach(el => {
    // 1. Preserve aria-label BEFORE split (accessibility)
    if (!el.getAttribute('aria-label')) {
      el.setAttribute('aria-label', el.textContent.trim());
    }

    // 2. SplitType word-level split
    const split = new SplitType(el, { types: 'words' });
    if (!split.words?.length) return;

    // 3. Wrap each word in overflow:hidden mask (DOM manipulation)
    wrapSplitWords(el);

    // 4. Position words below the mask (hidden by overflow:hidden)
    gsap.set(split.words, { y: '110%' });

    // 5. Animate on scroll entry — words rise through the curtain
    ScrollTrigger.create({
      trigger: el,
      start: opts.start || 'top 88%',
      once: true,
      invalidateOnRefresh: true,
      onEnter() {
        gsap.to(split.words, {
          y: '0%',
          duration: opts.duration || 0.9,
          ease: opts.ease || 'power3.out',
          stagger: opts.stagger || 0.055,
          clearProps: 'transform',
        });
      },
    });
  });
}


/* ─────────────────────────────────────────────────────────
   SECTION TITLE LINES — DRAW-IN UNDERLINE
   A decorative underline animates in below section titles
───────────────────────────────────────────────────────── */

function initSectionTitleLines() {
  if (prefersReducedMotion) return;

  $$('.section__title').forEach((title) => {
    const parent = title.closest('.section__header');
    if (!parent) return;

    if (typeof SplitType === 'undefined') {
      gsap.fromTo(title,
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0,
          duration: 0.85,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: parent,
            start: 'top 86%',
            toggleActions: 'play none none none',
            once: true,
            invalidateOnRefresh: true,
          },
        }
      );
    }

    const eyebrow = parent.querySelector('.section__eyebrow');
    if (eyebrow) {
      gsap.fromTo(eyebrow,
        { opacity: 0, y: 14 },
        {
          opacity: 1, y: 0,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: parent,
            start: 'top 88%',
            toggleActions: 'play none none none',
            once: true,
            invalidateOnRefresh: true,
          },
        }
      );
    }
  });
}


/* ─────────────────────────────────────────────────────────
   AMBIENT AMBER GLOW ON SCROLL
   The hero amber glow subtly shifts intensity as you scroll
───────────────────────────────────────────────────────── */

function initAmbientGlow() {
  if (prefersReducedMotion) return;

  const hero = $('.hero');
  if (!hero) return;

  // Step 9.5 — Animate depth layer CSS vars on scroll
  ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: 'bottom top',
    onUpdate: (self) => {
      const p = self.progress;
      // Drive depth layer z-index perception via CSS vars
      // Animate from default to heightened depth values as user scrolls past hero
      gsap.quickSetter(document.documentElement, '--section-depth-near', 'css')(
        (2 + p * 3).toFixed(2)
      );
      gsap.quickSetter(document.documentElement, '--section-depth-mid', 'css')(
        (4 + p * 2).toFixed(2)
      );
      gsap.quickSetter(document.documentElement, '--section-depth-far', 'css')(
        (1 + p * 1).toFixed(2)
      );
    },
  });
}


/* ─────────────────────────────────────────────────────────
   RESIZE HANDLER — REFRESH SCROLLTRIGGER
───────────────────────────────────────────────────────── */

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    ScrollTrigger.refresh();
  }, 200);
});


/* ─────────────────────────────────────────────────────────
   INIT — WAIT FOR DOM + FONTS
───────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────────────────────
   PROCESS STEPS — STAGGERED LEFT-TO-RIGHT ENTRY
───────────────────────────────────────────────────────── */

function initProcessSteps() {
  const steps = $$('.process-step');
  if (!steps.length || prefersReducedMotion) return;

  steps.forEach((step, i) => {
    gsap.fromTo(step,
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0,
        duration: 0.75,
        delay: i * 0.15,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.process__steps',
          start: 'top 82%',
          toggleActions: 'play none none none',
          once: true,
          invalidateOnRefresh: true,
        },
      }
    );
  });

  // Animate connectors
  $$('.process-step__connector').forEach((conn, i) => {
    gsap.fromTo(conn,
      { opacity: 0, scaleX: 0 },
      {
        opacity: 1, scaleX: 1,
        transformOrigin: 'left center',
        duration: 0.5,
        delay: 0.2 + i * 0.15,
        ease: 'power1.out',
        scrollTrigger: {
          trigger: '.process__steps',
          start: 'top 82%',
          toggleActions: 'play none none none',
          once: true,
          invalidateOnRefresh: true,
        },
      }
    );
  });
}


/* ─────────────────────────────────────────────────────────
   GALLERY CARDS — STAGGERED GRID ENTRY
───────────────────────────────────────────────────────── */

function initGallery() {
  const cards = $$('.gallery-card');
  if (!cards.length || prefersReducedMotion) return;

  cards.forEach((card, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    gsap.set(card, { opacity: 0, y: 36, scale: 0.97 });
    gsap.to(card, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.7,
      delay: col * 0.08 + row * 0.05,
      ease: 'expo.out',
      clearProps: 'scale',
      scrollTrigger: {
        trigger: '.gallery__grid',
        start: 'top 82%',
        toggleActions: 'play none none none',
        once: true,
        invalidateOnRefresh: true,
      },
    });
  });
}


/* ─────────────────────────────────────────────────────────
   TRUST BADGES — CSS marquee (no JS animation needed)
   The .marquee-inner animation is handled entirely via CSS.
───────────────────────────────────────────────────────── */

function initTrustBadges() {
  // No-op: marquee is CSS-driven (@keyframes marquee in styles.css)
}


/* ─────────────────────────────────────────────────────────
   RHETORICAL COPY SECTION — SCROLL-TRIGGERED REVEAL
   Short declarative lines stagger in on scroll entry.
   Inspired by Mantis Works' scroll-paced copy rhythm.
───────────────────────────────────────────────────────── */

function initRhetoricalSection() {
  const section = $('.rhetoric-section');
  const lines = $$('.rhetoric-line');
  if (!section || !lines.length) return;

  if (prefersReducedMotion || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    return;
  }

  const accents = $$('.rhetoric-kicker, .rhetoric-proof__item', section);

  gsap.fromTo(accents,
    {
      y: 12,
      opacity: 0.84,
    },
    {
      y: 0,
      opacity: 1,
      stagger: 0.08,
      duration: 0.55,
      ease: 'power2.out',
      immediateRender: false,
      scrollTrigger: {
        trigger: section,
        start: 'top 82%',
        toggleActions: 'play none none none',
        once: true,
        invalidateOnRefresh: true,
      },
    }
  );

  gsap.fromTo(lines,
    {
      y: 24,
      opacity: 0.86,
      filter: 'blur(8px)',
    },
    {
      y: 0,
      opacity: 1,
      filter: 'blur(0px)',
      stagger: 0.16,
      duration: 0.9,
      ease: 'power3.out',
      immediateRender: false,
      clearProps: 'filter',
      scrollTrigger: {
        trigger: section,
        start: 'top 80%',
        toggleActions: 'play none none none',
        once: true,
        invalidateOnRefresh: true,
      },
    }
  );
}


/* ─────────────────────────────────────────────────────────
   CONTACT FORM — SLIDE UP REVEAL
───────────────────────────────────────────────────────── */

function initContactForm() {
  const form = $('.contact-form');
  if (!form || prefersReducedMotion) return;

  gsap.fromTo(form,
    { opacity: 0, x: 30 },
    {
      opacity: 1, x: 0,
      duration: 0.9,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.contact-layout',
        start: 'top 80%',
        toggleActions: 'play none none none',
        once: true,
        invalidateOnRefresh: true,
      },
    }
  );
}


/* ─────────────────────────────────────────────────────────
   PRELOADER — #1
   Amber progress bar that dismisses after fonts + assets ready
───────────────────────────────────────────────────────── */

function initPreloader() {
  const preloader = document.getElementById('preloader');
  const bar = document.getElementById('preloaderBar');
  const label = document.getElementById('preloaderLabel');
  if (!preloader) {
    dispatchHeroIntroStart();
    return;
  }

  // Exposed to src/scene/index.js for GLB load progress updates
  window.__preloaderProgress = (pct) => {
    if (bar) bar.style.width = pct + '%';
    if (label) label.textContent = pct < 100 ? 'Loading assets...' : 'Ready';
  };

  const fontsReady = document.fonts && document.fonts.ready
    ? document.fonts.ready
    : Promise.resolve();

  const sceneReady = window.__sceneAssetsReady instanceof Promise
    ? window.__sceneAssetsReady
    : new Promise((resolve) => {
        window.addEventListener('three-scene:ready', resolve, { once: true });
      });

  Promise.race([
    Promise.all([fontsReady, sceneReady]),
    new Promise((resolve) => setTimeout(resolve, 7000)),
  ]).then(() => {
    window.__preloaderProgress?.(100);
    setTimeout(() => {
      if (typeof gsap !== 'undefined') {
        gsap.to(preloader, {
          opacity: 0,
          duration: 0.7,
          ease: 'power2.inOut',
          onComplete: () => {
            preloader.classList.add('hidden');
            dispatchHeroIntroStart();
          },
        });
      } else {
        preloader.classList.add('hidden');
        dispatchHeroIntroStart();
      }
    }, 250);
  });
}


/* ─────────────────────────────────────────────────────────
   CUSTOM CURSOR — #2
   Amber dot (instant) + lagging ring (GSAP quickTo)
───────────────────────────────────────────────────────── */

function initCursor() {
  const cursor = document.getElementById('cursor');
  if (!cursor || window.matchMedia('(hover: none)').matches) return;

  const dot  = cursor.querySelector('.cursor__dot');
  const ring = cursor.querySelector('.cursor__ring');
  if (!dot || !ring) return;

  // quickTo batches writes in the GSAP RAF loop — no new tween per mousemove
  const moveDotX  = gsap.quickTo(dot,  'x', { duration: 0 });
  const moveDotY  = gsap.quickTo(dot,  'y', { duration: 0 });
  const moveRingX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' });
  const moveRingY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' });

  window.addEventListener('mousemove', (e) => {
    moveDotX(e.clientX);
    moveDotY(e.clientY);
    moveRingX(e.clientX);
    moveRingY(e.clientY);
  });

  // Hover state on interactive elements
  const hoverEls = document.querySelectorAll('a, button, .service-card, .gallery-card, .pillar, .testimonial, .about-stat-card');
  hoverEls.forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('cursor--hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('cursor--hover'));
  });

  // Click flash
  window.addEventListener('mousedown', () => cursor.classList.add('cursor--click'));
  window.addEventListener('mouseup',   () => cursor.classList.remove('cursor--click'));

  // CTA state — add cursor--cta class for primary buttons (blend mode switches to amber)
  const ctaEls = document.querySelectorAll('.btn--primary, .nav__cta');
  ctaEls.forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('cursor--cta'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('cursor--cta'));
  });
}


/* ─────────────────────────────────────────────────────────
   SPLITTYPE TEXT REVEALS — #3
   Hero chars fly up; section titles reveal word-by-word
───────────────────────────────────────────────────────── */

function initSplitTextReveals() {
  if (prefersReducedMotion || typeof SplitType === 'undefined') return;

  // Hero title — characters fly up with perspective rotation
  const heroTitle = document.querySelector('.hero__title');
  if (heroTitle) {
    const split = new SplitType(heroTitle, { types: 'chars,words' });
    gsap.from(split.chars, {
      opacity: 0,
      y: '110%',
      rotateX: -90,
      stagger: { amount: 0.65, from: 'start' },
      duration: 0.85,
      ease: 'power4.out',
      delay: 0.6,
    });
  }

  // Section titles — overflow mask technique (Amendment 1)
  // Words rise from below an overflow:hidden parent — NO opacity fade
  document.querySelectorAll('.section__title, .about-narrative__title, .contact-info__title').forEach(el => {
    // Set aria-label before split
    if (!el.getAttribute('aria-label')) {
      el.setAttribute('aria-label', el.textContent.trim());
    }
    const split = new SplitType(el, { types: 'words' });
    if (!split.words?.length) return;
    wrapSplitWords(el);
    gsap.set(split.words, { y: '110%' });
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter() {
        gsap.to(split.words, {
          y: '0%',
          duration: 0.85,
          ease: 'power3.out',
          stagger: 0.055,
          clearProps: 'transform',
        });
      },
    });
  });

  // Rhetoric section animation is handled separately so its copy stays visible by default.
}


/* ─────────────────────────────────────────────────────────
   MAGNETIC BUTTONS — #4
   CTAs follow the cursor with elastic snap-back
───────────────────────────────────────────────────────── */

function initMagneticButtons() {
  if (window.matchMedia('(hover: none)').matches) return;

  document.querySelectorAll('.btn--primary, .btn--lg, .nav__cta').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = (e.clientX - cx) * 0.35;
      const dy = (e.clientY - cy) * 0.35;
      gsap.to(btn, { x: dx, y: dy, duration: 0.3, ease: 'power2.out' });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
    });
  });
}


/* ─────────────────────────────────────────────────────────
   GALLERY CARD TILT — #5
   3D perspective tilt tracking mouse within each card
───────────────────────────────────────────────────────── */

function initGalleryTilt() {
  if (window.matchMedia('(hover: none)').matches) return;

  document.querySelectorAll('.gallery-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      const rotY =  ((e.clientX - cx) / (rect.width  / 2)) * 8;
      const rotX = -((e.clientY - cy) / (rect.height / 2)) * 5;
      gsap.to(card, {
        rotateX: rotX,
        rotateY: rotY,
        scale: 1.03,
        duration: 0.4,
        ease: 'power2.out',
        transformPerspective: 800,
      });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        scale: 1,
        duration: 0.6,
        ease: 'elastic.out(1, 0.6)',
      });
    });
  });
}


/* ─────────────────────────────────────────────────────────
   SERVICES HORIZONTAL SCROLL — #6
   Pinned section: vertical scroll translates to horizontal
   Desktop only (≥1024px)
───────────────────────────────────────────────────────── */

function initServicesHScroll() {
  if (prefersReducedMotion || typeof gsap === 'undefined') return;

  const section = document.getElementById('services');
  const pinWrap = document.getElementById('servicesPin');
  const track = document.querySelector('.services__scroll-track');
  const grid  = document.querySelector('.services__grid');
  const viewport = track?.parentElement;
  if (!section || !pinWrap || !track || !grid || !viewport) return;

  const media = gsap.matchMedia();

  const disableHorizontalMode = () => {
    section.classList.remove('services--horizontal');
    gsap.set(track, { clearProps: 'transform' });
  };

  media.add('(min-width: 1024px)', () => {
    section.classList.add('services--horizontal');

    const getOverflow = () => Math.max(0, grid.scrollWidth - viewport.clientWidth);
    const getScrollDistance = () => getOverflow() + 120;
    // Only pin when overflow is meaningful (cards actually scroll) but not so large it creates
    // an unintentional blank spacer. Budget is recomputed in getScrollDistance for refresh safety.
    const MIN_OVERFLOW_TO_PIN = 520;
    const MAX_SCROLL_BUDGET = () => Math.min(window.innerHeight * 0.8, 800);

    if (getOverflow() < MIN_OVERFLOW_TO_PIN || getScrollDistance() > MAX_SCROLL_BUDGET()) {
      disableHorizontalMode();
      return disableHorizontalMode;
    }

    const tween = gsap.to(track, {
      x: () => -getOverflow(),
      ease: 'none',
      scrollTrigger: {
        trigger: pinWrap,
        start: 'top top',
        end: () => '+=' + getScrollDistance(),
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      disableHorizontalMode();
    };
  });
}


/* ─────────────────────────────────────────────────────────
   ACTIVE NAV HIGHLIGHTING — #7
   Highlights current section link as user scrolls
───────────────────────────────────────────────────────── */

function initNavHighlight() {
  const navLinks = [...document.querySelectorAll('.nav__link')];
  if (!navLinks.length) return;

  const sections = ['services', 'process', 'gallery', 'about', 'testimonials', 'contact']
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  if (!sections.length) return;

  let activeId = null;
  let rafId = null;

  function setActive(id) {
    if (id === activeId) return;
    activeId = id;
    navLinks.forEach(a => {
      a.classList.toggle('nav__link--active', !!id && a.getAttribute('href') === '#' + id);
    });
  }

  function getClosestVisibleSection() {
    const viewportCenter = window.innerHeight * 0.5;
    let bestId = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.top >= window.innerHeight) return;

      const sectionCenter = rect.top + rect.height / 2;
      const containsCenter = rect.top <= viewportCenter && rect.bottom >= viewportCenter;
      const distance = containsCenter ? 0 : Math.abs(sectionCenter - viewportCenter);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestId = section.id;
      }
    });

    return bestId;
  }

  function queueActiveUpdate() {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      setActive(getClosestVisibleSection());
    });
  }

  ScrollTrigger.create({
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: queueActiveUpdate,
    onRefresh: queueActiveUpdate,
  });

  if (lenis) {
    lenis.on('scroll', queueActiveUpdate);
  } else {
    window.addEventListener('scroll', queueActiveUpdate, { passive: true });
  }

  window.addEventListener('resize', queueActiveUpdate);
  queueActiveUpdate();
}


/* ─────────────────────────────────────────────────────────
   SECTION BACKGROUND PARALLAX — #9
   Subtle background shift at different rate than content
───────────────────────────────────────────────────────── */

function initParallaxSections() {
  if (prefersReducedMotion) return;

  ['.services', '.gallery', '.testimonials'].forEach(sel => {
    const el = document.querySelector(sel);
    if (!el) return;
    gsap.to(el, {
      backgroundPositionY: '30%',
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  });
}


/* ─────────────────────────────────────────────────────────
   CONTACT FORM — VALIDATION + NO-RELOAD FOLLOW-UP
───────────────────────────────────────────────────────── */

function initContactFormSubmission() {
  const form = document.querySelector('.contact-form');
  const status = document.getElementById('formStatus');
  const followup = document.getElementById('formFollowup');
  const smsLink = document.getElementById('formSmsLink');
  if (!form || !status || !followup || !smsLink) return;

  const fieldIds = ['contactName', 'contactPhone', 'contactEmail', 'contactService', 'contactMessage'];
  const fields = fieldIds
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const clearErrors = () => fields.forEach((field) => field.removeAttribute('aria-invalid'));

  const setStatus = (message, type) => {
    status.textContent = message;
    status.classList.remove('form-status--error', 'form-status--success');
    if (type) status.classList.add(`form-status--${type}`);
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearErrors();
    followup.hidden = true;

    const nameField = document.getElementById('contactName');
    const phoneField = document.getElementById('contactPhone');
    const emailField = document.getElementById('contactEmail');
    const serviceField = document.getElementById('contactService');
    const messageField = document.getElementById('contactMessage');
    if (!nameField || !phoneField || !emailField || !serviceField || !messageField) return;

    const name = nameField.value.trim();
    const phone = phoneField.value.trim();
    const email = emailField.value.trim();
    const service = serviceField.value.trim();
    const message = messageField.value.trim();

    const invalidFields = [];
    const phoneDigits = phone.replace(/\D/g, '');
    const emailLooksValid = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!name) invalidFields.push(nameField);
    if (!service) invalidFields.push(serviceField);
    if (message.length < 15) invalidFields.push(messageField);
    if (!phoneDigits && !email) invalidFields.push(phoneField, emailField);
    if (phone && phoneDigits.length > 0 && phoneDigits.length < 10) invalidFields.push(phoneField);
    if (!emailLooksValid) invalidFields.push(emailField);

    if (invalidFields.length) {
      [...new Set(invalidFields)].forEach((field) => field.setAttribute('aria-invalid', 'true'));
      setStatus('Please add your name, service, project details, and either a valid phone number or email.', 'error');
      invalidFields[0]?.focus();
      return;
    }

    const serviceLabel = serviceField.options[serviceField.selectedIndex]?.textContent || service;
    const requestBody = [
      `Hi ProCraft, this is ${name}.`,
      `I'm looking for help with: ${serviceLabel}.`,
      `Project details: ${message}`,
      phone ? `Phone: ${phone}` : null,
      email ? `Email: ${email}` : null,
    ].filter(Boolean).join(' ');

    smsLink.href = `sms:+12175550182?body=${encodeURIComponent(requestBody)}`;
    setStatus('Estimate request ready — use the text or call shortcut below so nothing gets lost in the shuffle.', 'success');
    followup.hidden = false;
    form.reset();
  });
}


/* ─────────────────────────────────────────────────────────
   SECTION FOLD TRANSITIONS — B6
   clip-path inset reveals for section inner containers.
   Apply to services, rhetoric, gallery header, about.
   (Amendment 2 — Dragonfly.xyz pattern)
───────────────────────────────────────────────────────── */

function initSectionFolds() {
  if (prefersReducedMotion) return;

  // Target section-reveal-inner elements (added to HTML in Phase C)
  $$('.section-reveal-inner').forEach(el => {
    sectionFold(el, { start: 'top 82%', duration: 1.2 });
  });

  // Also apply fold to section headers that have the class
  $$('.section__header--fold').forEach(el => {
    sectionFold(el, { start: 'top 85%', duration: 1.1, ease: 'expo.out' });
  });
}


function initAll() {
  initCursor();
  initMagneticButtons();
  initHeroCtaWake();
  initHeroSectionTransitionSignal();
  initNavHighlight();
  initHeroEntrance();
  initSectionReveals();
  initServiceCards();
  initTestimonials();
  initCountUp();
  initPillars();
  initCtaBand();
  initSectionTitleLines();
  initAmbientGlow();
  initProcessSteps();
  initGallery();
  initGalleryTilt();
  initTrustBadges();
  initContactForm();
  initContactFormSubmission();
  initRhetoricalSection();
  initParallaxSections();
  initSectionFolds();
  initServicesHScroll();
}

// Preloader must run immediately (before fonts) to register the progress callback
// so src/scene/index.js can call window.__preloaderProgress during GLB loading
initPreloader();

// Motion-kill mode: low-end touch devices get a functional static page
// (Amendment 6 — Dogstudio pattern: not "reduce", but "kill" entirely)
if (SHOULD_DISABLE_MOTION) {
  document.documentElement.classList.add('motion-disabled');
  // Only run the essential non-animation functions
  initNavHighlight();
  initContactFormSubmission();
  // SplitType: set all text visible without animation
  document.querySelectorAll('.section__title, .about-narrative__title, .contact-info__title').forEach(el => {
    gsap.set(el, { opacity: 1 });
  });
} else {
  // Full motion path: font-aware init
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      initAll();
      // SplitType reveals after fonts so metrics are accurate
      initSplitTextReveals();
      ScrollTrigger.refresh();

      // Update preloader status for screen readers
      const statusEl = document.getElementById('preloader-status');
      if (statusEl) statusEl.textContent = 'Page ready';
    });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      initAll();
      initSplitTextReveals();
    });
  }
}

// Tab-visibility optimization: pause scroll engine when tab hidden (D5)
document.addEventListener('visibilitychange', () => {
  if (!lenis) return;
  if (document.hidden) lenis.stop();
  else lenis.start();
});
