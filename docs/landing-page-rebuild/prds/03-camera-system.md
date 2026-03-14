# PRD 03 — Camera Choreography & Transition System

## Objective

Extend existing director phases with richer intro dramaturgy and a designed scroll handoff.

## Current State

5 director phases: `static-layout`, `pre-reveal`, `reveal`, `lockup`, `interactive-idle`, `scroll-transition`. Scroll-transition compresses but feels abrupt.

## Target

### Intro: 3-Beat Sequence
1. **Dark** (`pre-reveal`): camera pulled back, low-key lighting, particles sparse
2. **Atmospheric wake**: ambient lights rise, particles gain energy, HDRI contribution increases
3. **Hero reveal** (`reveal`): key light hits tool, particles orbit, composition settles

### Scroll-Out: Camera Move (not dissolve)
- `scroll-transition`: add deeper dolly (z-axis push forward) + particle convergence
- Tools should feel like they're retreating into the workshop, not fading to white

## Sub-States in pre-reveal

```js
// SHOT_CONFIG additions:
preReveal: {
  subStates: ['dark', 'wake', 'ready'],
  dark:  { duration: 400, lightRig: 'darkRoom', particleEnergy: 0.1 },
  wake:  { duration: 600, lightRig: 'ambientWake', particleEnergy: 0.4 },
  ready: { duration: 200, lightRig: 'preRevealReady', particleEnergy: 0.7 },
}
```

## Scroll-Transition Enhancement

```js
// Extend scrollTransition phase:
// - Add z-axis dolly: camera.position.z decreases (pushes forward into scene)
// - Particle convergence: particles contract toward tool origin before cutaway
// - Lighting: key light dims, atmosphere light holds last
```

## Acceptance

- Intro feels staged — 3 distinct beats in first 3 seconds
- Scroll-out feels like camera retreating into workshop (not dissolve)
- Director screenshots show clear lighting differentiation per phase
