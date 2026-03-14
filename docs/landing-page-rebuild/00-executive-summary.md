# Landing Page World-Class Transformation — Executive Summary

**Date:** 2026-03-14
**Branch:** feat/landing-transformation
**Goal:** Transform the Handyman landing page from a technically capable 3D hero with generic 2D sections into a fully authored, world-class immersive web experience.

## Quality Bar

Benchmarked against: activetheory.net, dogstudio.co, henryheffernan.com, dragonfly.xyz, lhbzr.com, mantis.works, tplh.net, nohero.studio, mont-fort.com, sr-seventy.one, adaline.ai.

## Architecture (Unchanged)

Vanilla JS + Three.js r134 + GSAP 3 + Lenis + SplitType + Vite. Single HTML, monolithic `src/scene/index.js`, `src/site/index.js` (1,285 lines), `styles.css` (2,300 lines). All enhancements are additive.

## Core Problem

The 3D hero quality ceiling is world-class, but everything below the fold is generic. Non-hero sections use a single reveal pattern (opacity 0→1, y N→0). There is no motion grammar, no sectional world-building, no environmental continuity, no authored mobile tier.

## Transformation Phases

| Phase | Name | Deliverable |
|-------|------|-------------|
| A | Foundation | Motion grammar system, Lenis physics, CSS design system, atmospheric scroll thread |
| B | Motion Grammar | Per-section authored animation identities |
| C | Sectional Worlds | Blueprint/Evidence/Precision/Statement visual rooms |
| D | Polish & Finish | Loading choreography, mobile tier, accessibility, performance |

## Critical Amendments Applied (from reference-site research)

1. **Typography reveals** use overflow:hidden mask technique (NOT opacity fade)
2. **Section fold transitions** via clip-path inset
3. **Loading orchestration** with precise millisecond timing (no spinner)
4. **Lenis physics** with exponential decay easing
5. **Cursor** with mix-blend-mode: exclusion
6. **Motion-kill mode** for low-end touch devices (Dogstudio pattern)
7. **Font metric overrides** to prevent layout reflow during swap
8. **Canvas pointer-events: none** verified (Heffernan pattern)

## World-Class Quality Checks

| Check | Pass Condition |
|-------|---------------|
| Typography reveal | Words rise from below overflow mask — NO opacity fade visible |
| Loading sequence | No spinner; body fade + choreographed stagger feels like directed film |
| Scroll physics | Perceptible momentum "coasting" on fast-then-release scroll |
| Cursor | Always visible via exclusion blend on dark/light backgrounds |
| Section entry | ≥4 sections have clip-path fold-in |
| Section identity | Each of 4 themed sections feels like a distinct room |
| Mobile on low-end | Static page served, no broken animations |
| 3D hero timing | First 3 seconds staged; tool reveal has weight and ceremony |
| Font loading | No visible layout jump when fonts swap from fallback |
