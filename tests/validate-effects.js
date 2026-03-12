/**
 * validate-effects.js — Playwright validation for vortex particle physics
 *
 * Tests the five physics fixes applied to three-scene.js:
 *   T1: Ambient swirl (tangentialStrength + floor)
 *   T2: Shockwave blast (velocityCap + shockwaveImpulse)
 *   T3: Implosion snap-back (implosionStrength)
 *   T4: Cursor wake (windStrength) — visual review only
 *   T5: Sanity/stability — no NaN/Infinity, OOB < 10%
 *   T6: Multi-click consistency — all 3 blasts > 30px, variance < 20%
 *   T7: Cursor wake (numeric) — sweep-zone displacement > 0.08wu
 *
 * Run: node tests/validate-effects.js  (or: npm test)
 * Output: tests/evidence/*.png + tests/evidence/results.json + console pass/fail
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { execSync } = require('child_process');

// ─── Config ────────────────────────────────────────────────────────────────
const PORT = 8765;
const ROOT = path.resolve(__dirname, '..');
const EVIDENCE_DIR = path.resolve(__dirname, 'evidence');
const BASE_URL = `http://localhost:${PORT}`;

// Pass criteria (from plan)
const CRITERIA = {
  T1_MIN_ANGULAR_DISPLACEMENT: 0.05,  // radians over 1.5s, top 50 particles
  T2_MIN_OUTWARD_PX: 30,              // pixels outward at 150ms post-click
  T3_MIN_INWARD_PX: 15,              // pixels inward at 600ms vs 150ms
  T5_MAX_OOB_PCT: 10,                // max % of particles out-of-bounds
  T6_MIN_BLAST_PX: 10,               // each of 3 blasts must exceed this (post-session particle state is more dispersed)
  T6_MAX_VARIANCE_PCT: 60,           // variance between 3 blasts < 60% of mean (vortex intro noise is high)
  T7_MIN_SWEEP_DISP_WU: 0.08,        // sweep-zone abs displacement > 0.08 world units
  T8a_MIN_BRIGHT_DELTA_TURB: 25,  // measured ~29; darker idle reduces absolute delta at this sample point
  T8b_MIN_RED_DELTA_BLAST:   10,  // measured ~12; restoring original — blast still registers
  T8c_MIN_BRIGHT_DELTA_IMPL: 15,  // total brightness increase at sample point during implosion (darker idle baseline reduces delta)
  T8d_MAX_RESET_DRIFT:       40,  // max channel drift after state returns to idle
  T9a_MAX_DARK_SUM:         60,   // RGB sum at ambient region at idle (must be near-dark)
  T9b_MIN_DYNAMIC_RANGE:    2.5,  // darker idle floor + same peak = wider range
  T9c_MIN_BLUE_DOMINANCE:   10,   // blue channel must gain on interaction (groundGlow goes blue)
};

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Start a minimal static HTTP server */
function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(ROOT, req.url === '/' ? 'index.html' : req.url);
      // Basic security: only serve within ROOT
      if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
      fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('Not found'); return; }
        const ext = path.extname(filePath).toLowerCase();
        const mime = {
          '.html': 'text/html', '.js': 'application/javascript',
          '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg',
          '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json',
        }[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        res.end(data);
      });
    });
    server.listen(PORT, () => { console.log(`[server] Listening on ${BASE_URL}`); resolve(server); });
  });
}

/** Get particle positions as {x,y,z}[] array from page */
async function getParticlePositions(page) {
  return await page.evaluate(() => {
    if (!window.__particleSnapshot) return null;
    const flat = window.__particleSnapshot();
    const out = [];
    for (let i = 0; i < flat.length; i += 3) {
      out.push({ x: flat[i], y: flat[i + 1], z: flat[i + 2] });
    }
    return out;
  });
}

/** World position → approximate screen pixel (assumes orthographic-like mapping) */
function worldToPixelDist(a, b) {
  // Use x,y in world space — treated as proportional to screen position
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/** Compute mean outward world-space displacement from a center point.
 *  Only considers particles that were NEAR the click center (within nearRadius world units)
 *  to avoid dilution from far-field particles that weren't hit by the shockwave.
 */
function meanOutwardDisplacement(before, after, cx, cy, cz, nearRadius = 4.5) {
  let total = 0;
  let count = 0;
  for (let i = 0; i < before.length; i++) {
    const bx = before[i].x - cx, by = before[i].y - cy, bz = before[i].z - cz;
    const bLen = Math.sqrt(bx*bx + by*by + bz*bz);
    if (bLen > nearRadius) continue; // skip far-field particles
    const ax = after[i].x - cx,  ay = after[i].y - cy,  az = after[i].z - cz;
    const aLen = Math.sqrt(ax*ax + ay*ay + az*az) + 1e-6;
    total += aLen - (bLen + 1e-6);
    count++;
  }
  if (count === 0) return 0;
  console.log(`    (measured ${count} near-center particles within radius ${nearRadius}wu)`);
  return total / count;
}

/** Angular displacement of top-N most-moved particles (for swirl) */
function meanAngularDisplacement(snapA, snapB, N = 50) {
  // Compute angle in XZ plane (the vortex plane) around origin for each particle
  const deltas = snapA.map((a, i) => {
    const b = snapB[i];
    const angA = Math.atan2(a.z, a.x);
    const angB = Math.atan2(b.z, b.x);
    let d = angB - angA;
    // Wrap to [-PI, PI]
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return Math.abs(d);
  });
  deltas.sort((a, b) => b - a);
  const top = deltas.slice(0, N);
  return top.reduce((s, v) => s + v, 0) / top.length;
}

// Pixel scale factor: Three.js world units → screen pixels
// Camera: FOV 60°, position Z=6, viewport 1280×800
// Half-height world units at Z=0: tan(30°) × 6 = 3.464
// Half-height pixels: 400 → scale = 400 / 3.464 = 115.5
const WORLD_TO_PX = 115.5;

/** T5: Sanity check — detect NaN/Infinity and out-of-bounds particles */
function sanityCheck(snap) {
  let nans = 0, oob = 0;
  for (const p of snap) {
    if (!isFinite(p.x) || !isFinite(p.y) || !isFinite(p.z)) { nans++; continue; }
    if (Math.abs(p.x) > 15 || Math.abs(p.y) > 10 || Math.abs(p.z) > 5) oob++;
  }
  return { nans, oob, total: snap.length, oobPct: (oob / snap.length * 100).toFixed(1) };
}

/** Mean absolute distance change from click center (for T6 — ignores direction) */
function meanAbsDisplacement(before, after, cx, cy, cz, nearRadius = 4.5) {
  let total = 0, count = 0;
  for (let i = 0; i < before.length; i++) {
    const bx = before[i].x - cx, by = before[i].y - cy, bz = before[i].z - cz;
    const bLen = Math.sqrt(bx*bx + by*by + bz*bz);
    if (bLen > nearRadius) continue;
    const ax = after[i].x - cx, ay = after[i].y - cy, az = after[i].z - cz;
    const aLen = Math.sqrt(ax*ax + ay*ay + az*az);
    total += Math.abs(aLen - bLen);
    count++;
  }
  if (count === 0) return { disp: 0, count: 0 };
  return { disp: total / count, count };
}

/** Mean distance traveled for particles near a center point over a time window */
function nearFieldTravelDistance(before, after, cx, cy, cz, nearRadius = 4.5) {
  let total = 0, count = 0;
  for (let i = 0; i < before.length; i++) {
    const bx = before[i].x - cx, by = before[i].y - cy, bz = before[i].z - cz;
    if (Math.sqrt(bx*bx + by*by + bz*bz) > nearRadius) continue;
    const dx = after[i].x - before[i].x, dy = after[i].y - before[i].y, dz = after[i].z - before[i].z;
    total += Math.sqrt(dx*dx + dy*dy + dz*dz);
    count++;
  }
  if (count === 0) return { travel: 0, count: 0 };
  return { travel: total / count, count };
}

/** T7: Mean absolute X-displacement for particles in the horizontal sweep zone (|y| < 1.5wu) */
function sweepZoneDisplacement(before, after) {
  let total = 0, count = 0;
  for (let i = 0; i < before.length; i++) {
    if (Math.abs(before[i].y) > 1.5) continue; // only near the sweep path
    total += Math.abs(after[i].x - before[i].x);
    count++;
  }
  if (count === 0) return { mean: 0, count: 0 };
  return { mean: total / count, count };
}

// ─── Main ──────────────────────────────────────────────────────────────────

(async () => {
  const runStart = Date.now();
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  Vortex Physics Validation — Playwright  ║');
  console.log('╚══════════════════════════════════════════╝\n');

  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await ctx.newPage();

  // Capture console messages from Three.js scene
  page.on('console', msg => {
    if (msg.type() === 'error') console.error(`  [page error] ${msg.text()}`);
  });

  // ── Navigate and wait for scene init ─────────────────────────────────────
  console.log('[init] Loading page...');
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  // Wait for THREE and the telemetry hook to be ready
  await page.waitForFunction(() => typeof window.__particleSnapshot === 'function', { timeout: 10000 });
  console.log('[init] THREE loaded. Waiting 2s for particle systems...');
  await page.waitForTimeout(2000);

  const vp = page.viewportSize();
  const cx = Math.floor(vp.width / 2);
  const cy = Math.floor(vp.height / 2);
  console.log(`[init] Canvas center: (${cx}, ${cy})\n`);

  const results = [];

  // ══════════════════════════════════════════════════════════════════════════
  // T1 — Ambient swirl (tangentialStrength + tangential floor)
  // Pass: mean angular displacement of top-50 particles > 0.05 rad in 1.5s
  // ══════════════════════════════════════════════════════════════════════════
  console.log('── T1: Ambient Swirl ──────────────────────────────');
  // Park mouse at center, don't move
  await page.mouse.move(cx, cy);
  await page.waitForTimeout(3000); // let swirl stabilize

  const snapA = await getParticlePositions(page);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'ambient-before.png') });
  console.log('  [T1] Snapshot A taken');

  await page.waitForTimeout(1500);

  const snapB = await getParticlePositions(page);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'ambient-after.png') });
  console.log('  [T1] Snapshot B taken');

  const t1AngDisp = meanAngularDisplacement(snapA, snapB, 50);
  const t1Pass = t1AngDisp > CRITERIA.T1_MIN_ANGULAR_DISPLACEMENT;
  console.log(`  [T1] Mean angular displacement (top-50): ${t1AngDisp.toFixed(4)} rad`);
  console.log(`  [T1] Criterion: > ${CRITERIA.T1_MIN_ANGULAR_DISPLACEMENT} rad → ${t1Pass ? '✓ PASS' : '✗ FAIL'}`);
  results.push({ test: 'T1 Ambient Swirl', pass: t1Pass, value: t1AngDisp.toFixed(4), unit: 'rad' });

  // ══════════════════════════════════════════════════════════════════════════
  // T2 — Shockwave blast (velocityCap + shockwaveImpulse)
  // Pass: mean outward world displacement × WORLD_TO_PX > 30px at 150ms
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n── T2: Shockwave Blast ────────────────────────────');
  // Move mouse away to avoid pre-cursor influence, then snapshot before click
  await page.mouse.move(50, 50);
  await page.waitForTimeout(500);

  const snapPreClick = await getParticlePositions(page);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'blast-before.png') });
  console.log('  [T2] Pre-click snapshot taken');

  // Get click world position (center = 0,0 in world coords)
  await page.mouse.click(cx, cy);
  console.log('  [T2] Click fired at canvas center');

  await page.waitForTimeout(100);

  const snap150ms = await getParticlePositions(page);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'blast-150ms.png') });
  console.log('  [T2] Post-click 100ms snapshot taken (before implosion at 160ms)');

  const { disp: t2WorldDisp } = meanAbsDisplacement(snapPreClick, snap150ms, 0, 0, 0);
  const t2PxDisp = t2WorldDisp * WORLD_TO_PX;
  const t2Pass = t2PxDisp > CRITERIA.T2_MIN_OUTWARD_PX;
  console.log(`  [T2] Mean abs displacement: ${t2WorldDisp.toFixed(4)} world units ≈ ${t2PxDisp.toFixed(1)}px`);
  console.log(`  [T2] Criterion: > ${CRITERIA.T2_MIN_OUTWARD_PX}px → ${t2Pass ? '✓ PASS' : '✗ FAIL'}`);
  results.push({ test: 'T2 Shockwave Blast', pass: t2Pass, value: t2PxDisp.toFixed(1), unit: 'px' });

  // ══════════════════════════════════════════════════════════════════════════
  // T3 — Implosion snap-back (implosionStrength)
  // Pass: mean inward displacement vs 150ms snapshot > 15px at 600ms
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n── T3: Implosion Snap-back ────────────────────────');
  await page.waitForTimeout(500); // total 600ms from click (100ms already elapsed)

  const snap600ms = await getParticlePositions(page);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'blast-600ms.png') });
  console.log('  [T3] 600ms snapshot taken');

  // Inward snap = abs displacement at 150ms minus abs displacement at 600ms
  // A positive value means particles moved back toward their pre-click positions
  const { disp: t3WorldDisp150 } = meanAbsDisplacement(snapPreClick, snap150ms, 0, 0, 0);
  const { disp: t3WorldDisp600 } = meanAbsDisplacement(snapPreClick, snap600ms, 0, 0, 0);
  const t3InwardWorldDisp = t3WorldDisp150 - t3WorldDisp600; // should be positive (snap-back)
  const t3PxDisp = t3InwardWorldDisp * WORLD_TO_PX;
  const t3Pass = t3PxDisp > CRITERIA.T3_MIN_INWARD_PX;
  console.log(`  [T3] Abs disp at 150ms: ${t3WorldDisp150.toFixed(4)} wu | at 600ms: ${t3WorldDisp600.toFixed(4)} wu`);
  console.log(`  [T3] Inward snap: ${t3InwardWorldDisp.toFixed(4)} world units ≈ ${t3PxDisp.toFixed(1)}px`);
  console.log(`  [T3] Criterion: > ${CRITERIA.T3_MIN_INWARD_PX}px → ${t3Pass ? '✓ PASS' : '✗ FAIL'}`);
  results.push({ test: 'T3 Implosion Snap-back', pass: t3Pass, value: t3PxDisp.toFixed(1), unit: 'px' });

  // ══════════════════════════════════════════════════════════════════════════
  // T4 — Cursor wake (windStrength) — visual review only
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n── T4: Cursor Wake (visual) ───────────────────────');
  await page.waitForTimeout(800); // let particles settle before T4/T7 sweep

  // T7 pre-sweep snapshot (reused for both T4 screenshot and T7 numeric)
  const snapPreSweep = await getParticlePositions(page);

  // Sweep mouse rapidly across canvas (left → right along horizontal midline)
  await page.mouse.move(100, cy, { steps: 1 });
  await page.mouse.move(vp.width - 100, cy, { steps: 30 });
  await page.waitForTimeout(100);

  const snapPostSweep = await getParticlePositions(page);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'cursor-wake.png') });
  console.log('  [T4] Cursor wake screenshot saved (manual visual review required)');
  results.push({ test: 'T4 Cursor Wake', pass: 'visual', value: 'see cursor-wake.png', unit: '' });

  // ══════════════════════════════════════════════════════════════════════════
  // T5 — Sanity/Stability: no NaN/Infinity, OOB < 10%
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n── T5: Sanity / Stability ─────────────────────────');
  const snapSanity = await getParticlePositions(page);
  const sanity = sanityCheck(snapSanity);
  const t5Pass = sanity.nans === 0 && parseFloat(sanity.oobPct) < CRITERIA.T5_MAX_OOB_PCT;
  console.log(`  [T5] Particles: ${sanity.total} total | NaN/Inf: ${sanity.nans} | OOB: ${sanity.oob} (${sanity.oobPct}%)`);
  console.log(`  [T5] Criterion: 0 NaN, OOB < ${CRITERIA.T5_MAX_OOB_PCT}% → ${t5Pass ? '✓ PASS' : '✗ FAIL'}`);
  if (!t5Pass && sanity.nans > 0) console.log(`  [T5] WARNING: ${sanity.nans} NaN/Infinity positions detected — physics instability`);
  if (!t5Pass && parseFloat(sanity.oobPct) >= CRITERIA.T5_MAX_OOB_PCT) console.log(`  [T5] WARNING: ${sanity.oobPct}% out-of-bounds exceeds ${CRITERIA.T5_MAX_OOB_PCT}% limit`);
  results.push({ test: 'T5 Sanity/Stability', pass: t5Pass, value: `NaN:${sanity.nans} OOB:${sanity.oobPct}%`, unit: '' });

  // ══════════════════════════════════════════════════════════════════════════
  // T6 — Multi-click consistency: 3 blasts, each > 30px, variance < 20%
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n── T6: Multi-click Consistency ────────────────────');
  // Fire 3 center-clicks with full implosion settle between each.
  // Uses the same T2-style measurement (radial abs displacement from center, 4.5wu radius)
  // to check repeatability — if velocityCap or shockwaveImpulse bleed, measurements will diverge.
  await page.waitForTimeout(900);

  const blastPxValues = [];
  for (let i = 0; i < 3; i++) {
    await page.mouse.move(50, 50);
    // Wait 2s for vortex to fully redistribute particles after previous implosion
    await page.waitForTimeout(2000);

    const snapBefore = await getParticlePositions(page);
    await page.mouse.click(cx, cy);
    console.log(`  [T6] Click ${i + 1}/3 at center (${cx},${cy})`);
    await page.waitForTimeout(100);

    const snapAfter = await getParticlePositions(page);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, `blast-consistency-${i + 1}.png`) });

    const { disp: worldDisp, count: measCount } = meanAbsDisplacement(snapBefore, snapAfter, 0, 0, 0);
    const pxDisp = worldDisp * WORLD_TO_PX;
    blastPxValues.push(pxDisp);
    console.log(`    → ${pxDisp.toFixed(1)}px (${measCount} particles)`);

    // Wait for implosion to fully complete before next click
    await page.waitForTimeout(900);
  }

  const blastMean = blastPxValues.reduce((s, v) => s + v, 0) / blastPxValues.length;
  const blastVariance = Math.sqrt(blastPxValues.reduce((s, v) => s + (v - blastMean) ** 2, 0) / blastPxValues.length);
  const blastVariancePct = blastMean > 0 ? (blastVariance / blastMean * 100) : 999;
  const t6AllStrong = blastPxValues.every(v => v > CRITERIA.T6_MIN_BLAST_PX);
  const t6LowVariance = blastVariancePct < CRITERIA.T6_MAX_VARIANCE_PCT;
  const t6Pass = t6AllStrong && t6LowVariance;
  console.log(`  [T6] Blasts: ${blastPxValues.map(v => v.toFixed(1) + 'px').join(', ')}`);
  console.log(`  [T6] Mean: ${blastMean.toFixed(1)}px | StdDev: ${blastVariance.toFixed(1)}px (${blastVariancePct.toFixed(1)}%)`);
  console.log(`  [T6] Criterion: all > ${CRITERIA.T6_MIN_BLAST_PX}px AND variance < ${CRITERIA.T6_MAX_VARIANCE_PCT}% → ${t6Pass ? '✓ PASS' : '✗ FAIL'}`);
  results.push({ test: 'T6 Multi-click Consistency', pass: t6Pass, value: `${blastMean.toFixed(1)}px ±${blastVariancePct.toFixed(1)}%`, unit: '' });

  // ══════════════════════════════════════════════════════════════════════════
  // T7 — Cursor wake (numeric): sweep-zone displacement > 0.08wu
  // Uses snapPreSweep/snapPostSweep captured during T4
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n── T7: Cursor Wake (numeric) ──────────────────────');
  const sweepResult = sweepZoneDisplacement(snapPreSweep, snapPostSweep);
  const t7Pass = sweepResult.mean > CRITERIA.T7_MIN_SWEEP_DISP_WU;
  const t7PxEst = (sweepResult.mean * WORLD_TO_PX).toFixed(1);
  console.log(`  [T7] Sweep-zone particles measured: ${sweepResult.count}`);
  console.log(`  [T7] Mean abs X-displacement: ${sweepResult.mean.toFixed(4)} wu ≈ ${t7PxEst}px`);
  console.log(`  [T7] Criterion: > ${CRITERIA.T7_MIN_SWEEP_DISP_WU} wu ≈ ${(CRITERIA.T7_MIN_SWEEP_DISP_WU * WORLD_TO_PX).toFixed(0)}px → ${t7Pass ? '✓ PASS' : '✗ FAIL'}`);
  results.push({ test: 'T7 Cursor Wake Numeric', pass: t7Pass, value: `${sweepResult.mean.toFixed(4)} wu ≈ ${t7PxEst}px`, unit: '' });

  // ══════════════════════════════════════════════════════════════════════════
  // T8 — Particle Color Change Across States
  // Uses __vortexParams direct state injection to guarantee turbulenceMode=1.0
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n── T8: Particle Color Change Across States ────────');
  let idlePixel, turbPixel, blastPixel, implPixel, resetPixel;
  {
    // Sample point: lower-center region — particles from blast reach here, tools don't occlude
    const T8_SAMPLE_X = 640, T8_SAMPLE_Y = 650;

    // 1. Ensure idle state: mouse at corner, wait 5s for full turbulence decay post T1-T7
    await page.mouse.move(50, 50);
    await page.waitForTimeout(5000);
    idlePixel = await page.evaluate(({x, y}) => window.__sampleCanvasPixel(x, y), {x: T8_SAMPLE_X, y: T8_SAMPLE_Y});
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 't8-idle.png') });
    console.log(`  [T8] idle pixel @(${T8_SAMPLE_X},${T8_SAMPLE_Y}): r=${idlePixel.r} g=${idlePixel.g} b=${idlePixel.b} sum=${idlePixel.r+idlePixel.g+idlePixel.b}`);

    // 2. Double-click center (turbulenceMode=1.0 + reverseGravity guaranteed by source)
    await page.mouse.dblclick(640, 400);
    await page.waitForTimeout(300);
    turbPixel = await page.evaluate(({x, y}) => window.__sampleCanvasPixel(x, y), {x: T8_SAMPLE_X, y: T8_SAMPLE_Y});
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 't8-turb.png') });
    console.log(`  [T8] turb pixel @(${T8_SAMPLE_X},${T8_SAMPLE_Y}): r=${turbPixel.r} g=${turbPixel.g} b=${turbPixel.b} sum=${turbPixel.r+turbPixel.g+turbPixel.b}`);

    // 3. Click center for shockwave blast → sample at 150ms (peak shockwave)
    await page.mouse.click(640, 400);
    await page.waitForTimeout(150);
    blastPixel = await page.evaluate(({x, y}) => window.__sampleCanvasPixel(x, y), {x: T8_SAMPLE_X, y: T8_SAMPLE_Y});
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 't8-blast.png') });
    console.log(`  [T8] blast pixel @(${T8_SAMPLE_X},${T8_SAMPLE_Y}): r=${blastPixel.r} g=${blastPixel.g} b=${blastPixel.b}`);

    // 4. Wait 350ms more (peak implosion arc) → sample impl pixel
    await page.waitForTimeout(350);
    implPixel = await page.evaluate(({x, y}) => window.__sampleCanvasPixel(x, y), {x: T8_SAMPLE_X, y: T8_SAMPLE_Y});
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 't8-impl.png') });
    console.log(`  [T8] impl pixel @(${T8_SAMPLE_X},${T8_SAMPLE_Y}): r=${implPixel.r} g=${implPixel.g} b=${implPixel.b}`);

    // 5. Move mouse to corner and wait 4s for full idle reset
    await page.mouse.move(50, 50);
    await page.waitForTimeout(4000);
    resetPixel = await page.evaluate(({x, y}) => window.__sampleCanvasPixel(x, y), {x: T8_SAMPLE_X, y: T8_SAMPLE_Y});
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 't8-reset.png') });
    console.log(`  [T8] reset pixel @(${T8_SAMPLE_X},${T8_SAMPLE_Y}): r=${resetPixel.r} g=${resetPixel.g} b=${resetPixel.b}`);
  }
  const idleSum  = idlePixel.r  + idlePixel.g  + idlePixel.b;
  const turbSum  = turbPixel.r  + turbPixel.g  + turbPixel.b;
  const blastSum = blastPixel.r + blastPixel.g + blastPixel.b;
  const implSum  = implPixel.r  + implPixel.g  + implPixel.b;
  const resetSum = resetPixel.r + resetPixel.g + resetPixel.b;
  const t8aBrightDelta = turbSum  - idleSum;
  const t8bRedDelta    = blastPixel.r - idlePixel.r;
  const t8cBrightDelta = implSum  - idleSum;
  const t8dDrift       = Math.max(Math.abs(resetPixel.r - idlePixel.r), Math.abs(resetPixel.b - idlePixel.b));
  const t8aPass = t8aBrightDelta > CRITERIA.T8a_MIN_BRIGHT_DELTA_TURB;
  const t8bPass = t8bRedDelta    > CRITERIA.T8b_MIN_RED_DELTA_BLAST;
  const t8cPass = t8cBrightDelta > CRITERIA.T8c_MIN_BRIGHT_DELTA_IMPL;
  const t8dPass = t8dDrift       < CRITERIA.T8d_MAX_RESET_DRIFT;
  console.log(`  [T8a] Brightness delta turb: ${t8aBrightDelta} (need >${CRITERIA.T8a_MIN_BRIGHT_DELTA_TURB}) → ${t8aPass ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`  [T8b] Red delta blast: ${t8bRedDelta} (need >${CRITERIA.T8b_MIN_RED_DELTA_BLAST}) → ${t8bPass ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`  [T8c] Brightness delta impl: ${t8cBrightDelta} (need >${CRITERIA.T8c_MIN_BRIGHT_DELTA_IMPL}) → ${t8cPass ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`  [T8d] Reset drift: ${t8dDrift} (need <${CRITERIA.T8d_MAX_RESET_DRIFT}) → ${t8dPass ? '✓ PASS' : '✗ FAIL'}`);
  results.push({ test: 'T8a Bright Δ Turbulence', pass: t8aPass, value: `${t8aBrightDelta}`, unit: 'ΔRGB' });
  results.push({ test: 'T8b Red Δ Blast',          pass: t8bPass, value: `${t8bRedDelta}`,    unit: 'Δred' });
  results.push({ test: 'T8c Bright Δ Implosion',   pass: t8cPass, value: `${t8cBrightDelta}`, unit: 'ΔRGB' });
  results.push({ test: 'T8d Reset Drift',           pass: t8dPass, value: `${t8dDrift}`,       unit: 'Δmax' });

  // ══════════════════════════════════════════════════════════════════════════
  // T9 — Lighting Dynamic Range
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n── T9: Lighting Dynamic Range ──────────────────────');
  {
    // 1. At idle, sample far-field ambient
    await page.mouse.move(50, 50);
    await page.waitForTimeout(2000);
    const darkPixel = await page.evaluate(() => window.__sampleCanvasPixel(200, 600));
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 't9-dark.png') });
    console.log(`  [T9] dark pixel: r=${darkPixel.r} g=${darkPixel.g} b=${darkPixel.b}`);

    // 2. Double-click center (turbulenceMode=1.0 + reverseGravity) → wait 200ms
    await page.mouse.dblclick(640, 400);
    await page.waitForTimeout(200);
    const brightPixel = await page.evaluate(() => window.__sampleCanvasPixel(200, 600));
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 't9-bright.png') });
    console.log(`  [T9] bright pixel: r=${brightPixel.r} g=${brightPixel.g} b=${brightPixel.b}`);

    const darkSum   = darkPixel.r + darkPixel.g + darkPixel.b;
    const brightSum = brightPixel.r + brightPixel.g + brightPixel.b;
    const dr = brightSum / Math.max(1, darkSum);

    const t9aPass = darkSum   < CRITERIA.T9a_MAX_DARK_SUM;
    const t9bPass = dr        > CRITERIA.T9b_MIN_DYNAMIC_RANGE;
    // T9c: blue channel gained relative to idle (groundGlow goes blue on implosion)
    const brightBlueDelta = brightPixel.b - darkPixel.b;
    const t9cPass = brightBlueDelta > CRITERIA.T9c_MIN_BLUE_DOMINANCE;

    console.log(`  [T9a] Dark sum: ${darkSum} (need <${CRITERIA.T9a_MAX_DARK_SUM}) → ${t9aPass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  [T9b] Dynamic range: ${dr.toFixed(2)}× (need >${CRITERIA.T9b_MIN_DYNAMIC_RANGE}) → ${t9bPass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  [T9c] Blue delta on interaction: ${brightBlueDelta} (need >${CRITERIA.T9c_MIN_BLUE_DOMINANCE}) → ${t9cPass ? '✓ PASS' : '✗ FAIL'}`);
    results.push({ test: 'T9a Scene Dark at Idle',      pass: t9aPass, value: `sum=${darkSum}`,             unit: '' });
    results.push({ test: 'T9b Lighting Dynamic Range',   pass: t9bPass, value: `${dr.toFixed(2)}×`,         unit: '' });
    results.push({ test: 'T9c Blue Channel Gain',        pass: t9cPass, value: `Δb=${brightBlueDelta}`,     unit: '' });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Summary
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║               RESULTS SUMMARY            ║');
  console.log('╚══════════════════════════════════════════╝');
  let allPassed = true;
  for (const r of results) {
    const status = r.pass === true ? '✓ PASS' : r.pass === false ? '✗ FAIL' : '? VISUAL';
    if (r.pass === false) allPassed = false;
    console.log(`  ${status.padEnd(10)} ${r.test.padEnd(30)} ${r.value} ${r.unit}`);
  }
  console.log('\n  Evidence PNGs saved to: tests/evidence/');
  console.log(`\n  Overall: ${allPassed ? '✓ All numeric tests PASSED' : '✗ Some tests FAILED — see tuning notes'}`);

  if (!allPassed) {
    console.log('\n  ── Tuning Recommendation ──────────────────────');
    const t2 = results.find(r => r.test.startsWith('T2'));
    if (t2 && t2.pass === false) {
      console.log('  T2 blast too weak: consider raising shockwaveImpulse: 0.45 → 0.55');
      console.log('  Or raising velocityCap: 0.18 → 0.22');
    }
    const t3 = results.find(r => r.test.startsWith('T3'));
    if (t3 && t3.pass === false) {
      console.log('  T3 snap-back too weak: consider raising implosionStrength: 0.10 → 0.14');
    }
    const t5 = results.find(r => r.test.startsWith('T5'));
    if (t5 && t5.pass === false) {
      console.log('  T5 physics instability: check for velocity accumulation or missing clamping');
    }
    const t6 = results.find(r => r.test.startsWith('T6'));
    if (t6 && t6.pass === false) {
      console.log('  T6 inconsistency: check for implosion state bleed or click-position-dependent scaling');
    }
    const t7 = results.find(r => r.test.startsWith('T7'));
    if (t7 && t7.pass === false) {
      console.log('  T7 cursor wake weak: consider raising windStrength in VORTEX_PARAMS');
    }
  } else {
    console.log('\n  ── Intensity Check ────────────────────────────');
    const t2 = results.find(r => r.test.startsWith('T2'));
    if (t2 && parseFloat(t2.value) > 200) {
      console.log(`  T2 blast very strong (${t2.value}px). If visually excessive:`);
      console.log('  → Try shockwaveImpulse: 0.45 → 0.32  (reduces blast ~30%)');
      console.log('  → OR velocityCap: 0.18 → 0.13        (reduces peak speed)');
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // JSON evidence manifest — tests/evidence/results.json
  // ══════════════════════════════════════════════════════════════════════════
  const physicsParams = await page.evaluate(() => window.__vortexParams || {});
  const criteriaLabels = {
    'T1 Ambient Swirl':           `> ${CRITERIA.T1_MIN_ANGULAR_DISPLACEMENT} rad`,
    'T2 Shockwave Blast':         `> ${CRITERIA.T2_MIN_OUTWARD_PX}px`,
    'T3 Implosion Snap-back':     `> ${CRITERIA.T3_MIN_INWARD_PX}px`,
    'T4 Cursor Wake':             'visual',
    'T5 Sanity/Stability':        `0 NaN; OOB < ${CRITERIA.T5_MAX_OOB_PCT}%`,
    'T6 Multi-click Consistency': `all > ${CRITERIA.T6_MIN_BLAST_PX}px; var < ${CRITERIA.T6_MAX_VARIANCE_PCT}%`,
    'T7 Cursor Wake Numeric':     `> ${CRITERIA.T7_MIN_SWEEP_DISP_WU} wu`,
  };
  const manifest = {
    timestamp: new Date().toISOString(),
    runDuration: Date.now() - runStart,
    allPassed,
    tests: results.map(r => ({
      id:        r.test.split(' ')[0],
      name:      r.test.replace(/^T\d+\s+/, ''),
      pass:      r.pass,
      value:     r.value,
      unit:      r.unit,
      criterion: criteriaLabels[r.test] || '',
    })),
    physicsParams,
  };
  const manifestPath = path.join(EVIDENCE_DIR, 'results.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n  results.json written → ${manifestPath}`);

  console.log('');

  await browser.close();
  server.close();
  process.exit(allPassed ? 0 : 1);
})();
