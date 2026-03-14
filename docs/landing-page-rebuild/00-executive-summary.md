# Landing Page World-Class Transformation — Executive Summary

**Date:** 2026-03-14
**Branch:** feat/landing-page-rebuild
**Status:** Planning Phase

---

## Mission

Transform the Handyman landing page from a technically capable 3D hero with generic 2D sections into a fully authored, world-class immersive web experience. Every section must have a designed visual identity, a distinct motion grammar, and a coherent narrative voice.

---

## Current State at a Glance

| Dimension | Current | Target |
|-----------|---------|--------|
| Hero scene | World-class (director phases, quality tiers, bespoke GLB pack) | Maintain + Phase 3 finishing |
| Below-fold sections | 10 sections, 27 `initX()` functions, single reveal pattern | 4-mode motion grammar, distinct section identities |
| Motion grammar | One pattern: `opacity+y` → `power2.out` | Cinematic sweep / Precision stagger / Velocity scrub / Ambient drift |
| Typography in motion | Hero title only (SplitType chars) | Every section title + rhetoric section |
| Visual identities | Uniform dark glass cards everywhere | Blueprint workshop / Evidence room / Precision workflow / Statement room |
| CSS design tokens | 50+ global tokens, no per-section overrides | Section-scoped CSS variable trees |
| Post-processing | UnrealBloom + CopyShader only | + DoF (selective) + chromatic aberration (CTA burst) + film grain (GLSL) |
| Custom shaders | Zero | `grain.glsl` + `grade.glsl` as ShaderPass |
| Mobile UX | Shrunk desktop port | Distinct touch tier: accordion services, swipe gallery, no tilt |
| Accessibility | 109 ARIA attrs, no skip link, SplitType breaks aria-label | Skip link, aria preservation, amber focus ring |
| Loading | 7s hard timeout, no skeleton | 3-stage progressive reveal + skeleton content |
| Performance | Single JS chunk, no RAF cap | Code-split chunks, hidden-tab suppression |
| Test coverage | Hero assets, UI smoke, desktop/mobile effects | + Section reveals + a11y regression |

---

## The Core Problem

The 3D hero quality ceiling is world-class. Everything below the fold is generic. The visual and kinetic quality gap between the hero and the rest of the page undermines the entire experience — visitors who scroll past the hero encounter a site that feels like a different, lesser product.

---

## Transformation Architecture

**Stack:** Vanilla JS + Three.js r134 + GSAP 3.14 + Lenis 1.3 + SplitType 0.3 + Vite 8
**Approach:** 100% additive — no framework migration, no Three.js upgrade in scope, all changes extend existing patterns.

### 4 Phases

| Phase | Name | Goal | Unlocks |
|-------|------|------|---------|
| Phase 0 | Asset Inventory | Assess 40+ 3D models in `assets/3dmodels/` | Which assets can feed Phases A–D |
| Phase A | Foundation | Motion grammar + CSS design system extension + atmospheric scroll thread | All section work |
| Phase B | Motion Grammar | Authored sectional animation for every section | Phase C |
| Phase C | Sectional Identity | Visual identity per section (4 distinct "rooms") | Phase D |
| Phase D | Finishing | Shaders, mobile UX, loading, a11y, performance, QA | Ship |

---

## Key Files

| File | Role | Lines |
|------|------|-------|
| `src/site/index.js` | 27 initX() functions, motion grammar | 1,266 |
| `src/scene/index.js` | Director phases, particles, EffectComposer | 9,359 |
| `styles.css` | Design tokens, section CSS, animations | 2,615 |
| `index.html` | Section structure, 10 sections, ARIA | 937 |
| `vite.config.mjs` | Build config (no chunk split yet) | ~10 |

---

## Success Metrics

1. Visual inspection: every section has a distinct motion character and visual identity
2. `npm test` passes all suites including 2 new ones (sections + a11y)
3. Frame budget: ≤16.7ms desktop, ≤22ms mobile
4. LCP-eligible content visible within 1s (progressive loading)
5. axe-core: 0 critical violations
6. Mobile at 430×932 and 390×844: intentional, touch-native experience
7. Vite build: no chunk-size warnings

---

## Document Index

| Document | Content |
|----------|---------|
| `00-executive-summary.md` | This file |
| `00b-asset-inventory.md` | Phase 0: 3D model assessment and utilization decisions |
| `01-current-state-audit.md` | Detailed audit of all 27 initX(), CSS tokens, scene architecture |
| `02-reference-synthesis.md` | Motion grammar references, world-class benchmarks |
| `03-gap-analysis.md` | Prioritized gap table (impact × effort) |
| `04-prioritized-roadmap.md` | Week-by-week implementation order with dependencies |
| `05-world-class-polish-checklist.md` | Per-section acceptance criteria |
| `prds/01-scene-redesign.md` | 3D scene art direction (extends existing roadmap) |
| `prds/02-motion-system.md` | Motion grammar: 4-mode dispatch system |
| `prds/03-camera-system.md` | Director phase extensions + scroll handoff |
| `prds/04-interaction-system.md` | Cursor, magnetic, drag, CTA pulse |
| `prds/05-environment-fx.md` | CSS particle layer + scroll depth variables |
| `prds/06-ui-3d-integration.md` | Typography-in-motion + canvas→DOM coupling |
| `prds/07-shaders-lighting-materials.md` | GLSL shaders + EffectComposer expansion |
| `prds/08-loading-progressive-enhancement.md` | 3-stage progressive reveal |
| `prds/09-performance-device-tiering.md` | Code splitting, RAF cap, frame budgets |
| `prds/10-mobile-touch-strategy.md` | Mobile as distinct UX tier |
| `prds/11-accessibility-reduced-motion.md` | Skip link, aria, focus rings, reduced-motion |
| `prds/12-polish-qa.md` | Test strategy + acceptance bar |
