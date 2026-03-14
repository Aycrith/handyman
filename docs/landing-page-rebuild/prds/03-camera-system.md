# PRD 03 — Camera Choreography & Transition System

**Status:** Planning
**Priority:** P0 (parallel with site work)
**Files:** `src/scene/index.js` (SHOT_CONFIG, director phases)
**Depends on:** Existing director phase state machine

---

## Objective

Extend the existing director phases with richer intro dramaturgy and a designed scroll handoff that doesn't just fade out. The intro should feel staged (3-beat sequence). The scroll-out should feel like a camera move, not a dissolve.

---

## Current State

### Director Phases (Working)

| Phase | Duration | Camera Preset | Issue |
|-------|---------|--------------|-------|
| `static-layout` | Until scene ready | lockup | Fine |
| `pre-reveal` | 520ms | preReveal | **Transition to reveal is abrupt** |
| `reveal` | 960ms | reveal | **Tool just appears, no build** |
| `lockup` | 940ms | lockup | Good |
| `interactive-idle` | Until scroll | interactiveIdle | Good |
| `scroll-transition` | Scroll-driven | scrollTransition | **Feels like dissolve, not move** |

### SHOT_CONFIG (Existing, Desktop Tier)

```js
// Example: desktop preReveal
{ z: 7.2, fov: 62, targetRotX: -0.024, targetRotY: 0.0, pointerGain: 0.01, sway: 0.3 }

// desktop lockup
{ z: 6.52, fov: 56, targetRotX: -0.02, targetRotY: 0.01, pointerGain: 0.04, sway: 0.6 }

// desktop scrollTransition
{ z: 9.0, fov: 70, ... } // compresses away — feels abrupt
```

---

## Target State

### 3-Beat Intro Sequence

Beat 1 (0–520ms, `pre-reveal`):
- Dark atmospheric chamber
- Strong vignette (90% opacity)
- Particles: flow ribbons + heavy cloud motes
- Camera: slightly farther back (z: 7.8), wider FOV (64°)
- DoF: maximum — background is fully blurred

Beat 2 (520–1480ms, `reveal`):
- Tool materializes from particle convergence
- Vignette lifts (70% → 45%)
- Camera: slowly dollies in toward lockup position
- DoF: eases off as tool clarifies
- `flowRibbon` particles dissolve

Beat 3 (1480–2420ms, `lockup`):
- Tool is pin-sharp, full color
- Vignette at stable level (35%)
- DoF: off entirely
- Camera: settled at lockup position, slight sway begins
- Particles: settled ambient only

### Scroll Handoff Redesign

Current: scroll compresses camera (z increases) and fades out — abrupt.

Target:
1. Scroll 0–30%: camera begins slow dolly backward (z: 6.52 → 7.5) — feels like stepping back
2. Scroll 30–60%: particles begin to diverge (radially expand, not just fade)
3. Scroll 60–80%: hero content (DOM) fades; canvas continues to dolly
4. Scroll 80–100%: canvas opacity → 0, scene suspended (RAF rate drops to 10fps to preserve GPU)

---

## Technical Implementation

### Sub-State Additions to SHOT_CONFIG

Add sub-phase modifiers without restructuring existing SHOT_CONFIG:

```js
// New additions to SHOT_CONFIG
PRE_REVEAL_PHASE_OVERRIDES: {
  desktop: { z: 7.8, fov: 64, vignette: 0.90, dofMaxBlur: 0.01 },
  mobile:  { z: 7.0, fov: 60, vignette: 0.85, dofMaxBlur: 0 }
},
REVEAL_PHASE_OVERRIDES: {
  desktop: { z: 7.0, fov: 58, vignette: 0.55, dofMaxBlur: 0.005 },
  mobile:  { z: 6.8, fov: 56, vignette: 0.50, dofMaxBlur: 0 }
},
LOCKUP_PHASE_OVERRIDES: {
  desktop: { z: 6.52, fov: 56, vignette: 0.35, dofMaxBlur: 0 },
  mobile:  { z: 6.0, fov: 54, vignette: 0.30, dofMaxBlur: 0 }
}
```

### Scroll Transition Extension

In `src/scene/index.js`, extend the scroll-transition ScrollTrigger:

```js
// Existing: scroll progress 0→1 drives z 6.52→9.0
// New: add particle divergence + staged canvas fade

ScrollTrigger.create({
  trigger: '.hero',
  start: 'top top',
  end: 'bottom top',
  scrub: true,
  onUpdate: (self) => {
    const p = self.progress;

    // Camera dolly (existing, keep)
    camera.position.z = gsap.utils.interpolate(6.52, 9.5, p);

    // NEW: Particle divergence (0.3→0.8 range)
    const divergence = gsap.utils.clamp(0, 1, (p - 0.3) / 0.5);
    updateParticleDivergence(divergence);

    // NEW: Canvas staged fade (0.7→1.0 range)
    const canvasFade = gsap.utils.clamp(0, 1, (p - 0.7) / 0.3);
    renderer.domElement.style.opacity = 1 - canvasFade;

    // NEW: RAF rate reduction when fully scrolled past
    if (p > 0.95 && !sceneSuspended) suspendScene();
    if (p < 0.9 && sceneSuspended) resumeScene();
  }
});
```

### Scene Suspend/Resume (Performance)

```js
let sceneSuspended = false;
let lowFpsInterval = null;

function suspendScene() {
  sceneSuspended = true;
  cancelAnimationFrame(rafId);
  // Low-rate render: 10fps maintenance to preserve WebGL context
  lowFpsInterval = setInterval(() => renderer.render(scene, camera), 100);
}

function resumeScene() {
  sceneSuspended = false;
  clearInterval(lowFpsInterval);
  rafId = requestAnimationFrame(tick); // resume full RAF
}
```

---

## Vignette State Management

Currently vignette is a CSS overlay (`scene-overlay`). Extend to be phase-driven:

```js
// In director phase transition handler:
const VIGNETTE_STRENGTHS = {
  'pre-reveal': 0.90,
  'reveal': 0.55,
  'lockup': 0.35,
  'interactive-idle': 0.35,
  'scroll-transition': 0.20 // lightens as camera pulls back
};

function onPhaseChange(newPhase) {
  const strength = VIGNETTE_STRENGTHS[newPhase] ?? 0.35;
  gsap.to('.scene-overlay', {
    opacity: strength,
    duration: 0.8,
    ease: 'power2.inOut'
  });
}
```

---

## Acceptance Criteria

- [ ] 3-beat intro is visually perceptible: dark atmospheric → tool emergence → settled hero
- [ ] Beat transitions feel staged (not instant cuts)
- [ ] Scroll-out: camera dolly backward is perceptible before fade
- [ ] Particle divergence on scroll-out is subtle (enhances, doesn't distract)
- [ ] Canvas opacity fade starts at 70% scroll (not at 0%)
- [ ] Scene suspends low-power render when hero fully scrolled past
- [ ] Vignette strength changes per phase (strong in pre-reveal, lighter in lockup)
- [ ] All changes preserve existing hero test suite results
- [ ] No scroll jank — `scrub: true` remains smooth with Lenis
