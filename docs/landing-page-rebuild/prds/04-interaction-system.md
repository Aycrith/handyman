# PRD 04 — Interaction Design System

**Amendment 5 applied:** Cursor mix-blend-mode: exclusion

## Objective

Formalize cursor semantics, magnetic button behavior, drag wake, and CTA feedback into a coherent authored system.

## Cursor States

| State | Trigger | Visual |
|-------|---------|--------|
| Default | Page idle | White dot (16px) + white ring (40px), `mix-blend-mode: exclusion` |
| Hover | Over links/buttons | Ring scales to 60px, dot stays |
| CTA | Over primary CTAs | Amber fill (blend mode OFF), ring glows amber |
| Drag | Mouse down + move | Ring stretches to ellipse (scaleX 1.4), amber |
| Pointer | Over tool in hero | Ring becomes crosshair, contracts to 28px |

## Cursor Blend Mode Implementation (Amendment 5)

```css
.cursor-dot {
  mix-blend-mode: exclusion;
  background: white;         /* White in exclusion mode inverts dark bg = visible white */
}
.cursor-ring {
  mix-blend-mode: exclusion;
  border-color: white;
}

/* CTA state: disable blend mode, use amber */
.cursor--cta .cursor-dot {
  mix-blend-mode: normal;
  background: var(--color-amber);
}
.cursor--cta .cursor-ring {
  mix-blend-mode: normal;
  border-color: var(--color-amber);
  box-shadow: 0 0 12px var(--color-amber);
}
```

The `exclusion` blend mode: the cursor appears white on dark backgrounds (which is the page default) but inverts to appear dark on any light content. This ensures the cursor is ALWAYS visible regardless of background color — a signature of premium cursor work.

## Magnetic Buttons

```js
// Existing: 0.35× pull factor, elastic.out(1, 0.5) snap-back
// Keep existing, ensure touch devices get pointer:coarse check
const IS_TOUCH = window.matchMedia('(pointer: coarse)').matches;
if (!IS_TOUCH) initMagneticButtons();
```

## Touch: Disable Cursor Entirely

```js
if (IS_TOUCH) {
  document.documentElement.classList.add('no-cursor');
  return; // Skip initCursor()
}
```

```css
.no-cursor .cursor-dot,
.no-cursor .cursor-ring { display: none; }
```

## Interaction Events

| Event | Source | Consumer |
|-------|--------|---------|
| `hero:cta-wake` | CTA hover/focus | Scene — increases particle glow |
| `hero:magic-pulse` | CTA click | Scene — particle energy burst |
| `hero:section-transition` | Scroll progress | Scene — camera phase |
| `cursor:state-change` | Cursor system | CSS class on `.custom-cursor` |

## Acceptance

- Cursor always visible on dark/light sections via exclusion blend
- Touch devices: no custom cursor, no magnetic buttons
- CTA state: amber fill (exclusion disabled)
- 0 cursor capture bugs (canvas has `pointer-events: none`)
