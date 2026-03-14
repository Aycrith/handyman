# PRD 06 — Typography-in-Motion & UI-to-3D Integration

**Status:** Planning
**Priority:** P1
**Files:** `src/site/index.js` (lines 545–589, 906–944), `src/scene/index.js`
**Depends on:** PRD 02 (Motion System, specifically `cinematic-sweep` and `velocity-scrub` modes)

---

## Objective

Elevate non-hero typography reveals into authored choreography. Strengthen the coupling between hero canvas events and DOM typography state. SplitType must be used meaningfully in every section title, not just the hero.

---

## Current State

### SplitType Usage

| Location | Split Type | Animation | Quality |
|----------|-----------|-----------|---------|
| Hero title | chars + words | `rotateX: -90° → 0` | ✓ Premium |
| Section titles | words | `opacity+y` basic | ✗ Generic |
| Rhetoric section | lines (manual) | `blur+opacity` | ✓ Good |
| Body copy | None | N/A | ✗ No reveal |

### Hero ↔ DOM Coupling

| Event | Scene Action | DOM Response |
|-------|-------------|-------------|
| `hero:cta-wake` | Amber bloom pulse | None (CTA just scales via CSS hover) |
| `hero:section-transition` | None | None |
| `hero:magic-pulse` | Bloom spike | None |

There's a one-way signal from DOM to scene (`hero:cta-wake`, `hero:magic-pulse`) but no scene → DOM signals. The hero scene energy peaks have no effect on when DOM typography reveals.

---

## Target State

### SplitType Typography System

Every section title uses `cinematic-sweep` (from PRD 02). The visual character:
- Words rise from below with skewY clearing (not just y-slide)
- `expo.out` easing (not `power2.out`) — fast arrival, slow settle
- Stagger 0.055s per word — rhythm feels deliberate
- Eyebrow line reveals before title (0.2s head start)

### Section Typography Hierarchy

| Level | Element | Treatment |
|-------|---------|-----------|
| Eyebrow | `.section-eyebrow` | Fade-in from y:10, 0.4s, no split |
| Title | `h2.section-title` | `cinematic-sweep` (SplitType word-level) |
| Subtitle | `.section-subtitle` | Fade from y:20, 0.6s, 0.15s after title starts |
| Body | `.section-body` | Fade from y:15, 0.5s, no split |

### Rhetoric Section Enhancement

The rhetoric section already has the best existing pattern (blur+opacity). Extend it:
- Line-by-line reveal with velocity bias (Lenis velocity at entry moment)
- Each line's `filter: blur()` intensity starts at `velocity × 0.4px` (capped at 6px)
- Amber accent words in the statement: highlight fires 0.4s after line settles
- Em element pulse: `--color-amber-bright` background-clip text, subtle glow on reveal

### Scene → DOM Signals (New)

```js
// In src/scene/index.js — fire DOM events from scene milestones

// When reveal phase completes and tool is fully visible:
window.dispatchEvent(new CustomEvent('scene:reveal-complete', {
  detail: { quality: currentTier } // 'desktop' | 'mobile' | 'low'
}));

// When lockup phase begins (stable composition):
window.dispatchEvent(new CustomEvent('scene:lockup-begin'));
```

```js
// In src/site/index.js — hero entrance sync

// Option: delay hero copy reveal until scene:lockup-begin
window.addEventListener('scene:lockup-begin', () => {
  // Trigger hero body copy reveal (currently instant after preloader)
  initHeroBodyCopyReveal(); // new function: reveals h1 sub-copy + hero CTAs
});
```

---

## Technical Implementation

### `initSectionTitleReveal()` — Replaces per-section title code

```js
// New function replacing all individual section title inits
function initSectionTitleReveal(selector = '.section-title', opts = {}) {
  const titles = document.querySelectorAll(selector);

  titles.forEach((title) => {
    const section = title.closest('section, .section, .rhetoric-section');

    // 1. Eyebrow reveals first (if present)
    const eyebrow = section?.querySelector('.section-eyebrow');
    if (eyebrow) {
      gsap.fromTo(eyebrow,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out',
          scrollTrigger: { trigger: title, start: 'top 88%', once: true }
        }
      );
    }

    // 2. Title: cinematic-sweep
    motionMode(title, 'cinematic-sweep', {
      start: 'top 85%',
      delay: eyebrow ? 0.15 : 0,
      ...opts
    });

    // 3. Subtitle reveals after title
    const subtitle = section?.querySelector('.section-subtitle');
    if (subtitle) {
      gsap.fromTo(subtitle,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out',
          delay: 0.3,
          scrollTrigger: { trigger: title, start: 'top 85%', once: true }
        }
      );
    }
  });
}
```

### `initRhetoricalSection()` Extension

```js
// Extend existing function (lines 721–778) with velocity bias
function initRhetoricalSection() {
  // ... existing setup ...

  // NEW: velocity sampling at entry moment
  let entryVelocity = 0;
  lenis.on('scroll', ({ velocity }) => { entryVelocity = Math.abs(velocity); });

  lines.forEach((line, i) => {
    ScrollTrigger.create({
      trigger: line,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        const blurStart = Math.min(entryVelocity * 0.4, 6); // caps at 6px
        gsap.fromTo(line,
          { opacity: 0, y: 20, filter: `blur(${blurStart}px)` },
          { opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 0.8 + (blurStart / 6) * 0.4, // more blur = slightly slower reveal
            ease: 'power2.out',
            delay: i * 0.1
          }
        );
      }
    });
  });

  // Amber em elements light up after their line settles
  document.querySelectorAll('.rhetoric-section em').forEach(em => {
    ScrollTrigger.create({
      trigger: em,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.fromTo(em,
          { '--em-opacity': 0 },
          { '--em-opacity': 1, duration: 0.6, ease: 'power3.out', delay: 0.5 }
        );
      }
    });
  });
}
```

### CSS for Amber Em Highlight

```css
.rhetoric-section em {
  font-style: normal;
  background: var(--gradient-amber);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  opacity: var(--em-opacity, 1); /* GSAP animates this from 0→1 */
}
```

---

## Acceptance Criteria

- [ ] All section titles use `cinematic-sweep` (SplitType word-level, skewY)
- [ ] Eyebrow text reveals 0.15s before title in each section
- [ ] Section subtitles/body copy reveal after title (0.3s delay)
- [ ] Rhetoric section: velocity-biased reveal (fast scroll = stronger blur start)
- [ ] Rhetoric `<em>` words light up 0.5s after their line settles
- [ ] `scene:lockup-begin` event fired from scene; hero body copy responds
- [ ] All SplitType splits preserve `aria-label` on parent element
- [ ] Screen readers: correct content order, no garbled words from split DOM
- [ ] Reduced-motion: all text instantly visible, no blur or transform
