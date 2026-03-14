# PRD 11 — Accessibility & Reduced-Motion Strategy

## Objective

Harden accessibility beyond existing foundations. Ensure all motion systems degrade correctly.

## Skip Link

```html
<!-- First element inside <body> -->
<a class="skip-link" href="#main-content">Skip to main content</a>
```

```css
.skip-link {
  position: absolute;
  top: -100%;
  left: 1rem;
  z-index: 9999;
  padding: 0.5rem 1rem;
  background: var(--color-amber);
  color: #0a0c12;
  font-weight: 700;
  border-radius: 4px;
  transition: top 0.2s;
}
.skip-link:focus {
  top: 1rem;
}
```

## SplitType Aria Preservation

```js
// ALWAYS set aria-label BEFORE calling new SplitType()
function splitWithAria(el, types) {
  el.setAttribute('aria-label', el.textContent.trim());
  return new SplitType(el, { types });
}
```

## Focus Styles

```css
/* Global amber focus ring on ALL interactive elements */
:focus-visible {
  outline: 2px solid var(--color-amber);
  outline-offset: 3px;
}
/* Remove default outline for mouse users */
:focus:not(:focus-visible) {
  outline: none;
}
```

## Preloader Live Region

```html
<div id="preloader-status" role="status" aria-live="polite" aria-atomic="true">
  <!-- Updated via JS: "Loading..." → "Page ready" -->
</div>
```

## Reduced-Motion Branch

```js
// Existing check — extend to cover all new motion systems
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
  // Set all split-word elements to final state immediately
  document.querySelectorAll('.split-word').forEach(el => {
    el.style.transform = 'none';
    el.style.opacity = '1';
  });
  // Skip all GSAP animations
  return;
}
```

## ARIA Landmarks

Verify all sections have proper landmark roles:
- `<nav>` for navigation
- `<main id="main-content">` wrapping all page content
- `<section aria-label="...">` for unnamed sections
- `<footer>` for footer

## Acceptance

- axe-core reports 0 critical violations
- Tab-navigation reaches all interactive elements in logical order
- Skip link appears on first Tab keypress and navigates to main content
- Reduced-motion: page fully readable, all animations disabled
- Screen readers get correct content via aria-label on split containers
- Focus ring: amber 2px, visible on all interactive elements
