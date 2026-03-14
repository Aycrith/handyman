# PRD 04 — Interaction Design System

**Status:** Planning
**Priority:** P1
**Files:** `src/site/index.js` (lines 867–968), `src/scene/index.js`
**Depends on:** Nothing (formalizes existing system)

---

## Objective

Formalize cursor semantics, magnetic button behavior, drag wake, and CTA feedback into a coherent authored system. Every interactive element should have deliberate, consistent feedback.

---

## Current State

### What Exists

- Custom cursor: dot + lagging ring via `gsap.quickTo` (lines 867–898)
- Magnetic buttons: 0.35 offset, elastic snap-back (lines 952–968)
- CTA hover: dispatches `hero:cta-wake` event → scene responds
- CTA click: dispatches `hero:magic-pulse` event → scene bloom spike
- Drag wake: not implemented
- Touch detection: exists (`navigator.maxTouchPoints > 0`) but inconsistently applied

### Cursor Implementation

```js
// Existing (good, keep)
const quickX = gsap.quickTo(ring, 'x', { duration: 0.6, ease: 'power3' });
const quickY = gsap.quickTo(ring, 'y', { duration: 0.6, ease: 'power3' });
// Dot follows cursor exactly; ring lags with easing
```

### Known Issues

- No `cursor--drag` state (pressing and dragging has no visual feedback)
- Magnetic effect applies globally to `.btn--primary` regardless of context
- `hero:magic-pulse` parameters not documented — event handlers may not coordinate
- Touch devices: cursor is hidden but magnetic handlers still attached (unnecessary listeners)

---

## Target State

### 4 Cursor States

| State | Trigger | CSS Class | Visual |
|-------|---------|-----------|--------|
| `default` | No interaction | — | Amber dot + lagging ring |
| `hover` | Mouse over interactive element | `cursor--hover` | Ring expands 1.5×, fills slightly |
| `drag` | Pointer down + moving | `cursor--drag` | Ring collapses 0.6×, dot brightens |
| `cta` | Mouse over primary CTA | `cursor--cta` | Ring becomes amber-filled circle, dot hides |

### State Transitions

```
default ←→ hover (interactive elements)
default ←→ drag (on pointerdown+move)
default/hover → cta (on CTA hover, overrides hover)
drag → default (on pointerup)
```

### Interaction Vocabulary

| Interaction | Effect | Scope |
|-------------|--------|-------|
| hover | Local awakening: element scales slightly, cursor state changes | All interactive elements |
| drag | Environmental wake: particle field disturbance in scene | Hero canvas area |
| click (CTA) | Premium pulse: `hero:magic-pulse` → CA burst + bloom spike | Primary CTAs only |
| scroll | Cinematic state machine: director phases → scroll-transition | Global |

---

## Technical Implementation

### Cursor State Machine

```js
// src/site/index.js — extend initCursor()
const cursorStates = ['default', 'hover', 'drag', 'cta'];
let currentCursorState = 'default';

function setCursorState(state) {
  if (currentCursorState === state) return;
  cursor.classList.remove(...cursorStates.map(s => `cursor--${s}`));
  if (state !== 'default') cursor.classList.add(`cursor--${state}`);
  currentCursorState = state;
}

// Hover state on interactive elements
document.querySelectorAll('a, button, [role="button"], .gallery-card').forEach(el => {
  el.addEventListener('mouseenter', () => setCursorState(el.matches('.btn--primary') ? 'cta' : 'hover'));
  el.addEventListener('mouseleave', () => setCursorState('default'));
});

// Drag state
document.addEventListener('pointerdown', () => {
  if (window.matchMedia('(pointer:fine)').matches) setCursorState('drag');
});
document.addEventListener('pointerup', () => setCursorState('default'));
```

### CSS Cursor State Styles

```css
/* Cursor state transitions */
.cursor-ring { transition: width 0.2s ease, height 0.2s ease, background 0.2s ease; }

.cursor--hover .cursor-ring { width: 36px; height: 36px; }
.cursor--drag  .cursor-ring { width: 20px; height: 20px; opacity: 0.8; }
.cursor--cta   .cursor-ring {
  width: 44px; height: 44px;
  background: var(--color-amber);
  opacity: 0.3;
}
.cursor--cta   .cursor-dot  { opacity: 0; }
```

### Drag Wake (Scene Integration)

```js
// In src/scene/index.js
// Listen for drag wake events dispatched from site/index.js
let dragWakeStrength = 0;

window.addEventListener('hero:drag-wake', (e) => {
  dragWakeStrength = Math.min(e.detail.speed / 20, 1.0); // 0→1
});

// In RAF loop: apply dragWakeStrength to particle force field
// Decay over 0.5s:
dragWakeStrength *= 0.95; // per frame decay
```

### Touch Device Cleanup

```js
// In initCursor(): guard at top
if (window.matchMedia('(pointer:coarse)').matches) {
  // Completely skip cursor setup — remove DOM elements
  document.querySelector('.cursor-dot')?.remove();
  document.querySelector('.cursor-ring')?.remove();
  return; // No cursor on touch
}

// In initMagneticButtons(): add same guard
if (window.matchMedia('(pointer:coarse)').matches) return;
```

### `hero:magic-pulse` Formalization

```js
// Standardized event parameters
window.dispatchEvent(new CustomEvent('hero:magic-pulse', {
  detail: {
    strength: 1.0,           // 0→1, burst intensity
    caStrength: 0.006,        // Chromatic aberration amount
    bloomSpike: 0.4,          // Additional bloom strength (added to base)
    duration: 16,             // ms for CA burst
    bloomDecay: 0.8           // s for bloom to return to normal
  }
}));
```

---

## Acceptance Criteria

- [ ] 4 cursor states visually distinct and correctly triggered
- [ ] `cursor--drag` state fires on pointerdown+move (not just pointerdown)
- [ ] `cursor--cta` overrides `cursor--hover` on primary CTA buttons
- [ ] Drag wake dispatches `hero:drag-wake` event; scene responds with particle disturbance
- [ ] Touch devices: cursor elements removed from DOM on touch detection
- [ ] Touch devices: magnetic button listeners not attached
- [ ] `hero:magic-pulse` documented parameters; CA burst fires on CTA click
- [ ] All cursor transitions are smooth (no GSAP tween, CSS transitions suffice)
- [ ] No performance impact: cursor update remains in `mousemove` handler with RAF synchronization
