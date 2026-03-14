# Gap Analysis — Prioritized by Impact × Effort

**Date:** 2026-03-14

---

## Scoring Criteria

**Visual Impact:** How much will this change the perceived quality of the page?
- Very High = immediately obvious to any visitor
- High = noticeable to design-aware visitor
- Medium = subtle quality signal
- Low = mostly internal/infrastructure

**Complexity:** Development effort and risk
- Low = 1–4 hours, low risk
- Medium = 4–16 hours, some integration risk
- High = 1–3 days, architectural touch
- Very High = 3+ days, major refactor or new system

---

## Master Gap Table

| # | Gap | Visual Impact | Complexity | Dependency | Priority |
|---|-----|--------------|------------|------------|----------|
| 1 | Motion grammar system (4 modes replacing 18 identical patterns) | **Very High** | Medium | Blocks all section work | **P0** |
| 2 | Per-section visual identities (Blueprint / Evidence / Precision / Statement) | **Very High** | Medium | CSS design system | **P0** |
| 3 | Scroll continuity / atmospheric thread below fold | **Very High** | Medium | Existing CSS-JS bridge | **P0** |
| 4 | Typography-in-motion (SplitType word-level skewY, not just opacity) | High | Low-Medium | Motion grammar | **P1** |
| 5 | Services card choreography (perspective-flip entrance, per-card parallax) | High | Medium | Motion grammar | **P1** |
| 6 | Gallery tilt depth (inner parallax, lift-hover) | High | Low | None | **P1** |
| 7 | Gallery visual identity (Evidence Room treatment) | High | Low | None | **P1** |
| 8 | Process connector animation (SVG stroke-dashoffset draw) | High | Medium | HTML SVG addition | **P1** |
| 9 | Skip-to-content link | Medium | **Low** | None | **P1** |
| 10 | SplitType aria-label preservation | Medium | **Low** | None | **P1** |
| 11 | CSS design system: per-section token overrides | High | Medium | None | **P1** |
| 12 | `initAmbientGlow()` — currently a no-op | High | Medium | CSS bridge | **P1** |
| 13 | Progressive loading / 3-stage reveal | High | Medium | Asset pipeline | **P1** |
| 14 | CSS ambient particle system (mid-page) | Medium | Medium | None | **P2** |
| 15 | Services mobile: vertical stack with accordion | High | High | Section redesign | **P2** |
| 16 | Gallery mobile: swipe carousel (not tilt) | High | Medium | None | **P2** |
| 17 | Custom GLSL shaders (grain + grade) | Medium-High | Very High | Three.js version | **P2** |
| 18 | Selective DoF (pre-reveal + reveal phases only) | Medium-High | High | Scene architecture | **P2** |
| 19 | Chromatic aberration on CTA click burst | Medium | High | CA shader | **P2** |
| 20 | Amber focus rings (all interactive elements) | Medium | Low | None | **P2** |
| 21 | Vite code-splitting (scene + site separate chunks) | Medium | Low | None | **P2** |
| 22 | RAF suppression on hidden tab | Medium | Low | None | **P2** |
| 23 | Hero scene Phase 3 (per existing roadmap) | Very High | High | Existing roadmap | **P0+** |
| 24 | Testimonials blur-to-sharp reveal | Medium | Low | Motion grammar | **P2** |
| 25 | About stat count-up visual redesign | Medium | Low | None | **P2** |
| 26 | Contact form section identity | Medium | Medium | CSS system | **P3** |
| 27 | Three.js upgrade (r134 → r170+) | Medium | Very High | All scene code | **P4** |
| 28 | Contact form backend | Low-Medium | High | Infrastructure | **P3** |
| 29 | Audio reactivity | Low | Very High | Browser API | **P4** |

---

## Critical Path Analysis

### P0 — Must complete before any P1 work begins

```
Motion grammar system (A1) → ALL section choreography
CSS design system extension (A2) → ALL section identities
Atmospheric scroll thread (A3) → Environmental FX work
```

These three form the critical path. None of the P1 section work is achievable at quality without them.

### P1 — High-value, unlocked by P0

The P1 items divide into two tracks that can proceed in parallel after P0:

**Track A — Motion quality:**
- Typography-in-motion (B2)
- Services choreography (B1)
- Gallery tilt depth (B3)
- Process connectors (B4)

**Track B — Section identity (fast CSS/HTML work):**
- Gallery Evidence Room (C2)
- Rhetoric Statement Room (C4)
- Services Blueprint (C1)
- Process Precision Workflow (C3)

**Track C — Quick accessibility wins:**
- Skip link (~30 min)
- SplitType aria-label preservation (~1 hour)
- Amber focus rings (~1 hour)

Track C should be done early in P1 — it's all low-effort, high-correctness-value work.

### P2 — Significant quality but after P1 foundation

P2 items are all "finishing" work that require stable section structure:
- GLSL shaders (D2): Can't iterate visually until section identities are stable
- DoF + CA (D1): Scene architecture changes that risk regression
- Mobile UX (D3): Needs section content stable before touch-tier specialization
- Progressive loading (D4): Needs section skeleton markup agreed first

### P3/P4 — Deferred or out-of-scope for this sprint

- Contact form backend: infrastructure dependency, separate sprint
- Three.js upgrade: high-risk, low-immediate-payoff, separate upgrade sprint
- Audio reactivity: experimental, no stakeholder requirement

---

## Effort × Impact Matrix

```
          LOW effort      MEDIUM effort     HIGH effort
HIGH      ┌────────────┐  ┌────────────┐  ┌────────────┐
impact    │ Skip link  │  │ Motion     │  │ Services   │
          │ Aria pres. │  │ grammar    │  │ mobile     │
          │ Focus ring │  │ CSS themes │  │ accordion  │
          │ Gallery    │  │ Services   │  │ DoF shader │
          │ tilt tweak │  │ choreog.   │  │            │
          └────────────┘  └────────────┘  └────────────┘
                               ^── DO THESE FIRST (P0/P1)

MEDIUM    ┌────────────┐  ┌────────────┐  ┌────────────┐
impact    │ RAF cap    │  │ CSS        │  │ GLSL grain │
          │ Code split │  │ particles  │  │ GLSL grade │
          │ Count-up   │  │ Progressive│  │ Three.js   │
          │ redesign   │  │ loading    │  │ upgrade    │
          └────────────┘  └────────────┘  └────────────┘
                               ^── P2 after foundation

LOW       ┌────────────┐  ┌────────────┐  ┌────────────┐
impact    │            │  │ Contact    │  │ Backend    │
          │            │  │ form ID    │  │ Audio      │
          └────────────┘  └────────────┘  └────────────┘
                                              ^── P3/P4
```

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Motion grammar refactor breaks existing hero reveal | Medium | High | Test harness runs after every init function change; keep hero functions untouched |
| GSAP ScrollTrigger conflicts between horizontal scroll + new vertical reveals | Medium | Medium | Test services section in isolation; use `gsap.context()` scoping |
| SplitType on section titles breaks screen reader flow | High (current bug) | Medium | Add aria-label before split; preserve via `split.el.setAttribute()` |
| GLSL shader introduces GPU flicker on mobile | Low | Medium | Gate all ShaderPass behind `CAN_RUN_DESKTOP_POST` (already used) |
| Progressive loading changes break preloader test | Medium | Medium | Update `validate-ui.js` in same PR as preloader change |
| gltf-transform processing corrupts materials | Low | Medium | Keep originals; write output to `assets/3dmodels/processed/` |
| CSS section themes conflict with global token system | Low | Low | Use CSS specificity carefully; prefer `.section-name .element` over `:root` overrides in sections |
