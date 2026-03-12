# 3D hero scene particle system and lighting audit

**Session ID:** ses_31fc3ee61ffeq6yocznxPomtYL
**Created:** 3/12/2026, 12:09:19 AM
**Updated:** 3/12/2026, 12:17:10 AM

---

## User

Perform a deep, comprehensive technical and artistic analysis of the current state of this project's 3D hero scene component, focusing on identifying every opportunity to visually elevate the scene to a world-class level. Systematically examine and provide detailed, actionable recommendations across all of the following dimensions:

Audit the existing physics and particle systems in depth — specifically the magic dust effect currently flowing through the scene. How can this particle system be fundamentally transformed into something far more visually captivating, dynamic, and emotionally resonant? Consider how the magic dust particles can be made to feel alive — reacting to and interacting with physical forces already present in the scene such as wind, turbulence, gravity, and vortices, as well as any new forces that could be introduced. Think of the sweeping, swirling golden sand and luminous dust magic seen in Aladdin, the enchanted particle choreography in Fantasia, or the ethereal glowing motes drifting through mystical desert landscapes in films like Dune — where particles don't simply float but billow, spiral, scatter, condense, and respond intelligently to their environment in ways that feel both physically grounded and supernaturally beautiful.

Explore how the magic dust could interact with scene geometry, light sources, and other objects — deflecting around surfaces, being pulled into swirling vortices, catching and refracting light, leaving glowing trails, clumping into nebulous clouds before dispersing, and forming emergent patterns that feel organic and surprising. Consider layering multiple particle systems at different scales and densities to create depth and complexity. Evaluate turbulence fields, curl noise, fluid simulation approximations, attractor and repeller forces, and any other force primitives that could make the dust behavior feel richer and more magical.

Conduct a full audit of the scene's lighting — examining every light source, its type, intensity, color temperature, attenuation, and contribution to mood. Identify what is working, what is flat or unconvincing, and what transformative improvements could be made. How can volumetric lighting, god rays, caustics, light scattering through the particle systems, emissive materials, and dynamic light animation be leveraged to dramatically increase the visual drama and sense of magic within the scene?

Analyze every dynamic and animated element in the scene — what is moving, how it moves, the quality of its motion curves and timing, and how those animations contribute to or detract from the overall sense of life and energy. Identify opportunities to add secondary motion, procedural animation, reactive behaviors tied to user interaction, and ambient animation loops that prevent the scene from ever feeling static or lifeless.

Evaluate the interactivity of the scene from a user experience perspective — how can the 3D environment respond meaningfully to cursor movement, scrolling, device orientation, proximity, clicking, or hovering in ways that make users feel they are genuinely influencing or inhabiting the magical world? How can particle and physics behaviors be made reactive to user input to create moments of delight and discovery?

Finally, assess the overall artistic composition, color palette, atmosphere, and emotional tone of the scene. Identify any gaps between the current visual output and the highest possible standard for a hero component of this type, and provide a prioritized roadmap of improvements ordered by visual impact and implementation feasibility. 

---

## Assistant (Plan · moonshotai/kimi-k2.5 · 4.7s)

_Thinking:_

 The user wants a comprehensive technical and artistic analysis of a 3D hero scene component in their project. They want me to examine:
1. Physics and particle systems (magic dust effect)
2. Lighting systems
3. Dynamic and animated elements
4. Interactivity
5. Artistic composition, color palette, atmosphere

This is a detailed request for analysis and recommendations, not implementation yet. Since Plan Mode is active, I should NOT make any edits - only observe, analyze, and plan.

First, I need to understand the current state of the project. Let me explore the codebase to find the 3D hero scene component and understand what exists

 I'll conduct a comprehensive analysis of your 3D hero scene. Let me first explore the

**Tool: glob**

**Input:**
```json
{
  "pattern": "**/*.{tsx,ts,jsx,js}"
}
```

**Output:**
```
C:\Dev\handyman\tests\validate-ui.js
C:\Dev\handyman\main.js
C:\Dev\handyman\tests\validate-effects.js
C:\Dev\handyman\three-scene.js
C:\Dev\handyman\tests\run-all.js
C:\Dev\handyman\tests\helpers\static-server.js
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "**/*hero*.{tsx,ts,jsx,js}"
}
```

**Output:**
```
No files found
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "**/*scene*.{tsx,ts,jsx,js}"
}
```

**Output:**
```
C:\Dev\handyman\three-scene.js
```

---

## Assistant (Plan · moonshotai/kimi-k2.5 · 4.2s)

_Thinking:_

 I found a `three-scene.js` file which likely contains the 3D hero scene component. Let me also check the HTML file to understand the full context, and then read the Three.js scene

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\Dev\\handyman\\three-scene.js"
}
```

**Output:**
```
<path>C:\Dev\handyman\three-scene.js</path>
<type>file</type>
<content>1: /**
2:  * three-scene.js — Blueprint Engineering Hero (Round 2)
3:  *
4:  * Self-initializing. Creates a fixed WebGL canvas behind all page content.
5:  * Requires Three.js r134 loaded before this script.
6:  */
7: 
8: (function () {
9:   'use strict';
10: 
11:   if (typeof THREE === 'undefined') {
12:     console.warn('[three-scene] THREE not found — skipping 3D background.');
13:     return;
14:   }
15: 
16:   /* ─── WebGL Feature Detection ─────────────────────────── */
17:   (function detectAndFallback() {
18:     const probe = document.createElement('canvas');
19:     const gl = probe.getContext('webgl2') || probe.getContext('webgl') || probe.getContext('experimental-webgl');
20:     if (!gl) {
21:       document.documentElement.classList.add('no-webgl');
22:       const hero = document.querySelector('.hero');
23:       if (hero) {
24:         const banner = document.createElement('p');
25:         banner.className = 'webgl-unsupported-banner';
26:         banner.setAttribute('role', 'status');
27:         banner.textContent = 'For the best visual experience, try Chrome or Firefox with hardware acceleration enabled.';
28:         hero.prepend(banner);
29:       }
30:     }
31:   })();
32: 
33:   /* ─── GPU tier detection (for low-end throttling) ─────── */
34:   const _gpuProbe = (function () {
35:     const probe = document.createElement('canvas');
36:     const gl = probe.getContext('webgl2') || probe.getContext('webgl');
37:     if (!gl) return { lowEnd: false };
38:     const ext = gl.getExtension('WEBGL_debug_renderer_info');
39:     const renderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '';
40:     const isSoftware = /SwiftShader|llvmpipe|softpipe/i.test(renderer);
41:     const lowMem = (navigator.deviceMemory || 4) < 2;
42:     return { lowEnd: isSoftware || lowMem };
43:   })();
44:   const _isLowEnd = _gpuProbe.lowEnd;
45: 
46:   /* ─── Reduced motion check ────────────────────────────── */
47:   const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
48: 
49:   /* ─── Renderer + Canvas ───────────────────────────────── */
50:   const renderer = new THREE.WebGLRenderer({
51:     antialias: true,
52:     alpha: false,
53:     powerPreference: 'high-performance',
54:     // preserveDrawingBuffer removed — not needed (no canvas export), caused double-buffer banding during additive particle rendering
55:   });
56: 
57:   renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
58:   renderer.setSize(window.innerWidth, window.innerHeight);
59:   renderer.shadowMap.enabled = true;
60:   renderer.shadowMap.type = THREE.VSMShadowMap;  // Gaussian blur penumbra — smoother than PCFSoft
61:   renderer.outputEncoding      = THREE.sRGBEncoding;
62:   renderer.toneMapping         = THREE.ACESFilmicToneMapping;
63:   renderer.toneMappingExposure = 0.82;  // blade darkened + sawSpot reduced; scene self-compensates
64: 
65:   // Required for RectAreaLight to render correctly
66:   if (THREE.RectAreaLightUniformsLib) {
67:     THREE.RectAreaLightUniformsLib.init();
68:   }
69: 
70:   /* ─── Post-processing: declarations (initialized after camera) ─── */
71:   const _isMobilePost = window.innerWidth < 768;
72:   let composer = null;
73:   let bloomPass = null;
74: 
75:   const canvas = renderer.domElement;
76:   canvas.id = 'three-canvas';
77:   canvas.setAttribute('aria-hidden', 'true');
78:   canvas.style.cursor = 'default';
79:   document.body.insertBefore(canvas, document.body.firstChild);
80: 
81:   if (!(window.__sceneAssetsReady instanceof Promise)) {
82:     window.__sceneAssetsReady = new Promise((resolve) => {
83:       window.__resolveSceneAssetsReady = resolve;
84:     });
85:   }
86: 
87:   /* ─── Scene ───────────────────────────────────────────── */
88:   const scene = new THREE.Scene();
89:   scene.background = new THREE.Color(0x030405); // near-black — tools emerge from darkness
90:   scene.fog = new THREE.FogExp2(0x050810, 0.055); // raised density for depth separation — pushes bg debris into murk, slight blue tint matches fill light
91: 
92:   // Real IBL via PMREMGenerator — gradient equirectangular env map matching warm/cool palette
93:   const pmrem = new THREE.PMREMGenerator(renderer);
94:   pmrem.compileEquirectangularShader();
95: 
96:   const envCvs = document.createElement('canvas');
97:   envCvs.width = 512; envCvs.height = 256;
98:   const ec = envCvs.getContext('2d');
99: 
100:   // Sky: deep dark blue-black gradient (top to horizon)
101:   const skyGrad = ec.createLinearGradient(0, 0, 0, 128);
102:   skyGrad.addColorStop(0, '#071018');
103:   skyGrad.addColorStop(1, '#0d1a2e');
104:   ec.fillStyle = skyGrad; ec.fillRect(0, 0, 512, 128);
105: 
106:   // Floor: dark warm-brown gradient (horizon to bottom)
107:   const flrGrad = ec.createLinearGradient(0, 128, 0, 256);
108:   flrGrad.addColorStop(0, '#1a0d04');
109:   flrGrad.addColorStop(1, '#070503');
110:   ec.fillStyle = flrGrad; ec.fillRect(0, 128, 512, 128);
111: 
112:   // Key light spot: warm amber radial blob — upper left (~camera key light position)
113:   const keySpot = ec.createRadialGradient(96, 64, 0, 96, 64, 140);
114:   keySpot.addColorStop(0,   'rgba(200,110,20,0.85)');
115:   keySpot.addColorStop(0.5, 'rgba(140,70,10,0.35)');
116:   keySpot.addColorStop(1,   'rgba(0,0,0,0)');
117:   ec.fillStyle = keySpot; ec.fillRect(0, 0, 512, 256);
118: 
119:   // Fill light spot: cool blue radial blob — upper right
120:   const fillSpot = ec.createRadialGradient(420, 80, 0, 420, 80, 120);
121:   fillSpot.addColorStop(0,   'rgba(20,40,90,0.20)');
122:   fillSpot.addColorStop(1,   'rgba(0,0,0,0)');
123:   ec.fillStyle = fillSpot; ec.fillRect(0, 0, 512, 256);
124: 
125:   const envTex = new THREE.CanvasTexture(envCvs);
126:   envTex.mapping = THREE.EquirectangularReflectionMapping;
127:   const envMap = pmrem.fromEquirectangular(envTex);
128:   scene.environment = envMap.texture;
129:   pmrem.dispose();
130: 
131:   // Cinematic overlays — injected above canvas, below page content
132:   const vignetteStyle = document.createElement('style');
133:   vignetteStyle.textContent = `
134:     #scene-vignette {
135:       position:fixed; inset:0; pointer-events:none; z-index:1;
136:       background:
137:         radial-gradient(ellipse 90% 70% at 50% 45%, transparent 40%, rgba(3,4,8,0.45) 72%, rgba(0,0,0,0.92) 100%),
138:         linear-gradient(to top, rgba(0,0,0,0.90) 0%, transparent 38%),
139:         linear-gradient(to bottom, rgba(1,2,5,0.55) 0%, transparent 22%);
140:     }
141:     #hero-copy {
142:       position:fixed; top:50%; left:50%;
143:       transform:translate(-50%, 20%);
144:       text-align:center; z-index:10; pointer-events:none;
145:       width:min(680px, 90vw);
146:       opacity:0; visibility:hidden;
147:       transition: opacity 0.85s ease, transform 0.85s ease;
148:       background: radial-gradient(ellipse 640px 300px at 50% 50%, rgba(1,2,4,0.48), transparent);
149:     }
150:     #hero-copy.visible {
151:       opacity:1; visibility:visible;
152:       transform:translate(-50%, 20%);
153:     }
154:     /* Scroll-out override — wins over .visible due to higher specificity */
155:     #hero-copy.visible.scrolled-out {
156:       opacity:0; visibility:hidden;
157:       transition: opacity 0.35s ease;
158:     }
159:     #hero-copy .hero-headline {
160:       font-family: 'Fraunces', Georgia, serif;
161:       font-size: clamp(28px, 4.0vw, 54px);
162:       font-weight: 800;
163:       letter-spacing: 0.04em;
164:       line-height: 1.1;
165:       color: #e8a840;
166:       text-shadow: 0 0 40px rgba(210,140,20,0.55), 0 2px 8px rgba(0,0,0,0.7);
167:       margin: 0 0 4px;
168:     }
169:     #hero-copy .hero-tagline {
170:       font-family: 'DM Sans', system-ui, sans-serif;
171:       font-size: clamp(12px, 1.5vw, 17px);
172:       font-weight: 400;
173:       color: #c8aa78;
174:       opacity: 0.7;
175:       letter-spacing: 0.07em;
176:       margin: 0 0 12px;
177:     }
178:     #hero-copy .hero-divider {
179:       width: 100%; height: 1px;
180:       background: linear-gradient(90deg, transparent, rgba(68,136,204,0.5) 30%, rgba(200,130,20,0.4) 70%, transparent);
181:       margin: 10px 0;
182:     }
183:     #hero-copy .hero-sub {
184:       font-family: "Courier New", monospace;
185:       font-size: clamp(10px, 1.1vw, 13px);
186:       color: #7a9bb8;
187:       letter-spacing: 0.18em;
188:       text-transform: uppercase;
189:       margin: 0 0 18px;
190:     }
191:     #hero-copy .hero-ctas {
192:       display: flex; gap: 14px; justify-content: center; pointer-events: auto;
193:     }
194:     #hero-copy .hero-btn-primary {
195:       font-family: system-ui, sans-serif;
196:       font-size: clamp(11px, 1.2vw, 14px);
197:       font-weight: 600; letter-spacing: 0.08em;
198:       padding: 11px 24px; cursor: pointer;
199:       background: linear-gradient(135deg, #c97512, #e8a840);
200:       color: #0d0a06; border: none; border-radius: 4px;
201:       box-shadow: 0 0 22px rgba(200,130,20,0.45), 0 2px 6px rgba(0,0,0,0.5);
202:       transition: box-shadow 0.2s ease, transform 0.15s ease;
203:     }
204:     #hero-copy .hero-btn-primary:hover {
205:       box-shadow: 0 0 36px rgba(200,140,20,0.7), 0 2px 8px rgba(0,0,0,0.5);
206:       transform: translateY(-1px);
207:     }
208:     #hero-copy .hero-btn-secondary {
209:       font-family: system-ui, sans-serif;
210:       font-size: clamp(11px, 1.2vw, 14px);
211:       font-weight: 500; letter-spacing: 0.08em;
212:       padding: 11px 24px; cursor: pointer;
213:       background: rgba(68,136,204,0.10);
214:       color: #7aaddd; border: 1px solid rgba(68,136,204,0.45);
215:       border-radius: 4px;
216:       transition: background 0.2s ease, border-color 0.2s ease;
217:     }
218:     #hero-copy .hero-btn-secondary:hover {
219:       background: rgba(68,136,204,0.22);
220:       border-color: rgba(68,136,204,0.75);
221:     }
222:     #tool-info-panel {
223:       border-left: 4px solid rgba(68,136,204,0.75) !important;
224:       box-shadow: -4px 0 32px rgba(68,136,204,0.22), inset 3px 0 14px rgba(68,136,204,0.08) !important;
225:       clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%);
226:     }
227:     @keyframes panelBorderFill {
228:       from { background-size: 0% 2px; }
229:       to   { background-size: 100% 2px; }
230:     }
231:     #tool-info-panel::before {
232:       content:''; position:absolute; top:0; left:4px; right:0; height:2px;
233:       background: linear-gradient(90deg, rgba(68,136,204,0.8), rgba(200,130,20,0.6));
234:       background-size: 0% 2px; background-repeat: no-repeat;
235:       animation: panelBorderFill 0.35s ease 0.1s forwards;
236:     }
237:     @media print { #scene-vignette, #hero-copy { display:none !important; } }
238:     @media (max-width: 767px) {
239:       #hero-copy {
240:         top: auto !important;
241:         bottom: 14% !important;
242:         transform: translate(-50%, 0) !important;
243:         width: min(92vw, 480px) !important;
244:       }
245:       #hero-copy.visible { transform: translate(-50%, 0) !important; }
246:       #hero-copy.visible.scrolled-out { opacity:0 !important; visibility:hidden !important; }
247:       #tool-info-panel { display: none !important; }
248:       #tool-tooltip { display: none !important; }
249:     }
250:   `;
251:   document.head.appendChild(vignetteStyle);
252: 
253:   const vignette = document.createElement('div');
254:   vignette.id = 'scene-vignette';
255:   document.body.insertBefore(vignette, document.body.firstChild);
256: 
257:   /* ─── Camera ──────────────────────────────────────────── */
258:   const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 50);
259:   camera.position.set(0, 0, 6);
260: 
261:   /* ─── EffectComposer + UnrealBloomPass (after camera) ─── */
262:   if (!_isMobilePost && !_isLowEnd && typeof THREE.EffectComposer !== 'undefined') {
263:     composer = new THREE.EffectComposer(renderer);
264:     composer.addPass(new THREE.RenderPass(scene, camera));
265: 
266:     bloomPass = new THREE.UnrealBloomPass(
267:       new THREE.Vector2(window.innerWidth, window.innerHeight),
268:       0.40,   // strength — reduced from 0.55; lower baseline, dynamic formula handles peaks
269:       0.22,   // radius — tight halo eliminates mip-boundary step artifact; was 0.40
270:       0.55    // threshold — only saw disc emissive + spark mesh bright spots bloom; was 0.45
271:     );
272:     composer.addPass(bloomPass);
273:     const copyPass = new THREE.ShaderPass(THREE.CopyShader);
274:     copyPass.renderToScreen = true; // direct canvas blit — eliminates extra FBO read-back that causes stripe artifacts
275:     composer.addPass(copyPass);
276:   }
277: 
278:   // Hero copy — headline, tagline, CTAs (fades in after assembly completes)
279:   const heroCopy = document.createElement('div');
280:   heroCopy.id = 'hero-copy';
281: 
282:   const headline1 = document.createElement('div');
283:   headline1.className = 'hero-headline';
284:   headline1.textContent = 'EXPERT CRAFTSMANSHIP';
285:   heroCopy.appendChild(headline1);
286: 
287:   const headline2 = document.createElement('div');
288:   headline2.className = 'hero-tagline';
289:   headline2.textContent = 'Every Project · On Time · Done Right';
290:   heroCopy.appendChild(headline2);
291: 
292:   const divider = document.createElement('div');
293:   divider.className = 'hero-divider';
294:   heroCopy.appendChild(divider);
295: 
296:   const subTag = document.createElement('div');
297:   subTag.className = 'hero-sub';
298:   subTag.textContent = 'General Construction & Handyman Services';
299:   heroCopy.appendChild(subTag);
300: 
301:   const ctaRow = document.createElement('div');
302:   ctaRow.className = 'hero-ctas';
303: 
304:   const ctaPrimary = document.createElement('button');
305:   ctaPrimary.className = 'hero-btn-primary';
306:   ctaPrimary.textContent = 'BOOK A FREE ESTIMATE \u2192';
307:   ctaRow.appendChild(ctaPrimary);
308: 
309:   const ctaSecondary = document.createElement('button');
310:   ctaSecondary.className = 'hero-btn-secondary';
311:   ctaSecondary.textContent = 'VIEW SERVICES';
312:   ctaRow.appendChild(ctaSecondary);
313: 
314:   heroCopy.appendChild(ctaRow);
315:   document.body.appendChild(heroCopy);
316: 
317:   /* ─── Lights ──────────────────────────────────────────── */
318:   // Minimal ambient — scene is dark, lights sculpt the form
319:   const ambientLight = new THREE.AmbientLight(0x06080e, 0.04);
320:   scene.add(ambientLight);
321: 
322:   // ── KEY LIGHT: large warm amber RectAreaLight — upper left, main sculpting light
323:   const keyLight = new THREE.RectAreaLight(0xf0920c, 0.18, 5.0, 4.0);
324:   keyLight.position.set(-4.0, 5.5, 5.5);
325:   keyLight.lookAt(0, 0.5, 0);
326:   scene.add(keyLight);
327: 
328:   // ── FILL LIGHT: cool blue RectAreaLight — right side, lower intensity
329:   const fillLight = new THREE.RectAreaLight(0x2255bb, 0.15, 3.5, 5.0);
330:   fillLight.position.set(5.0, 0.5, 3.0);
331:   fillLight.lookAt(0, 0.5, 0);
332:   scene.add(fillLight);
333: 
334:   // ── RIM / BACK LIGHT: neutral cool, overhead-rear — edge separation
335:   const rimAreaLight = new THREE.RectAreaLight(0x7799cc, 0.12, 6.0, 1.8);
336:   rimAreaLight.position.set(0, 7.0, -4.5);
337:   rimAreaLight.lookAt(0, 0, 1);
338:   scene.add(rimAreaLight);
339: 
340:   // ── FLOOR BOUNCE: warm amber point from below — fills in under-shadows
341:   const groundGlow = new THREE.PointLight(0xb06010, 0.18, 12);
342:   groundGlow.position.set(0, -2.2, 2.5);
343:   scene.add(groundGlow);
344: 
345:   // ── ORBITING DYNAMIC LIGHT: warm amber point, animates — keeps metals alive
346:   const orbitLight = new THREE.PointLight(0xd4820a, 0.25, 20);
347:   orbitLight.castShadow = false; // VSM pass omitted — orbiting light shadow not visually significant; reduces GPU load during particle peaks
348:   const shadowRes = window.innerWidth < 768 ? 1024 : 2048;
349:   orbitLight.shadow.mapSize.width  = shadowRes;
350:   orbitLight.shadow.mapSize.height = shadowRes;
351:   orbitLight.shadow.radius = 4;  // VSM blur radius — wider = softer penumbra
352:   orbitLight.shadow.camera.near = 0.5;
353:   orbitLight.shadow.camera.far  = 22;
354:   orbitLight.shadow.bias = -0.0005;
355:   scene.add(orbitLight);
356: 
357:   // ── SAW SPOT: tight amber spotlight on saw blade apex
358:   const sawSpot = new THREE.SpotLight(0xffa040, 0.6, 14, Math.PI / 14, 0.45, 1.8);
359:   sawSpot.position.set(0.2, 5.0, 4.5);
360:   sawSpot.target.position.set(0, 2.2, -0.5);
361:   sawSpot.castShadow = true;
362:   sawSpot.shadow.mapSize.width  = shadowRes;
363:   sawSpot.shadow.mapSize.height = shadowRes;
364:   sawSpot.shadow.radius = 3;
365:   sawSpot.shadow.camera.near = 1;
366:   sawSpot.shadow.camera.far  = 16;
367:   sawSpot.shadow.bias = -0.0003;
368:   scene.add(sawSpot);
369:   scene.add(sawSpot.target);
370: 
371:   // ── VORTEX PARTICLE LIGHT: warm amber point that follows cursor vortex center ──
372:   // Gives tools physically correct illumination from the particle cloud
373:   const vortexLight = new THREE.PointLight(0xd4820a, 0, 10);
374:   vortexLight.position.set(0, 0, 1.5);
375:   scene.add(vortexLight);
376: 
377:   // ── SAW PARTICLE GLOW: orange light from spinning blade sparks / hub bloom ──
378:   const sawParticleGlow = new THREE.PointLight(0xff6600, 0, 8);
379:   scene.add(sawParticleGlow);
380: 
381:   // ── SPARK LIGHT: warm gold light from secondary particle system during turbulence ──
382:   const sparkLight = new THREE.PointLight(0xffcc66, 0, 8);
383:   scene.add(sparkLight);
384: 
385:   // ── CLOUD KEY LIGHT: wide-radius amber fill covering all 3 tools ──
386:   const cloudKeyLight = new THREE.PointLight(0xff9933, 0, 18);
387:   cloudKeyLight.position.set(0, 0.5, 2.0);
388:   scene.add(cloudKeyLight);
389: 
390:   // ── FLOOR RIM LIGHT: dramatic under-lighting burst on implosion ──
391:   const floorRimLight = new THREE.PointLight(0x4488cc, 0, 14);
392:   floorRimLight.position.set(0, -2.0, 1.5);
393:   scene.add(floorRimLight);
394: 
395:   /* ─── Helpers ─────────────────────────────────────────── */
396:   function rand(min, max) {
397:     return min + Math.random() * (max - min);
398:   }
399: 
400:   function makeMaterial(colorHex) {
401:     const variant = Math.random();
402:     const roughness = variant < 0.33 ? rand(0.55, 0.70)
403:                     : variant < 0.66 ? rand(0.12, 0.28)
404:                     :                  rand(0.72, 0.88);
405:     const metalness = variant < 0.33 ? rand(0.75, 0.92)
406:                     : variant < 0.66 ? rand(0.88, 0.98)
407:                     :                  rand(0.25, 0.45);
408:     const baseColor = new THREE.Color(colorHex);
409:     baseColor.multiplyScalar(rand(0.75, 1.15));
410:     return new THREE.MeshStandardMaterial({ color: baseColor, roughness, metalness });
411:   }
412: 
413:   // Gunmetal — hammer head, deep dark metal
414:   const steelMat = new THREE.MeshStandardMaterial({
415:     color: 0x5a5a62,
416:     roughness: 0.08,
417:     metalness: 0.97,
418:     envMapIntensity: 0.7,
419:   });
420: 
421:   // Dark rubber grip — hammer handle and wrench grip zones
422:   const darkMat = new THREE.MeshStandardMaterial({
423:     color: 0x181410,
424:     roughness: 0.75,
425:     metalness: 0.12,
426:   });
427: 
428:   // Polished chrome — wrench jaw and saw blade body
429:   const chromeMat = new THREE.MeshStandardMaterial({
430:     color: 0xf2f0ea,
431:     roughness: 0.02,
432:     metalness: 0.99,
433:     envMapIntensity: 0.8,
434:   });
435: 
436:   // Amber emissive — for saw blade hub and highlights
437:   const amberEmissiveMat = new THREE.MeshStandardMaterial({
438:     color: 0xff8800,
439:     roughness: 0.1,
440:     metalness: 0.0,
441:     emissive: new THREE.Color(0xff6600),
442:     emissiveIntensity: 1.4,   // bloom-safe sweet spot — hub glows hot amber, not blown white
443:     transparent: true,
444:     opacity: 1.0,
445:   });
446: 
447:   // Gunmetal — tape measure housing
448:   const gunmetalMat = new THREE.MeshStandardMaterial({
449:     color: 0x3a3830,
450:     roughness: 0.28,
451:     metalness: 0.82,
452:     transparent: true,
453:     opacity: 1.0,
454:   });
455:   gunmetalMat.envMapIntensity = 0.8;
456: 
457:   // Yellow tape — tape measure band
458:   const tapeBandMat = new THREE.MeshStandardMaterial({
459:     color: 0xd4a012,
460:     roughness: 0.55,
461:     metalness: 0.45,
462:     transparent: true,
463:     opacity: 1.0,
464:   });
465:   tapeBandMat.envMapIntensity = 0.4;
466: 
467:   // Warm wood — hammer handle
468:   const woodMat = new THREE.MeshStandardMaterial({
469:     color: 0xc8952a,
470:     roughness: 0.85,
471:     metalness: 0.0,
472:     transparent: true,
473:     opacity: 1.0,
474:   });
475: 
476:   const panelColors = [0x2e2a22, 0x38332a, 0x403b30, 0x4a4438, 0x352f26, 0x3d3830];
477: 
478:   /* ─── Debris group ────────────────────────────────────── */
479:   const fragmentGroup = new THREE.Group();
480:   scene.add(fragmentGroup);
481:   const fragmentData = [];
482: 
483:   // Girder bars — strictly behind tools, slower rotation = atmospheric not distracting
484:   for (let i = 0; i < 8; i++) {
485:     const geo = new THREE.BoxGeometry(0.08, rand(1.8, 3.2), 0.08);
486:     const mat = makeMaterial(panelColors[Math.floor(Math.random() * panelColors.length)]);
487:     const mesh = new THREE.Mesh(geo, mat);
488:     mesh.castShadow = true;
489:     mesh.receiveShadow = true;
490:     mesh.position.set(rand(-9, 9), rand(-5, 5), rand(-18, -6));
491:     mesh.rotation.set(rand(-0.4, 0.4), rand(-Math.PI, Math.PI), rand(-0.3, 0.3));
492:     fragmentGroup.add(mesh);
493:     fragmentData.push({ mesh, rotX: rand(0.000025, 0.0001), rotY: rand(0.000025, 0.0001), rotZ: rand(0.000015, 0.00005) });
494:   }
495: 
496:   // Hex bolt heads — behind tools
497:   for (let i = 0; i < 5; i++) {
498:     const geo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 6);
499:     const mat = makeMaterial(panelColors[Math.floor(Math.random() * panelColors.length)]);
500:     const mesh = new THREE.Mesh(geo, mat);
501:     mesh.castShadow = true;
502:     mesh.position.set(rand(-8, 8), rand(-4, 4), rand(-16, -6));
503:     mesh.rotation.set(rand(-Math.PI, Math.PI), rand(-Math.PI, Math.PI), 0);
504:     fragmentGroup.add(mesh);
505:     fragmentData.push({ mesh, rotX: rand(0.000025, 0.0001), rotY: rand(0.00003, 0.000125), rotZ: rand(0.000015, 0.00005) });
506:   }
507: 
508:   // Washer rings — behind tools
509:   for (let i = 0; i < 4; i++) {
510:     const geo = new THREE.TorusGeometry(0.18, 0.045, 8, 14);
511:     const mat = makeMaterial(panelColors[Math.floor(Math.random() * panelColors.length)]);
512:     const mesh = new THREE.Mesh(geo, mat);
513:     mesh.castShadow = true;
514:     mesh.position.set(rand(-8, 8), rand(-4, 4), rand(-16, -6));
515:     mesh.rotation.set(rand(-Math.PI, Math.PI), rand(-Math.PI, Math.PI), rand(-Math.PI, Math.PI));
516:     fragmentGroup.add(mesh);
517:     fragmentData.push({ mesh, rotX: rand(0.00003, 0.00011), rotY: rand(0.00003, 0.00011), rotZ: rand(0.000015, 0.00006) });
518:   }
519: 
520:   // Pipe sections — behind tools
521:   for (let i = 0; i < 4; i++) {
522:     const geo = new THREE.CylinderGeometry(0.07, 0.07, rand(0.35, 0.65), 8);
523:     const mat = makeMaterial(panelColors[Math.floor(Math.random() * panelColors.length)]);
524:     const mesh = new THREE.Mesh(geo, mat);
525:     mesh.castShadow = true;
526:     mesh.position.set(rand(-8, 8), rand(-4, 4), rand(-16, -6));
527:     mesh.rotation.set(rand(-Math.PI, Math.PI), rand(-Math.PI, Math.PI), rand(-Math.PI, Math.PI));
528:     fragmentGroup.add(mesh);
529:     fragmentData.push({ mesh, rotX: rand(0.000025, 0.0001), rotY: rand(0.000025, 0.0001), rotZ: rand(0.000015, 0.00005) });
530:   }
531: 
532:   /* ─── Particle Systems ─────────────────────────────────── */
533:   // Create ember-quality particle texture — 128px with corona ring for depth
534:   const particleCanvas = document.createElement('canvas');
535:   particleCanvas.width = particleCanvas.height = 128;
536:   const pCtx = particleCanvas.getContext('2d');
537:   const cx = 64, cy = 64, r = 62;
538: 
539:   const grad = pCtx.createRadialGradient(cx, cy, 0, cx, cy, r);
540:   grad.addColorStop(0,    'rgba(255,255,255,1.0)');  // white-hot core
541:   grad.addColorStop(0.08, 'rgba(255,230,140,0.95)'); // inner amber halo
542:   grad.addColorStop(0.25, 'rgba(255,170,50,0.70)');  // orange mid glow
543:   grad.addColorStop(0.55, 'rgba(220,100,20,0.28)');  // ember outer glow
544:   grad.addColorStop(1.0,  'rgba(180,60,5,0.00)');    // transparent edge
545:   pCtx.fillStyle = grad;
546:   pCtx.fillRect(0, 0, 128, 128);
547: 
548:   // Wider luminous corona ring — bloom-enhanced; broader halo makes particles read as light sources
549:   const ring = pCtx.createRadialGradient(cx, cy, r*0.25, cx, cy, r*0.65);
550:   ring.addColorStop(0,   'rgba(255,200,80,0.0)');
551:   ring.addColorStop(0.5, 'rgba(255,180,60,0.22)');
552:   ring.addColorStop(1,   'rgba(255,160,40,0.0)');
553:   pCtx.fillStyle = ring;
554:   pCtx.fillRect(0, 0, 128, 128);
555: 
556:   const particleTex = new THREE.CanvasTexture(particleCanvas);
557: 
558:   /* ─── Responsive particle counts ─────────────────────── */
559:   const isMobile = window.innerWidth < 768;
560:   const AMBER_COUNT = _isLowEnd ? 600  : (isMobile ? 1200 : 6000);  // Dense golden ember cloud
561:   const SPARK_COUNT = _isLowEnd ? 250  : (isMobile ? 500  : 2800);  // Warm gold secondary layer
562: 
563:   /* ─── Particle physics system ────────────────────────── */
564:   function createParticleSystem(particleCount, positionRange) {
565:     const positions = new Float32Array(particleCount * 3);
566:     const velocities = new Float32Array(particleCount * 3);
567: 
568:     // Initialize positions in a cloud formation
569:     for (let i = 0; i < particleCount; i++) {
570:       const theta = rand(0, Math.PI * 2);
571:       const phi = Math.acos(rand(-1, 1));
572:       const r = rand(0, positionRange);
573:       positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
574:       positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
575:       positions[i * 3 + 2] = r * Math.cos(phi);
576:       // Velocities initialized to zero
577:     }
578: 
579:     const geo = new THREE.BufferGeometry();
580:     geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
581: 
582:     return { positions, velocities, geo, count: particleCount };
583:   }
584: 
585:   // Amber dust particles — main layer with per-particle vertex colors for temperature variation
586:   const amberSystem = createParticleSystem(AMBER_COUNT, 11);
587:   // Vertex colors: white-hot to red-orange based on per-particle temperature
588:   const amberColors = new Float32Array(AMBER_COUNT * 3);
589:   for (let i = 0; i < AMBER_COUNT; i++) {
590:     const temp = Math.random();
591:     amberColors[i*3]   = 1.0;
592:     amberColors[i*3+1] = 0.30 + temp * 0.40;
593:     amberColors[i*3+2] = temp * 0.15;
594:   }
595:   amberSystem.geo.setAttribute('color', new THREE.BufferAttribute(amberColors, 3));
596:   const amberParticleMat = new THREE.PointsMaterial({
597:     map: particleTex,
598:     color: 0xffffff, size: 0.060, sizeAttenuation: true,  // white base — vertex colors drive hue
599:     vertexColors: true,
600:     transparent: true, opacity: 0.60,
601:     blending: THREE.AdditiveBlending, depthWrite: false,
602:   });
603:   const amberParticles = new THREE.Points(amberSystem.geo, amberParticleMat);
604:   amberParticles.frustumCulled = false;
605:   scene.add(amberParticles);
606: 
607:   // DEBUG-TELEMETRY: expose particle positions for Playwright validation (removable)
608:   window.__particleSnapshot = () => Float32Array.from(amberSystem.positions);
609:   window.__vortexParams = () => ({ ...VORTEX_PARAMS });
610:   window.__sampleCanvasPixel = (x, y) => {
611:     const gl = renderer.getContext();
612:     const buf = new Uint8Array(4);
613:     gl.readPixels(x, gl.drawingBufferHeight - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf);
614:     return { r: buf[0], g: buf[1], b: buf[2], a: buf[3] };
615:   };
616: 
617:   // Blue-white spark particles — secondary layer, smaller, brighter
618:   const sparkSystem = createParticleSystem(SPARK_COUNT, 6);
619:   const sparkMat = new THREE.PointsMaterial({
620:     map: particleTex,
621:     color: 0xffeedd, size: 0.045, sizeAttenuation: true,
622:     transparent: true, opacity: 0.72,
623:     blending: THREE.AdditiveBlending, depthWrite: false,
624:   });
625:   const sparkParticles = new THREE.Points(sparkSystem.geo, sparkMat);
626:   sparkParticles.frustumCulled = false;
627:   scene.add(sparkParticles);
628: 
629:   // Fine sand haze — ultra-small particles at high count, fills the volume with luminous mist
630:   const HAZE_COUNT = _isLowEnd ? 400 : (isMobile ? 800 : 4000);
631:   const hazeSystem = createParticleSystem(HAZE_COUNT, 18);  // wider spread than other layers
632:   const hazeMat = new THREE.PointsMaterial({
633:     map: particleTex,
634:     color: 0xaa9977, size: 0.045, sizeAttenuation: true,  // warm taupe — blends with amber palette, not blue
635:     transparent: true, opacity: 0.42,
636:     blending: THREE.AdditiveBlending, depthWrite: false,
637:   });
638:   const hazeParticles = new THREE.Points(hazeSystem.geo, hazeMat);
639:   hazeParticles.frustumCulled = false;
640:   scene.add(hazeParticles);
641: 
642:   /* ─── Vortex physics parameters ──────────────────────── */
643:   const VORTEX_PARAMS = {
644:     vortexRadius: 7.0,          // Wide cursor influence — more particles feel the cursor, better interaction
645:     coreRadius: 1.8,            // Wide dead zone — equilibrium ring is large and loose, not a tight halo
646:     tangentialStrength: 0.0042, // Spiral force — raised for visible ambient swirl at rest
647:     radialStrength: 0.00075,    // Balanced pull — competes with scene pressure, doesn't dominate
648:     coreStrength: 0.005,        // Soft core bounce — light spring effect at center
649:     entropyStrength: 0.00055,   // ~0.73× radialStrength — entropy and pull roughly equal, no ring forms
650:     upwardDrift: 0.00085,       // Moderate convection — embers rise slowly, center stays populated
651:     damping: 0.960,             // Heavy drag — particles barely coast, linger like embers
652:     velocityCap: 0.18,          // Allows shockwave blast, implosion snap; physics damping controls decay
653:     shockwaveRadius: 4.5,       // Click blast radius
654:     shockwaveImpulse: 0.45,     // Outward impulse strength on click
655:     implosionStrength: 0.14,    // Crisp rubber-band snap-back; matches raised velocityCap
656:     implosionDelay: 0.05,       // Fraction of implosion duration before pull starts (snappier)
657:     boundaryTop: 8.0,
658:     boundaryBottom: -6.5,
659:     // ── Mouse-driven physics fields ──
660:     centerX: 0, centerY: 0, centerZ: 0,   // Moveable vortex center (lerps to cursor)
661:     mouseVelocityX: 0, mouseVelocityY: 0,  // EMA-smoothed mouse velocity (NDC/frame)
662:     turbulenceMode: 0,                      // 0=gravity well, 1=thermal scatter
663:     velocityThreshold: 0.020,               // Raised — micro-jitter no longer triggers turbulence
664:     turbulenceStrength: 0.014,              // Stronger scatter — visceral cursor interaction
665:     thermalDamping: 0.970,                  // Looser damping when turbulent
666:     proximityTool: null,                    // 'hammer'|'wrench'|'saw'|null
667:     proximityStrength: 0,                   // 0–1 smooth blend
668:     reverseGravity: false,                  // Right-click: all particles flee cursor
669:     // ── Directional wind (mouse-velocity aligned force) ──
670:     windStrength: 0.020,                    // stronger directional wind — particles trail cursor visibly
671:     baseWindStrength: 0.020,               // reset target for windStrength after drag boost
672:     windZBias: 0.55,                        // fraction of z-scatter aligned to mouse direction
673:     // ── Saw aerodynamic induction ──
674:     sawInductionStrength: 0.0012,           // tangential circulation per unit speedRatio — subtle stir
675:     sawInductionRadius: 2.2,              // smaller zone — saw stirs but doesn't dominate
676:     sawWorldX: 0, sawWorldY: 0, sawWorldZ: 0, // saw position — updated each frame
677:     sawSpeedRatio: 0,                       // 0–1 saw speed — updated each frame
678:     // ── Ambient breathing pulse ──
679:     breatheAmplitude: 0.0006,              // ±33% modulation of radialStrength
680:     breathePeriod: 4000,                   // ms per complete breath cycle
681:   };
682: 
683:   /* ─── Vortex physics update ──────────────────────────── */
684:   function updateVortexPhysics(system, mouseWorldPos, delta) {
685:     const pos = system.positions;
686:     const vel = system.velocities;
687:     const count = system.count;
688: 
689:     // Read moveable center (lerped toward cursor by updateMousePhysics)
690:     const cx = VORTEX_PARAMS.centerX;
691:     const cy = VORTEX_PARAMS.centerY;
692:     const cz = VORTEX_PARAMS.centerZ;
693: 
694:     const turbBlend = VORTEX_PARAMS.turbulenceMode;          // 0..1
695:     const isTurbulent = turbBlend > 0.3;
696:     const gravSign = VORTEX_PARAMS.reverseGravity ? -1.0 : 1.0;
697:     const proxTool = VORTEX_PARAMS.proximityTool;
698:     const proxStr  = VORTEX_PARAMS.proximityStrength;
699: 
700:     // Dynamic damping: blend toward looser thermalDamping when turbulent
701:     const effectiveDamping = VORTEX_PARAMS.damping + (VORTEX_PARAMS.thermalDamping - VORTEX_PARAMS.damping) * turbBlend;
702: 
703:     // Wind direction: unit vector along mouse velocity (used in turbulence branch)
704:     const velMag = Math.sqrt(VORTEX_PARAMS.mouseVelocityX ** 2 + VORTEX_PARAMS.mouseVelocityY ** 2);
705:     const windDirX = velMag > 0.0001 ? VORTEX_PARAMS.mouseVelocityX / velMag : 0;
706:     const windDirY = velMag > 0.0001 ? VORTEX_PARAMS.mouseVelocityY / velMag : 0;
707:     const windDirZ = windDirX * 0.4;  // depth component: rightward motion → slight backward push
708: 
709:     for (let i = 0; i < count; i++) {
710:       const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
711:       let px = pos[ix], py = pos[iy], pz = pos[iz];
712:       let vx = vel[ix], vy = vel[iy], vz = vel[iz];
713: 
714:       const dx = px - cx;
715:       const dy = py - cy;
716:       const dz = pz - cz;
717:       const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
718: 
719:       if (dist < VORTEX_PARAMS.vortexRadius && dist > 0.01) {
720:         const normDist = dist / VORTEX_PARAMS.vortexRadius;
721: 
722:         if (!isTurbulent) {
723:           // ── GRAVITY WELL: spiral inward toward cursor ──
724:           const tx = -dz / dist;
725:           const tz =  dx / dist;
726:           // Tangential force scaled by turbBlend — zero at rest, full when mouse is moving
727:           // This prevents the spiral orbit ring from forming when the cursor is stationary
728:           const tangentialForce = VORTEX_PARAMS.tangentialStrength * (1.0 - normDist * 0.6) * (0.35 + turbBlend * 0.65);
729:           vx += tx * tangentialForce;
730:           vz += tz * tangentialForce;
731: 
732:           // Core repulsion: invert force inside equilibrium radius — creates orbital ring not collapsed point
733:           const equilibriumRadius = VORTEX_PARAMS.coreRadius * 2.0;
734:           let radialForce;
735:           if (dist < VORTEX_PARAMS.coreRadius) {
736:             // Inside core: strong outward push — particles bounce off the center
737:             radialForce = -VORTEX_PARAMS.coreStrength * (1.0 - dist / VORTEX_PARAMS.coreRadius);
738:           } else if (dist < equilibriumRadius) {
739:             // Transition zone: blend from repulsion to gentle attraction
740:             const t = (dist - VORTEX_PARAMS.coreRadius) / (equilibriumRadius - VORTEX_PARAMS.coreRadius);
741:             radialForce = VORTEX_PARAMS.coreStrength * 0.3 * (t * 2.0 - 1.0);
742:           } else {
743:             // Outer vortex: gentle inward pull that fades at radius edge
744:             radialForce = VORTEX_PARAMS.radialStrength * (1.0 - normDist);
745:           }
746:           vx -= (dx / dist) * radialForce * gravSign;
747:           vy -= (dy / dist) * radialForce * gravSign;
748:           vz -= (dz / dist) * radialForce * gravSign;
749:         } else {
750:           // ── THERMAL TURBULENCE: directional scatter — particles trail cursor motion ──
751:           const scatterX = VORTEX_PARAMS.mouseVelocityX * 5.5;
752:           const scatterY = VORTEX_PARAMS.mouseVelocityY * -3.0;
753:           const falloff = 1.0 - normDist;
754:           vx += scatterX * VORTEX_PARAMS.turbulenceStrength * falloff;
755:           vy += scatterY * VORTEX_PARAMS.turbulenceStrength * falloff;
756:           // Directional wind boost — pushes particles in the cursor's travel direction
757:           vx += windDirX * velMag * 80.0 * VORTEX_PARAMS.windStrength * falloff;
758:           vy += windDirY * velMag * 80.0 * VORTEX_PARAMS.windStrength * falloff;
759:           // 70/30 directional jitter — streak along mouse axis, not symmetric blob
760:           const jitterMag = VORTEX_PARAMS.turbulenceStrength * 0.8 * falloff;
761:           const jitterAlong = (Math.random() - 0.5) * jitterMag;
762:           vx += windDirX * jitterAlong * 0.70 + (Math.random() - 0.5) * jitterMag * 0.30;
763:           vy += windDirY * jitterAlong * 0.70 + (Math.random() - 0.5) * jitterMag * 0.30;
764:           vz += windDirZ * jitterAlong * 0.70 + (Math.random() - 0.5) * jitterMag * 0.15;
765:           // Outward wind pressure — fast cursor movement pushes particles away like disturbing sand
766:           const outwardForce = velMag * 0.010 * falloff;
767:           vx += (dx / dist) * outwardForce;
768:           vy += (dy / dist) * outwardForce;
769:         }
770: 
771:         // ── TOOL PROXIMITY PHYSICS: each tool has a distinct force signature ──
772:         if (proxTool !== null && proxStr > 0.05) {
773:           const falloff = 1.0 - normDist;
774:           if (proxTool === 'hammer') {
775:             // "Nail driving" — strong downward column, particles pile up below hammer
776:             const horzDist = Math.sqrt(dx * dx + dz * dz);
777:             if (horzDist < 2.0) {
778:               const colFalloff = (1.0 - horzDist / 2.0) * falloff;
779:               vy -= 0.0040 * colFalloff * proxStr;  // Stronger downward pull
780:               vx -= (dx / Math.max(dist, 0.1)) * 0.0010 * colFalloff * proxStr;
781:               vz -= (dz / Math.max(dist, 0.1)) * 0.0010 * colFalloff * proxStr;
782:             }
783:           } else if (proxTool === 'wrench') {
784:             // "Tightening" — tight vortex spiral that really grabs particles, high tangential
785:             const tx = -dz / dist;
786:             const tz =  dx / dist;
787:             vx += tx * VORTEX_PARAMS.tangentialStrength * 7.0 * falloff * proxStr;
788:             vz += tz * VORTEX_PARAMS.tangentialStrength * 7.0 * falloff * proxStr;
789:             vx -= (dx / dist) * VORTEX_PARAMS.coreStrength * 3.5 * proxStr;
790:             vz -= (dz / dist) * VORTEX_PARAMS.coreStrength * 3.5 * proxStr;
791:           } else if (proxTool === 'saw') {
792:             // "Cutting" — strong fan scatter radiating outward from blade center
793:             const arcAngle = Math.atan2(dz, dx);
794:             const fanForce = 0.0045 * falloff * proxStr;  // Stronger scatter
795:             vx += Math.cos(arcAngle) * fanForce;
796:             vz += Math.sin(arcAngle) * fanForce;
797:             vy *= 0.95;  // Harder suppression — saw keeps things horizontal
798:           }
799:         }
800: 
801:         // ── SAW INDUCTION: spinning blade creates tangential air circulation ──
802:         if (VORTEX_PARAMS.sawSpeedRatio > 0.15) {
803:           const sdx = px - VORTEX_PARAMS.sawWorldX;
804:           const sdz = pz - VORTEX_PARAMS.sawWorldZ;
805:           const sawDist = Math.sqrt(sdx * sdx + sdz * sdz);
806:           if (sawDist > 0.05 && sawDist < VORTEX_PARAMS.sawInductionRadius) {
807:             const sawFalloff = 1.0 - (sawDist / VORTEX_PARAMS.sawInductionRadius);
808:             const stx = -sdz / sawDist;
809:             const stz =  sdx / sawDist;
810:             const induction = VORTEX_PARAMS.sawInductionStrength * VORTEX_PARAMS.sawSpeedRatio * sawFalloff;
811:             vx += stx * induction;
812:             vz += stz * induction;
813:           }
814:         }
815:       }
816: 
817:       // Upward drift + gentle lateral desert wind (always active)
818:       vy += VORTEX_PARAMS.upwardDrift;
819:       vx += 0.00008;  // slow persistent drift — desert breeze pushes dust rightward
820: 
821:       // ── ENTROPY: per-particle random walk — prevents static equilibrium, keeps cloud alive ──
822:       // Applied to ALL particles every frame regardless of vortex distance
823:       // Strength (0.00085) is ~2× radialStrength — entropy WINS over attraction, breaking orbits
824:       const entropyScale = VORTEX_PARAMS.entropyStrength;
825:       vx += (Math.random() - 0.5) * entropyScale;
826:       vy += (Math.random() - 0.5) * entropyScale * 0.6;  // less vertical entropy — embers mostly drift up
827:       vz += (Math.random() - 0.5) * entropyScale * 0.4;  // minimal depth entropy
828: 
829:       // ── SCENE PRESSURE: gentle push away from world origin — prevents cloud from re-collapsing ──
830:       // Half strength from before — nudge not push, center stays populated
831:       vx += px * 0.000040;
832:       vy += py * 0.000018;
833: 
834:       // Dynamic damping
835:       vx *= effectiveDamping;
836:       vy *= effectiveDamping;
837:       vz *= effectiveDamping;
838: 
839:       // ── Z-GRAVITY: restore deep-background particles toward foreground ──
840:       if (pz < -2.0) { vz += (-2.0 - pz) * 0.00018; }
841:       if (pz >  2.5) { vz -= (pz - 2.5) * 0.00009; }
842: 
843:       // Velocity magnitude cap
844:       const vmag = Math.sqrt(vx * vx + vy * vy + vz * vz);
845:       if (vmag > VORTEX_PARAMS.velocityCap) {
846:         const scale = VORTEX_PARAMS.velocityCap / vmag;
847:         vx *= scale; vy *= scale; vz *= scale;
848:       }
849: 
850:       // Position update
851:       px += vx; py += vy; pz += vz;
852: 
853:       // Boundary recycling
854:       if (py > VORTEX_PARAMS.boundaryTop || py < VORTEX_PARAMS.boundaryBottom) {
855:         px = (Math.random() - 0.5) * 22;
856:         py = VORTEX_PARAMS.boundaryBottom + Math.random() * 2.5;
857:         pz = (Math.random() - 0.5) * 22;
858:         vx = 0; vy = 0; vz = 0;
859:       }
860: 
861:       pos[ix] = px; pos[iy] = py; pos[iz] = pz;
862:       vel[ix] = vx; vel[iy] = vy; vel[iz] = vz;
863:     }
864:     system.geo.attributes.position.needsUpdate = true;
865:   }
866: 
867:   /* ─── Vortex shockwave (click blast) ─────────────────── */
868:   function applyVortexShockwave(system, clickWorldPos) {
869:     const pos = system.positions;
870:     const vel = system.velocities;
871:     for (let i = 0; i < system.count; i++) {
872:       const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
873:       const dx = pos[ix] - clickWorldPos.x;
874:       const dy = pos[iy] - clickWorldPos.y;
875:       const dz = pos[iz] - clickWorldPos.z;
876:       const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
877:       if (dist < VORTEX_PARAMS.shockwaveRadius && dist > 0.01) {
878:         const impulse = VORTEX_PARAMS.shockwaveImpulse * (1 - dist / VORTEX_PARAMS.shockwaveRadius);
879:         vel[ix] += (dx / dist) * impulse;
880:         vel[iy] += (dy / dist) * impulse;
881:         vel[iz] += (dz / dist) * impulse;
882:       }
883:     }
884:   }
885: 
886:   /* ─── Blueprint Grids ─────────────────────────────────── */
887:   function makeGrid(cols, rows, cell, color, opacity) {
888:     const verts = [];
889:     for (let c = 0; c <= cols; c++) {
890:       const x = (c - cols / 2) * cell;
891:       verts.push(x, 0, 0,  x, rows * cell, 0);
892:     }
893:     for (let r = 0; r <= rows; r++) {
894:       const y = r * cell;
895:       verts.push(-(cols / 2) * cell, y, 0,  (cols / 2) * cell, y, 0);
896:     }
897:     const geo = new THREE.BufferGeometry();
898:     geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
899:     const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
900:     return new THREE.LineSegments(geo, mat);
901:   }
902: 
903:   const floorGrid = makeGrid(28, 20, 0.6, 0x1a44aa, 0.55); // more saturated blue, clearly visible
904:   floorGrid.rotation.x = -1.05;
905:   floorGrid.position.set(0, -3.2, 1.0);
906:   scene.add(floorGrid);
907: 
908:   const wallGrid = makeGrid(14, 9, 0.55, 0xe8900a, 0.22); // warm amber wall grid, visible
909:   wallGrid.position.set(0, -0.5, -3.8);
910:   scene.add(wallGrid);
911: 
912:   // Horizon depth grid — creates vanishing-point perspective illusion
913:   const horizonGrid = makeGrid(22, 12, 0.7, 0x2255cc, 0.14);
914:   horizonGrid.rotation.x = -1.35;
915:   horizonGrid.position.set(0, -2.8, -2.0);
916:   scene.add(horizonGrid);
917: 
918: /* ─── Reflective floor plane ──────────────────────────── */
919: const floorPlane = new THREE.Mesh(
920:   new THREE.PlaneGeometry(28, 28, 1, 1),
921:   new THREE.MeshStandardMaterial({
922:     color: 0x080a0f,
923:     roughness: 0.08,
924:     metalness: 0.92,
925:     envMapIntensity: 1.4,
926:   })
927: );
928: floorPlane.rotation.x = -Math.PI / 2;
929: floorPlane.position.y = -2.55;
930: floorPlane.receiveShadow = true;
931: scene.add(floorPlane);
932: 
933: // Soft glow bloom on floor — additive overlay plane slightly above floor
934: const floorGlow = new THREE.Mesh(
935:   new THREE.PlaneGeometry(14, 14, 1, 1),
936:   new THREE.MeshBasicMaterial({
937:     color: 0x1a0e04,
938:     transparent: true,
939:     opacity: 0.28,
940:     blending: THREE.AdditiveBlending,
941:     depthWrite: false,
942:   })
943: );
944: floorGlow.rotation.x = -Math.PI / 2;
945: floorGlow.position.y = -2.50;
946: scene.add(floorGlow);
947: 
948: // Additive vortex glow plane — billboard at vortex origin creates "light volume" illusion
949: const vortexGlowPlane = new THREE.Mesh(
950:   new THREE.PlaneGeometry(6.0, 6.0),
951:   new THREE.MeshBasicMaterial({
952:     color: 0x331100, transparent: true, opacity: 0.0,
953:     blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false,
954:   })
955: );
956: vortexGlowPlane.renderOrder = 999;
957: scene.add(vortexGlowPlane);
958: 
959:   /* ─── Scan-line + glow layer ──────────────────────────── */
960:   const scanLineVerts = new Float32Array(6);
961:   const scanLineGeo = new THREE.BufferGeometry();
962:   scanLineGeo.setAttribute('position', new THREE.BufferAttribute(scanLineVerts, 3));
963: 
964:   const scanLineMat = new THREE.LineBasicMaterial({
965:     color: 0x55aaff, transparent: true, opacity: 1.0,
966:   });
967:   const scanLine = new THREE.Line(scanLineGeo, scanLineMat);
968:   scanLine.rotation.x = -1.05;
969:   scanLine.position.set(0, -3.2, 1.0);
970:   scene.add(scanLine);
971: 
972:   // Additive glow duplicate — same geometry, wider apparent spread via blending
973:   const scanGlowMat = new THREE.LineBasicMaterial({
974:     color: 0x88ccff,
975:     transparent: true,
976:     opacity: 0.45,
977:     blending: THREE.AdditiveBlending,
978:     depthWrite: false,
979:   });
980:   const scanGlow = new THREE.Line(scanLineGeo, scanGlowMat);
981:   scanGlow.rotation.x = -1.05;
982:   scanGlow.position.set(0, -3.2, 1.0);
983:   scene.add(scanGlow);
984: 
985:   const SCAN_GRID_W = 28 * 0.6;
986:   const SCAN_GRID_H = 20 * 0.6;
987: 
988: 
989:   /* ─── Assembly helpers ────────────────────────────────── */
990:   let partCounter = 0;
991: 
992:   function registerPart(mesh, spreadX, spreadY, spreadZ, partList) {
993:     mesh.userData.restPos   = mesh.position.clone();
994:     mesh.userData.spreadPos = new THREE.Vector3(
995:       mesh.position.x + spreadX,
996:       mesh.position.y + spreadY,
997:       mesh.position.z + spreadZ
998:     );
999:     mesh.userData.spreadRot   = new THREE.Euler(rand(-1.4, 1.4), rand(-1.4, 1.4), rand(-1.4, 1.4));
1000:     mesh.userData.assemblyDelay = partCounter * 85; // 85 ms stagger
1001:     partCounter++;
1002:     partList.push(mesh);
1003:     // Start in spread position
1004:     mesh.position.copy(mesh.userData.spreadPos);
1005:     mesh.rotation.copy(mesh.userData.spreadRot);
1006:   }
1007: 
1008:   /* ─── Framing Hammer ─────────────────────────────────────── */
1009:   const hammerGroup = new THREE.Group();
1010:   const hammerParts = [];
1011: 
1012:   function addHammerPart(geo, mat, px, py, pz, sx, sy, sz) {
1013:     const mesh = new THREE.Mesh(geo, mat);
1014:     mesh.castShadow = true;
1015:     mesh.position.set(px, py, pz);
1016:     hammerGroup.add(mesh);
1017:     registerPart(mesh, sx, sy, sz, hammerParts);
1018:     return mesh;
1019:   }
1020: 
1021:   // ── Handle — long tapered cylinder (wood)
1022:   addHammerPart(
1023:     new THREE.CylinderGeometry(0.055, 0.090, 2.20, 12),
1024:     woodMat.clone(), 0, -0.85, 0, 0, -1.4, 0.3
1025:   );
1026: 
1027:   // ── Grip wrap rings (8×) — dark bands showing grip texture
1028:   for (let g = 0; g < 8; g++) {
1029:     const ring = new THREE.Mesh(
1030:       new THREE.TorusGeometry(0.100, 0.008, 6, 16),
1031:       new THREE.MeshStandardMaterial({ color: 0x0f0d0a, roughness: 0.88, metalness: 0.15 })
1032:     );
1033:     ring.castShadow = true;
1034:     ring.rotation.x = Math.PI / 2;
1035:     ring.position.set(0, -1.30 - g * 0.07, 0);
1036:     hammerGroup.add(ring);
1037:   }
1038: 
1039:   // ── Head body — large rectangular steel block
1040:   addHammerPart(
1041:     new THREE.BoxGeometry(1.20, 0.42, 0.38),
1042:     steelMat.clone(), 0, 0.55, 0, 0, 1.0, 0.4
1043:   );
1044: 
1045:   // ── Face strike plate — flat disc on front face of head
1046:   addHammerPart(
1047:     new THREE.BoxGeometry(0.42, 0.42, 0.025),
1048:     chromeMat.clone(), 0.60, 0.55, 0, 1.0, 0.8, 0.5
1049:   );
1050: 
1051:   // ── Poll (rear flat face of head)
1052:   addHammerPart(
1053:     new THREE.BoxGeometry(0.18, 0.38, 0.34),
1054:     steelMat.clone(), -0.68, 0.55, 0, -1.0, 0.8, 0.4
1055:   );
1056: 
1057:   // ── Claw — two diverging prongs from rear of head
1058:   // Left prong
1059:   const clawL = new THREE.Mesh(
1060:     new THREE.BoxGeometry(0.10, 0.38, 0.055),
1061:     steelMat.clone()
1062:   );
1063:   clawL.castShadow = true;
1064:   clawL.position.set(-0.72, 0.62, 0.11);
1065:   clawL.rotation.z = -0.32;
1066:   hammerGroup.add(clawL);
1067:   registerPart(clawL, -1.2, 1.0, 0.5, hammerParts);
1068: 
1069:   // Right prong
1070:   const clawR = new THREE.Mesh(
1071:     new THREE.BoxGeometry(0.10, 0.38, 0.055),
1072:     steelMat.clone()
1073:   );
1074:   clawR.castShadow = true;
1075:   clawR.position.set(-0.72, 0.62, -0.11);
1076:   clawR.rotation.z = -0.32;
1077:   hammerGroup.add(clawR);
1078:   registerPart(clawR, -1.2, 1.0, -0.5, hammerParts);
1079: 
1080:   // ── Neck — steel cylinder connecting handle to head
1081:   addHammerPart(
1082:     new THREE.CylinderGeometry(0.068, 0.068, 0.28, 10),
1083:     steelMat.clone(), 0, 0.23, 0, 0, 0.5, 0.2
1084:   );
1085: 
1086:   // ── Amber accent bevel on top of head — catches key light
1087:   addHammerPart(
1088:     new THREE.BoxGeometry(1.22, 0.030, 0.40),
1089:     new THREE.MeshStandardMaterial({ color: 0xe8a040, roughness: 0.10, metalness: 0.95, transparent: true, opacity: 1.0 }),
1090:     0, 0.77, 0, 0, 1.2, 0.4
1091:   );
1092: 
1093:   // ── Raycasting bounds
1094:   const hammerBounds = new THREE.Mesh(
1095:     new THREE.BoxGeometry(1.6, 2.6, 0.6),
1096:     new THREE.MeshBasicMaterial({ visible: false })
1097:   );
1098:   hammerBounds.userData.toolId = 'hammer';
1099:   hammerGroup.add(hammerBounds);
1100: 
1101:   hammerGroup.rotation.z = 0.22;
1102:   hammerGroup.rotation.y = -0.55;
1103:   scene.add(hammerGroup);
1104: 
1105:   /* ─── All tool groups for traversal (wrench+saw parts pushed in after GLB load) ── */
1106:   const allToolParts = [...hammerParts];
1107: 
1108:   /* ─── Wrench + Saw groups (populated after GLB load) ────── */
1109:   const wrenchGroup = new THREE.Group();
1110:   const wrenchParts = [];
1111:   wrenchGroup.rotation.z = -0.15;
1112:   wrenchGroup.rotation.y = 0.60;
1113:   wrenchGroup.visible = false;  // hidden until GLB/procedural content is loaded
1114:   scene.add(wrenchGroup);
1115: 
1116:   const sawGroup = new THREE.Group();
1117:   const sawParts = [];
1118:   let sawSpinGroup = null;      // assigned in buildProceduralSaw or populateSawFromGLB
1119:   let hubGlowMat = null;        // referenced in animate loop for opacity pulse
1120:   let hubCoronaMat = null;
1121:   let bladeMat = null;          // hoisted for envMapIntensity pulse in animate
1122:   let glbSawLoaded = false;     // true when handsaw GLB loaded; disables blade spin + hub glow
1123:   // sawGroup.rotation.x set by populateSawFromGLB (handsaw) or buildProceduralSaw (blade)
1124:   sawGroup.position.set(0, 2.2, -0.5);
1125:   sawGroup.userData.baseSawSpeed = 0.008;
1126:   sawGroup.userData.maxSawSpeed  = 0.045;
1127:   sawGroup.visible = false;  // hidden until GLB/procedural content is loaded
1128:   scene.add(sawGroup);
1129: 
1130:   /* ─── Procedural fallback builders ───────────────────── */
1131:   function buildProceduralWrench() {
1132:     function addWrenchPart(geo, mat, px, py, pz, sx, sy, sz) {
1133:       const mesh = new THREE.Mesh(geo, mat);
1134:       mesh.castShadow = true;
1135:       mesh.position.set(px, py, pz);
1136:       wrenchGroup.add(mesh);
1137:       registerPart(mesh, sx, sy, sz, wrenchParts);
1138:       return mesh;
1139:     }
1140: 
1141:     // ── Handle — long tapered cylinder (chrome steel)
1142:     addWrenchPart(
1143:       new THREE.CylinderGeometry(0.095, 0.130, 2.50, 16),
1144:       steelMat.clone(), 0, -0.70, 0, 0, -1.6, 0.3
1145:     );
1146: 
1147:     // ── Knurl rings on handle (5×)
1148:     for (let k = 0; k < 5; k++) {
1149:       const ring = new THREE.Mesh(
1150:         new THREE.TorusGeometry(0.140, 0.009, 6, 16),
1151:         new THREE.MeshStandardMaterial({ color: 0x3a3830, roughness: 0.55, metalness: 0.92 })
1152:       );
1153:       ring.castShadow = true;
1154:       ring.rotation.x = Math.PI / 2;
1155:       ring.position.set(0, -1.20 - k * 0.10, 0);
1156:       wrenchGroup.add(ring);
1157:     }
1158: 
1159:     // ── Jaw body (throat connecting handle to jaws)
1160:     addWrenchPart(
1161:       new THREE.BoxGeometry(0.55, 0.20, 0.16),
1162:       steelMat.clone(), 0, 0.65, 0, 0, 0.8, 0.3
1163:     );
1164: 
1165:     // ── Fixed jaw arm (upper — top of the C)
1166:     addWrenchPart(
1167:       new THREE.BoxGeometry(0.20, 0.65, 0.16),

(Output capped at 50 KB. Showing lines 1-1167. Use offset=1168 to continue.)
</content>
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "**/*.html"
}
```

**Output:**
```
C:\Dev\handyman\index.html
```

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\Dev\\handyman\\main.js"
}
```

**Output:**
```
<path>C:\Dev\handyman\main.js</path>
<type>file</type>
<content>1: /**
2:  * main.js — Handyman Landing Page
3:  *
4:  * Animation stack:
5:  *  - Lenis (smooth scroll)
6:  *  - GSAP + ScrollTrigger (all animations)
7:  *
8:  * Load order: GSAP → ScrollTrigger → Lenis → this file
9:  */
10: 
11: /* ─────────────────────────────────────────────────────────
12:    UTILITIES
13: ───────────────────────────────────────────────────────── */
14: 
15: const $ = (selector, ctx = document) => ctx.querySelector(selector);
16: const $$ = (selector, ctx = document) => [...ctx.querySelectorAll(selector)];
17: 
18: const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
19: 
20: /* Set footer year */
21: const yearEl = $('#currentYear');
22: if (yearEl) yearEl.textContent = new Date().getFullYear();
23: 
24: 
25: /* ─────────────────────────────────────────────────────────
26:    LENIS — SMOOTH SCROLL
27: ───────────────────────────────────────────────────────── */
28: 
29: let lenis;
30: 
31: function initLenis() {
32:   if (typeof Lenis === 'undefined') return;
33: 
34:   lenis = new Lenis({
35:     duration: 1.15,
36:     easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
37:     orientation: 'vertical',
38:     gestureOrientation: 'vertical',
39:     smoothWheel: !prefersReducedMotion,
40:     touchMultiplier: 1.8,
41:   });
42: 
43:   // Connect Lenis to GSAP ticker for frame-perfect sync
44:   if (typeof gsap !== 'undefined') {
45:     gsap.ticker.add((time) => lenis.raf(time * 1000));
46:     gsap.ticker.lagSmoothing(0);
47:   }
48: }
49: 
50: initLenis();
51: 
52: 
53: /* ─────────────────────────────────────────────────────────
54:    GSAP — CORE SETUP
55: ───────────────────────────────────────────────────────── */
56: 
57: if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
58:   console.warn('[handyman] GSAP or ScrollTrigger not loaded.');
59: }
60: 
61: gsap.registerPlugin(ScrollTrigger);
62: 
63: // Tell ScrollTrigger to use Lenis scroll position
64: if (lenis) {
65:   ScrollTrigger.scrollerProxy(document.body, {
66:     scrollTop(value) {
67:       if (arguments.length) {
68:         lenis.scrollTo(value, { immediate: true });
69:       } else {
70:         return lenis.animatedScroll;
71:       }
72:     },
73:     getBoundingClientRect() {
74:       return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
75:     },
76:     pinType: document.body.style.transform ? 'transform' : 'fixed',
77:   });
78: 
79:   // Drive --scene-warmth CSS var from Lenis smooth scroll progress
80:   // Using quickSetter for RAF-batched DOM writes (Active Theory pattern)
81:   const setWarmth = gsap.quickSetter(document.documentElement, '--scene-warmth', '');
82:   lenis.on('scroll', ({ progress }) => {
83:     setWarmth(progress.toFixed(3));
84:     ScrollTrigger.update();
85:   });
86: }
87: 
88: 
89: /* ─────────────────────────────────────────────────────────
90:    SCROLL PROGRESS BAR
91: ───────────────────────────────────────────────────────── */
92: 
93: const progressBar = $('#scrollProgress');
94: 
95: if (progressBar) {
96:   gsap.to(progressBar, {
97:     scaleX: 1,
98:     ease: 'none',
99:     scrollTrigger: {
100:       start: 'top top',
101:       end: 'bottom bottom',
102:       scrub: 0.1,
103:     },
104:   });
105: }
106: 
107: 
108: /* ─────────────────────────────────────────────────────────
109:    NAVIGATION — SCROLL STATE
110: ───────────────────────────────────────────────────────── */
111: 
112: const nav = $('#nav');
113: 
114: if (nav) {
115:   ScrollTrigger.create({
116:     start: 'top -70',
117:     onUpdate(self) {
118:       nav.classList.toggle('nav--scrolled', self.progress > 0);
119:     },
120:   });
121: 
122:   // Smooth anchor navigation via Lenis
123:   $$('a[href^="#"]').forEach((link) => {
124:     link.addEventListener('click', (e) => {
125:       const target = document.querySelector(link.getAttribute('href'));
126:       if (target && lenis) {
127:         e.preventDefault();
128:         lenis.scrollTo(target, { duration: 1.2, offset: -80 });
129:       }
130:     });
131:   });
132: }
133: 
134: 
135: /* Hero parallax background removed — replaced by Three.js 3D camera scroll. */
136: 
137: 
138: /* ─────────────────────────────────────────────────────────
139:    HERO ENTRANCE ANIMATION
140:    Staggered reveal — same pattern as Rorelp/Framer Motion
141:    stagger delays but done in GSAP timeline
142: ───────────────────────────────────────────────────────── */
143: 
144: function initHeroEntrance() {
145:   if (prefersReducedMotion) {
146:     // Instantly show all hero elements
147:     gsap.set([
148:       '.hero__eyebrow', '.eyebrow-seg', '.eyebrow-dot',
149:       '.hero__title', '.hero__sub',
150:       '.hero__ctas', '.hero__trust', '#scrollCue',
151:     ], { opacity: 1, y: 0 });
152:     return;
153:   }
154: 
155:   const heroTl = gsap.timeline({
156:     delay: 0.15,
157:     defaults: { ease: 'power3.out' },
158:   });
159: 
160:   // Reveal eyebrow container first, then stagger each segment
161:   heroTl
162:     .set('.hero__eyebrow', { opacity: 1 })
163:     .fromTo('.eyebrow-seg, .eyebrow-dot',
164:       { opacity: 0, y: 10 },
165:       { opacity: 1, y: 0, stagger: 0.14, duration: 0.55, ease: 'power2.out' }
166:     )
167:     .fromTo('.hero__title',
168:       { opacity: 0, y: typeof SplitType === 'undefined' ? 45 : 0 },
169:       { opacity: 1, y: 0, duration: 1.0, clearProps: 'clip-path', immediateRender: false },
170:       '-=0.35'
171:     )
172:     .fromTo('.hero__sub',
173:       { opacity: 0, y: 22 },
174:       { opacity: 1, y: 0, duration: 0.75, immediateRender: false },
175:       '-=0.55'
176:     )
177:     .fromTo('.hero__ctas',
178:       { opacity: 0, y: 18 },
179:       { opacity: 1, y: 0, duration: 0.65, immediateRender: false },
180:       '-=0.45'
181:     )
182:     .fromTo('.hero__trust',
183:       { opacity: 0, y: 10 },
184:       { opacity: 1, y: 0, duration: 0.55, immediateRender: false },
185:       '-=0.35'
186:     )
187:     .fromTo('#scrollCue',
188:       { opacity: 0, y: 8 },
189:       { opacity: 1, y: 0, duration: 0.55, immediateRender: false },
190:       '-=0.15'
191:     );
192: }
193: 
194: 
195: /* ─────────────────────────────────────────────────────────
196:    SCROLL CUE FADE OUT
197:    Fades out as user starts scrolling
198: ───────────────────────────────────────────────────────── */
199: 
200: const scrollCue = $('#scrollCue');
201: 
202: if (scrollCue && !prefersReducedMotion) {
203:   gsap.to(scrollCue, {
204:     opacity: 0,
205:     ease: 'none',
206:     scrollTrigger: {
207:       trigger: '.hero',
208:       start: 'top top',
209:       end: '18% top',
210:       scrub: true,
211:     },
212:   });
213: }
214: 
215: 
216: /* ─────────────────────────────────────────────────────────
217:    SECTION REVEALS
218:    Generic .reveal elements fade+slide in on scroll
219: ───────────────────────────────────────────────────────── */
220: 
221: function initSectionReveals() {
222:   if (prefersReducedMotion) {
223:     gsap.set('.reveal', { opacity: 1, y: 0 });
224:     return;
225:   }
226: 
227:   $$('.reveal').forEach((el) => {
228:     gsap.fromTo(el,
229:       { opacity: 0, y: 42 },
230:       {
231:         opacity: 1, y: 0,
232:         duration: 0.85,
233:         ease: 'power2.out',
234:         scrollTrigger: {
235:           trigger: el,
236:           start: 'top 87%',
237:           toggleActions: 'play none none none',
238:           once: true,
239:           invalidateOnRefresh: true,
240:         },
241:       }
242:     );
243:   });
244: }
245: 
246: 
247: /* ─────────────────────────────────────────────────────────
248:    SERVICE CARDS — STAGGERED ENTRY
249:    Each card staggers 80ms apart
250: ───────────────────────────────────────────────────────── */
251: 
252: function initServiceCards() {
253:   const cards = $$('.service-card');
254:   if (!cards.length) return;
255: 
256:   if (prefersReducedMotion) {
257:     gsap.set(cards, { opacity: 1, y: 0 });
258:     return;
259:   }
260: 
261:   // Stagger them in batches of columns
262:   cards.forEach((card, i) => {
263:     gsap.fromTo(card,
264:       { opacity: 0, y: 52 },
265:       {
266:         opacity: 1, y: 0,
267:         duration: 0.75,
268:         delay: (i % 3) * 0.08,
269:         ease: 'power2.out',
270:         scrollTrigger: {
271:           trigger: '.services__grid',
272:           start: 'top 82%',
273:           toggleActions: 'play none none none',
274:           once: true,
275:           invalidateOnRefresh: true,
276:         },
277:       }
278:     );
279:   });
280: }
281: 
282: 
283: /* ─────────────────────────────────────────────────────────
284:    TESTIMONIALS — STAGGERED ENTRY
285: ───────────────────────────────────────────────────────── */
286: 
287: function initTestimonials() {
288:   const blocks = $$('.testimonial');
289:   if (!blocks.length || prefersReducedMotion) return;
290: 
291:   blocks.forEach((block, i) => {
292:     gsap.fromTo(block,
293:       { opacity: 0, y: 38 },
294:       {
295:         opacity: 1, y: 0,
296:         duration: 0.75,
297:         delay: i * 0.12,
298:         ease: 'power2.out',
299:         scrollTrigger: {
300:           trigger: '.testimonials__grid',
301:           start: 'top 87%',
302:           toggleActions: 'play none none none',
303:           once: true,
304:           invalidateOnRefresh: true,
305:         },
306:       }
307:     );
308:   });
309: }
310: 
311: 
312: /* ─────────────────────────────────────────────────────────
313:    COUNT-UP STATS ANIMATION
314:    Animates numeric counter from 0 to target value
315: ───────────────────────────────────────────────────────── */
316: 
317: function initCountUp() {
318:   $$('.stat__num').forEach((el) => {
319:     const target = parseInt(el.dataset.target, 10);
320:     if (isNaN(target)) return;
321: 
322:     if (prefersReducedMotion) {
323:       el.textContent = target;
324:       return;
325:     }
326: 
327:     const counter = { val: 0 };
328: 
329:     ScrollTrigger.create({
330:       trigger: el,
331:       start: 'top 82%',
332:       once: true,
333:       onEnter() {
334:         gsap.to(counter, {
335:           val: target,
336:           duration: 1.8,
337:           ease: 'power2.out',
338:           onUpdate() {
339:             el.textContent = Math.round(counter.val);
340:           },
341:           onComplete() {
342:             el.textContent = target;
343:           },
344:         });
345:       },
346:     });
347:   });
348: }
349: 
350: 
351: /* ─────────────────────────────────────────────────────────
352:    PILLAR CARDS — STAGGERED ENTRY
353: ───────────────────────────────────────────────────────── */
354: 
355: function initPillars() {
356:   const pillars = $$('.pillar');
357:   if (!pillars.length || prefersReducedMotion) return;
358: 
359:   pillars.forEach((p, i) => {
360:     gsap.fromTo(p,
361:       { opacity: 0, y: 36 },
362:       {
363:         opacity: 1, y: 0,
364:         duration: 0.75,
365:         delay: i * 0.14,
366:         ease: 'power2.out',
367:         scrollTrigger: {
368:           trigger: '.pillars__grid',
369:           start: 'top 84%',
370:           toggleActions: 'play none none none',
371:           once: true,
372:           invalidateOnRefresh: true,
373:         },
374:       }
375:     );
376:   });
377: }
378: 
379: 
380: /* ─────────────────────────────────────────────────────────
381:    CTA BAND — SUBTLE SCALE-IN
382: ───────────────────────────────────────────────────────── */
383: 
384: function initCtaBand() {
385:   const band = $('.cta-band__inner');
386:   if (!band || prefersReducedMotion) return;
387: 
388:   gsap.fromTo(band,
389:     { opacity: 0, y: 30 },
390:     {
391:       opacity: 1, y: 0,
392:       duration: 0.9,
393:       ease: 'power2.out',
394:       scrollTrigger: {
395:         trigger: '.cta-band',
396:         start: 'top 80%',
397:         toggleActions: 'play none none none',
398:         once: true,
399:         invalidateOnRefresh: true,
400:       },
401:     }
402:   );
403: }
404: 
405: 
406: /* ─────────────────────────────────────────────────────────
407:    SECTION TITLE LINES — DRAW-IN UNDERLINE
408:    A decorative underline animates in below section titles
409: ───────────────────────────────────────────────────────── */
410: 
411: function initSectionTitleLines() {
412:   if (prefersReducedMotion) return;
413: 
414:   $$('.section__title').forEach((title) => {
415:     const parent = title.closest('.section__header');
416:     if (!parent) return;
417: 
418:     if (typeof SplitType === 'undefined') {
419:       gsap.fromTo(title,
420:         { opacity: 0, y: 30 },
421:         {
422:           opacity: 1, y: 0,
423:           duration: 0.85,
424:           ease: 'power3.out',
425:           scrollTrigger: {
426:             trigger: parent,
427:             start: 'top 86%',
428:             toggleActions: 'play none none none',
429:             once: true,
430:             invalidateOnRefresh: true,
431:           },
432:         }
433:       );
434:     }
435: 
436:     const eyebrow = parent.querySelector('.section__eyebrow');
437:     if (eyebrow) {
438:       gsap.fromTo(eyebrow,
439:         { opacity: 0, y: 14 },
440:         {
441:           opacity: 1, y: 0,
442:           duration: 0.6,
443:           ease: 'power2.out',
444:           scrollTrigger: {
445:             trigger: parent,
446:             start: 'top 88%',
447:             toggleActions: 'play none none none',
448:             once: true,
449:             invalidateOnRefresh: true,
450:           },
451:         }
452:       );
453:     }
454:   });
455: }
456: 
457: 
458: /* ─────────────────────────────────────────────────────────
459:    AMBIENT AMBER GLOW ON SCROLL
460:    The hero amber glow subtly shifts intensity as you scroll
461: ───────────────────────────────────────────────────────── */
462: 
463: function initAmbientGlow() {
464:   if (prefersReducedMotion) return;
465: 
466:   const hero = $('.hero');
467:   if (!hero) return;
468: 
469:   // Subtle parallax on the hero's amber glow origin
470:   // Done by animating a background-position-like effect via CSS var
471:   // (pure visual enhancement — falls back gracefully)
472: }
473: 
474: 
475: /* ─────────────────────────────────────────────────────────
476:    RESIZE HANDLER — REFRESH SCROLLTRIGGER
477: ───────────────────────────────────────────────────────── */
478: 
479: let resizeTimer;
480: window.addEventListener('resize', () => {
481:   clearTimeout(resizeTimer);
482:   resizeTimer = setTimeout(() => {
483:     ScrollTrigger.refresh();
484:   }, 200);
485: });
486: 
487: 
488: /* ─────────────────────────────────────────────────────────
489:    INIT — WAIT FOR DOM + FONTS
490: ───────────────────────────────────────────────────────── */
491: 
492: /* ─────────────────────────────────────────────────────────
493:    PROCESS STEPS — STAGGERED LEFT-TO-RIGHT ENTRY
494: ───────────────────────────────────────────────────────── */
495: 
496: function initProcessSteps() {
497:   const steps = $$('.process-step');
498:   if (!steps.length || prefersReducedMotion) return;
499: 
500:   steps.forEach((step, i) => {
501:     gsap.fromTo(step,
502:       { opacity: 0, y: 40 },
503:       {
504:         opacity: 1, y: 0,
505:         duration: 0.75,
506:         delay: i * 0.15,
507:         ease: 'power2.out',
508:         scrollTrigger: {
509:           trigger: '.process__steps',
510:           start: 'top 82%',
511:           toggleActions: 'play none none none',
512:           once: true,
513:           invalidateOnRefresh: true,
514:         },
515:       }
516:     );
517:   });
518: 
519:   // Animate connectors
520:   $$('.process-step__connector').forEach((conn, i) => {
521:     gsap.fromTo(conn,
522:       { opacity: 0, scaleX: 0 },
523:       {
524:         opacity: 1, scaleX: 1,
525:         transformOrigin: 'left center',
526:         duration: 0.5,
527:         delay: 0.2 + i * 0.15,
528:         ease: 'power1.out',
529:         scrollTrigger: {
530:           trigger: '.process__steps',
531:           start: 'top 82%',
532:           toggleActions: 'play none none none',
533:           once: true,
534:           invalidateOnRefresh: true,
535:         },
536:       }
537:     );
538:   });
539: }
540: 
541: 
542: /* ─────────────────────────────────────────────────────────
543:    GALLERY CARDS — STAGGERED GRID ENTRY
544: ───────────────────────────────────────────────────────── */
545: 
546: function initGallery() {
547:   const cards = $$('.gallery-card');
548:   if (!cards.length || prefersReducedMotion) return;
549: 
550:   cards.forEach((card, i) => {
551:     gsap.fromTo(card,
552:       { opacity: 0, y: 36, scale: 0.97 },
553:       {
554:         opacity: 1, y: 0, scale: 1,
555:         duration: 0.7,
556:         delay: (i % 3) * 0.1,
557:         ease: 'power2.out',
558:         scrollTrigger: {
559:           trigger: '.gallery__grid',
560:           start: 'top 82%',
561:           toggleActions: 'play none none none',
562:           once: true,
563:           invalidateOnRefresh: true,
564:         },
565:       }
566:     );
567:   });
568: }
569: 
570: 
571: /* ─────────────────────────────────────────────────────────
572:    TRUST BADGES — CSS marquee (no JS animation needed)
573:    The .marquee-inner animation is handled entirely via CSS.
574: ───────────────────────────────────────────────────────── */
575: 
576: function initTrustBadges() {
577:   // No-op: marquee is CSS-driven (@keyframes marquee in styles.css)
578: }
579: 
580: 
581: /* ─────────────────────────────────────────────────────────
582:    RHETORICAL COPY SECTION — SCROLL-TRIGGERED REVEAL
583:    Short declarative lines stagger in on scroll entry.
584:    Inspired by Mantis Works' scroll-paced copy rhythm.
585: ───────────────────────────────────────────────────────── */
586: 
587: function initRhetoricalSection() {
588:   const lines = $$('.rhetoric-line');
589:   if (!lines.length) return;
590: 
591:   if (prefersReducedMotion) {
592:     gsap.set(lines, { opacity: 1, y: 0 });
593:     return;
594:   }
595: 
596:   gsap.from(lines, {
597:     opacity: 0,
598:     y: 40,
599:     stagger: 0.22,
600:     duration: 0.95,
601:     ease: 'power3.out',
602:     scrollTrigger: {
603:       trigger: '.rhetoric-section',
604:       start: 'top 75%',
605:       toggleActions: 'play none none reverse',
606:       invalidateOnRefresh: true,
607:     },
608:   });
609: }
610: 
611: 
612: /* ─────────────────────────────────────────────────────────
613:    CONTACT FORM — SLIDE UP REVEAL
614: ───────────────────────────────────────────────────────── */
615: 
616: function initContactForm() {
617:   const form = $('.contact-form');
618:   if (!form || prefersReducedMotion) return;
619: 
620:   gsap.fromTo(form,
621:     { opacity: 0, x: 30 },
622:     {
623:       opacity: 1, x: 0,
624:       duration: 0.9,
625:       ease: 'power2.out',
626:       scrollTrigger: {
627:         trigger: '.contact-layout',
628:         start: 'top 80%',
629:         toggleActions: 'play none none none',
630:         once: true,
631:         invalidateOnRefresh: true,
632:       },
633:     }
634:   );
635: }
636: 
637: 
638: /* ─────────────────────────────────────────────────────────
639:    PRELOADER — #1
640:    Amber progress bar that dismisses after fonts + assets ready
641: ───────────────────────────────────────────────────────── */
642: 
643: function initPreloader() {
644:   const preloader = document.getElementById('preloader');
645:   const bar = document.getElementById('preloaderBar');
646:   const label = document.getElementById('preloaderLabel');
647:   if (!preloader) return;
648: 
649:   // Exposed to three-scene.js for GLB load progress updates
650:   window.__preloaderProgress = (pct) => {
651:     if (bar) bar.style.width = pct + '%';
652:     if (label) label.textContent = pct < 100 ? 'Loading assets...' : 'Ready';
653:   };
654: 
655:   const fontsReady = document.fonts && document.fonts.ready
656:     ? document.fonts.ready
657:     : Promise.resolve();
658: 
659:   const sceneReady = window.__sceneAssetsReady instanceof Promise
660:     ? window.__sceneAssetsReady
661:     : new Promise((resolve) => {
662:         window.addEventListener('three-scene:ready', resolve, { once: true });
663:       });
664: 
665:   Promise.race([
666:     Promise.all([fontsReady, sceneReady]),
667:     new Promise((resolve) => setTimeout(resolve, 7000)),
668:   ]).then(() => {
669:     window.__preloaderProgress?.(100);
670:     setTimeout(() => {
671:       if (typeof gsap !== 'undefined') {
672:         gsap.to(preloader, {
673:           opacity: 0,
674:           duration: 0.7,
675:           ease: 'power2.inOut',
676:           onComplete: () => preloader.classList.add('hidden'),
677:         });
678:       } else {
679:         preloader.classList.add('hidden');
680:       }
681:     }, 250);
682:   });
683: }
684: 
685: 
686: /* ─────────────────────────────────────────────────────────
687:    CUSTOM CURSOR — #2
688:    Amber dot (instant) + lagging ring (GSAP quickTo)
689: ───────────────────────────────────────────────────────── */
690: 
691: function initCursor() {
692:   const cursor = document.getElementById('cursor');
693:   if (!cursor || window.matchMedia('(hover: none)').matches) return;
694: 
695:   const dot  = cursor.querySelector('.cursor__dot');
696:   const ring = cursor.querySelector('.cursor__ring');
697:   if (!dot || !ring) return;
698: 
699:   // quickTo batches writes in the GSAP RAF loop — no new tween per mousemove
700:   const moveDotX  = gsap.quickTo(dot,  'x', { duration: 0 });
701:   const moveDotY  = gsap.quickTo(dot,  'y', { duration: 0 });
702:   const moveRingX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' });
703:   const moveRingY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' });
704: 
705:   window.addEventListener('mousemove', (e) => {
706:     moveDotX(e.clientX);
707:     moveDotY(e.clientY);
708:     moveRingX(e.clientX);
709:     moveRingY(e.clientY);
710:   });
711: 
712:   // Hover state on interactive elements
713:   const hoverEls = document.querySelectorAll('a, button, .service-card, .gallery-card, .pillar, .testimonial, .about-stat-card');
714:   hoverEls.forEach(el => {
715:     el.addEventListener('mouseenter', () => cursor.classList.add('cursor--hover'));
716:     el.addEventListener('mouseleave', () => cursor.classList.remove('cursor--hover'));
717:   });
718: 
719:   // Click flash
720:   window.addEventListener('mousedown', () => cursor.classList.add('cursor--click'));
721:   window.addEventListener('mouseup',   () => cursor.classList.remove('cursor--click'));
722: }
723: 
724: 
725: /* ─────────────────────────────────────────────────────────
726:    SPLITTYPE TEXT REVEALS — #3
727:    Hero chars fly up; section titles reveal word-by-word
728: ───────────────────────────────────────────────────────── */
729: 
730: function initSplitTextReveals() {
731:   if (prefersReducedMotion || typeof SplitType === 'undefined') return;
732: 
733:   // Hero title — characters fly up with perspective rotation
734:   const heroTitle = document.querySelector('.hero__title');
735:   if (heroTitle) {
736:     const split = new SplitType(heroTitle, { types: 'chars,words' });
737:     gsap.from(split.chars, {
738:       opacity: 0,
739:       y: '110%',
740:       rotateX: -90,
741:       stagger: { amount: 0.65, from: 'start' },
742:       duration: 0.85,
743:       ease: 'power4.out',
744:       delay: 0.6,
745:     });
746:   }
747: 
748:   // Section titles — words reveal left-to-right on scroll
749:   document.querySelectorAll('.section__title, .about-narrative__title, .contact-info__title').forEach(el => {
750:     const split = new SplitType(el, { types: 'words' });
751:     gsap.from(split.words, {
752:       opacity: 0,
753:       y: 40,
754:       rotateX: -20,
755:       stagger: 0.08,
756:       duration: 0.75,
757:       ease: 'power3.out',
758:       scrollTrigger: {
759:         trigger: el,
760:         start: 'top 88%',
761:         toggleActions: 'play none none none',
762:         once: true,
763:       },
764:     });
765:   });
766: 
767:   // Rhetoric lines — chars cascade in
768:   document.querySelectorAll('.rhetoric-line').forEach((el, i) => {
769:     const split = new SplitType(el, { types: 'chars' });
770:     gsap.from(split.chars, {
771:       opacity: 0,
772:       y: 30,
773:       stagger: 0.025,
774:       duration: 0.5,
775:       ease: 'power2.out',
776:       scrollTrigger: {
777:         trigger: '.rhetoric-section',
778:         start: 'top 75%',
779:         toggleActions: 'play none none reverse',
780:       },
781:       delay: i * 0.35,
782:     });
783:   });
784: }
785: 
786: 
787: /* ─────────────────────────────────────────────────────────
788:    MAGNETIC BUTTONS — #4
789:    CTAs follow the cursor with elastic snap-back
790: ───────────────────────────────────────────────────────── */
791: 
792: function initMagneticButtons() {
793:   if (window.matchMedia('(hover: none)').matches) return;
794: 
795:   document.querySelectorAll('.btn--primary, .btn--lg, .nav__cta').forEach(btn => {
796:     btn.addEventListener('mousemove', (e) => {
797:       const rect = btn.getBoundingClientRect();
798:       const cx = rect.left + rect.width  / 2;
799:       const cy = rect.top  + rect.height / 2;
800:       const dx = (e.clientX - cx) * 0.35;
801:       const dy = (e.clientY - cy) * 0.35;
802:       gsap.to(btn, { x: dx, y: dy, duration: 0.3, ease: 'power2.out' });
803:     });
804:     btn.addEventListener('mouseleave', () => {
805:       gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
806:     });
807:   });
808: }
809: 
810: 
811: /* ─────────────────────────────────────────────────────────
812:    GALLERY CARD TILT — #5
813:    3D perspective tilt tracking mouse within each card
814: ───────────────────────────────────────────────────────── */
815: 
816: function initGalleryTilt() {
817:   if (window.matchMedia('(hover: none)').matches) return;
818: 
819:   document.querySelectorAll('.gallery-card').forEach(card => {
820:     card.addEventListener('mousemove', (e) => {
821:       const rect = card.getBoundingClientRect();
822:       const cx   = rect.left + rect.width  / 2;
823:       const cy   = rect.top  + rect.height / 2;
824:       const rotY =  ((e.clientX - cx) / (rect.width  / 2)) * 8;
825:       const rotX = -((e.clientY - cy) / (rect.height / 2)) * 5;
826:       gsap.to(card, {
827:         rotateX: rotX,
828:         rotateY: rotY,
829:         scale: 1.03,
830:         duration: 0.4,
831:         ease: 'power2.out',
832:         transformPerspective: 800,
833:       });
834:     });
835:     card.addEventListener('mouseleave', () => {
836:       gsap.to(card, {
837:         rotateX: 0,
838:         rotateY: 0,
839:         scale: 1,
840:         duration: 0.6,
841:         ease: 'elastic.out(1, 0.6)',
842:       });
843:     });
844:   });
845: }
846: 
847: 
848: /* ─────────────────────────────────────────────────────────
849:    SERVICES HORIZONTAL SCROLL — #6
850:    Pinned section: vertical scroll translates to horizontal
851:    Desktop only (≥1024px)
852: ───────────────────────────────────────────────────────── */
853: 
854: function initServicesHScroll() {
855:   if (prefersReducedMotion || typeof gsap === 'undefined') return;
856: 
857:   const section = document.getElementById('services');
858:   const pinWrap = document.getElementById('servicesPin');
859:   const track = document.querySelector('.services__scroll-track');
860:   const grid  = document.querySelector('.services__grid');
861:   const viewport = track?.parentElement;
862:   if (!section || !pinWrap || !track || !grid || !viewport) return;
863: 
864:   const media = gsap.matchMedia();
865: 
866:   const disableHorizontalMode = () => {
867:     section.classList.remove('services--horizontal');
868:     gsap.set(track, { clearProps: 'transform' });
869:   };
870: 
871:   media.add('(min-width: 1024px)', () => {
872:     section.classList.add('services--horizontal');
873: 
874:     const getOverflow = () => Math.max(0, grid.scrollWidth - viewport.clientWidth);
875:     const getScrollDistance = () => getOverflow() + 120;
876:     const maxScrollBudget = Math.min(window.innerHeight, 960);
877:     const minOverflowToPin = 520;
878: 
879:     if (getOverflow() < minOverflowToPin || getOverflow() > maxScrollBudget) {
880:       disableHorizontalMode();
881:       return disableHorizontalMode;
882:     }
883: 
884:     const tween = gsap.to(track, {
885:       x: () => -getOverflow(),
886:       ease: 'none',
887:       scrollTrigger: {
888:         trigger: pinWrap,
889:         start: 'top top',
890:         end: () => '+=' + getScrollDistance(),
891:         pin: true,
892:         scrub: 1,
893:         invalidateOnRefresh: true,
894:         anticipatePin: 1,
895:       },
896:     });
897: 
898:     return () => {
899:       tween.scrollTrigger?.kill();
900:       tween.kill();
901:       disableHorizontalMode();
902:     };
903:   });
904: }
905: 
906: 
907: /* ─────────────────────────────────────────────────────────
908:    ACTIVE NAV HIGHLIGHTING — #7
909:    Highlights current section link as user scrolls
910: ───────────────────────────────────────────────────────── */
911: 
912: function initNavHighlight() {
913:   const navLinks = [...document.querySelectorAll('.nav__link')];
914:   if (!navLinks.length) return;
915: 
916:   const sections = ['services', 'process', 'gallery', 'about', 'testimonials', 'contact']
917:     .map((id) => document.getElementById(id))
918:     .filter(Boolean);
919:   if (!sections.length) return;
920: 
921:   let activeId = null;
922:   let rafId = null;
923: 
924:   function setActive(id) {
925:     if (id === activeId) return;
926:     activeId = id;
927:     navLinks.forEach(a => {
928:       a.classList.toggle('nav__link--active', !!id && a.getAttribute('href') === '#' + id);
929:     });
930:   }
931: 
932:   function getClosestVisibleSection() {
933:     const viewportCenter = window.innerHeight * 0.5;
934:     let bestId = null;
935:     let bestDistance = Number.POSITIVE_INFINITY;
936: 
937:     sections.forEach((section) => {
938:       const rect = section.getBoundingClientRect();
939:       if (rect.bottom <= 0 || rect.top >= window.innerHeight) return;
940: 
941:       const sectionCenter = rect.top + rect.height / 2;
942:       const containsCenter = rect.top <= viewportCenter && rect.bottom >= viewportCenter;
943:       const distance = containsCenter ? 0 : Math.abs(sectionCenter - viewportCenter);
944: 
945:       if (distance < bestDistance) {
946:         bestDistance = distance;
947:         bestId = section.id;
948:       }
949:     });
950: 
951:     return bestId;
952:   }
953: 
954:   function queueActiveUpdate() {
955:     if (rafId) return;
956:     rafId = requestAnimationFrame(() => {
957:       rafId = null;
958:       setActive(getClosestVisibleSection());
959:     });
960:   }
961: 
962:   ScrollTrigger.create({
963:     start: 'top top',
964:     end: 'bottom bottom',
965:     onUpdate: queueActiveUpdate,
966:     onRefresh: queueActiveUpdate,
967:   });
968: 
969:   if (lenis) {
970:     lenis.on('scroll', queueActiveUpdate);
971:   } else {
972:     window.addEventListener('scroll', queueActiveUpdate, { passive: true });
973:   }
974: 
975:   window.addEventListener('resize', queueActiveUpdate);
976:   queueActiveUpdate();
977: }
978: 
979: 
980: /* ─────────────────────────────────────────────────────────
981:    SECTION BACKGROUND PARALLAX — #9
982:    Subtle background shift at different rate than content
983: ───────────────────────────────────────────────────────── */
984: 
985: function initParallaxSections() {
986:   if (prefersReducedMotion) return;
987: 
988:   ['.services', '.gallery', '.testimonials'].forEach(sel => {
989:     const el = document.querySelector(sel);
990:     if (!el) return;
991:     gsap.to(el, {
992:       backgroundPositionY: '30%',
993:       ease: 'none',
994:       scrollTrigger: {
995:         trigger: el,
996:         start: 'top bottom',
997:         end: 'bottom top',
998:         scrub: true,
999:       },
1000:     });
1001:   });
1002: }
1003: 
1004: 
1005: /* ─────────────────────────────────────────────────────────
1006:    CONTACT FORM — VALIDATION + NO-RELOAD FOLLOW-UP
1007: ───────────────────────────────────────────────────────── */
1008: 
1009: function initContactFormSubmission() {
1010:   const form = document.querySelector('.contact-form');
1011:   const status = document.getElementById('formStatus');
1012:   const followup = document.getElementById('formFollowup');
1013:   const smsLink = document.getElementById('formSmsLink');
1014:   if (!form || !status || !followup || !smsLink) return;
1015: 
1016:   const fieldIds = ['contactName', 'contactPhone', 'contactEmail', 'contactService', 'contactMessage'];
1017:   const fields = fieldIds
1018:     .map((id) => document.getElementById(id))
1019:     .filter(Boolean);
1020: 
1021:   const clearErrors = () => fields.forEach((field) => field.removeAttribute('aria-invalid'));
1022: 
1023:   const setStatus = (message, type) => {
1024:     status.textContent = message;
1025:     status.classList.remove('form-status--error', 'form-status--success');
1026:     if (type) status.classList.add(`form-status--${type}`);
1027:   };
1028: 
1029:   form.addEventListener('submit', (event) => {
1030:     event.preventDefault();
1031:     clearErrors();
1032:     followup.hidden = true;
1033: 
1034:     const nameField = document.getElementById('contactName');
1035:     const phoneField = document.getElementById('contactPhone');
1036:     const emailField = document.getElementById('contactEmail');
1037:     const serviceField = document.getElementById('contactService');
1038:     const messageField = document.getElementById('contactMessage');
1039:     if (!nameField || !phoneField || !emailField || !serviceField || !messageField) return;
1040: 
1041:     const name = nameField.value.trim();
1042:     const phone = phoneField.value.trim();
1043:     const email = emailField.value.trim();
1044:     const service = serviceField.value.trim();
1045:     const message = messageField.value.trim();
1046: 
1047:     const invalidFields = [];
1048:     const phoneDigits = phone.replace(/\D/g, '');
1049:     const emailLooksValid = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
1050: 
1051:     if (!name) invalidFields.push(nameField);
1052:     if (!service) invalidFields.push(serviceField);
1053:     if (message.length < 15) invalidFields.push(messageField);
1054:     if (!phoneDigits && !email) invalidFields.push(phoneField, emailField);
1055:     if (phone && phoneDigits.length > 0 && phoneDigits.length < 10) invalidFields.push(phoneField);
1056:     if (!emailLooksValid) invalidFields.push(emailField);
1057: 
1058:     if (invalidFields.length) {
1059:       [...new Set(invalidFields)].forEach((field) => field.setAttribute('aria-invalid', 'true'));
1060:       setStatus('Please add your name, service, project details, and either a valid phone number or email.', 'error');
1061:       invalidFields[0]?.focus();
1062:       return;
1063:     }
1064: 
1065:     const serviceLabel = serviceField.options[serviceField.selectedIndex]?.textContent || service;
1066:     const requestBody = [
1067:       `Hi ProCraft, this is ${name}.`,
1068:       `I'm looking for help with: ${serviceLabel}.`,
1069:       `Project details: ${message}`,
1070:       phone ? `Phone: ${phone}` : null,
1071:       email ? `Email: ${email}` : null,
1072:     ].filter(Boolean).join(' ');
1073: 
1074:     smsLink.href = `sms:+12175550182?body=${encodeURIComponent(requestBody)}`;
1075:     setStatus('Estimate request ready — use the text or call shortcut below so nothing gets lost in the shuffle.', 'success');
1076:     followup.hidden = false;
1077:     form.reset();
1078:   });
1079: }
1080: 
1081: 
1082: function initAll() {
1083:   initCursor();
1084:   initMagneticButtons();
1085:   initNavHighlight();
1086:   initHeroEntrance();
1087:   initSectionReveals();
1088:   initServiceCards();
1089:   initTestimonials();
1090:   initCountUp();
1091:   initPillars();
1092:   initCtaBand();
1093:   initSectionTitleLines();
1094:   initAmbientGlow();
1095:   initProcessSteps();
1096:   initGallery();
1097:   initGalleryTilt();
1098:   initTrustBadges();
1099:   initContactForm();
1100:   initContactFormSubmission();
1101:   initRhetoricalSection();
1102:   initParallaxSections();
1103:   initServicesHScroll();
1104: }
1105: 
1106: // Preloader must run immediately (before fonts) to register the progress callback
1107: // so three-scene.js can call window.__preloaderProgress during GLB loading
1108: initPreloader();
1109: 
1110: // Use document.fonts.ready for font-aware layout (prevents jump)
1111: if (document.fonts && document.fonts.ready) {
1112:   document.fonts.ready.then(() => {
1113:     initAll();
1114:     // SplitType reveals after fonts so metrics are accurate
1115:     initSplitTextReveals();
1116:     ScrollTrigger.refresh();
1117:   });
1118: } else {
1119:   document.addEventListener('DOMContentLoaded', () => {
1120:     initAll();
1121:     initSplitTextReveals();
1122:   });
1123: }

(End of file - total 1123 lines)
</content>
```

---

## Assistant (Plan · moonshotai/kimi-k2.5 · 10.6s)

_Thinking:_

 Let me continue reading the three-scene.js file to

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\Dev\\handyman\\three-scene.js",
  "offset": 1168,
  "limit": 1000
}
```

**Output:**
```
<path>C:\Dev\handyman\three-scene.js</path>
<type>file</type>
<content>1168:       steelMat.clone(), 0.30, 1.02, 0, 0.8, 1.0, 0.4
1169:     );
1170: 
1171:     // ── Movable jaw arm (lower — bottom of the C)
1172:     addWrenchPart(
1173:       new THREE.BoxGeometry(0.20, 0.55, 0.16),
1174:       steelMat.clone(), 0.30, 0.28, 0, 0.8, -0.5, 0.4
1175:     );
1176: 
1177:     // ── Jaw opening gap indicator
1178:     const jawGap = new THREE.Mesh(
1179:       new THREE.BoxGeometry(0.28, 0.32, 0.18),
1180:       new THREE.MeshStandardMaterial({ color: 0x030303, roughness: 1.0, metalness: 0.0 })
1181:     );
1182:     jawGap.position.set(0.46, 0.65, 0);
1183:     wrenchGroup.add(jawGap);
1184: 
1185:     // ── Worm adjuster — cylinder perpendicular to handle at jaw base
1186:     const wormAdj = new THREE.Mesh(
1187:       new THREE.CylinderGeometry(0.065, 0.065, 0.34, 14),
1188:       new THREE.MeshStandardMaterial({ color: 0xc8c0a0, roughness: 0.06, metalness: 0.97 })
1189:     );
1190:     wormAdj.castShadow = true;
1191:     wormAdj.rotation.z = Math.PI / 2;
1192:     wormAdj.position.set(0, 0.40, 0);
1193:     wrenchGroup.add(wormAdj);
1194:     registerPart(wormAdj, 0.5, -0.3, 0.5, wrenchParts);
1195: 
1196:     // Adjuster knurl rings (3×)
1197:     for (let a = 0; a < 3; a++) {
1198:       const ar = new THREE.Mesh(
1199:         new THREE.TorusGeometry(0.068, 0.007, 6, 14),
1200:         new THREE.MeshStandardMaterial({ color: 0x2a2820, roughness: 0.55, metalness: 0.90 })
1201:       );
1202:       ar.rotation.x = Math.PI / 2;
1203:       ar.position.set(-0.06 + a * 0.06, 0.40, 0);
1204:       wrenchGroup.add(ar);
1205:     }
1206: 
1207:     // ── Amber accent line on handle
1208:     addWrenchPart(
1209:       new THREE.BoxGeometry(0.020, 1.60, 0.14),
1210:       new THREE.MeshStandardMaterial({ color: 0xe8a040, roughness: 0.10, metalness: 0.95, transparent: true, opacity: 1.0 }),
1211:       0.098, -0.50, 0, 0.5, -1.0, 0.3
1212:     );
1213: 
1214:     // ── Raycasting bounds
1215:     const wrenchBounds = new THREE.Mesh(
1216:       new THREE.BoxGeometry(0.8, 2.8, 0.4),
1217:       new THREE.MeshBasicMaterial({ visible: false })
1218:     );
1219:     wrenchBounds.userData.toolId = 'wrench';
1220:     wrenchGroup.add(wrenchBounds);
1221: 
1222:     wrenchParts.forEach(m => allToolParts.push(m));
1223:     wrenchGroup.visible = true;
1224:   }
1225: 
1226:   function buildProceduralSaw() {
1227:     sawGroup.rotation.x = Math.PI / 2;  // tilt flat blade to face camera
1228:     sawSpinGroup = new THREE.Group();
1229:     sawGroup.add(sawSpinGroup);
1230: 
1231:     function addSawPart(geo, mat, px, py, pz, sx, sy, sz) {
1232:       const mesh = new THREE.Mesh(geo, mat);
1233:       mesh.castShadow = true;
1234:       mesh.position.set(px, py, pz);
1235:       sawSpinGroup.add(mesh);
1236:       registerPart(mesh, sx, sy, sz, sawParts);
1237:       return mesh;
1238:     }
1239: 
1240:     // Blade disc — MeshPhysicalMaterial with clearcoat for Fresnel rim brightening during spin
1241:     bladeMat = new THREE.MeshPhysicalMaterial({
1242:       color: 0x7a7a7a,          // slightly darker steel — prevents luminance clip
1243:       roughness: 0.30,          // was 0.18 — further scatter breaks hotspot
1244:       metalness: 0.92,
1245:       envMapIntensity: 0.8,     // was 1.2 — reduce reflection contribution
1246:       clearcoat: 0.35,          // was 0.5 — smaller secondary specular lobe
1247:       clearcoatRoughness: 0.20, // was 0.12 — wider scatter
1248:       reflectivity: 0.70,       // was 0.85
1249:     });
1250:     addSawPart(
1251:       new THREE.CylinderGeometry(0.88, 0.88, 0.055, 48),
1252:       bladeMat, 0, 0, 0, 0, 0.6, 0.4
1253:     );
1254: 
1255:     // Inner relief cutouts
1256:     for (let i = 0; i < 5; i++) {
1257:       const angle = (i / 5) * Math.PI * 2;
1258:       const slotMesh = new THREE.Mesh(
1259:         new THREE.CylinderGeometry(0.09, 0.09, 0.06, 12),
1260:         new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.9, metalness: 0.1 })
1261:       );
1262:       slotMesh.position.set(Math.cos(angle) * 0.55, 0, Math.sin(angle) * 0.55);
1263:       sawSpinGroup.add(slotMesh);
1264:     }
1265: 
1266:     // 24 teeth
1267:     const TOOTH_COUNT = 24;
1268:     for (let t = 0; t < TOOTH_COUNT; t++) {
1269:       const angle = (t / TOOTH_COUNT) * Math.PI * 2;
1270:       const cosA = Math.cos(angle), sinA = Math.sin(angle);
1271:       const toothMat = (t % 3 === 0)
1272:         ? new THREE.MeshStandardMaterial({ color: 0x9a8060, roughness: 0.12, metalness: 0.88 })
1273:         : chromeMat.clone();
1274: 
1275:       const base = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.07, 0.058), toothMat);
1276:       base.castShadow = true;
1277:       const r = 0.91;
1278:       base.position.set(cosA * r, 0, sinA * r);
1279:       base.rotation.y = -angle;
1280:       sawSpinGroup.add(base);
1281: 
1282:       const tip = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.055, 0.048), toothMat);
1283:       tip.castShadow = true;
1284:       tip.position.set(cosA * (r + 0.058), 0, sinA * (r + 0.058));
1285:       tip.rotation.y = -angle;
1286:       sawSpinGroup.add(tip);
1287:     }
1288: 
1289:     // Hub — emissive amber center disc
1290:     addSawPart(
1291:       new THREE.CylinderGeometry(0.18, 0.18, 0.07, 24),
1292:       amberEmissiveMat.clone(), 0, 0, 0, 0, 0.3, 0.2
1293:     );
1294: 
1295:     // Arbor hole
1296:     const arborMesh = new THREE.Mesh(
1297:       new THREE.CylinderGeometry(0.045, 0.045, 0.08, 12),
1298:       new THREE.MeshStandardMaterial({ color: 0x020202, roughness: 1.0, metalness: 0.0 })
1299:     );
1300:     sawSpinGroup.add(arborMesh);
1301: 
1302:     // Hub bloom sprites
1303:     hubGlowMat = new THREE.SpriteMaterial({
1304:       map: particleTex, color: 0xff7700,
1305:       transparent: true, opacity: 0.40,
1306:       blending: THREE.AdditiveBlending, depthWrite: false,
1307:     });
1308:     const hubGlowSprite = new THREE.Sprite(hubGlowMat);
1309:     hubGlowSprite.scale.set(0.90, 0.90, 1.0);
1310:     hubGlowSprite.position.set(0, 0, 0);
1311:     sawGroup.add(hubGlowSprite);
1312: 
1313:     hubCoronaMat = new THREE.SpriteMaterial({
1314:       map: particleTex, color: 0xff5500,
1315:       transparent: true, opacity: 0.18,
1316:       blending: THREE.AdditiveBlending, depthWrite: false,
1317:     });
1318:     const hubCorona = new THREE.Sprite(hubCoronaMat);
1319:     hubCorona.scale.set(1.6, 1.6, 1.0);
1320:     sawGroup.add(hubCorona);
1321: 
1322:     // Invisible bounds for raycasting
1323:     const sawBounds = new THREE.Mesh(
1324:       new THREE.CylinderGeometry(1.1, 1.1, 0.2, 16),
1325:       new THREE.MeshBasicMaterial({ visible: false })
1326:     );
1327:     sawBounds.userData.toolId = 'saw';
1328:     sawGroup.add(sawBounds);
1329: 
1330:     sawParts.forEach(m => allToolParts.push(m));
1331:     sawGroup.visible = true;
1332:   }
1333: 
1334:   /* ─── GLB loaders ─────────────────────────────────────── */
1335:   function registerGLBPart(mesh, partsArr) {
1336:     const rest = mesh.position.clone();
1337:     mesh.userData.restPos = rest;
1338:     mesh.userData.spreadPos = rest.clone().add(
1339:       new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2.5, (Math.random() - 0.5) * 1)
1340:     );
1341:     mesh.userData.spreadRot = { x: Math.random() * Math.PI, y: Math.random() * Math.PI, z: 0 };
1342:     mesh.userData.assemblyDelay = Math.random() * 800;
1343:     mesh.position.copy(mesh.userData.spreadPos);
1344:     partsArr.push(mesh);
1345:     allToolParts.push(mesh);
1346:   }
1347: 
1348:   function _addGLBToGroup(gltf, targetGroup, partsList, targetSize) {
1349:     const model = gltf.scene;
1350: 
1351:     // Scale to fit targetSize in the largest dimension
1352:     const box = new THREE.Box3().setFromObject(model);
1353:     const size = box.getSize(new THREE.Vector3());
1354:     model.scale.setScalar(targetSize / Math.max(size.x, size.y, size.z));
1355: 
1356:     // Center the model within the group (offset from bounding box center)
1357:     box.setFromObject(model);
1358:     const center = box.getCenter(new THREE.Vector3());
1359:     model.position.sub(center);   // shifts model so its center sits at group origin
1360: 
1361:     // Enable shadows; hide LOD duplicates exported from modelling software
1362:     model.traverse(obj => {
1363:       if (!obj.isMesh) return;
1364:       if (/_lod[1-9]|_low|_duplicate|_copy/i.test(obj.name)) {
1365:         obj.visible = false;
1366:         return;
1367:       }
1368:       obj.castShadow = true;
1369:       obj.receiveShadow = true;
1370:     });
1371: 
1372:     // Treat the whole model as one assembly part.
1373:     // restPos = (0,0,0) relative to group — the model is centered there.
1374:     model.userData.restPos = new THREE.Vector3(0, 0, 0);
1375:     model.userData.spreadPos = new THREE.Vector3(
1376:       (Math.random() - 0.5) * 3,
1377:       (Math.random() - 0.5) * 3,
1378:       (Math.random() - 0.5) * 1.5
1379:     );
1380:     model.userData.spreadRot = { x: Math.random() * Math.PI, y: Math.random() * Math.PI, z: 0 };
1381:     model.userData.assemblyDelay = Math.random() * 400;
1382:     model.position.copy(model.userData.spreadPos);
1383: 
1384:     targetGroup.add(model);
1385:     partsList.push(model);
1386:     allToolParts.push(model);
1387:   }
1388: 
1389:   function populateWrenchFromGLB(gltf) {
1390:     _addGLBToGroup(gltf, wrenchGroup, wrenchParts, 2.2);
1391:     wrenchGroup.visible = true;
1392: 
1393:     const bounds = new THREE.Mesh(
1394:       new THREE.BoxGeometry(1.2, 2.5, 0.6),
1395:       new THREE.MeshBasicMaterial({ visible: false })
1396:     );
1397:     bounds.userData.toolId = 'wrench';
1398:     wrenchGroup.add(bounds);
1399:   }
1400: 
1401:   function populateSawFromGLB(gltf) {
1402:     _addGLBToGroup(gltf, sawGroup, sawParts, 2.0);
1403:     sawGroup.visible = true;
1404: 
1405:     // Handsaw sits upright — no PI/2 blade tilt, slight lean for visual interest
1406:     sawGroup.rotation.x = 0;
1407:     sawGroup.rotation.z = 0.2;
1408: 
1409:     const bounds = new THREE.Mesh(
1410:       new THREE.BoxGeometry(2.5, 1.0, 0.3),
1411:       new THREE.MeshBasicMaterial({ visible: false })
1412:     );
1413:     bounds.userData.toolId = 'saw';
1414:     sawGroup.add(bounds);
1415: 
1416:     glbSawLoaded = true;
1417:   }
1418: 
1419:   function loadGLBModels() {
1420:     const loader = new THREE.GLTFLoader();
1421:     let loaded = 0;
1422:     const total = 2;
1423:     const load = url => new Promise((res, rej) => loader.load(url, (gltf) => {
1424:       loaded++;
1425:       window.__preloaderProgress?.(Math.round((loaded / total) * 90)); // 0–90%, leave 10% for fonts
1426:       res(gltf);
1427:     }, undefined, rej));
1428:     window.__preloaderProgress?.(10); // signal start
1429:     return Promise.all([
1430:       load('assets/models/pipe-wrench.glb'),
1431:       load('assets/models/handsaw.glb'),
1432:     ]).then(([wrenchGltf, sawGltf]) => {
1433:       populateWrenchFromGLB(wrenchGltf);
1434:       populateSawFromGLB(sawGltf);
1435:     });
1436:   }
1437: 
1438: 
1439:   /* ─── Tooltip overlay (opacity/visibility transition) ─── */
1440:   const tooltip = document.createElement('div');
1441:   tooltip.id = 'tool-tooltip';
1442:   Object.assign(tooltip.style, {
1443:     position: 'fixed',
1444:     visibility: 'hidden',
1445:     opacity: '0',
1446:     pointerEvents: 'none',
1447:     fontFamily: '"Courier New", Courier, monospace',
1448:     fontSize: '11px',
1449:     lineHeight: '1.6',
1450:     letterSpacing: '0.05em',
1451:     color: '#c97512',
1452:     background: 'rgba(6,5,4,0.88)',
1453:     border: '1px solid rgba(180,100,18,0.55)',
1454:     padding: '9px 12px',
1455:     maxWidth: '192px',
1456:     zIndex: '9999',
1457:     transition: 'opacity 0.18s ease',
1458:   });
1459:   document.body.appendChild(tooltip);
1460: 
1461:   let tooltipHideTimer = null;
1462: 
1463:   const toolInfo = {
1464:     hammer: {
1465:       title: 'FRAMING HAMMER', sub: '20 oz Milled Face',
1466:       desc: 'Framing · Demolition\nNailing · Forming',
1467:       hint: '[H] panel  ·  drag to spin  ·  dbl-click burst',
1468:       specs: { Weight: '20 oz', Handle: 'Hickory', Face: 'Milled', Length: '16 in' },
1469:       apps: ['Framing & Demolition', 'Nailing & Forming'],
1470:       cta: 'Get a Quote',
1471:     },
1472:     wrench: {
1473:       title: 'ADJUSTABLE WRENCH', sub: '12" Chrome-Plated',
1474:       desc: 'Fastening · Plumbing\nRepair · Installation',
1475:       hint: '[W] panel  ·  drag to spin  ·  dbl-click burst',
1476:       specs: { Length: '12 in', Jaw: '35 mm max', Material: 'Chrome Steel', Finish: 'Polished' },
1477:       apps: ['Fastening & Plumbing', 'Repair & Installation'],
1478:       cta: 'Get a Quote',
1479:     },
1480:     saw: {
1481:       title: 'CIRCULAR SAW BLADE', sub: '7-1/4" Carbide Tipped',
1482:       desc: 'Framing · Decking\nDemolition · Finish Cuts',
1483:       hint: '[S] panel  ·  drag to spin  ·  dbl-click burst',
1484:       specs: { Diameter: '184 mm', Teeth: '24T', Bore: '15.88 mm', Coating: 'Anti-Stick' },
1485:       apps: ['Framing & Decking', 'Demolition & Finish Cuts'],
1486:       cta: 'Get a Quote',
1487:     },
1488:   };
1489: 
1490:   /* ─── Blueprint info panel ────────────────────────────── */
1491:   const infoPanel = document.createElement('div');
1492:   infoPanel.id = 'tool-info-panel';
1493:   Object.assign(infoPanel.style, {
1494:     position: 'fixed',
1495:     top: '50%',
1496:     right: '0',
1497:     transform: 'translateY(-50%) translateX(100%)',
1498:     width: '260px',
1499:     background: 'rgba(4,8,14,0.94)',
1500:     border: '1px solid rgba(68,136,204,0.45)',
1501:     borderRight: 'none',
1502:     borderRadius: '6px 0 0 6px',
1503:     padding: '0',
1504:     zIndex: '9998',
1505:     fontFamily: '"Courier New", Courier, monospace',
1506:     fontSize: '11px',
1507:     lineHeight: '1.7',
1508:     letterSpacing: '0.05em',
1509:     color: '#c8aa78',
1510:     background: 'rgba(4,8,16,0.96)',
1511:     transition: 'transform 0.28s cubic-bezier(0.22,1,0.36,1)',
1512:     pointerEvents: 'auto',
1513:     overflow: 'hidden',
1514:     position: 'relative',
1515:   });
1516:   document.body.appendChild(infoPanel);
1517: 
1518:   let activePanelTool = null;
1519: 
1520:   function openPanel(toolId) {
1521:     const info = toolInfo[toolId];
1522:     if (!info) return;
1523:     activePanelTool = toolId;
1524: 
1525:     while (infoPanel.firstChild) infoPanel.removeChild(infoPanel.firstChild);
1526: 
1527:     // Header bar
1528:     const header = document.createElement('div');
1529:     Object.assign(header.style, {
1530:       background: 'linear-gradient(135deg, rgba(200,120,20,0.18) 0%, rgba(68,136,204,0.08) 100%)',
1531:       borderBottom: '1px solid rgba(68,136,204,0.3)',
1532:       padding: '14px 14px 11px',
1533:       display: 'flex',
1534:       justifyContent: 'space-between',
1535:       alignItems: 'flex-start',
1536:     });
1537: 
1538:     const titleWrap = document.createElement('div');
1539:     const diamond = document.createElement('span');
1540:     diamond.textContent = '\u25C8 ';
1541:     diamond.style.color = '#4488cc';
1542:     titleWrap.appendChild(diamond);
1543:     const titleEl = document.createElement('strong');
1544:     titleEl.textContent = info.title;
1545:     titleEl.style.color = '#e8a840';
1546:     titleWrap.appendChild(titleEl);
1547:     const subEl = document.createElement('div');
1548:     subEl.textContent = info.sub;
1549:     subEl.style.cssText = 'opacity:0.5;font-size:10px;margin-top:2px;';
1550:     titleWrap.appendChild(subEl);
1551:     header.appendChild(titleWrap);
1552: 
1553:     const closeBtn = document.createElement('button');
1554:     closeBtn.textContent = '\u00D7';
1555:     Object.assign(closeBtn.style, {
1556:       background: 'none', border: '1px solid rgba(68,136,204,0.4)',
1557:       color: '#4488cc', cursor: 'pointer', fontSize: '14px',
1558:       lineHeight: '1', padding: '2px 6px', borderRadius: '3px',
1559:       fontFamily: 'inherit',
1560:     });
1561:     closeBtn.addEventListener('click', closePanel);
1562:     header.appendChild(closeBtn);
1563:     infoPanel.appendChild(header);
1564: 
1565:     // Body
1566:     const body = document.createElement('div');
1567:     body.style.padding = '12px 14px';
1568: 
1569:     // Specs section
1570:     const specsLabel = document.createElement('div');
1571:     specsLabel.textContent = 'SPECIFICATIONS';
1572:     specsLabel.style.cssText = 'color:#4488cc;font-size:9px;letter-spacing:0.12em;margin-bottom:6px;';
1573:     body.appendChild(specsLabel);
1574: 
1575:     const specsTable = document.createElement('div');
1576:     specsTable.style.marginBottom = '12px';
1577:     Object.entries(info.specs).forEach(([k, v], idx) => {
1578:       const row = document.createElement('div');
1579:       const rowBg = idx % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'transparent';
1580:       row.style.cssText = `display:flex;justify-content:space-between;padding:4px 6px;border-radius:2px;background:${rowBg};`;
1581:       const keyEl = document.createElement('span');
1582:       keyEl.textContent = k;
1583:       keyEl.style.opacity = '0.55';
1584:       const valEl = document.createElement('span');
1585:       valEl.textContent = v;
1586:       valEl.style.color = '#e8a840';
1587:       row.appendChild(keyEl);
1588:       row.appendChild(valEl);
1589:       specsTable.appendChild(row);
1590:     });
1591:     body.appendChild(specsTable);
1592: 
1593:     // Applications section
1594:     const appsLabel = document.createElement('div');
1595:     appsLabel.textContent = 'APPLICATIONS';
1596:     appsLabel.style.cssText = 'color:#4488cc;font-size:9px;letter-spacing:0.12em;margin-bottom:6px;';
1597:     body.appendChild(appsLabel);
1598: 
1599:     const appsList = document.createElement('div');
1600:     appsList.style.marginBottom = '14px';
1601:     info.apps.forEach(app => {
1602:       const item = document.createElement('div');
1603:       item.style.cssText = 'padding:2px 0;';
1604:       const bullet = document.createElement('span');
1605:       bullet.textContent = '\u25B8 ';
1606:       bullet.style.color = '#4488cc';
1607:       item.appendChild(bullet);
1608:       const appText = document.createTextNode(app);
1609:       item.appendChild(appText);
1610:       appsList.appendChild(item);
1611:     });
1612:     body.appendChild(appsList);
1613: 
1614:     // CTA button
1615:     const cta = document.createElement('button');
1616:     cta.textContent = info.cta.toUpperCase();
1617:     Object.assign(cta.style, {
1618:       width: '100%', padding: '11px 0',
1619:       background: 'linear-gradient(135deg, #c97512, #e8a840)',
1620:       border: 'none',
1621:       borderRadius: '4px', color: '#0d0a06',
1622:       fontFamily: 'inherit', fontSize: '11px', fontWeight: '700',
1623:       letterSpacing: '0.14em', cursor: 'pointer',
1624:       boxShadow: '0 0 18px rgba(200,130,20,0.4)',
1625:       transition: 'box-shadow 0.18s ease, transform 0.12s ease',
1626:     });
1627:     cta.addEventListener('mouseenter', () => {
1628:       cta.style.boxShadow = '0 0 32px rgba(200,140,20,0.65)';
1629:       cta.style.transform = 'translateY(-1px)';
1630:     });
1631:     cta.addEventListener('mouseleave', () => {
1632:       cta.style.boxShadow = '0 0 18px rgba(200,130,20,0.4)';
1633:       cta.style.transform = 'translateY(0)';
1634:     });
1635:     body.appendChild(cta);
1636: 
1637:     infoPanel.appendChild(body);
1638: 
1639:     // Slide in
1640:     infoPanel.style.transform = 'translateY(-50%) translateX(0)';
1641:   }
1642: 
1643:   function closePanel() {
1644:     activePanelTool = null;
1645:     infoPanel.style.transform = 'translateY(-50%) translateX(100%)';
1646:   }
1647: 
1648:   function showTooltip(toolId, screenX, screenY) {
1649:     const info = toolInfo[toolId];
1650:     if (!info) return;
1651:     clearTimeout(tooltipHideTimer);
1652: 
1653:     while (tooltip.firstChild) tooltip.removeChild(tooltip.firstChild);
1654: 
1655:     const titleEl = document.createElement('strong');
1656:     titleEl.textContent = info.title;
1657:     tooltip.appendChild(titleEl);
1658:     tooltip.appendChild(document.createElement('br'));
1659: 
1660:     const subEl = document.createElement('span');
1661:     subEl.textContent = info.sub;
1662:     subEl.style.opacity = '0.55';
1663:     tooltip.appendChild(subEl);
1664: 
1665:     const hr = document.createElement('hr');
1666:     hr.style.cssText = 'border:none;border-top:1px solid rgba(200,120,20,0.3);margin:5px 0';
1667:     tooltip.appendChild(hr);
1668: 
1669:     const descEl = document.createElement('span');
1670:     descEl.textContent = info.desc;
1671:     descEl.style.cssText = 'opacity:0.8;white-space:pre-line';
1672:     tooltip.appendChild(descEl);
1673: 
1674:     if (info.hint) {
1675:       const hr2 = document.createElement('hr');
1676:       hr2.style.cssText = 'border:none;border-top:1px solid rgba(200,120,20,0.2);margin:5px 0 4px';
1677:       tooltip.appendChild(hr2);
1678:       const hintEl = document.createElement('span');
1679:       hintEl.textContent = info.hint;
1680:       hintEl.style.cssText = 'opacity:0.35;font-size:9px;letter-spacing:0.04em';
1681:       tooltip.appendChild(hintEl);
1682:     }
1683: 
1684:     // Clamp to viewport
1685:     const x = Math.min(screenX + 18, window.innerWidth  - 210);
1686:     const y = Math.max(screenY - 20, 8);
1687:     tooltip.style.left = x + 'px';
1688:     tooltip.style.top  = y + 'px';
1689:     tooltip.style.visibility = 'visible';
1690:     tooltip.style.opacity = '1';
1691:   }
1692: 
1693:   function hideTooltip() {
1694:     tooltip.style.opacity = '0';
1695:     clearTimeout(tooltipHideTimer);
1696:     tooltipHideTimer = setTimeout(() => {
1697:       tooltip.style.visibility = 'hidden';
1698:     }, 200);
1699:   }
1700: 
1701:   /* ─── Raycaster ───────────────────────────────────────── */
1702:   const raycaster = new THREE.Raycaster();
1703:   const mouseVec  = new THREE.Vector2();
1704:   let hoveredTool = null;
1705:   const hoverEmissive = { hammer: 0, wrench: 0, saw: 0 };
1706: 
1707:   function getToolGroup(id) {
1708:     if (id === 'hammer') return hammerGroup;
1709:     if (id === 'wrench') return wrenchGroup;
1710:     return sawGroup;
1711:   }
1712: 
1713:   let sceneReadySignaled = false;
1714: 
1715:   function signalSceneReady() {
1716:     if (sceneReadySignaled) return;
1717:     sceneReadySignaled = true;
1718:     window.__preloaderProgress?.(100);
1719:     if (typeof window.__resolveSceneAssetsReady === 'function') {
1720:       window.__resolveSceneAssetsReady();
1721:       window.__resolveSceneAssetsReady = null;
1722:     }
1723:     window.dispatchEvent(new CustomEvent('three-scene:ready'));
1724:   }
1725: 
1726:   function setObjectOpacity(object, opacity) {
1727:     object.traverse((node) => {
1728:       if (!node.material) return;
1729:       const materials = Array.isArray(node.material) ? node.material : [node.material];
1730:       materials.forEach((material) => {
1731:         if (!material || typeof material.opacity !== 'number') return;
1732:         if (opacity < 1 && !material.transparent) material.transparent = true;
1733:         material.opacity = opacity;
1734:       });
1735:     });
1736:   }
1737: 
1738:   /* ─── Spin animation state ────────────────────────────── */
1739:   const spinState = {
1740:     hammer: { spinning: false, spinStart: 0, spinFrom: 0 },
1741:     wrench: { spinning: false, spinStart: 0, spinFrom: 0 },
1742:     saw:    { spinning: false, spinStart: 0, spinFrom: 0 },
1743:   };
1744:   const SPIN_DURATION = 820;
1745:   function easeInOut(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
1746: 
1747:   /* ─── Assembly intro ──────────────────────────────────── */
1748:   let assemblyDone      = false;
1749:   let assemblyStartTime = null;
1750:   let heroCopyShown     = false; // guard: only add .visible class once
1751:   const ASSEMBLY_DURATION = 1800;
1752: 
1753:   // Vortex implosion state (click shockwave → delayed pull-back)
1754:   let implosionActive = false;
1755:   let implosionStart = 0;
1756:   let clickWorldPos = { x: 0, y: 0, z: 0 };
1757:   const IMPLOSION_DURATION = 1200;
1758:   function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
1759:   // Spring easing for assembly — underdamped: ~12% overshoot, parts snap together with mechanical weight
1760:   function easeOutSpring(t) {
1761:     const decay = Math.exp(-6.5 * t);
1762:     return 1 - decay * Math.cos(Math.PI * 2.2 * t);
1763:   }
1764: 
1765:   /* ─── Idle rotation accumulators + drag inertia ──────── */
1766:   let hammerIdleY = 0;
1767:   let wrenchIdleY = 0;
1768:   const inertia = { hammer: 0, wrench: 0, saw: 0 };
1769: 
1770:   /* ─── Mouse tracking ──────────────────────────────────── */
1771:   let mouseX = 0, mouseY = 0;
1772:   let rawMouseX = 0, rawMouseY = 0;
1773:   let targetRotX = 0, targetRotY = 0;
1774:   // Velocity tracking for turbulence physics
1775:   let prevMouseX = 0, prevMouseY = 0;
1776:   let smoothVelX = 0, smoothVelY = 0;
1777:   let reverseGravityTimer = null;
1778: 
1779:   window.addEventListener('mousemove', (e) => {
1780:     rawMouseX = e.clientX;
1781:     rawMouseY = e.clientY;
1782:     mouseX = (e.clientX / window.innerWidth)  * 2 - 1;
1783:     mouseY = (e.clientY / window.innerHeight) * 2 - 1;
1784:     // Cubic parallax: low sensitivity at center, pronounced tilt at viewport edges
1785:     targetRotY =  (mouseX * mouseX * mouseX) * 0.12;
1786:     targetRotX = -(mouseY * mouseY * mouseY) * 0.10;
1787: 
1788:     // Fix: correct NDC Y — no sign flip needed here
1789:     mouseVec.set(mouseX, mouseY);
1790:     raycaster.setFromCamera(mouseVec, camera);
1791: 
1792:     const targets = [];
1793:     [hammerGroup, wrenchGroup, sawGroup].forEach(grp => {
1794:       grp.traverse(o => { if (o.userData.toolId) targets.push(o); });
1795:     });
1796:     const hits = raycaster.intersectObjects(targets);
1797: 
1798:     if (hits.length > 0) {
1799:       const id = hits[0].object.userData.toolId;
1800:       if (id !== hoveredTool) {
1801:         emitRipple(id); // ripple on enter
1802:       }
1803:       hoveredTool = id;
1804:       canvas.style.cursor = 'pointer';
1805:       showTooltip(id, rawMouseX, rawMouseY);
1806:     } else {
1807:       if (hoveredTool !== null) {
1808:         // Clear proximity physics on hover exit (strength lerps back to 0)
1809:         VORTEX_PARAMS.proximityTool = null;
1810:       }
1811:       hoveredTool = null;
1812:       canvas.style.cursor = 'default';
1813:       hideTooltip();
1814:     }
1815:   });
1816: 
1817:   /* ─── Touch interaction for mobile ─────────────────────── */
1818:   let prevPinchDist = null;
1819:   let longPressTimer = null;
1820:   let swipeStartX = null, swipeStartY = null;
1821: 
1822:   canvas.addEventListener('touchstart', (e) => {
1823:     if (e.touches.length === 1) {
1824:       swipeStartX = e.touches[0].clientX;
1825:       swipeStartY = e.touches[0].clientY;
1826:       // Long-press (600ms) → reverse gravity
1827:       longPressTimer = setTimeout(() => {
1828:         VORTEX_PARAMS.reverseGravity = true;
1829:         clearTimeout(reverseGravityTimer);
1830:         reverseGravityTimer = setTimeout(() => { VORTEX_PARAMS.reverseGravity = false; }, 2500);
1831:       }, 600);
1832:     } else if (e.touches.length === 2) {
1833:       clearTimeout(longPressTimer);
1834:       const t0 = e.touches[0], t1 = e.touches[1];
1835:       prevPinchDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
1836:     }
1837:   }, { passive: true });
1838: 
1839:   canvas.addEventListener('touchmove', (event) => {
1840:     clearTimeout(longPressTimer);
1841:     // Prevent browser scroll only while touch is inside the hero — preserves normal page scroll elsewhere
1842:     const heroEl = document.querySelector('.hero');
1843:     if (heroEl && event.touches[0].clientY <= heroEl.getBoundingClientRect().bottom) {
1844:       event.preventDefault();
1845:     }
1846:     if (event.touches.length === 1) {
1847:       // Single touch: gravity well (existing behavior)
1848:       const touch = event.touches[0];
1849:       mouseX = (touch.clientX / window.innerWidth) * 2 - 1;
1850:       mouseY = (touch.clientY / window.innerHeight) * 2 - 1;
1851:       rawMouseX = touch.clientX;
1852:       rawMouseY = touch.clientY;
1853:     } else if (event.touches.length === 2) {
1854:       // Two-finger pinch / expand
1855:       const t0 = event.touches[0], t1 = event.touches[1];
1856:       const curDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
1857:       const delta = curDist - (prevPinchDist || curDist);
1858:       prevPinchDist = curDist;
1859:       if (Math.abs(delta) > 4) {
1860:         const midX = (t0.clientX + t1.clientX) / 2;
1861:         const midY = (t0.clientY + t1.clientY) / 2;
1862:         const mwx = ((midX / window.innerWidth) * 2 - 1) * 5.5;
1863:         const mwy = -((midY / window.innerHeight) * 2 - 1) * 3.0;
1864:         if (delta > 0) {
1865:           // Pinch out → explosion
1866:           applyVortexShockwave(amberSystem, { x: mwx, y: mwy, z: 0 });
1867:           applyVortexShockwave(sparkSystem, { x: mwx, y: mwy, z: 0 });
1868:           emitSparks(mwx, mwy, 0xffa040, 10);
1869:         } else {
1870:           // Pinch in → implosion pull
1871:           VORTEX_PARAMS.centerX = mwx;
1872:           VORTEX_PARAMS.centerY = mwy;
1873:           const savedCore = VORTEX_PARAMS.coreStrength;
1874:           VORTEX_PARAMS.coreStrength = 0.018;
1875:           setTimeout(() => { VORTEX_PARAMS.coreStrength = savedCore; }, 400);
1876:         }
1877:       }
1878:     }
1879:   }, { passive: false });
1880: 
1881:   canvas.addEventListener('touchend', (e) => {
1882:     clearTimeout(longPressTimer);
1883:     prevPinchDist = null;
1884:     if (swipeStartX === null) return;
1885:     const t = e.changedTouches[0];
1886:     const sdx = t.clientX - swipeStartX;
1887:     const sdy = t.clientY - swipeStartY;
1888:     const swipeDist = Math.hypot(sdx, sdy);
1889:     swipeStartX = null; swipeStartY = null;
1890:     if (swipeDist > 60) {
1891:       if (Math.abs(sdx) > Math.abs(sdy)) {
1892:         // Horizontal swipe → spin all tools
1893:         const rotDir = sdx > 0 ? 0.025 : -0.025;
1894:         inertia.hammer += rotDir;
1895:         inertia.wrench += rotDir;
1896:       } else if (sdy < 0) {
1897:         // Swipe up → scatter
1898:         applyVortexShockwave(amberSystem, { x: 0, y: 0, z: 0 });
1899:         applyVortexShockwave(sparkSystem, { x: 0, y: 0, z: 0 });
1900:       } else {
1901:         // Swipe down → gather/implosion
1902:         VORTEX_PARAMS.centerX = 0;
1903:         VORTEX_PARAMS.centerY = 0;
1904:         const savedCore = VORTEX_PARAMS.coreStrength;
1905:         VORTEX_PARAMS.coreStrength = 0.022;
1906:         setTimeout(() => { VORTEX_PARAMS.coreStrength = savedCore; }, 600);
1907:       }
1908:     } else {
1909:       // Tap — raycast for tool click or emit shockwave
1910:       e.preventDefault();
1911:       const tx = (t.clientX / window.innerWidth) * 2 - 1;
1912:       const ty = -((t.clientY / window.innerHeight) * 2 - 1);
1913:       mouseVec.set(tx, ty);
1914:       raycaster.setFromCamera(mouseVec, camera);
1915:       const tgts = [];
1916:       [hammerGroup, wrenchGroup, sawGroup].forEach(grp => {
1917:         grp.traverse(o => { if (o.userData.toolId) tgts.push(o); });
1918:       });
1919:       const hits = raycaster.intersectObjects(tgts);
1920:       if (hits.length > 0) {
1921:         handleToolClick(hits[0].object.userData.toolId, t.clientX, t.clientY);
1922:       } else {
1923:         closePanel();
1924:         const wx = ((t.clientX / window.innerWidth) * 2 - 1) * 5.5;
1925:         const wy = -((t.clientY / window.innerHeight) * 2 - 1) * 3.0;
1926:         emitSparks(wx, wy);
1927:         clickWorldPos = { x: wx, y: wy, z: 0 };
1928:         applyVortexShockwave(amberSystem, clickWorldPos);
1929:         applyVortexShockwave(sparkSystem, clickWorldPos);
1930:         applyVortexShockwave(hazeSystem,  clickWorldPos);
1931:         implosionActive = true;
1932:         implosionStart = performance.now();
1933:       }
1934:     }
1935:   }, false);
1936: 
1937:   /* ─── Disassembly state ───────────────────────────────── */
1938:   const disassembleState = {
1939:     hammer: { exploded: false, animating: false, startTime: 0, goingOut: false },
1940:     wrench: { exploded: false, animating: false, startTime: 0, goingOut: false },
1941:     saw:    { exploded: false, animating: false, startTime: 0, goingOut: false },
1942:   };
1943:   const DISASSEMBLE_DURATION = 900;
1944: 
1945:   function getToolParts(id) {
1946:     if (id === 'hammer') return hammerParts;
1947:     if (id === 'wrench') return wrenchParts;
1948:     return sawParts;
1949:   }
1950: 
1951:   function triggerDisassemble(id) {
1952:     const ds = disassembleState[id];
1953:     ds.animating = true;
1954:     ds.startTime = performance.now();
1955:     ds.goingOut  = !ds.exploded;
1956:     // Burst at tool world position — blue-white for disassembly, amber for reassembly
1957:     const grp = getToolGroup(id);
1958:     const burstColor = ds.goingOut ? 0x88ccff : 0xffa040;
1959:     emitSparks(grp.position.x, grp.position.y, burstColor, sparks.length);
1960:   }
1961: 
1962:   /* ─── Hover ripple rings ───────────────────────────────── */
1963:   const rippleRings = [];
1964:   for (let r = 0; r < 3; r++) {
1965:     const rMat = new THREE.MeshBasicMaterial({
1966:       color: 0x4488cc, transparent: true, opacity: 0,
1967:       side: THREE.FrontSide, blending: THREE.AdditiveBlending, depthWrite: false,
1968:     });
1969:     const rMesh = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.025, 6, 24), rMat);
1970:     rMesh.visible = false;
1971:     scene.add(rMesh);
1972:     rippleRings.push({ mesh: rMesh, active: false, startTime: 0 });
1973:   }
1974:   let rippleIdx = 0;
1975: 
1976:   function emitRipple(toolId) {
1977:     const grp = getToolGroup(toolId);
1978:     const ring = rippleRings[rippleIdx % 3];
1979:     rippleIdx++;
1980:     ring.mesh.position.copy(grp.position);
1981:     ring.mesh.scale.set(0.2, 0.2, 0.2);
1982:     ring.mesh.material.opacity = 0.65;
1983:     ring.mesh.visible = true;
1984:     ring.active = true;
1985:     ring.startTime = performance.now();
1986:   }
1987: 
1988:   /* ─── Click: open panel OR spin (single) ──────────────── */
1989:   let lastClickTime = 0;
1990:   let lastClickTool = null;
1991: 
1992:   function handleToolClick(toolId, screenX, screenY) {
1993:     const now = performance.now();
1994:     const dt  = now - lastClickTime;
1995:     // Double-click detection (≤ 400 ms)
1996:     if (dt < 400 && lastClickTool === toolId) {
1997:       triggerDisassemble(toolId);
1998:       lastClickTime = 0;
1999:       return;
2000:     }
2001:     lastClickTime = now;
2002:     lastClickTool = toolId;
2003: 
2004:     // Panel toggle
2005:     if (activePanelTool === toolId) {
2006:       closePanel();
2007:     } else {
2008:       openPanel(toolId);
2009:       // Single click also spins
2010:       const st = spinState[toolId];
2011:       if (!st.spinning) {
2012:         st.spinning  = true;
2013:         st.spinStart = performance.now();
2014:         st.spinFrom  = getToolGroup(toolId).rotation.y;
2015:       }
2016:     }
2017:   }
2018: 
2019:   let canvasLastClickTime = 0;
2020:   canvas.addEventListener('click', (e) => {
2021:     const now = performance.now();
2022:     if (hoveredTool) {
2023:       handleToolClick(hoveredTool, e.clientX, e.clientY);
2024:       canvasLastClickTime = now;
2025:       return;
2026:     }
2027:     // Guard only for empty-space shockwaves — absorbs synthetic click from dblclick
2028:     if (now - canvasLastClickTime < 350) return;
2029:     canvasLastClickTime = now;
2030:     {
2031:       closePanel();
2032:       // Spark burst at click world position
2033:       const clickX = ((e.clientX / window.innerWidth)  * 2 - 1) * 5.5;
2034:       const clickY = -((e.clientY / window.innerHeight) * 2 - 1) * 3.0;
2035:       emitSparks(clickX, clickY);
2036:       // Apply vortex shockwave + implosion pull-back
2037:       clickWorldPos = { x: clickX, y: clickY, z: 0 };
2038:       applyVortexShockwave(amberSystem, clickWorldPos);
2039:       applyVortexShockwave(sparkSystem, clickWorldPos);
2040:       applyVortexShockwave(hazeSystem,  clickWorldPos);
2041:       implosionActive = true;
2042:       implosionStart = performance.now();
2043:     }
2044:   });
2045: 
2046:   /* ─── Drag-to-rotate tools ────────────────────────────── */
2047:   let dragTool = null, dragStartX = 0, dragBaseRotY = 0;
2048:   let dragVel = 0, dragLastX = 0, dragLastT = 0;
2049: 
2050:   canvas.addEventListener('mousedown', (e) => {
2051:     if (hoveredTool) {
2052:       dragTool     = hoveredTool;
2053:       dragStartX   = e.clientX;
2054:       dragBaseRotY = getToolGroup(hoveredTool).rotation.y;
2055:       dragVel = 0; dragLastX = e.clientX; dragLastT = performance.now();
2056:       canvas.style.cursor = 'grabbing';
2057:       // Drag-grab burst: sparks fly from tool + immediate turbulence spike
2058:       const grp = getToolGroup(dragTool);
2059:       emitSparks(grp.position.x, grp.position.y, 0xffcc66, 10);
2060:       VORTEX_PARAMS.turbulenceMode = Math.min(1.0, VORTEX_PARAMS.turbulenceMode + 0.6);
2061:       e.preventDefault();
2062:     }
2063:   });
2064: 
2065:   window.addEventListener('mousemove', (e) => {
2066:     if (!dragTool) return;
2067:     const dx = (e.clientX - dragStartX) / window.innerWidth;
2068:     getToolGroup(dragTool).rotation.y = dragBaseRotY + dx * Math.PI * 2.5;
2069:     // Track velocity for inertia on release
2070:     const nowT = performance.now();
2071:     dragVel = (e.clientX - dragLastX) / Math.max(1, nowT - dragLastT) * 0.003;
2072:     // Boost particle turbulence + wind during drag proportional to drag speed
2073:     const dragWindBoost = Math.abs(e.clientX - dragLastX) * 0.00012;
2074:     VORTEX_PARAMS.turbulenceMode = Math.min(1.0, VORTEX_PARAMS.turbulenceMode + 0.25);
2075:     VORTEX_PARAMS.windStrength = Math.min(0.022, VORTEX_PARAMS.baseWindStrength + dragWindBoost);
2076:     dragLastX = e.clientX; dragLastT = nowT;
2077:   });
2078: 
2079:   window.addEventListener('mouseup', () => {
2080:     clearTimeout(slingshotTimer); // prevent deferred slingshot after middle-click release
2081:     if (!dragTool) return;
2082:     canvas.style.cursor = hoveredTool ? 'pointer' : 'default';
2083:     // Sync idle accumulator to current rotation so idle resumes seamlessly
2084:     if (dragTool === 'hammer') hammerIdleY = hammerGroup.rotation.y;
2085:     if (dragTool === 'wrench') wrenchIdleY = wrenchGroup.rotation.y;
2086:     // Store drag velocity for inertia decay
2087:     inertia[dragTool] = dragVel;
2088:     // Release burst: size proportional to drag velocity
2089:     const burstCount = Math.min(20, Math.floor(Math.abs(dragVel) * 3000) + 6);
2090:     const grpR = getToolGroup(dragTool);
2091:     emitSparks(grpR.position.x, grpR.position.y, 0xffa040, burstCount);
2092:     if (Math.abs(dragVel) > 0.002) {
2093:       const lateralPos = {
2094:         x: grpR.position.x + (dragVel > 0 ? 1.5 : -1.5),
2095:         y: grpR.position.y, z: 0
2096:       };
2097:       applyVortexShockwave(amberSystem, lateralPos);
2098:       applyVortexShockwave(sparkSystem, lateralPos);
2099:     }
2100:     // Reset wind boost back to base after drag ends
2101:     VORTEX_PARAMS.windStrength = VORTEX_PARAMS.baseWindStrength;
2102:     dragTool = null;
2103:   });
2104: 
2105:   /* ─── Right-click: reverse gravity ────────────────────── */
2106:   canvas.addEventListener('contextmenu', (e) => {
2107:     e.preventDefault();
2108:     VORTEX_PARAMS.reverseGravity = true;
2109:     clearTimeout(reverseGravityTimer);
2110:     reverseGravityTimer = setTimeout(() => { VORTEX_PARAMS.reverseGravity = false; }, 2500);
2111:     // Visual feedback: small shockwave from cursor
2112:     const rx = ((e.clientX / window.innerWidth) * 2 - 1) * 5.5;
2113:     const ry = -((e.clientY / window.innerHeight) * 2 - 1) * 3.0;
2114:     applyVortexShockwave(amberSystem, { x: rx, y: ry, z: 0 });
2115:     applyVortexShockwave(sparkSystem, { x: rx, y: ry, z: 0 });
2116:     applyVortexShockwave(hazeSystem,  { x: rx, y: ry, z: 0 });
2117:     emitSparks(rx, ry, 0x88ccff, 10);
2118:     // Implosion pull-back from right-click position
2119:     clickWorldPos = { x: rx, y: ry, z: 0 };
2120:     implosionActive = true;
2121:     implosionStart = performance.now();
2122:   });
2123: 
2124:   /* ─── Extended Interaction Events ────────────────────────── */
2125: 
2126:   // State variables for new interactions (reverseGravityTimer already declared above)
2127:   let reverseGravityActive = false;
2128:   let slingshotTimer = null;
2129:   let sawLocked = false;
2130: 
2131:   // Double-click: Detonation burst — particles explode outward then snap back via implosion
2132:   canvas.addEventListener('dblclick', (e) => {
2133:     VORTEX_PARAMS.reverseGravity = true;
2134:     VORTEX_PARAMS.turbulenceMode = 1.0;
2135:     reverseGravityActive = true;
2136:     clearTimeout(reverseGravityTimer);
2137:     reverseGravityTimer = setTimeout(() => {
2138:       VORTEX_PARAMS.reverseGravity = false;
2139:       reverseGravityActive = false;
2140:     }, 800);
2141:     // Delayed snap-back implosion — starts 300ms in so blast peaks first
2142:     const dbx = ((e.clientX / window.innerWidth) * 2 - 1) * 5.5;
2143:     const dby = -((e.clientY / window.innerHeight) * 2 - 1) * 3.0;
2144:     clickWorldPos = { x: dbx, y: dby, z: 0 };
2145:     implosionActive = true;
2146:     implosionStart = performance.now() - IMPLOSION_DURATION * VORTEX_PARAMS.implosionDelay;
2147:   });
2148: 
2149:   // Middle-click: Freeze + Slingshot — particles decelerate to near-stop, then blast outward
2150:   canvas.addEventListener('mousedown', e => {
2151:     if (e.button !== 1 || dragTool) return; // skip if not middle-click or already dragging
2152:     e.preventDefault();
2153:     VORTEX_PARAMS.damping = 0.940;
2154:     clearTimeout(slingshotTimer);
2155:     slingshotTimer = setTimeout(() => {
2156:       VORTEX_PARAMS.damping = 0.982;
2157:       VORTEX_PARAMS.shockwaveImpulse = 0.35;
2158:       const wp = new THREE.Vector3(mouseX * 5.5, -mouseY * 3.0, 0);
2159:       applyVortexShockwave(amberSystem, wp);
2160:       applyVortexShockwave(sparkSystem, wp);
2161:       applyVortexShockwave(hazeSystem,  wp);
2162:       setTimeout(() => { VORTEX_PARAMS.shockwaveImpulse = 0.45; }, 100);
2163:     }, 600);
2164:   });
2165: 
2166:   // Spacebar hold: Saw lock at max speed + suppress cursor vortex so saw induction dominates
2167:   window.addEventListener('keydown', e => {

(Showing lines 1168-2167 of 2994. Use offset=2168 to continue.)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\Dev\\handyman\\index.html"
}
```

**Output:**
```
<path>C:\Dev\handyman\index.html</path>
<type>file</type>
<content>1: <!DOCTYPE html>
2: <html lang="en">
3: <head>
4:   <meta charset="UTF-8">
5:   <meta name="viewport" content="width=device-width, initial-scale=1.0">
6: 
7:   <title>ProCraft — General Construction &amp; Handyman | Springfield, IL</title>
8:   <meta name="description" content="ProCraft provides general construction and handyman services in Springfield, Illinois. Carpentry, drywall, painting, flooring, repairs, and free estimates.">
9: 
10:   <!-- Open Graph -->
11:   <meta property="og:title" content="ProCraft — Springfield Handyman &amp; Construction">
12:   <meta property="og:description" content="Skilled hands-on work, honest pricing, and free estimates across Springfield and surrounding Illinois communities.">
13:   <meta property="og:type" content="website">
14:   <!-- PLACEHOLDER: <link rel="canonical" href="https://yourdomain.com"> -->
15: 
16:   <!-- Favicon placeholder -->
17:   <!-- PLACEHOLDER: <link rel="icon" type="image/png" href="assets/images/favicon.png"> -->
18: 
19:   <!-- Fonts -->
20:   <link rel="preconnect" href="https://fonts.googleapis.com">
21:   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
22:   <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;0,9..144,900;1,9..144,900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
23: 
24:   <!-- Styles -->
25:   <link rel="stylesheet" href="styles.css">
26: 
27:   <!-- SplitType — character/word level text splitting for reveals -->
28:   <script src="https://unpkg.com/split-type@0.3.4/umd/index.min.js"></script>
29: 
30:   <!-- Hidden SVG noise filter (referenced by CSS) -->
31:   <svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute">
32:     <defs>
33:       <filter id="noise-filter" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB">
34:         <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" result="noiseOut"/>
35:         <feColorMatrix type="saturate" values="0" in="noiseOut" result="grayNoise"/>
36:         <feBlend in="SourceGraphic" in2="grayNoise" mode="overlay" result="blended"/>
37:         <feComposite in="blended" in2="SourceGraphic" operator="in"/>
38:       </filter>
39:     </defs>
40:   </svg>
41: </head>
42: 
43: <body>
44: 
45:   <!-- ═══════════════════════════════════════════
46:        GLOBAL OVERLAYS
47:   ═══════════════════════════════════════════ -->
48: 
49:   <!-- Page preloader — fills while Three.js GLB assets load -->
50:   <div class="preloader" id="preloader" aria-hidden="true">
51:     <div class="preloader__inner">
52:       <div class="preloader__logo">
53:         <span class="preloader__mark">✦</span>
54:         <span class="preloader__name">ProCraft</span>
55:       </div>
56:       <div class="preloader__bar-track">
57:         <div class="preloader__bar" id="preloaderBar"></div>
58:       </div>
59:       <p class="preloader__label" id="preloaderLabel">Loading...</p>
60:     </div>
61:   </div>
62: 
63:   <!-- Custom cursor — amber dot + lagging ring -->
64:   <div class="cursor" id="cursor" aria-hidden="true">
65:     <div class="cursor__dot"></div>
66:     <div class="cursor__ring"></div>
67:   </div>
68: 
69:   <!-- Film grain / noise texture overlay -->
70:   <div class="noise-overlay" aria-hidden="true"></div>
71: 
72:   <!-- Gradient overlay between Three.js canvas and content for readability -->
73:   <div class="scene-overlay" aria-hidden="true"></div>
74: 
75:   <!-- Scroll-reactive warmth overlay — amber intensity increases with scroll depth -->
76:   <div class="scene-warmth-overlay" aria-hidden="true"></div>
77: 
78:   <!-- Scroll progress bar (thin amber line at top) -->
79:   <div class="scroll-progress" id="scrollProgress" role="progressbar" aria-hidden="true"></div>
80: 
81: 
82:   <!-- ═══════════════════════════════════════════
83:        NAVIGATION
84:   ═══════════════════════════════════════════ -->
85:   <nav class="nav" id="nav" role="navigation" aria-label="Main navigation">
86:     <div class="nav__inner container">
87:       <!-- PLACEHOLDER: Replace with logo image or business name -->
88:       <a href="#hero" class="nav__logo" aria-label="ProCraft Construction & Handyman — Home">
89:         <span class="nav__logo-mark">✦</span>
90:         <span class="nav__logo-text">ProCraft</span>
91:       </a>
92: 
93:       <div class="nav__links">
94:         <a href="#services" class="nav__link">Services</a>
95:         <a href="#about" class="nav__link">About</a>
96:         <a href="#testimonials" class="nav__link">Reviews</a>
97:         <a href="#contact" class="nav__link">Contact</a>
98:       </div>
99: 
100:       <!-- PLACEHOLDER: Replace with real phone number -->
101:       <a class="nav__cta btn btn--primary btn--sm" href="tel:+12175550182">
102:         <svg class="btn__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
103:           <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
104:         </svg>
105:         Call Now
106:       </a>
107:     </div>
108:   </nav>
109: 
110: 
111:   <!-- ═══════════════════════════════════════════
112:        HERO SECTION
113:   ═══════════════════════════════════════════ -->
114:   <section class="hero" id="hero" aria-label="Hero">
115: 
116:     <!-- Parallax background layer -->
117:     <div class="hero__bg" id="heroBg" aria-hidden="true">
118:       <!-- Atmospheric grid + radial glow are in CSS -->
119:       <!-- PLACEHOLDER: Optionally add background-image: url(assets/images/hero-bg.jpg) via inline style when image is ready -->
120:     </div>
121: 
122:     <!-- Foreground content -->
123:     <div class="hero__content container">
124: 
125:       <p class="hero__eyebrow" aria-label="ProCraft location and credentials">
126:         <span class="eyebrow-seg">GREATER SPRINGFIELD AREA</span>
127:         <span class="eyebrow-dot" aria-hidden="true"> · </span>
128:         <span class="eyebrow-seg">(217) 555-0182</span>
129:         <span class="eyebrow-dot" aria-hidden="true"> · </span>
130:         <span class="eyebrow-seg">&#9733; 4.9 RATED</span>
131:       </p>
132: 
133:       <!-- PLACEHOLDER: Replace with real headline -->
134:       <h1 class="hero__title">
135:         Built Right.<br>
136:         <em>Done Right.</em>
137:       </h1>
138: 
139:       <!-- PLACEHOLDER: Replace with real description -->
140:       <p class="hero__sub">
141:         General construction &amp; handyman services — from small fixes to full projects.
142:         One call, real craftsmanship, honest pricing.
143:       </p>
144: 
145:       <div class="hero__ctas">
146:         <!-- PLACEHOLDER: Replace href and text with real phone number -->
147:         <a class="btn btn--primary btn--lg" href="tel:+12175550182">
148:           <svg class="btn__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
149:             <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
150:           </svg>
151:           (217) 555-0182
152:         </a>
153:         <a class="btn btn--ghost btn--lg" href="#services">
154:           Our Services
155:           <svg class="btn__icon btn__icon--right" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
156:             <path d="M5 12h14M12 5l7 7-7 7"/>
157:           </svg>
158:         </a>
159:       </div>
160: 
161:       <!-- PLACEHOLDER: Replace with real trust badges -->
162:       <div class="hero__trust" role="list" aria-label="Service highlights">
163:         <span class="trust-item" role="listitem">
164:           <svg class="trust-item__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
165:           Free Estimates
166:         </span>
167:         <span class="trust-item" role="listitem">
168:           <svg class="trust-item__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
169:           Springfield, IL
170:         </span>
171:         <span class="trust-item" role="listitem">
172:           <svg class="trust-item__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
173:           No Job Too Small
174:         </span>
175:       </div>
176: 
177:     </div>
178: 
179:     <!-- Scroll cue -->
180:     <div class="scroll-cue" id="scrollCue" aria-hidden="true">
181:       <span class="scroll-cue__label">Scroll</span>
182:       <div class="scroll-cue__mouse">
183:         <div class="scroll-cue__dot"></div>
184:       </div>
185:     </div>
186: 
187:   </section>
188: 
189: 
190:   <!-- ═══════════════════════════════════════════
191:        SERVICES SECTION
192:   ═══════════════════════════════════════════ -->
193:   <section class="section services" id="services" aria-label="Services">
194:     <div class="services__pin-wrap services__scroll-pin" id="servicesPin">
195: 
196:       <div class="container">
197:         <header class="section__header reveal">
198:           <p class="section__eyebrow">What We Do</p>
199:           <h2 class="section__title">Services</h2>
200:           <!-- PLACEHOLDER: Optionally replace subtitle -->
201:           <p class="section__sub">From quick repairs to complete renovations — skilled work for every job.</p>
202:         </header>
203:       </div>
204: 
205:       <div class="container services__cards-wrap">
206:         <div class="services__scroll-track">
207:       <div class="services__grid" role="list">
208: 
209:         <!-- Service Card 1 -->
210:         <article class="service-card" role="listitem">
211:           <div class="service-card__icon" aria-hidden="true">
212:             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
213:               <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
214:             </svg>
215:           </div>
216:           <!-- PLACEHOLDER: Replace service name and description -->
217:           <h3 class="service-card__title">Carpentry</h3>
218:           <p class="service-card__desc">Custom woodwork, trim, framing, shelving, and cabinet installation done with precision.</p>
219:         </article>
220: 
221:         <!-- Service Card 2 -->
222:         <article class="service-card" role="listitem">
223:           <div class="service-card__icon" aria-hidden="true">
224:             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
225:               <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>
226:             </svg>
227:           </div>
228:           <h3 class="service-card__title">Drywall</h3>
229:           <p class="service-card__desc">Hanging, taping, mudding, and finishing — seamless walls ready for paint.</p>
230:         </article>
231: 
232:         <!-- Service Card 3 -->
233:         <article class="service-card" role="listitem">
234:           <div class="service-card__icon" aria-hidden="true">
235:             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
236:               <path d="M12 22V12m0 0C12 7 7 4 4 7c0 0 1 5 8 5zm0 0c0-5 5-8 8-5 0 0-1 5-8 5"/><path d="M4 7c0 0-2 8 8 15"/>
237:             </svg>
238:           </div>
239:           <h3 class="service-card__title">Painting</h3>
240:           <p class="service-card__desc">Interior and exterior painting with clean lines, proper prep, and lasting finish.</p>
241:         </article>
242: 
243:         <!-- Service Card 4 -->
244:         <article class="service-card" role="listitem">
245:           <div class="service-card__icon" aria-hidden="true">
246:             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
247:               <rect x="2" y="2" width="20" height="20" rx="1"/><line x1="2" y1="7" x2="22" y2="7"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="17" x2="22" y2="17"/>
248:             </svg>
249:           </div>
250:           <h3 class="service-card__title">Flooring</h3>
251:           <p class="service-card__desc">Hardwood, LVP, tile installation and subfloor repair — foundation you can feel.</p>
252:         </article>
253: 
254:         <!-- Service Card 5 -->
255:         <article class="service-card" role="listitem">
256:           <div class="service-card__icon" aria-hidden="true">
257:             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
258:               <path d="M12 2a7 7 0 00-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 00-7-7z"/><circle cx="12" cy="9" r="2.5"/>
259:             </svg>
260:           </div>
261:           <h3 class="service-card__title">Plumbing Repairs</h3>
262:           <p class="service-card__desc">Fixture installation, leak fixes, faucet and toilet replacement — no plumbing license needed for most handyman work.</p>
263:         </article>
264: 
265:         <!-- Service Card 6 -->
266:         <article class="service-card" role="listitem">
267:           <div class="service-card__icon" aria-hidden="true">
268:             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
269:               <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
270:             </svg>
271:           </div>
272:           <h3 class="service-card__title">General Repairs</h3>
273:           <p class="service-card__desc">Doors, windows, fences, decks, power washing — whatever needs fixing, we handle it.</p>
274:         </article>
275: 
276:       </div><!-- /services__grid -->
277:         </div><!-- /services__scroll-track -->
278:       </div><!-- /services__cards-wrap -->
279: 
280:     </div><!-- /services__pin-wrap -->
281:   </section>
282: 
283: 
284:   <!-- ═══════════════════════════════════════════
285:        RHETORIC SECTION — Confident craft statement
286:   ═══════════════════════════════════════════ -->
287:   <section class="rhetoric-section" aria-label="Our commitment">
288:     <div class="rhetoric-inner">
289:       <p class="rhetoric-line">We show up.</p>
290:       <p class="rhetoric-line">We do it right.</p>
291:       <p class="rhetoric-line">We leave your space better than we found it.</p>
292:     </div>
293:   </section>
294: 
295: 
296:   <!-- ═══════════════════════════════════════════
297:        HOW IT WORKS
298:   ═══════════════════════════════════════════ -->
299:   <section class="section process" id="process" aria-label="How it works">
300:     <div class="container">
301: 
302:       <header class="section__header reveal">
303:         <p class="section__eyebrow">Simple Process</p>
304:         <h2 class="section__title">How It Works</h2>
305:         <p class="section__sub">Getting your project done is easy. Three steps — that's it.</p>
306:       </header>
307: 
308:       <div class="process__steps">
309: 
310:         <div class="process-step process-step--1">
311:           <div class="process-step__number" aria-hidden="true">01</div>
312:           <div class="process-step__icon" aria-hidden="true">
313:             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
314:               <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.82 19.79 19.79 0 01.38 1.18 2 2 0 012.36 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.08 6.08l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
315:             </svg>
316:           </div>
317:           <h3 class="process-step__title">Call or Text</h3>
318:           <p class="process-step__desc">Reach out by phone or text to describe your project. Quick response — usually within a few hours.</p>
319:         </div>
320: 
321:         <div class="process-step__connector" aria-hidden="true"></div>
322: 
323:         <div class="process-step process-step--2">
324:           <div class="process-step__number" aria-hidden="true">02</div>
325:           <div class="process-step__icon" aria-hidden="true">
326:             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
327:               <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
328:             </svg>
329:           </div>
330:           <h3 class="process-step__title">Free Estimate</h3>
331:           <p class="process-step__desc">We come to you, assess the job, and give you a clear written estimate — no pressure, no hidden fees.</p>
332:         </div>
333: 
334:         <div class="process-step__connector" aria-hidden="true"></div>
335: 
336:         <div class="process-step process-step--3">
337:           <div class="process-step__number" aria-hidden="true">03</div>
338:           <div class="process-step__icon" aria-hidden="true">
339:             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
340:               <polyline points="20 6 9 17 4 12"/>
341:             </svg>
342:           </div>
343:           <h3 class="process-step__title">Work Done Right</h3>
344:           <p class="process-step__desc">We show up on time, do the work, and leave your space clean. You only pay when you're satisfied.</p>
345:         </div>
346: 
347:       </div><!-- /process__steps -->
348: 
349:     </div>
350:   </section>
351: 
352: 
353:   <!-- ═══════════════════════════════════════════
354:        PROJECT GALLERY
355:   ═══════════════════════════════════════════ -->
356:   <section class="section gallery" id="gallery" aria-label="Project gallery">
357:     <div class="container">
358: 
359:       <header class="section__header reveal">
360:         <p class="section__eyebrow">Our Work</p>
361:         <h2 class="section__title">Recent Projects</h2>
362:         <p class="section__sub">A sample of completed work across Springfield and surrounding areas.</p>
363:       </header>
364: 
365:       <div class="gallery__grid" role="list">
366: 
367:         <div class="gallery-card gallery-card--deck" role="listitem" aria-label="Deck construction project">
368:           <div class="gallery-card__overlay">
369:             <span class="gallery-card__label">Deck Build</span>
370:             <span class="gallery-card__location">Springfield, IL</span>
371:           </div>
372:         </div>
373: 
374:         <div class="gallery-card gallery-card--interior" role="listitem" aria-label="Interior painting project">
375:           <div class="gallery-card__overlay">
376:             <span class="gallery-card__label">Interior Paint</span>
377:             <span class="gallery-card__location">Chatham, IL</span>
378:           </div>
379:         </div>
380: 
381:         <div class="gallery-card gallery-card--flooring" role="listitem" aria-label="Hardwood flooring installation">
382:           <div class="gallery-card__overlay">
383:             <span class="gallery-card__label">Hardwood Flooring</span>
384:             <span class="gallery-card__location">Auburn, IL</span>
385:           </div>
386:         </div>
387: 
388:         <div class="gallery-card gallery-card--drywall" role="listitem" aria-label="Drywall finishing project">
389:           <div class="gallery-card__overlay">
390:             <span class="gallery-card__label">Drywall & Finish</span>
391:             <span class="gallery-card__location">Sherman, IL</span>
392:           </div>
393:         </div>
394: 
395:         <div class="gallery-card gallery-card--trim" role="listitem" aria-label="Custom trim carpentry">
396:           <div class="gallery-card__overlay">
397:             <span class="gallery-card__label">Custom Trim Work</span>
398:             <span class="gallery-card__location">Rochester, IL</span>
399:           </div>
400:         </div>
401: 
402:         <div class="gallery-card gallery-card--fence" role="listitem" aria-label="Fence installation">
403:           <div class="gallery-card__overlay">
404:             <span class="gallery-card__label">Fence Installation</span>
405:             <span class="gallery-card__location">Riverton, IL</span>
406:           </div>
407:         </div>
408: 
409:       </div><!-- /gallery__grid -->
410: 
411:     </div>
412:   </section>
413: 
414: 
415:   <!-- ═══════════════════════════════════════════
416:        STATS / WHY CHOOSE US
417:   ═══════════════════════════════════════════ -->
418:   <section class="section stats-section" id="about" aria-label="About us">
419:     <div class="container">
420: 
421:       <!-- About Narrative -->
422:       <div class="about-narrative reveal">
423:         <div class="about-narrative__text">
424:           <p class="section__eyebrow">About ProCraft</p>
425:           <h2 class="about-narrative__title">20 Years of Craft.<br><em>One Standard: Done Right.</em></h2>
426:           <p class="about-narrative__body">ProCraft Construction &amp; Handyman was founded on a simple belief: people deserve a contractor they can actually trust. One who shows up, tells the truth about the job, charges a fair price, and takes pride in the work long after the tools are packed up.</p>
427:           <p class="about-narrative__body">Owner Mike Caldwell has been working trades in central Illinois since 2004. Whether it's a single broken door hinge or a full basement remodel, every job gets the same level of care — because your home deserves it.</p>
428:           <div class="about-narrative__badges">
429:             <span class="about-badge">Licensed &amp; Insured</span>
430:             <span class="about-badge">Family Owned</span>
431:             <span class="about-badge">Serving Central IL Since 2004</span>
432:           </div>
433:         </div>
434:         <div class="about-narrative__visual" aria-hidden="true">
435:           <div class="about-stat-card reveal">
436:             <div class="about-stat-card__number">20<span>+</span></div>
437:             <div class="about-stat-card__label">Years of Craft</div>
438:           </div>
439:           <div class="about-stat-card about-stat-card--offset reveal">
440:             <div class="about-stat-card__number">500<span>+</span></div>
441:             <div class="about-stat-card__label">Homes Served</div>
442:           </div>
443:           <div class="about-stat-card about-stat-card--offset2 reveal">
444:             <div class="about-stat-card__number">5<span>★</span></div>
445:             <div class="about-stat-card__label">Google Rating</div>
446:           </div>
447:         </div>
448:       </div>
449: 
450:       <!-- Stats row -->
451:       <div class="stats__grid reveal">
452:         <!-- PLACEHOLDER: Replace numbers and labels with real data -->
453:         <div class="stat">
454:           <div class="stat__number">
455:             <span class="stat__num" data-target="10">0</span><span class="stat__suffix">+</span>
456:           </div>
457:           <span class="stat__label">Years of Experience</span>
458:         </div>
459:         <div class="stat">
460:           <div class="stat__number">
461:             <span class="stat__num" data-target="200">0</span><span class="stat__suffix">+</span>
462:           </div>
463:           <span class="stat__label">Projects Completed</span>
464:         </div>
465:         <div class="stat">
466:           <div class="stat__number">
467:             <span class="stat__num" data-target="100">0</span><span class="stat__suffix">%</span>
468:           </div>
469:           <span class="stat__label">Satisfaction Rate</span>
470:         </div>
471:       </div>
472: 
473:       <!-- Pillars -->
474:       <div class="pillars__grid">
475: 
476:         <div class="pillar reveal">
477:           <div class="pillar__icon" aria-hidden="true">
478:             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
479:               <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
480:             </svg>
481:           </div>
482:           <h3 class="pillar__title">Honest Pricing</h3>
483:           <p class="pillar__desc">No surprise fees. You get a clear estimate upfront — and that's what you pay.</p>
484:         </div>
485: 
486:         <div class="pillar reveal">
487:           <div class="pillar__icon" aria-hidden="true">
488:             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
489:               <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
490:             </svg>
491:           </div>
492:           <h3 class="pillar__title">Shows Up On Time</h3>
493:           <p class="pillar__desc">Your time matters. We schedule around you and actually show up when we say we will.</p>
494:         </div>
495: 
496:         <div class="pillar reveal">
497:           <div class="pillar__icon" aria-hidden="true">
498:             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
499:               <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
500:             </svg>
501:           </div>
502:           <h3 class="pillar__title">Quality Work</h3>
503:           <p class="pillar__desc">Done once, done right. Every job gets the same care whether it's a shelf or a full remodel.</p>
504:         </div>
505: 
506:       </div><!-- /pillars__grid -->
507: 
508:     </div>
509:   </section>
510: 
511: 
512:   <!-- ═══════════════════════════════════════════
513:        TESTIMONIALS
514:   ═══════════════════════════════════════════ -->
515:   <section class="section testimonials" id="testimonials" aria-label="Customer reviews">
516:     <div class="container">
517: 
518:       <header class="section__header reveal">
519:         <p class="section__eyebrow">Reviews</p>
520:         <h2 class="section__title">What Clients Say</h2>
521:       </header>
522: 
523:       <div class="testimonials__grid" role="list">
524: 
525:         <!-- PLACEHOLDER: Replace all testimonials with real customer reviews -->
526:         <blockquote class="testimonial reveal" role="listitem">
527:           <div class="testimonial__stars" aria-label="5 stars">★★★★★</div>
528:           <p class="testimonial__text">"Showed up the same day, fixed what three other guys couldn't figure out, and charged exactly what he quoted. Couldn't be happier."</p>
529:           <footer class="testimonial__author">
530:             <div class="testimonial__author-row">
531:               <div class="testimonial__avatar" aria-hidden="true">JM</div>
532:               <div>
533:                 <strong>J. Martinez</strong>
534:                 <span class="testimonial__job">Homeowner · Springfield, IL</span>
535:               </div>
536:             </div>
537:             <span class="testimonial__source">via Google</span>
538:           </footer>
539:         </blockquote>
540: 
541:         <blockquote class="testimonial reveal" role="listitem">
542:           <div class="testimonial__stars" aria-label="5 stars">★★★★★</div>
543:           <p class="testimonial__text">"He built out our entire deck and did the interior trim work. The quality is incredible — I've gotten more compliments on my house since then than ever."</p>
544:           <footer class="testimonial__author">
545:             <div class="testimonial__author-row">
546:               <div class="testimonial__avatar" aria-hidden="true">RT</div>
547:               <div>
548:                 <strong>R. Thompson</strong>
549:                 <span class="testimonial__job">Homeowner · Chatham, IL</span>
550:               </div>
551:             </div>
552:             <span class="testimonial__source">via Google</span>
553:           </footer>
554:         </blockquote>
555: 
556:         <blockquote class="testimonial reveal" role="listitem">
557:           <div class="testimonial__stars" aria-label="5 stars">★★★★★</div>
558:           <p class="testimonial__text">"Finally found someone I can trust. He's done work on three of my rental properties — always professional, always clean, always done right."</p>
559:           <footer class="testimonial__author">
560:             <div class="testimonial__author-row">
561:               <div class="testimonial__avatar" aria-hidden="true">DP</div>
562:               <div>
563:                 <strong>D. Park</strong>
564:                 <span class="testimonial__job">Property Owner · Auburn, IL</span>
565:               </div>
566:             </div>
567:             <span class="testimonial__source">via Google</span>
568:           </footer>
569:         </blockquote>
570: 
571:       </div>
572: 
573:     </div>
574:   </section>
575: 
576: 
577:   <!-- ═══════════════════════════════════════════
578:        TRUST BADGES — CSS marquee ticker
579:   ═══════════════════════════════════════════ -->
580:   <section class="trust-section" aria-label="Trust and credentials">
581:     <div class="marquee-track" aria-label="Credentials and trust signals">
582:       <!-- Items duplicated for seamless infinite loop -->
583:       <div class="marquee-inner" aria-hidden="true">
584: 
585:         <span class="marquee-badge">
586:           <svg class="marquee-badge__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
587:           Licensed &amp; Insured
588:         </span>
589:         <span class="marquee-sep" aria-hidden="true">✦</span>
590: 
591:         <span class="marquee-badge">
592:           <svg class="marquee-badge__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
593:           5-Star Google Reviews
594:         </span>
595:         <span class="marquee-sep" aria-hidden="true">✦</span>
596: 
597:         <span class="marquee-badge">
598:           <svg class="marquee-badge__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
599:           Same-Day Response
600:         </span>
601:         <span class="marquee-sep" aria-hidden="true">✦</span>
602: 
603:         <span class="marquee-badge">
604:           <svg class="marquee-badge__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
605:           Honest, Flat Pricing
606:         </span>
607:         <span class="marquee-sep" aria-hidden="true">✦</span>
608: 
609:         <span class="marquee-badge">
610:           <svg class="marquee-badge__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12l3 3 5-5"/></svg>
611:           Satisfaction Guaranteed
612:         </span>
613:         <span class="marquee-sep" aria-hidden="true">✦</span>
614: 
615:         <span class="marquee-badge">
616:           <svg class="marquee-badge__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
617:           Serving Central IL Since 2004
618:         </span>
619:         <span class="marquee-sep" aria-hidden="true">✦</span>
620: 
621:         <!-- Duplicate set for seamless loop -->
622:         <span class="marquee-badge">
623:           <svg class="marquee-badge__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
624:           Licensed &amp; Insured
625:         </span>
626:         <span class="marquee-sep" aria-hidden="true">✦</span>
627: 
628:         <span class="marquee-badge">
629:           <svg class="marquee-badge__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
630:           5-Star Google Reviews
631:         </span>
632:         <span class="marquee-sep" aria-hidden="true">✦</span>
633: 
634:         <span class="marquee-badge">
635:           <svg class="marquee-badge__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
636:           Same-Day Response
637:         </span>
638:         <span class="marquee-sep" aria-hidden="true">✦</span>
639: 
640:         <span class="marquee-badge">
641:           <svg class="marquee-badge__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
642:           Honest, Flat Pricing
643:         </span>
644:         <span class="marquee-sep" aria-hidden="true">✦</span>
645: 
646:         <span class="marquee-badge">
647:           <svg class="marquee-badge__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12l3 3 5-5"/></svg>
648:           Satisfaction Guaranteed
649:         </span>
650:         <span class="marquee-sep" aria-hidden="true">✦</span>
651: 
652:         <span class="marquee-badge">
653:           <svg class="marquee-badge__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
654:           Serving Central IL Since 2004
655:         </span>
656:         <span class="marquee-sep" aria-hidden="true">✦</span>
657: 
658:       </div>
659:     </div>
660: 
661:     <!-- Accessible static fallback (screen readers) -->
662:     <ul class="marquee-a11y-list" aria-label="Trust signals">
663:       <li>Licensed &amp; Insured</li>
664:       <li>5-Star Google Reviews</li>
665:       <li>Same-Day Response</li>
666:       <li>Honest, Flat Pricing</li>
667:       <li>Satisfaction Guaranteed</li>
668:       <li>Serving Central IL Since 2004</li>
669:     </ul>
670:   </section>
671: 
672: 
673:   <!-- ═══════════════════════════════════════════
674:        CTA BAND — SERVICE AREA + CALL TO ACTION
675:   ═══════════════════════════════════════════ -->
676:   <section class="section cta-band" aria-label="Service area">
677:     <div class="cta-band__bg" aria-hidden="true"></div>
678:     <div class="container cta-band__inner reveal">
679: 
680:       <p class="cta-band__eyebrow">Service Area</p>
681:       <h2 class="cta-band__title">Serving Springfield &amp; Surrounding Areas</h2>
682:       <p class="cta-band__sub">Ready to get started? Call for a free estimate — no pressure, no obligation.</p>
683: 
684:       <div class="cta-band__areas" aria-label="Service areas">
685:         <span class="area-pill">Springfield</span>
686:         <span class="area-pill">Chatham</span>
687:         <span class="area-pill">Auburn</span>
688:         <span class="area-pill">Sherman</span>
689:         <span class="area-pill">Rochester</span>
690:         <span class="area-pill">Riverton</span>
691:         <span class="area-pill">Williamsville</span>
692:         <span class="area-pill">Pawnee</span>
693:         <span class="area-pill">Virden</span>
694:       </div>
695: 
696:       <a class="btn btn--primary btn--xl" href="tel:+12175550182">
697:         <svg class="btn__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
698:           <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
699:         </svg>
700:         (217) 555-0182 — Free Estimate
701:       </a>
702: 
703:       <p class="cta-band__note">We typically respond within a few hours.</p>
704: 
705:     </div>
706:   </section>
707: 
708: 
709:   <!-- ═══════════════════════════════════════════
710:        CONTACT FORM
711:   ═══════════════════════════════════════════ -->
712:   <section class="section contact-section" id="contact" aria-label="Contact form">
713:     <div class="container">
714: 
715:       <div class="contact-layout">
716: 
717:         <div class="contact-info reveal">
718:           <p class="section__eyebrow">Get In Touch</p>
719:           <h2 class="contact-info__title">Request a<br><em>Free Estimate</em></h2>
720:           <p class="contact-info__body">Tell us about your project and we'll get back to you quickly. No commitment required — just an honest conversation about what you need.</p>
721: 
722:           <div class="contact-details">
723:             <a href="tel:+12175550182" class="contact-detail">
724:               <span class="contact-detail__icon" aria-hidden="true">
725:                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
726:                   <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
727:                 </svg>
728:               </span>
729:               <span>(217) 555-0182</span>
730:             </a>
731:             <div class="contact-detail">
732:               <span class="contact-detail__icon" aria-hidden="true">
733:                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
734:                   <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
735:                 </svg>
736:               </span>
737:               <span>Springfield, IL &amp; Surrounding Areas</span>
738:             </div>
739:             <div class="contact-detail">
740:               <span class="contact-detail__icon" aria-hidden="true">
741:                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
742:                   <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
743:                 </svg>
744:               </span>
745:               <span>Mon–Fri 7am–6pm · Sat by appointment</span>
746:             </div>
747:           </div>
748:         </div>
749: 
750:         <form class="contact-form reveal" aria-label="Contact form" novalidate>
751:           <div class="form-row">
752:             <div class="form-group">
753:               <label class="form-label" for="contactName">Your Name</label>
754:               <input class="form-input" type="text" id="contactName" name="name" placeholder="John Smith" autocomplete="name" required>
755:             </div>
756:             <div class="form-group">
757:               <label class="form-label" for="contactPhone">Phone Number</label>
758:               <input class="form-input" type="tel" id="contactPhone" name="phone" placeholder="(217) 555-0000" autocomplete="tel">
759:             </div>
760:           </div>
761:           <div class="form-group">
762:             <label class="form-label" for="contactEmail">Email Address</label>
763:             <input class="form-input" type="email" id="contactEmail" name="email" placeholder="john@email.com" autocomplete="email">
764:           </div>
765:           <div class="form-group">
766:             <label class="form-label" for="contactService">Type of Service</label>
767:             <select class="form-input form-select" id="contactService" name="service" required>
768:               <option value="" disabled selected>Select a service...</option>
769:               <option value="carpentry">Carpentry</option>
770:               <option value="drywall">Drywall</option>
771:               <option value="painting">Painting</option>
772:               <option value="flooring">Flooring</option>
773:               <option value="plumbing">Plumbing Repairs</option>
774:               <option value="general">General Repairs</option>
775:               <option value="other">Other / Not Sure</option>
776:             </select>
777:           </div>
778:           <div class="form-group">
779:             <label class="form-label" for="contactMessage">Project Description</label>
780:             <textarea class="form-input form-textarea" id="contactMessage" name="message" placeholder="Describe your project — size, location, timeline, anything helpful..." rows="4" data-lenis-prevent required></textarea>
781:           </div>
782:           <button class="btn btn--primary btn--lg form-submit" type="submit">
783:             <svg class="btn__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
784:               <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
785:             </svg>
786:             Send Message
787:           </button>
788:           <p class="form-note">We'll get back to you within a few hours during business hours.</p>
789:           <p class="form-status" id="formStatus" role="status" aria-live="polite"></p>
790:           <div class="form-followup" id="formFollowup" hidden>
791:             <a class="btn btn--ghost btn--md" id="formSmsLink" href="sms:+12175550182">Text Request</a>
792:             <a class="btn btn--primary btn--md" id="formCallLink" href="tel:+12175550182">Call Instead</a>
793:           </div>
794:         </form>
795: 
796:       </div>
797: 
798:     </div>
799:   </section>
800: 
801: 
802:   <!-- ═══════════════════════════════════════════
803:        FOOTER
804:   ═══════════════════════════════════════════ -->
805:   <footer class="footer" role="contentinfo">
806:     <div class="container">
807: 
808:       <div class="footer__grid">
809: 
810:         <!-- Brand col -->
811:         <div class="footer__col footer__col--brand">
812:           <div class="footer__brand">
813:             <span class="footer__logo-mark" aria-hidden="true">✦</span>
814:             <span class="footer__name">ProCraft</span>
815:           </div>
816:           <p class="footer__tagline">General Construction &amp; Handyman<br>Springfield, IL</p>
817:           <a class="footer__phone" href="tel:+12175550182">(217) 555-0182</a>
818:           <div class="footer__social" aria-label="Social media links">
819:             <!-- Facebook -->
820:             <a href="#" class="footer__social-link" aria-label="Facebook" rel="noopener">
821:               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
822:             </a>
823:             <!-- Instagram -->
824:             <a href="#" class="footer__social-link" aria-label="Instagram" rel="noopener">
825:               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
826:             </a>
827:             <!-- Nextdoor -->
828:             <a href="#" class="footer__social-link" aria-label="Nextdoor" rel="noopener">
829:               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
830:             </a>
831:           </div>
832:         </div>
833: 
834:         <!-- Services col -->
835:         <div class="footer__col">
836:           <h3 class="footer__col-title">Services</h3>
837:           <ul class="footer__list">
838:             <li><a href="#services" class="footer__link">Carpentry</a></li>
839:             <li><a href="#services" class="footer__link">Drywall</a></li>
840:             <li><a href="#services" class="footer__link">Painting</a></li>
841:             <li><a href="#services" class="footer__link">Flooring</a></li>
842:             <li><a href="#services" class="footer__link">Plumbing Repairs</a></li>
843:             <li><a href="#services" class="footer__link">General Repairs</a></li>
844:           </ul>
845:         </div>
846: 
847:         <!-- Service Areas col -->
848:         <div class="footer__col">
849:           <h3 class="footer__col-title">Service Areas</h3>
850:           <ul class="footer__list">
851:             <li><span class="footer__text">Springfield, IL</span></li>
852:             <li><span class="footer__text">Chatham, IL</span></li>
853:             <li><span class="footer__text">Auburn, IL</span></li>
854:             <li><span class="footer__text">Sherman, IL</span></li>
855:             <li><span class="footer__text">Rochester, IL</span></li>
856:             <li><span class="footer__text">Riverton, IL</span></li>
857:           </ul>
858:         </div>
859: 
860:         <!-- Company col -->
861:         <div class="footer__col">
862:           <h3 class="footer__col-title">Company</h3>
863:           <ul class="footer__list">
864:             <li><a href="#about" class="footer__link">About Us</a></li>
865:             <li><a href="#process" class="footer__link">How It Works</a></li>
866:             <li><a href="#gallery" class="footer__link">Our Work</a></li>
867:             <li><a href="#testimonials" class="footer__link">Reviews</a></li>
868:             <li><a href="#contact" class="footer__link">Contact</a></li>
869:           </ul>
870:         </div>
871: 
872:       </div><!-- /footer__grid -->
873: 
874:       <div class="footer__bottom">
875:         <p class="footer__copy">
876:           © <span id="currentYear"></span> ProCraft Construction &amp; Handyman. All rights reserved.
877:         </p>
878:         <p class="footer__copy footer__copy--right">
879:           Serving Springfield, IL &amp; Surrounding Areas
880:         </p>
881:       </div>
882: 
883:     </div>
884:   </footer>
885: 
886: 
887:   <!-- ═══════════════════════════════════════════
888:        STRUCTURED DATA — JSON-LD
889:   ═══════════════════════════════════════════ -->
890:   <!-- PLACEHOLDER: Replace ALL bracketed values with real business data -->
891:   <script type="application/ld+json">
892:   {
893:     "@context": "https://schema.org",
894:     "@type": "LocalBusiness",
895:     "name": "ProCraft Construction & Handyman",
896:     "description": "General construction and handyman services in Springfield, Illinois. Carpentry, drywall, painting, flooring, plumbing repairs, and general repairs.",
897:     "telephone": "+1-217-555-0182",
898:     "address": {
899:       "@type": "PostalAddress",
900:       "addressLocality": "Springfield",
901:       "addressRegion": "IL",
902:       "addressCountry": "US"
903:     },
904:     "areaServed": [
905:       { "@type": "City", "name": "Springfield" },
906:       { "@type": "City", "name": "Chatham" },
907:       { "@type": "City", "name": "Sherman" },
908:       { "@type": "City", "name": "Rochester" }
909:     ],
910:     "priceRange": "$$",
911:     "openingHours": "Mo-Fr 07:00-18:00",
912:     "paymentAccepted": "Cash, Check, Venmo, Zelle",
913:     "hasOfferCatalog": {
914:       "@type": "OfferCatalog",
915:       "name": "Handyman Services",
916:       "itemListElement": [
917:         { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Carpentry" } },
918:         { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Drywall" } },
919:         { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Painting" } },
920:         { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Flooring" } },
921:         { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Plumbing Repairs" } },
922:         { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "General Repairs" } }
923:       ]
924:     }
925:   }
926:   </script>
927: 
928:   <!-- ═══════════════════════════════════════════
929:        SCRIPTS
930:   ═══════════════════════════════════════════ -->
931:   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
932:   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
933:   <script src="https://unpkg.com/lenis@1.1.14/dist/lenis.min.js"></script>
934:   <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
935:   <!-- EffectComposer post-processing chain (must match r134 version) -->
936:   <script src="https://unpkg.com/three@0.134.0/examples/js/postprocessing/EffectComposer.js"></script>
937:   <script src="https://unpkg.com/three@0.134.0/examples/js/postprocessing/RenderPass.js"></script>
938:   <script src="https://unpkg.com/three@0.134.0/examples/js/postprocessing/ShaderPass.js"></script>
939:   <script src="https://unpkg.com/three@0.134.0/examples/js/postprocessing/UnrealBloomPass.js"></script>
940:   <script src="https://unpkg.com/three@0.134.0/examples/js/shaders/CopyShader.js"></script>
941:   <script src="https://unpkg.com/three@0.134.0/examples/js/shaders/LuminosityHighPassShader.js"></script>
942:   <script src="https://unpkg.com/three@0.134.0/examples/js/loaders/GLTFLoader.js"></script>
943:   <script src="three-scene.js"></script>
944:   <script src="main.js"></script>
945: 
946: </body>
947: </html>

(End of file - total 947 lines)
</content>
```

**Tool: skill**

**Input:**
```json
{
  "name": "nextjs-3d-pipeline"
}
```

**Output:**
```
<skill_content name="nextjs-3d-pipeline">
# Skill: nextjs-3d-pipeline

# Next.js 3D Pipeline

Complete end-to-end framework for designing, building, and deploying production-ready interactive 3D web experiences.

## Overview

Award-winning 3D web experiences follow a predictable pipeline: vision → assets → scene → materials → lighting → animation → camera → interaction → optimization → deployment. This skill provides exhaustive, actionable guidance for each phase, enabling consistent production of work comparable to studios like Mantis, Dogstudio, Active Theory, and lhbzr.com.

## When to Use

- Building immersive hero sections with 3D elements
- Creating scroll-driven narrative experiences
- Developing interactive product showcases
- Implementing particle systems and visual effects
- Crafting custom shader-based visual experiences
- Optimizing 3D scenes for 60fps performance

**Reference Sites:** mantis.works, dogstudio.co, activetheory.net, henryheffernan.com, dragonfly.xyz, lhbzr.com, sr-seventy.one, tplh.net, nohero.studio, mont-fort.com, adaline.ai

## Quick Reference

| Phase | Key Outputs | Tools |
|-------|------------|-------|
| Vision | Mood board, color system, motion language | Figma, Pinterest, Dribbble |
| Assets | 3D models, textures, HDRI | Meshy, Sketchfab, Poly Haven |
| Scene | Hierarchy, LOD, environment | Three.js, R3F |
| Materials | PBR, custom shaders | GLSL, Substance |
| Lighting | 3-point setup, environment maps | Drei, post-processing |
| Animation | ScrollTrigger, spring physics | GSAP, cannon-es |
| Camera | Cinematic paths, DOF | CatmullRomCurve3 |
| Interaction | Raycasting, hover states | useFrame, events |
| Performance | <60fps, <100 draw calls | InstancedMesh, KTX2 |
| Deployment | Next.js, WebGL2 | Vercel, CDN |

## Phase 1: Artistic Vision & Direction

### Creative Concept Definition

**Mood Board Process:**
1. Collect 15-20 reference images (lighting, composition, color, motion)
2. Extract color palette with Adobe Color or Coolors
3. Define motion language (easing curves, timing, choreography)
4. Document interaction patterns (hover, scroll, click)

**Reference Site Techniques:**

| Site | Technique | Implementation |
|------|-----------|----------------|
| Dogstudio | Cinematic depth, typographic integration | Parallax layers, text extrusion |
| lhbzr.com | Abstract generative aesthetics | Noise-based shaders, procedural geometry |
| Mantis | Particle systems, scroll choreography | Instanced particles, ScrollTrigger |
| Adaline | Glass morphism, subtle depth | Transmission materials, blur effects |

### Color Theory Application

**HSLuv Color Space (perceptually uniform):**
```javascript
// Primary palette
const colors = {
  primary: { h: 220, s: 90, l: 60 },
  secondary: { h: 280, s: 80, l: 65 },
  accent: { h: 45, s: 100, l: 60 },
  background: { h: 220, s: 20, l: 10 },
  surface: { h: 220, s: 15, l: 15 },
}

const primaryColor = new THREE.Color(`hsl(${colors.primary.h}, ${colors.primary.s}%, ${colors.primary.l}%)`);
```

### Motion Language Definition

**Easing Curve Selection:**
- `ease-out`: UI elements (snappy, responsive)
- `ease-in-out`: Transitions (balanced, smooth)
- `elastic.out`: Playful elements (bounce, energy)
- `expo.out`: Dramatic reveals (fast start, slow end)
- `none`: Scroll-linked (linear progression)

**Timing Standards:**
- Micro-interactions: 150-300ms
- Section transitions: 500-800ms
- Ambient loops: 3-10s
- Scroll scrub: 1 (1:1 with scroll)

## Phase 2: Asset Sourcing, Generation & Acquisition

### AI-Generated 3D Models

**Meshy.ai Prompting Strategy:**
```
Subject: [Abstract geometric sculpture / Organic form / Mechanical part]
Style: [Minimalist / Futuristic / Organic / Industrial]
Material: [Chrome / Matte plastic / Glass / Fabric]
Lighting: [Studio lighting / Dramatic rim / Soft ambient]
Color: [Specific hex codes or color descriptions]
Quality: High detail, clean topology, game-ready
```

**Rodin/CSM.ai Workflow:**
1. Upload reference image or sketch
2. Select style: Photorealistic / Artistic / Low-poly
3. Generate 4 variants
4. Download GLTF with textures
5. Validate in Blender: topology, UVs, scale

### Procedural Geometry Generation

**Three.js Custom Buffer Geometry:**
```typescript
function createProceduralLandscape(width: number, depth: number, segments: number) {
  const geometry = new THREE.PlaneGeometry(width, depth, segments, segments);
  const positions = geometry.attributes.position.array as Float32Array;
  
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const z = positions[i + 2];
    const y = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 2;
    positions[i + 1] = y;
  }
  
  geometry.computeVertexNormals();
  return geometry;
}
```

### Asset Library Sourcing

**Sketchfab API Integration:**
```typescript
async function searchSketchfab(query: string) {
  const params = new URLSearchParams({
    q: query,
    downloadable: 'true',
    sort_by: 'like_count',
  });
  
  const response = await fetch(`https://api.sketchfab.com/v3/search?${params}`);
  const data = await response.json();
  return data.results;
}
```

**Recommended Libraries:**
| Library | Best For | Licensing |
|---------|----------|-----------|
| Poly Pizza | Low-poly characters/objects | CC0 |
| Quixel Megascans | Photorealistic PBR | Free with Unreal |
| Poly Haven | HDRI environments | CC0 |
| KitBash3D | Architectural scenes | Commercial |
| TurboSquid | High-quality models | Varies |

### Texture Generation

**Stable Diffusion with ControlNet:**
```
Prompt: Seamless PBR texture, [material type], [surface characteristics], 
        high detail, 4K, tileable, photorealistic

ControlNet: Depth map from 3D mesh
            → Generate texture matching geometry

Output: Albedo, Normal, Roughness, Metallic, AO maps
```

## Phase 3: Scene Architecture & Environment Construction

### Scene Graph Hierarchy

```
Scene
├── Environment
│   ├── Fog
│   ├── Background (HDRI/Color)
│   └── Ground/Platform
├── Lighting
│   ├── Ambient
│   ├── Directional (Key)
│   ├── Spot (Rim)
│   └── Point (Fill)
├── Objects
│   ├── Hero Object (LOD 0)
│   ├── Secondary Objects (LOD 1)
│   └── Background Elements (LOD 2)
├── Particles
│   ├── Ambient Dust
│   └── Interactive Elements
└── Post-Processing
    ├── Bloom
    ├── SSAO
    └── DOF
```

### LOD Strategy

```typescript
function LODMesh({ distance }: { distance: number }) {
  const { scene: high } = useGLTF('/models/hero-high.glb');
  const { scene: med } = useGLTF('/models/hero-med.glb');
  const { scene: low } = useGLTF('/models/hero-low.glb');
  
  const { camera } = useThree();
  const [detail, setDetail] = useState(high);
  
  useFrame(() => {
    const dist = camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
    if (dist < 5) setDetail(high);
    else if (dist < 15) setDetail(med);
    else setDetail(low);
  });
  
  return <primitive object={detail} />;
}
```

## Phase 4: Materials, Shaders & Visual Fidelity

### PBR Material Setup

```typescript
function PBRMesh() {
  const textures = useTexture({
    map: '/textures/albedo.jpg',
    normalMap: '/textures/normal.jpg',
    roughnessMap: '/textures/roughness.jpg',
    metalnessMap: '/textures/metallic.jpg',
    aoMap: '/textures/ao.jpg',
  });
  
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial {...textures} />
    </mesh>
  );
}
```

### Custom GLSL Shaders

**Iridescent Material:**
```typescript
const IridescentMaterial = shaderMaterial(
  { uTime: 0, uColor: new THREE.Color('#6366f1') },
  // Vertex
  `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  // Fragment
  `
  uniform float uTime;
  uniform vec3 uColor;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vec3 viewDir = normalize(-vPosition);
    vec3 normal = normalize(vNormal);
    float fresnel = pow(1.0 - dot(viewDir, normal), 3.0);
    vec3 iridescence = vec3(
      sin(fresnel * 10.0 + uTime) * 0.5 + 0.5,
      sin(fresnel * 10.0 + uTime + 2.09) * 0.5 + 0.5,
      sin(fresnel * 10.0 + uTime + 4.18) * 0.5 + 0.5
    );
    gl_FragColor = vec4(mix(uColor, iridescence, fresnel * 0.8), 1.0);
  }
  `
);
```

## Phase 5: Lighting & Rendering

### Three-Point Lighting Setup

```typescript
function StudioLighting() {
  return (
    <>
      <directionalLight
        position={[5, 5, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      />
      <directionalLight
        position={[-5, 3, -5]}
        intensity={0.5}
        color='#e0f7ff'
      />
      <spotLight
        position={[0, 5, -5]}
        intensity={1}
        angle={Math.PI / 4}
        penumbra={0.5}
      />
      <ambientLight intensity={0.3} />
      <Environment preset='city' />
    </>
  );
}
```

### Post-Processing Pipeline

```typescript
function PostProcessing() {
  return (
    <EffectComposer multisampling={0}>
      <SSAO
        blendFunction={BlendFunction.MULTIPLY}
        samples={30}
        radius={20}
        intensity={1.5}
      />
      <Bloom
        luminanceThreshold={0.9}
        luminanceSmoothing={0.025}
        intensity={1.5}
      />
      <DepthOfField
        focusDistance={0}
        focalLength={0.02}
        bokehScale={2}
      />
      <Vignette offset={0.1} darkness={1.1} />
    </EffectComposer>
  );
}
```

## Phase 6: Animation, Physics & Simulation

### GSAP ScrollTrigger Camera Path

```typescript
function ScrollCameraAnimation() {
  const { camera } = useThree();
  
  useEffect(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#scene-container',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        pin: true,
      }
    });
    
    tl.to(camera.position, { x: 0, y: 2, z: 5, duration: 0.2 })
      .to(camera.position, { x: 5, y: 0, z: 0, duration: 0.3 })
      .to(camera.position, { x: 0, y: -2, z: 5, duration: 0.3 })
      .to(camera.position, { x: 0, y: 0, z: 10, duration: 0.2 });
    
    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, [camera]);
  
  return null;
}
```

### Physics with Cannon-es

```typescript
import { Physics, useBox, usePlane } from '@react-three/cannon';

function PhysicsScene() {
  return (
    <Physics gravity={[0, -9.81, 0]}>
      <Ground />
      <FallingBoxes />
    </Physics>
  );
}

function Ground() {
  const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0] }));
  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color='#333' />
    </mesh>
  );
}
```

## Phase 7: Camera Design & Cinematic Language

### CatmullRomCurve3 Path Animation

```typescript
const curve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 10),
  new THREE.Vector3(5, 2, 5),
  new THREE.Vector3(0, 5, 0),
  new THREE.Vector3(-5, 2, 5),
  new THREE.Vector3(0, 0, 10),
]);

function CameraOnPath() {
  const { camera } = useThree();
  const progress = useRef(0);
  
  useFrame((state, delta) => {
    progress.current += delta * 0.1;
    if (progress.current > 1) progress.current = 0;
    
    const point = curve.getPoint(progress.current);
    camera.position.copy(point);
    camera.lookAt(0, 0, 0);
  });
  
  return null;
}
```

### Depth of Field Configuration

```typescript
<DepthOfField
  focusDistance={0.02}
  focalLength={0.05}
  bokehScale={3}
  height={480}
/>
```

## Phase 8: Interaction, Reactivity & UX

### Raycasting & Object Picking

```typescript
function InteractiveMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      const targetScale = hovered ? 1.1 : 1;
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        delta * 5
      );
    }
  });
  
  return (
    <mesh
      ref={meshRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
    </mesh>
  );
}
```

### Scroll Hijacking with Lenis

```typescript
import Lenis from '@studio-freight/lenis';

function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);
  
  return null;
}
```

## Phase 9: Performance Optimization & Delivery

### InstancedMesh for Particles

```typescript
function ParticleField({ count = 1000 }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  useEffect(() => {
    if (!meshRef.current) return;
    
    for (let i = 0; i < count; i++) {
      dummy.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [count, dummy]);
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.02, 8, 8]} />
      <meshBasicMaterial color='white' transparent opacity={0.6} />
    </instancedMesh>
  );
}
```

### Performance Budgets

| Metric | Target Desktop | Target Mobile |
|--------|---------------|---------------|
| Frame Rate | 60fps | 30fps |
| Draw Calls | < 100 | < 50 |
| Vertices | < 500K | < 100K |
| Texture Memory | < 128MB | < 64MB |
| Load Time | < 3s | < 5s |

## Phase 10: Technology Stack & Deployment

### Next.js Integration

```typescript
// app/page.tsx
import dynamic from 'next/dynamic';

const Scene3D = dynamic(() => import('@/components/Scene3D'), {
  ssr: false,
  loading: () => <div className='h-screen bg-slate-900 animate-pulse' />,
});

export default function Home() {
  return (
    <main>
      <Scene3D />
    </main>
  );
}
```

### WebGL2 Fallback

```typescript
function CanvasWithFallback() {
  const [webgl2, setWebgl2] = useState(true);
  
  useEffect(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    setWebgl2(!!gl);
  }, []);
  
  if (!webgl2) {
    return <div className='fallback-2d'>Experience requires WebGL2</div>;
  }
  
  return <Canvas>{/* 3D scene */}</Canvas>;
}
```

## Phase 11: Mobile Optimization & Performance

### Device Quality Detection

Automatically detect device capabilities and adjust quality:

```typescript
import { useDeviceQuality } from '@/hooks/useDeviceQuality';

function AdaptiveScene() {
  const { capabilities, settings, isReady } = useDeviceQuality();
  
  if (!isReady) return <Loading />;
  
  return (
    <Canvas
      shadows={settings.enableShadows}
      gl={{
        antialias: capabilities.tier !== 'low',
        powerPreference: 'high-performance',
      }}
      dpr={capabilities.isMobile ? 1 : [1, 2]}
    >
      {/* Scene content */}
    </Canvas>
  );
}
```

### Mobile-Specific Patterns

**Reduced Motion:**
```typescript
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

useFrame((state, delta) => {
  if (prefersReducedMotion) return;
  // Animation logic
});
```

**Touch Interactions:**
```typescript
function TouchFriendlyControls() {
  const { isTouch } = useDeviceQuality().capabilities;
  
  return (
    <OrbitControls
      enableZoom={!isTouch}
      enablePan={false}
      rotateSpeed={isTouch ? 0.5 : 1}
    />
  );
}
```

**Instanced Mesh for Performance:**
```typescript
function MobileParticles({ count = 1000 }) {
  const { settings } = useDeviceQuality();
  const actualCount = settings.particleCount;
  
  return <ParticleField count={actualCount} />;
}
```

### Quality Tiers

| Tier | Device Type | Target | Effects |
|------|-------------|--------|---------|
| **High** | Desktop, High-end mobile | 60fps | Bloom, SSAO, DOF, Shadows |
| **Medium** | Mid-range devices | 60fps | Bloom, Shadows |
| **Low** | Mobile, Low-end | 30fps | Basic lighting only |

## React Three Fiber v9 Compatibility

### React 19 Support

R3F v9 adds React 19 support with concurrent features:

```typescript
// Works with React 19 Suspense boundaries
import { Suspense } from 'react';

<Canvas>
  <Suspense fallback={<Loading />}>
    <Model />
  </Suspense>
</Canvas>
```

### New Hooks

```typescript
// useLoader is now async-friendly
import { useLoader } from '@react-three/fiber';

function Model() {
  const gltf = useLoader(GLTFLoader, '/model.glb');
  return <primitive object={gltf.scene} />;
}
```

### Improved TypeScript

```typescript
// Better type inference
import { ThreeElements } from '@react-three/fiber';

declare module '@react-three/fiber' {
  interface ThreeElements {
    customShaderMaterial: ThreeElements['meshStandardMaterial'];
  }
}
```

## React Spring Integration

Alternative to GSAP for physics-based animations:

```bash
npm install @react-spring/three
```

```typescript
import { useSpring, animated } from '@react-spring/three';

function SpringAnimation() {
  const { scale, rotation } = useSpring({
    scale: [1, 1, 1],
    rotation: [0, 0, 0],
    config: { mass: 1, tension: 170, friction: 26 },
  });
  
  return (
    <animated.mesh scale={scale} rotation={rotation}>
      <boxGeometry />
      <meshStandardMaterial />
    </animated.mesh>
  );
}
```

## Spline Integration

Import Spline scenes for no-code 3D design:

```bash
npm install @splinetool/react-spline
```

```typescript
import Spline from '@splinetool/react-spline';

function SplineScene() {
  return (
    <Spline
      scene="https://prod.spline.design/your-scene-url"
      onLoad={() => console.log('Loaded')}
    />
  );
}
```

## Resources

- **Three.js Docs:** https://threejs.org/docs/
- **React Three Fiber:** https://docs.pmnd.rs/react-three-fiber/
- **Drei Helpers:** https://github.com/pmndrs/drei
- **GSAP:** https://greensock.com/gsap/
- **Post Processing:** https://github.com/pmndrs/react-postprocessing
- **React Spring:** https://react-spring.dev/
- **Spline:** https://spline.design/

## Version

**Skill Version:** 1.0.0
**Last Updated:** 2026-03-07
**Next.js:** 14+
**React Three Fiber:** 8+ (v9 supported)
**Three.js:** r160+

Base directory for this skill: file:///C:/Users/camer/.claude/skills/nextjs-3d-pipeline
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>C:\Users\camer\.claude\skills\nextjs-3d-pipeline\COMPONENTS.md</file>
<file>C:\Users\camer\.claude\skills\nextjs-3d-pipeline\GLOBAL-ACCESS.md</file>
<file>C:\Users\camer\.claude\skills\nextjs-3d-pipeline\SHADERS.md</file>
<file>C:\Users\camer\.claude\skills\nextjs-3d-pipeline\templates\DogstudioStyle.tsx</file>
<file>C:\Users\camer\.claude\skills\nextjs-3d-pipeline\ASSETS.md</file>
<file>C:\Users\camer\.claude\skills\nextjs-3d-pipeline\IMPLEMENTATION-SUMMARY.md</file>
<file>C:\Users\camer\.claude\skills\nextjs-3d-pipeline\README.md</file>
<file>C:\Users\camer\.claude\skills\nextjs-3d-pipeline\templates\LhbzrStyle.tsx</file>
<file>C:\Users\camer\.claude\skills\nextjs-3d-pipeline\templates\MantisStyle.tsx</file>
<file>C:\Users\camer\.claude\skills\nextjs-3d-pipeline\hooks\useScrollProgress.ts</file>
</skill_files>
</skill_content>
```

---

## Assistant (Plan · moonshotai/kimi-k2.5 · 10.7s)

_Thinking:_

  Now I have a comprehensive view of the project. Let me continue reading the three-scene.js to see the rest of the animation and rendering loop, then

**Tool: read**

**Input:**
```json
{
  "filePath": "C:\\Dev\\handyman\\three-scene.js",
  "offset": 2168,
  "limit": 1000
}
```

**Output:**
```
<path>C:\Dev\handyman\three-scene.js</path>
<type>file</type>
<content>2168:     if (e.code !== 'Space') return;
2169:     const tag = e.target.tagName;
2170:     if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
2171:     if (e.repeat) return; // prevent keydown repeat from re-firing burst
2172:     e.preventDefault();
2173:     sawLocked = true;
2174:     // Visual lock signal: blue-white burst + shockwave from saw position
2175:     const sp = sawGroup.position;
2176:     emitSparks(sp.x, sp.y, 0xaaddff, 16);
2177:     applyVortexShockwave(amberSystem, { x: sp.x, y: sp.y, z: 0 });
2178:     applyVortexShockwave(sparkSystem, { x: sp.x, y: sp.y, z: 0 });
2179:     applyVortexShockwave(hazeSystem,  { x: sp.x, y: sp.y, z: 0 });
2180:     VORTEX_PARAMS.turbulenceMode = 1.0;
2181:   });
2182:   window.addEventListener('keyup', e => {
2183:     if (e.code !== 'Space') return;
2184:     sawLocked = false;
2185:     VORTEX_PARAMS.tangentialStrength = 0.0032;  // restore cursor vortex strength
2186:     // Unlock burst: smaller orange release from saw
2187:     const sp = sawGroup.position;
2188:     emitSparks(sp.x, sp.y, 0xff8800, 10);
2189:   });
2190: 
2191:   /* ─── Spark burst pool ─────────────────────────────────── */
2192:   // 28 total: first 16 reserved for saw sparks, last 12 for tool-click sparks.
2193:   // Smaller radius (0.018) so they look like actual spark particles, not golf balls.
2194:   const sparks = [];
2195:   for (let s = 0; s < 28; s++) {
2196:     const sm = new THREE.Mesh(
2197:       new THREE.SphereGeometry(0.018, 4, 3),
2198:       new THREE.MeshBasicMaterial({
2199:         color: 0xffa040, transparent: true, opacity: 0,
2200:         blending: THREE.AdditiveBlending, depthWrite: false,
2201:       })
2202:     );
2203:     sm.frustumCulled = false;
2204:     sm.visible = false;
2205:     scene.add(sm);
2206:     sparks.push({ mesh: sm, active: false, vel: new THREE.Vector3(), startTime: 0, lifetime: 600 });
2207:   }
2208: 
2209:   // Generic radial burst — used for tool clicks, pinch gestures, shockwaves
2210:   function emitSparks(worldX, worldY, color = 0xffa040, count = 8) {
2211:     // Use slots 12–27 (last 16 of pool) so saw sparks (0–15) aren't clobbered
2212:     const startSlot = 12;
2213:     let filled = 0;
2214:     for (let i = startSlot; i < sparks.length && filled < count; i++) {
2215:       const sp = sparks[i];
2216:       if (sp.active) continue;  // skip busy sparks
2217:       const angle = (filled / count) * Math.PI * 2 + rand(0, 0.5);
2218:       const speed = rand(0.005, 0.016);
2219:       sp.mesh.material.color.setHex(color);
2220:       sp.mesh.position.set(worldX, worldY, 1.5);
2221:       sp.vel.set(Math.cos(angle) * speed, Math.sin(angle) * speed, rand(-0.002, 0.002));
2222:       sp.mesh.material.opacity = 0.9;
2223:       sp.mesh.visible = true;
2224:       sp.active = true;
2225:       sp.startTime = performance.now();
2226:       sp.lifetime = 600;
2227:       filled++;
2228:     }
2229:   }
2230: 
2231:   // Saw-specific sparks — tangential arc from blade contact point, with gravity
2232:   function emitSawSparks(sawPos, speedRatio) {
2233:     const count = Math.ceil(1 + speedRatio * 4);  // 1–5 sparks
2234:     // Contact point: bottom of blade (y - blade radius), slightly forward
2235:     const contactX = sawPos.x;
2236:     const contactY = sawPos.y - 0.88;
2237:     const contactZ = sawPos.z + 0.15;
2238:     // CW rotation (positive rotation.y in sawSpinGroup whose local Y points toward camera):
2239:     // At the bottom of the blade (6 o'clock), tangent velocity points rightward (+X).
2240:     // Sparks fly right and slightly downward with natural gravity arc.
2241:     // BASE_ANGLE ≈ -0.25 rad = rightward with slight downward bias for realism.
2242:     const BASE_ANGLE = -0.25;  // ~355° = right + slight down
2243:     let filled = 0;
2244:     for (let i = 0; i < sparks.length && filled < count; i++) {
2245:       const sp = sparks[i];
2246:       if (sp.active) continue;
2247:       const angle = BASE_ANGLE + (Math.random() - 0.5) * 0.55;  // ±16° spread
2248:       const speed = 0.022 + Math.random() * 0.030 * speedRatio;
2249:       // Color: white-hot → amber → orange as speed drops
2250:       const color = speedRatio > 0.75 ? 0xffffff
2251:                   : speedRatio > 0.45 ? 0xffdd66
2252:                   :                     0xff6600;
2253:       sp.mesh.material.color.setHex(color);
2254:       sp.mesh.position.set(contactX, contactY, contactZ);
2255:       sp.vel.set(
2256:         Math.cos(angle) * speed,
2257:         Math.sin(angle) * speed,
2258:         (Math.random() - 0.5) * 0.005
2259:       );
2260:       sp.mesh.material.opacity = 1.0;
2261:       sp.mesh.visible = true;
2262:       sp.active = true;
2263:       sp.startTime = performance.now();
2264:       sp.lifetime = 380 + Math.random() * 280;  // shorter-lived than click sparks
2265:       filled++;
2266:     }
2267:   }
2268: 
2269:   /* ─── Keyboard shortcuts ───────────────────────────────── */
2270:   window.addEventListener('keydown', (e) => {
2271:     const key = e.key.toUpperCase();
2272:     if (key === 'H') {
2273:       openPanel('hammer'); hoverEmissive.hammer = 0.38;
2274:       const hp = hammerGroup.position;
2275:       applyVortexShockwave(amberSystem, { x: hp.x, y: hp.y, z: 0 });
2276:       applyVortexShockwave(sparkSystem, { x: hp.x, y: hp.y, z: 0 });
2277:       applyVortexShockwave(hazeSystem,  { x: hp.x, y: hp.y, z: 0 });
2278:       emitSparks(hp.x, hp.y, 0xffaa40, 14);
2279:     }
2280:     if (key === 'W') {
2281:       openPanel('wrench'); hoverEmissive.wrench = 0.38;
2282:       const wp = wrenchGroup.position;
2283:       applyVortexShockwave(amberSystem, { x: wp.x, y: wp.y, z: 0 });
2284:       applyVortexShockwave(sparkSystem, { x: wp.x, y: wp.y, z: 0 });
2285:       applyVortexShockwave(hazeSystem,  { x: wp.x, y: wp.y, z: 0 });
2286:       emitSparks(wp.x, wp.y, 0x88ddff, 14);
2287:     }
2288:     if (key === 'S') {
2289:       openPanel('saw'); hoverEmissive.saw = 0.38;
2290:       const sp = sawGroup.position;
2291:       applyVortexShockwave(amberSystem, { x: sp.x, y: sp.y, z: 0 });
2292:       applyVortexShockwave(sparkSystem, { x: sp.x, y: sp.y, z: 0 });
2293:       applyVortexShockwave(hazeSystem,  { x: sp.x, y: sp.y, z: 0 });
2294:       emitSparks(sp.x, sp.y, 0xff6600, 18);
2295:     }
2296:     if (e.key === 'Escape') { closePanel(); }
2297:   });
2298: 
2299:   /* ─── Scroll tracking ─────────────────────────────────── */
2300:   let scrollProgress  = 0;  // 0–1 across full page — used for camera pull-back
2301:   let currentScrollY  = 0;  // raw px — used for hero fade threshold
2302: 
2303:   let lastScrollY = 0;
2304:   let scrollSweepTimer = null;
2305:   function updateScroll() {
2306:     const prevY = lastScrollY;
2307:     currentScrollY = window.scrollY;
2308:     lastScrollY = currentScrollY;
2309:     const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
2310:     scrollProgress  = maxScroll > 0 ? currentScrollY / maxScroll : 0;
2311:     const overlayAlpha = Math.min(scrollProgress * 2, 1);
2312:     document.documentElement.style.setProperty('--overlay-alpha', overlayAlpha.toFixed(3));
2313:     document.documentElement.style.setProperty('--scene-warmth', scrollProgress.toFixed(3));
2314:     // Scale bloom strength with scroll warmth
2315:     if (bloomPass) bloomPass.strength = 0.40 + scrollProgress * 0.25;
2316:     // Particle vertical sweep on scroll
2317:     const scrollingDown = currentScrollY > prevY;
2318:     VORTEX_PARAMS.turbulenceMode = 1.0;
2319:     VORTEX_PARAMS.upwardDrift = scrollingDown ? -0.003 : 0.003;
2320:     clearTimeout(scrollSweepTimer);
2321:     scrollSweepTimer = setTimeout(() => { VORTEX_PARAMS.upwardDrift = 0.00085; }, 400);
2322:   }
2323: 
2324:   window.addEventListener('scroll', updateScroll, { passive: true });
2325: 
2326:   /* ─── Camera state ────────────────────────────────────── */
2327:   let camRotX = 0, camRotY = 0;
2328:   // Spring physics for camera parallax — replaces exponential lerp for organic overshoot feel
2329:   let camVelX = 0, camVelY = 0;
2330:   const SPRING_K = 180, SPRING_C = 18;  // K=180 → ~2.1 Hz natural freq, C=18 → damping ratio ~0.67
2331: 
2332:   /* ─── Responsive layout ───────────────────────────────── */
2333:   function applyResponsiveLayout() {
2334:     const w = window.innerWidth;
2335:     const isNarrow = w < 480;
2336:     const isMobile = w < 768;
2337: 
2338:     if (isNarrow) {
2339:       camera.fov = 52;
2340:       [hammerGroup, wrenchGroup, sawGroup].forEach(g => g.scale.setScalar(0.55));
2341:       hammerGroup.position.set(-0.6, 0.8, 1.5);   // upper left
2342:       wrenchGroup.position.set( 0.6, 0.6, 1.5);   // upper right
2343:       sawGroup.position.set(0, 1.2, -0.5);         // upper center-back
2344:     } else if (isMobile) {
2345:       camera.fov = 54;
2346:       [hammerGroup, wrenchGroup, sawGroup].forEach(g => g.scale.setScalar(0.65));
2347:       hammerGroup.position.set(-0.8, 0.7, 1.6);   // upper left
2348:       wrenchGroup.position.set( 0.8, 0.5, 1.5);   // upper right
2349:       sawGroup.position.set(0, 1.0, -0.5);         // upper center-back
2350:     } else {
2351:       camera.fov = 60;
2352:       [hammerGroup, wrenchGroup].forEach(g => g.scale.setScalar(1.0));
2353:       hammerGroup.position.set(-1.8, 0.2, 2.0);   // left-front in triangle
2354:       wrenchGroup.position.set( 1.6, 0.4, 1.8);   // right-front in triangle
2355:       sawGroup.scale.setScalar(1.3);
2356:       sawGroup.position.set(0, 2.2, -0.5);
2357:     }
2358:     camera.aspect = window.innerWidth / window.innerHeight;
2359:     camera.updateProjectionMatrix();
2360: 
2361:     // Store base positions for float animations to preserve responsive layout
2362:     window.toolBasePositions = {
2363:       hammer: {
2364:         x: hammerGroup.position.x,
2365:         y: hammerGroup.position.y,
2366:         z: hammerGroup.position.z
2367:       },
2368:       wrench: {
2369:         x: wrenchGroup.position.x,
2370:         y: wrenchGroup.position.y,
2371:         z: wrenchGroup.position.z
2372:       },
2373:       saw: {
2374:         x: sawGroup.position.x,
2375:         y: sawGroup.position.y,
2376:         z: sawGroup.position.z
2377:       }
2378:     };
2379:   }
2380: 
2381:   /* ─── Resize handler ──────────────────────────────────── */
2382:   let resizeTimer;
2383:   window.addEventListener('resize', () => {
2384:     clearTimeout(resizeTimer);
2385:     resizeTimer = setTimeout(() => {
2386:       renderer.setSize(window.innerWidth, window.innerHeight);
2387:       if (composer) composer.setSize(window.innerWidth, window.innerHeight);
2388:       if (bloomPass) bloomPass.resolution.set(window.innerWidth, window.innerHeight);
2389:       applyResponsiveLayout();
2390:     }, 150);
2391:   });
2392: 
2393:   // applyResponsiveLayout() called inside startScene() after GLB load
2394: 
2395:   /* ─── Mouse physics updater ───────────────────────────── */
2396:   // Called each frame before updateVortexPhysics.
2397:   // Computes velocity, turbulence mode, moves vortex center to cursor,
2398:   // and detects tool proximity for per-tool force signatures.
2399:   function updateMousePhysics() {
2400:     // ── Step 1: EMA-smoothed mouse velocity (NDC/frame) ──
2401:     const rawVX = mouseX - prevMouseX;
2402:     const rawVY = mouseY - prevMouseY;
2403:     prevMouseX = mouseX;
2404:     prevMouseY = mouseY;
2405:     smoothVelX = smoothVelX * 0.72 + rawVX * 0.28;
2406:     smoothVelY = smoothVelY * 0.72 + rawVY * 0.28;
2407:     const velMag = Math.sqrt(smoothVelX * smoothVelX + smoothVelY * smoothVelY);
2408:     VORTEX_PARAMS.mouseVelocityX = smoothVelX;
2409:     VORTEX_PARAMS.mouseVelocityY = smoothVelY;
2410: 
2411:     // ── Step 2: Turbulence mode (asymmetric lerp — fast attack, slow decay) ──
2412:     // Double-click detonation overrides turbulence — skip the lerp during that event
2413:     if (!reverseGravityActive) {
2414:       const targetTurb = velMag > VORTEX_PARAMS.velocityThreshold ? 1.0 : 0.0;
2415:       const turbRate = targetTurb > VORTEX_PARAMS.turbulenceMode ? 0.18 : 0.040;
2416:       VORTEX_PARAMS.turbulenceMode += (targetTurb - VORTEX_PARAMS.turbulenceMode) * turbRate;
2417:     }
2418: 
2419:     // ── Step 3: Lerp vortex center to cursor world position ──
2420:     const targetCX = mouseX * 5.5;
2421:     const targetCY = -mouseY * 3.0;
2422:     const centerLerp = 0.022 + VORTEX_PARAMS.turbulenceMode * 0.04;  // slower follow — particles spread before center catches up
2423:     VORTEX_PARAMS.centerX += (targetCX - VORTEX_PARAMS.centerX) * centerLerp;
2424:     VORTEX_PARAMS.centerY += (targetCY - VORTEX_PARAMS.centerY) * centerLerp;
2425:     // centerZ stays 0 (tools are at z≈0–2, particles fill the z range)
2426: 
2427:     // ── Step 4: Tool proximity (screen-space pixel distance) ──
2428:     const toolDefs = [
2429:       { id: 'hammer', group: hammerGroup, threshold: 140 },
2430:       { id: 'wrench', group: wrenchGroup, threshold: 140 },
2431:       { id: 'saw',    group: sawGroup,    threshold: 110 },
2432:     ];
2433:     let closestId = null;
2434:     let closestDist = Infinity;
2435:     let closestStrength = 0;
2436:     for (const t of toolDefs) {
2437:       const wp = t.group.position.clone();
2438:       wp.project(camera);
2439:       const sx = (wp.x  + 1) / 2 * window.innerWidth;
2440:       const sy = (-wp.y + 1) / 2 * window.innerHeight;
2441:       const pd = Math.sqrt((rawMouseX - sx) * (rawMouseX - sx) + (rawMouseY - sy) * (rawMouseY - sy));
2442:       if (pd < t.threshold && pd < closestDist) {
2443:         closestDist = pd;
2444:         closestId = t.id;
2445:         closestStrength = 1.0 - pd / t.threshold;
2446:       }
2447:     }
2448:     if (closestId !== VORTEX_PARAMS.proximityTool) {
2449:       VORTEX_PARAMS.proximityTool = closestId;
2450:       VORTEX_PARAMS.proximityStrength = 0;
2451:     } else {
2452:       const targetStr = closestId !== null ? closestStrength : 0;
2453:       VORTEX_PARAMS.proximityStrength += (targetStr - VORTEX_PARAMS.proximityStrength) * 0.08;
2454:     }
2455:   }
2456: 
2457:   /* ─── Animation loop ──────────────────────────────────── */
2458:   let lastTime = 0;
2459:   let edgeFade = 0; // declared here so scan + scroll blocks can both reference it
2460: 
2461:   function animate(time) {
2462:     requestAnimationFrame(animate);
2463:     const delta = Math.min(time - lastTime, 50);
2464:     lastTime = time;
2465: 
2466:     /* ── Staggered assembly intro ── */
2467:     if (!assemblyDone) {
2468:       if (assemblyStartTime === null) assemblyStartTime = time;
2469:       const elapsed = time - assemblyStartTime;
2470:       let allDone = true;
2471: 
2472:       allToolParts.forEach(mesh => {
2473:         const partElapsed = Math.max(0, elapsed - mesh.userData.assemblyDelay);
2474:         const partT = easeOutSpring(Math.min(partElapsed / (ASSEMBLY_DURATION * 0.72), 1));
2475:         mesh.position.lerpVectors(mesh.userData.spreadPos, mesh.userData.restPos, partT);
2476:         // Tumble rotation lerps to zero
2477:         mesh.rotation.x = mesh.userData.spreadRot.x * (1 - partT);
2478:         mesh.rotation.y = mesh.userData.spreadRot.y * (1 - partT);
2479:         mesh.rotation.z = mesh.userData.spreadRot.z * (1 - partT);
2480:         if (partT < 1) allDone = false;
2481:       });
2482: 
2483:       if (allDone) {
2484:         assemblyDone = true;
2485:         allToolParts.forEach(mesh => { mesh.rotation.set(0, 0, 0); });
2486:         // Add .visible exactly once — CSS transition fires from this single state change
2487:         if (!heroCopyShown) {
2488:           heroCopyShown = true;
2489:           heroCopy.classList.add('visible');
2490:         }
2491:       }
2492:     }
2493: 
2494:     /* ── Orbit light ── */
2495:     const lightAngle = time * 0.0004 + 0.8;
2496:     orbitLight.position.set(
2497:       Math.cos(lightAngle) * 7,
2498:       2.5 + Math.sin(lightAngle * 0.5) * 2.5,
2499:       Math.sin(lightAngle) * 5
2500:     );
2501: 
2502:     /* ── Fragment debris + mouse proximity reaction ── */
2503:     const mouseWorldX = mouseX * 5.5;
2504:     const mouseWorldY = -mouseY * 3.0;
2505:     for (const fd of fragmentData) {
2506:       const dx = fd.mesh.position.x - mouseWorldX;
2507:       const dy = fd.mesh.position.y - mouseWorldY;
2508:       const dist = Math.sqrt(dx * dx + dy * dy);
2509:       const proximity = Math.max(0, 1 - dist / 2.5);
2510:       // Boost rotation near cursor
2511:       fd.mesh.rotation.x += fd.rotX * delta * (1 + proximity * 8);
2512:       fd.mesh.rotation.y += fd.rotY * delta * (1 + proximity * 8);
2513:       fd.mesh.rotation.z += fd.rotZ * delta * (1 + proximity * 6);
2514:       // Gentle drift away from cursor
2515:       if (proximity > 0.1 && dist > 0.01) {
2516:         fd.mesh.position.x += (dx / dist) * proximity * 0.0008 * delta;
2517:         fd.mesh.position.y += (dy / dist) * proximity * 0.0008 * delta;
2518:       }
2519:     }
2520: 
2521:     /* ── Particles (physics-driven) ── */
2522:     const mouseWorldPos = {
2523:       x: mouseX * 5.5,
2524:       y: -mouseY * 3.0,
2525:       z: 0
2526:     };
2527:     // Ambient breathing pulse — modulate radial + tangential with slow sine (~4s period)
2528:     // Radial and tangential are 90° out of phase: when pulling in, spiral tightens; when pushing out, spiral loosens
2529:     const breathPhase = (time % VORTEX_PARAMS.breathePeriod) / VORTEX_PARAMS.breathePeriod;
2530:     VORTEX_PARAMS.radialStrength = 0.0018 + Math.sin(breathPhase * Math.PI * 2) * VORTEX_PARAMS.breatheAmplitude;
2531:     const breatheTarget = 0.0028 + Math.sin((breathPhase + 0.25) * Math.PI * 2) * (VORTEX_PARAMS.breatheAmplitude * 0.8);
2532:     VORTEX_PARAMS.tangentialStrength = sawLocked ? 0.0008 : breatheTarget;
2533: 
2534:     // Update mouse velocity, turbulence mode, vortex center, tool proximity
2535:     updateMousePhysics();
2536: 
2537:     // ── PARTICLE COLOR STATE MACHINE (dark default, explosive on interaction) ──
2538:     // impl/implPct declared in animate() scope so the light section below can reuse them
2539:     let impl = implosionActive;
2540:     let implPct = 0;
2541:     if (impl) {
2542:       const impT = (performance.now() - implosionStart) / IMPLOSION_DURATION;
2543:       implPct = Math.sin(Math.max(0, Math.min(1, impT)) * Math.PI); // 0→1→0 arc
2544:     }
2545:     {
2546:       const turb = VORTEX_PARAMS.turbulenceMode;
2547:       const revG = VORTEX_PARAMS.reverseGravity;
2548: 
2549:       // Amber layer: deep ember red → white-hot blast → electric blue implosion
2550:       const ar = impl ? THREE.MathUtils.lerp(1.0,  0.1,  implPct)
2551:                       : THREE.MathUtils.lerp(1.0,  1.0,  turb);
2552:       const ag = impl ? THREE.MathUtils.lerp(0.333, 0.3,  implPct)
2553:                       : THREE.MathUtils.lerp(0.333, 1.0,  turb);
2554:       const ab = impl ? THREE.MathUtils.lerp(0.0,  1.0,  implPct)
2555:                       : THREE.MathUtils.lerp(0.0,  1.0,  turb);
2556:       amberParticleMat.color.setRGB(ar, ag, ab);
2557: 
2558:       // Spark layer: cool steel-blue → arc-white on turbulence / violet on reverse gravity
2559:       const sr = revG ? THREE.MathUtils.lerp(0.667, 0.8,  VORTEX_PARAMS.proximityStrength || turb)
2560:                       : THREE.MathUtils.lerp(0.667, 1.0,  turb);
2561:       const sg = revG ? THREE.MathUtils.lerp(0.867, 0.1,  VORTEX_PARAMS.proximityStrength || turb)
2562:                       : THREE.MathUtils.lerp(0.867, 1.0,  turb);
2563:       const sb = revG ? THREE.MathUtils.lerp(1.0,   1.0,  VORTEX_PARAMS.proximityStrength || turb)
2564:                       : THREE.MathUtils.lerp(1.0,   1.0,  turb);
2565:       sparkMat.color.setRGB(sr, sg, sb);
2566: 
2567:       // Haze layer: teal mist → white corona on turb, magenta on revG
2568:       const hr = revG ? THREE.MathUtils.lerp(0.133, 1.0, turb) : THREE.MathUtils.lerp(0.133, 1.0, turb);
2569:       const hg = revG ? THREE.MathUtils.lerp(1.0,   0.0, turb) : THREE.MathUtils.lerp(1.0,   1.0, turb);
2570:       const hb = revG ? THREE.MathUtils.lerp(0.667, 0.8, turb) : THREE.MathUtils.lerp(0.667, 1.0, turb);
2571:       hazeMat.color.setRGB(hr, hg, hb);
2572: 
2573:       // Particle size swells dramatically on blast, shrinks on implosion
2574:       amberParticleMat.size    = 0.048 + turb * 0.055 + implPct * 0.020;
2575:       amberParticleMat.opacity = Math.min(0.65, 0.38 + turb * 0.20 + implPct * 0.15);
2576:       sparkMat.size            = 0.036 + turb * 0.030 + implPct * 0.014;
2577:       sparkMat.opacity         = Math.min(0.60, 0.42 + turb * 0.14 + implPct * 0.12);
2578:       hazeMat.size             = 0.038 + turb * 0.028;
2579:       hazeMat.opacity          = Math.min(0.48, 0.28 + turb * 0.18 + implPct * 0.14);
2580:     }
2581: 
2582:     // Implosion pull-back phase (pre-physics so pull affects this frame's position update)
2583:     if (implosionActive) {
2584:       const impElapsed = performance.now() - implosionStart;
2585:       const impT = impElapsed / IMPLOSION_DURATION;
2586:       if (impT >= 1.0) {
2587:         implosionActive = false;
2588:       } else if (impT > VORTEX_PARAMS.implosionDelay) {
2589:         const normalizedT = (impT - VORTEX_PARAMS.implosionDelay) / (1.0 - VORTEX_PARAMS.implosionDelay);
2590:         const pullStrength = VORTEX_PARAMS.implosionStrength * Math.sin(normalizedT * Math.PI);
2591:         for (const system of [amberSystem, sparkSystem, hazeSystem]) {
2592:           const pos = system.positions;
2593:           const vel = system.velocities;
2594:           for (let i = 0; i < system.count; i++) {
2595:             const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
2596:             const dx = clickWorldPos.x - pos[ix];
2597:             const dy = clickWorldPos.y - pos[iy];
2598:             const dz = clickWorldPos.z - pos[iz];
2599:             const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
2600:             if (dist > 0.01 && dist < VORTEX_PARAMS.shockwaveRadius * 2.5) {
2601:               vel[ix] += (dx / dist) * pullStrength;
2602:               vel[iy] += (dy / dist) * pullStrength;
2603:               vel[iz] += (dz / dist) * pullStrength;
2604:             }
2605:           }
2606:         }
2607:       }
2608:     }
2609: 
2610:     updateVortexPhysics(amberSystem, mouseWorldPos, delta);
2611:     updateVortexPhysics(sparkSystem, mouseWorldPos, delta);
2612:     updateVortexPhysics(hazeSystem,  mouseWorldPos, delta);
2613: 
2614:     /* ── Hub bloom pulse ── */
2615:     // Will be calculated after sawSpinSpeed is set (see below)
2616: 
2617:     /* ── Scan line sweep ── */
2618:     const scanFrac = (time * 0.00028) % 1.0;
2619:     const scanY    = scanFrac * SCAN_GRID_H;
2620:     const sw       = SCAN_GRID_W / 2;
2621:     scanLineVerts[0] = -sw; scanLineVerts[1] = scanY; scanLineVerts[2] = 0;
2622:     scanLineVerts[3] =  sw; scanLineVerts[4] = scanY; scanLineVerts[5] = 0;
2623:     scanLineGeo.attributes.position.needsUpdate = true;
2624:     edgeFade = Math.min(scanFrac, 1 - scanFrac) * 2; // 0 at edges, 1 in middle
2625: 
2626:     /* ── Hero-only fade — viewport-relative, works on any page length ── */
2627:     const heroFadeStart = window.innerHeight * 0.15; // start fading at 15vh scroll
2628:     const heroFadeEnd   = window.innerHeight * 0.55; // fully gone at 55vh scroll
2629:     const toolAlpha     = Math.max(0, 1 - Math.max(0, currentScrollY - heroFadeStart) / (heroFadeEnd - heroFadeStart));
2630: 
2631:     /* ── Hover emissive lerp — also driven by vortex turbulence + implosion ── */
2632:     const particleEnergyBase = VORTEX_PARAMS.turbulenceMode * 0.18 + implPct * 0.28;
2633:     const sawEnergyBoost = (VORTEX_PARAMS.sawSpeedRatio || 0) * 0.12;
2634: 
2635:     const lerpE = 1 - Math.pow(0.04, delta / 16);
2636:     ['hammer', 'wrench', 'saw'].forEach(id => {
2637:       const hoverTarget = (hoveredTool === id || activePanelTool === id) ? 0.38 : 0;
2638:       const particleTarget = particleEnergyBase + (id === 'saw' ? sawEnergyBoost : 0);
2639:       const target = Math.max(hoverTarget, particleTarget);
2640:       hoverEmissive[id] += (target - hoverEmissive[id]) * lerpE;
2641:       const ev = hoverEmissive[id];
2642:       getToolGroup(id).traverse(obj => {
2643:         if (obj.isMesh && obj.material && obj.material.emissive) {
2644:           // Don't override bubble's own emissive — only change non-emissive parts
2645:           if (obj.material.emissiveIntensity < 0.5) {
2646:             // Amber-orange at rest/turbulence; shifts blue on implosion
2647:             const rC = impl ? THREE.MathUtils.lerp(0.95, 0.2, implPct) : 0.95;
2648:             const gC = impl ? THREE.MathUtils.lerp(0.52, 0.4, implPct) : 0.52;
2649:             const bC = impl ? THREE.MathUtils.lerp(0.05, 1.0, implPct) : 0.05;
2650:             obj.material.emissive.setRGB(ev * rC, ev * gC, ev * bC);
2651:           }
2652:         }
2653:       });
2654:     });
2655:     /* ── Spin animation ── */
2656:     ['hammer', 'wrench', 'saw'].forEach(id => {
2657:       const st = spinState[id];
2658:       if (!st.spinning || dragTool === id) return;
2659:       const elapsed = performance.now() - st.spinStart;
2660:       if (elapsed >= SPIN_DURATION) {
2661:         getToolGroup(id).rotation.y = st.spinFrom;
2662:         st.spinning = false;
2663:       } else {
2664:         getToolGroup(id).rotation.y = st.spinFrom + easeInOut(elapsed / SPIN_DURATION) * Math.PI * 2;
2665:       }
2666:     });
2667: 
2668:     /* ── Disassembly animation ── */
2669:     ['hammer', 'wrench', 'saw'].forEach(id => {
2670:       const ds = disassembleState[id];
2671:       if (!ds.animating) return;
2672:       const elapsed = performance.now() - ds.startTime;
2673:       const t = easeOut(Math.min(elapsed / DISASSEMBLE_DURATION, 1));
2674:       const parts = getToolParts(id);
2675:       parts.forEach(mesh => {
2676:         if (ds.goingOut) {
2677:           mesh.position.lerpVectors(mesh.userData.restPos, mesh.userData.spreadPos, t);
2678:           mesh.rotation.x = mesh.userData.spreadRot.x * t;
2679:           mesh.rotation.y = mesh.userData.spreadRot.y * t;
2680:           mesh.rotation.z = mesh.userData.spreadRot.z * t;
2681:         } else {
2682:           mesh.position.lerpVectors(mesh.userData.spreadPos, mesh.userData.restPos, t);
2683:           mesh.rotation.x = mesh.userData.spreadRot.x * (1 - t);
2684:           mesh.rotation.y = mesh.userData.spreadRot.y * (1 - t);
2685:           mesh.rotation.z = mesh.userData.spreadRot.z * (1 - t);
2686:         }
2687:       });
2688:       if (t >= 1) {
2689:         ds.animating = false;
2690:         ds.exploded  = ds.goingOut;
2691:         if (!ds.exploded) parts.forEach(m => m.rotation.set(0, 0, 0));
2692:       }
2693:     });
2694: 
2695:     /* ── Hover ripple rings ── */
2696:     for (const ring of rippleRings) {
2697:       if (!ring.active) continue;
2698:       const elapsed = performance.now() - ring.startTime;
2699:       const t = Math.min(elapsed / 420, 1);
2700:       const s = 0.2 + t * 1.3;
2701:       ring.mesh.scale.set(s, s, s);
2702:       ring.mesh.material.opacity = 0.65 * (1 - t);
2703:       if (t >= 1) { ring.active = false; ring.mesh.visible = false; }
2704:     }
2705: 
2706:     /* ── Idle rotation (when assembled + not spinning + not dragging) ── */
2707:     if (assemblyDone) {
2708:       if (!spinState.hammer.spinning && dragTool !== 'hammer') {
2709:         hammerIdleY += 0.00018 * delta;
2710:       }
2711:       if (!spinState.wrench.spinning && dragTool !== 'wrench') {
2712:         wrenchIdleY -= 0.00014 * delta;
2713:       }
2714:     }
2715:     // Inertia decay — continues spinning after drag release
2716:     ['hammer', 'wrench', 'saw'].forEach(id => {
2717:       if (!inertia[id]) return;
2718:       if (id === 'hammer') hammerIdleY += inertia[id] * delta;
2719:       if (id === 'wrench') wrenchIdleY += inertia[id] * delta;
2720:       inertia[id] *= 0.92;
2721:       if (Math.abs(inertia[id]) < 0.0001) inertia[id] = 0;
2722:     });
2723: 
2724:     /* ── Tool float + proximity tilt + parallax ── */
2725:     // Use stored responsive base positions and add float animation on top
2726:     if (window.toolBasePositions) {
2727:       // Differentiated float periods prevent synchronized bobbing — 3.2s / 4.1s / 5.0s
2728:       hammerGroup.position.x = window.toolBasePositions.hammer.x + camRotY * -1.8;
2729:       hammerGroup.position.y = window.toolBasePositions.hammer.y + Math.sin(time * 0.00098) * 0.065;  // 3.2s period
2730:       hammerGroup.position.z = window.toolBasePositions.hammer.z + camRotX * -0.6;
2731: 
2732:       wrenchGroup.position.x = window.toolBasePositions.wrench.x + camRotY * -1.6;
2733:       wrenchGroup.position.y = window.toolBasePositions.wrench.y + Math.sin(time * 0.00076 + 1.2) * 0.048;  // 4.1s period
2734:       wrenchGroup.position.z = window.toolBasePositions.wrench.z + camRotX * -0.5;
2735: 
2736:       // Saw blade apex positioning with corrected float frequency and parallax
2737:       sawGroup.position.x = window.toolBasePositions.saw.x + camRotY * -1.4;
2738:       sawGroup.position.y = window.toolBasePositions.saw.y + Math.cos(time * 0.00063 + 2.7) * 0.038;  // 5.0s period
2739:       sawGroup.position.z = window.toolBasePositions.saw.z + camRotX * -0.4 + Math.sin(time * 0.00063 + 2.7) * 0.06;
2740:     }
2741: 
2742:     if (!spinState.hammer.spinning && dragTool !== 'hammer') {
2743:       hammerGroup.rotation.y = hammerIdleY - 0.55 + camRotY * 0.35;
2744:       hammerGroup.rotation.z = 0.22 + mouseX * -0.06;
2745:     }
2746: 
2747:     if (!spinState.wrench.spinning && dragTool !== 'wrench') {
2748:       wrenchGroup.rotation.y = wrenchIdleY + 0.60 + camRotY * 0.28;
2749:       wrenchGroup.rotation.z = -0.15 + mouseX * 0.05;
2750:     }
2751: 
2752:     // sawSpinGroup is inside sawGroup (which has rotation.x = PI/2).
2753:     // The inner group's local Y-axis therefore points toward the camera (world -Z).
2754:     // Spinning sawSpinGroup.rotation.y rotates the blade around its own face-normal = correct saw spin.
2755:     // Mouse-X driven speed: left (-1) = slow, right (1) = fast
2756:     // Spacebar lock overrides to max speed and suppresses cursor vortex
2757:     const speedMultiplier = 0.5 + (mouseX * 0.5); // 0 to 1 range
2758:     const sawSpinSpeed = sawLocked
2759:       ? sawGroup.userData.maxSawSpeed
2760:       : THREE.MathUtils.lerp(sawGroup.userData.baseSawSpeed, sawGroup.userData.maxSawSpeed, speedMultiplier);
2761:     if (!glbSawLoaded && sawSpinGroup) sawSpinGroup.rotation.y += sawSpinSpeed;
2762: 
2763:     // NOW calculate speedRatio using the current frame's sawSpinSpeed
2764:     const baseSpeed = sawGroup.userData.baseSawSpeed;
2765:     const maxSpeed = sawGroup.userData.maxSawSpeed;
2766:     const speedRatio = (sawSpinSpeed - baseSpeed) / (maxSpeed - baseSpeed); // 0 to 1
2767:     // Propagate saw state to VORTEX_PARAMS for induction physics
2768:     VORTEX_PARAMS.sawSpeedRatio = speedRatio;
2769:     VORTEX_PARAMS.sawWorldX = sawGroup.position.x;
2770:     VORTEX_PARAMS.sawWorldY = sawGroup.position.y;
2771:     VORTEX_PARAMS.sawWorldZ = sawGroup.position.z;
2772:     // Hub bloom pulses dramatically with spin speed — from dim glow to blazing at full speed
2773:     if (!glbSawLoaded && hubGlowMat)   hubGlowMat.opacity   = 0.12 + speedRatio * 0.20;
2774:     if (!glbSawLoaded && hubCoronaMat) hubCoronaMat.opacity = 0.05 + speedRatio * 0.14;
2775:     if (bladeMat) bladeMat.envMapIntensity = 0.5 + speedRatio * 0.5 + VORTEX_PARAMS.turbulenceMode * 0.2;
2776: 
2777:     // Saw blade sparks — tangential arc from blade contact point, always active above idle
2778:     if (speedRatio > 0.12 && Math.random() < 0.18 + speedRatio * 0.35) {
2779:       emitSawSparks(sawGroup.position, speedRatio);
2780:     }
2781:     // At very high speed, burst sparks also fly off from the side of the blade
2782:     if (speedRatio > 0.80 && Math.random() < 0.30) {
2783:       const sideAngle = (Math.random() - 0.5) * 1.2;  // random point on rim
2784:       const rp = sawGroup.position;
2785:       emitSparks(
2786:         rp.x + Math.cos(sideAngle) * 0.88,
2787:         rp.y + Math.sin(sideAngle) * 0.88,
2788:         0xffffff, 2
2789:       );
2790:     }
2791: 
2792:     /* ── Floor grid parallax ── */
2793:     floorGrid.position.x = camRotY * -0.8;
2794:     floorGrid.position.z = 1.0 + camRotX * 0.4;
2795: 
2796:     /* ── Opacity / fade on scroll ── */
2797:     allToolParts.forEach((part) => setObjectOpacity(part, toolAlpha));
2798:     floorGrid.material.opacity   = toolAlpha * 0.55;
2799:     wallGrid.material.opacity    = toolAlpha * 0.22;
2800:     orbitLight.intensity = toolAlpha * 0.3;
2801:     // Floor glow breathes with particle pulse + flares on turbulence
2802:     const breathPhaseGlow = (time % 4000) / 4000;
2803:     const glowPulse = 0.12 + Math.sin(breathPhaseGlow * Math.PI * 2) * 0.04 + VORTEX_PARAMS.turbulenceMode * 0.05;
2804:     floorGlow.material.opacity  = toolAlpha * glowPulse;
2805: 
2806:     // ── PARTICLE LIGHT UPDATES: dynamic illumination from vortex + saw + sparks ──
2807: 
2808:     // Ambient flash on implosion — subtle tint only, not a flood
2809:     ambientLight.intensity = 0.04 + implPct * 0.10;
2810:     ambientLight.color.setRGB(
2811:       impl ? THREE.MathUtils.lerp(0.024, 0.08, implPct) : 0.024,
2812:       impl ? THREE.MathUtils.lerp(0.031, 0.07, implPct) : 0.031,
2813:       impl ? THREE.MathUtils.lerp(0.055, 0.09, implPct) : 0.055
2814:     );
2815: 
2816:     // Vortex light tracks cursor center — amber idle, blue-white on implosion
2817:     vortexLight.position.set(VORTEX_PARAMS.centerX, VORTEX_PARAMS.centerY, 1.5);
2818:     const vBase = impl ? 1.5 * implPct : 0;
2819:     const vTurb = toolAlpha * (0.4 + VORTEX_PARAMS.turbulenceMode * 1.6);
2820:     vortexLight.intensity = Math.min(2.0, Math.max(vBase, vTurb));
2821:     vortexLight.color.setRGB(
2822:       impl ? THREE.MathUtils.lerp(0.83, 0.5, implPct) : 0.83,
2823:       impl ? THREE.MathUtils.lerp(0.51, 0.6, implPct) : 0.51,
2824:       impl ? THREE.MathUtils.lerp(0.04, 1.0, implPct) : 0.04
2825:     );
2826: 
2827:     // Spark light: intensifies AND goes cyan on high turbulence
2828:     sparkLight.position.set(VORTEX_PARAMS.centerX * 0.8, VORTEX_PARAMS.centerY * 0.8 + 0.5, 1.0);
2829:     sparkLight.intensity = toolAlpha * (VORTEX_PARAMS.turbulenceMode * 1.2 + implPct * 1.5);
2830:     sparkLight.color.setRGB(
2831:       THREE.MathUtils.lerp(1.0, 0.0, VORTEX_PARAMS.turbulenceMode),
2832:       THREE.MathUtils.lerp(0.8, 0.93, VORTEX_PARAMS.turbulenceMode),
2833:       THREE.MathUtils.lerp(0.4, 1.0, VORTEX_PARAMS.turbulenceMode)
2834:     );
2835: 
2836:     // Ground glow: reacts to implosion — brief blue-white flood from floor
2837:     groundGlow.intensity = impl ? implPct * 1.2 : VORTEX_PARAMS.turbulenceMode * 0.3;
2838:     groundGlow.color.setRGB(
2839:       impl ? THREE.MathUtils.lerp(0.69, 0.3, implPct) : 0.69,
2840:       impl ? THREE.MathUtils.lerp(0.38, 0.4, implPct) : 0.38,
2841:       impl ? THREE.MathUtils.lerp(0.06, 1.0, implPct) : 0.06
2842:     );
2843: 
2844:     // Saw particle glow: orange light from sparks + hub, scales with blade speed
2845:     sawParticleGlow.position.set(sawGroup.position.x, sawGroup.position.y, sawGroup.position.z + 0.5);
2846:     sawParticleGlow.intensity = toolAlpha * speedRatio * 1.2;
2847: 
2848:     // Cloud key light: wide amber fill that breathes with particle energy
2849:     const cloudBreath = 0.5 + Math.sin(time * 0.00038) * 0.5;
2850:     cloudKeyLight.position.set(VORTEX_PARAMS.centerX * 0.6, VORTEX_PARAMS.centerY * 0.4 + cloudBreath * 0.8, 2.2);
2851:     cloudKeyLight.intensity = toolAlpha * (VORTEX_PARAMS.turbulenceMode * 1.5 + implPct * 1.8);
2852:     // Base is now 0 at idle — light only activates when particles are actually turbulent
2853:     cloudKeyLight.color.setRGB(
2854:       impl ? THREE.MathUtils.lerp(1.0, 0.3, implPct) : 1.0,
2855:       impl ? THREE.MathUtils.lerp(0.6, 0.5, implPct) : 0.6,
2856:       impl ? THREE.MathUtils.lerp(0.2, 1.0, implPct) : 0.2
2857:     );
2858: 
2859:     // Floor rim light: fires on implosion for dramatic under-lighting burst
2860:     floorRimLight.position.set(VORTEX_PARAMS.centerX * 0.3, -2.0, 1.5);
2861:     floorRimLight.intensity = toolAlpha * (impl ? implPct * 0.8 : 0);
2862:     floorRimLight.color.setRGB(0.4, 0.5, 0.9); // softer cool — was pure 0.2,0.4,1.0 blue
2863: 
2864:     horizonGrid.material.opacity = toolAlpha * 0.14;
2865:     scanLineMat.opacity  = Math.min(edgeFade, 1) * 0.55 * toolAlpha;
2866:     scanGlowMat.opacity  = Math.min(edgeFade, 1) * 0.22 * toolAlpha;
2867:     // Saw spotlight: intensity scales with spin speed, position tracks mouse X for drama
2868:     const spotIntensity = 0.5 + (speedRatio * 1.2); // 0.5 idle → 1.7 at max speed
2869:     sawSpot.intensity  = toolAlpha * spotIntensity;
2870:     sawSpot.position.x = mouseX * 1.8 + camRotY * -1.5;  // follows cursor left/right
2871: 
2872:     // Hero-scope: hide all fixed elements when scrolled past hero fold
2873:     const heroVisible = toolAlpha > 0.01;
2874:     canvas.style.visibility    = heroVisible ? 'visible' : 'hidden';
2875:     canvas.style.pointerEvents = heroVisible ? 'auto'    : 'none';
2876:     vignette.style.visibility  = heroVisible ? 'visible' : 'hidden';
2877:     // Info panel: restore CSS default when visible, force hidden when scrolled out
2878:     infoPanel.style.visibility = heroVisible ? '' : 'hidden';
2879:     if (!heroVisible && activePanelTool) closePanel();
2880: 
2881:     // Hero copy: class-only approach — no inline opacity/visibility fights
2882:     // .visible added once on assemblyDone; .scrolled-out toggled by scroll state
2883:     if (heroCopyShown) {
2884:       heroCopy.classList.toggle('scrolled-out', !heroVisible);
2885:     }
2886: 
2887:     /* ── Spark burst update ── */
2888:     const now = performance.now();
2889:     for (const sp of sparks) {
2890:       if (!sp.active) continue;
2891:       const elapsed = now - sp.startTime;
2892:       const t = elapsed / sp.lifetime;
2893:       if (t >= 1) {
2894:         sp.active = false;
2895:         sp.mesh.visible = false;
2896:       } else {
2897:         sp.vel.y -= 0.0016 * delta;  // gravity: arcs downward over lifetime
2898:         sp.mesh.position.addScaledVector(sp.vel, delta);
2899:         sp.mesh.material.opacity = (1 - t * t);  // quadratic fade — stays bright, drops fast at end
2900:       }
2901:     }
2902: 
2903:     /* ── Camera spring physics + idle breathing sway ── */
2904:     // Dual-frequency sway — irrational periods prevent mechanical feel, amplitudes ~0.5° (subliminal)
2905:     const swayX = Math.sin(time * 0.00031) * 0.009 + Math.sin(time * 0.00071) * 0.005;
2906:     const swayY = Math.cos(time * 0.00027) * 0.011 + Math.cos(time * 0.00059) * 0.006;
2907: 
2908:     // Semi-implicit Euler spring: K=180, C=18 → ~8% overshoot on fast sweeps, settles in ~0.5s
2909:     const dt = delta / 1000;
2910:     camVelX += (SPRING_K * (targetRotX + swayX - camRotX) - SPRING_C * camVelX) * dt;
2911:     camVelY += (SPRING_K * (targetRotY + swayY - camRotY) - SPRING_C * camVelY) * dt;
2912:     camRotX += camVelX * dt;
2913:     camRotY += camVelY * dt;
2914:     camera.rotation.x = camRotX;
2915: 
2916:     const scrollZ    = 6 + scrollProgress * 3;
2917:     const scrollRotY = scrollProgress * 0.3;
2918:     camera.position.z += (scrollZ - camera.position.z) * 0.06;
2919:     camera.rotation.y  = camRotY + scrollRotY;
2920: 
2921:     /* ── Vortex glow plane — billboard additive fake volumetric core ── */
2922:     vortexGlowPlane.position.set(VORTEX_PARAMS.centerX * 0.5, VORTEX_PARAMS.centerY * 0.3, 1.0);
2923:     vortexGlowPlane.quaternion.copy(camera.quaternion);
2924:     const vgOpacity = VORTEX_PARAMS.turbulenceMode * 0.08 + implPct * 0.18 + Math.sin(time * 0.00041) * 0.02;
2925:     vortexGlowPlane.material.opacity = Math.max(0, vgOpacity) * toolAlpha;
2926:     vortexGlowPlane.material.color.setRGB(
2927:       impl ? THREE.MathUtils.lerp(0.20, 0.05, implPct) : 0.20,
2928:       impl ? THREE.MathUtils.lerp(0.07, 0.15, implPct) : 0.07,
2929:       impl ? THREE.MathUtils.lerp(0.00, 0.30, implPct) : 0.00
2930:     );
2931: 
2932:     /* ── Background breathes with particle energy ── */
2933:     const bgBreath = Math.sin(time * 0.00031) * 0.5 + 0.5; // slow 0..1 pulse
2934:     const bgR = impl ? THREE.MathUtils.lerp(0.012 + bgBreath*0.004, 0.001, implPct)
2935:                      : 0.012 + VORTEX_PARAMS.turbulenceMode*0.018 + bgBreath*0.004;
2936:     const bgG = impl ? THREE.MathUtils.lerp(0.016 + bgBreath*0.003, 0.004, implPct)
2937:                      : 0.016 + VORTEX_PARAMS.turbulenceMode*0.008 + bgBreath*0.003;
2938:     const bgB = impl ? THREE.MathUtils.lerp(0.020 + bgBreath*0.004, 0.040, implPct)
2939:                      : 0.020 + VORTEX_PARAMS.turbulenceMode*0.006 + bgBreath*0.006;
2940:     scene.background.setRGB(bgR, bgG, bgB);
2941: 
2942:     /* ── Dynamic bloom strength driven by vortex state ── */
2943:     if (bloomPass) {
2944:       const bloomTarget = Math.min(
2945:         0.30 + VORTEX_PARAMS.turbulenceMode * 0.08 + implPct * 0.07,
2946:         0.45  // hard cap — keeps bloom within mip levels 1-2 for radius=0.22; was 0.57 peak (crossed mip-3 boundary causing stripes)
2947:       );
2948:       bloomPass.strength += (bloomTarget - bloomPass.strength) * 0.025; // slightly slower lerp + hard cap prevents mip-boundary banding
2949:     }
2950: 
2951:     if (composer) {
2952:       composer.render();
2953:     } else {
2954:       renderer.render(scene, camera);
2955:     }
2956:   }
2957: 
2958:   function startScene() {
2959:     applyResponsiveLayout();
2960:     if (prefersReduced) {
2961:       allToolParts.forEach(mesh => {
2962:         mesh.position.copy(mesh.userData.restPos);
2963:         mesh.rotation.set(0, 0, 0);
2964:       });
2965:       renderer.render(scene, camera);
2966:       signalSceneReady();
2967:     } else {
2968:       animate(0);
2969:       signalSceneReady();
2970:     }
2971:   }
2972: 
2973:   loadGLBModels()
2974:     .then(startScene)
2975:     .catch(err => {
2976:       console.warn('[three-scene] GLB load failed, using procedural fallback:', err);
2977:       buildProceduralWrench();
2978:       buildProceduralSaw();
2979:       startScene();
2980:     });
2981: 
2982:   /* ─── Timer cleanup on unload ─────────────────────────── */
2983:   window.addEventListener('beforeunload', () => {
2984:     clearTimeout(scrollSweepTimer);
2985:     clearTimeout(reverseGravityTimer);
2986:     clearTimeout(slingshotTimer);
2987:   });
2988: 
2989:   /* ─── Print: hide canvas ──────────────────────────────── */
2990:   const printStyle = document.createElement('style');
2991:   printStyle.textContent = '@media print { #three-canvas { display: none !important; } }';
2992:   document.head.appendChild(printStyle);
2993: 
2994: }());

(End of file - total 2994 lines)
</content>
```

---

## Assistant (Plan · moonshotai/kimi-k2.5 · 364.5s)

_Thinking:_

 Now I have a comprehensive understanding of the Three.js hero scene. This is an impressive piece of work with:

1. **Particle Systems**: Three layered systems (amber dust, blue-white sparks, fine sand haze) with vortex physics, turbulence modes, tool proximity interactions, implosion/shockwave effects
2. **Lighting**: Multiple dynamic lights (key, fill, rim, orbiting, saw spotlight, vortex light, dynamic particle lights)
3. **Tools**: Hammer, wrench, and saw with procedural and GLB-loaded geometry, spin animations, hover effects
4. **Interactivity**: Mouse tracking, drag-to-rotate, click interactions, keyboard shortcuts, touch gestures
5. **Post-processing**: UnrealBloomPass with dynamic strength modulation
6. **Animations**: Assembly intro, idle rotations, disassembly effects, ripple rings

The user wants a comprehensive analysis with actionable recommendations to elevate this to world-class level. Let me now create a detailed analysis covering all the requested dimensions:

1. **Particle Systems Audit** - Current state and transformation opportunities
2. **Lighting Audit** - Full assessment and improvements
3. **Animation & Motion** - Quality and enhancement opportunities  
4. **Interactivity UX** - User experience and reactive behaviors
5. **Artistic Composition** - Color, atmosphere, emotional tone

**Tool: task**

**Input:**
```json
{
  "subagent_type": "deep-thinker",
  "description": "3D hero scene analysis",
  "prompt": "I need you to perform a comprehensive technical and artistic analysis of a Three.js hero scene component. I will provide you with the complete source code of the scene, and you must systematically examine every dimension and provide detailed, actionable recommendations.\n\n## CURRENT SCENE OVERVIEW\n\nThis is a construction/handyman business website hero section featuring:\n- Three.js r134 with WebGL2\n- Post-processing: EffectComposer + UnrealBloomPass\n- Three particle systems (amber dust: 6000 particles, sparks: 2800 particles, haze: 4000 particles on desktop)\n- Three tools: Hammer (procedural), Wrench (GLB/procedural fallback), Saw (GLB/procedural fallback)\n- Complex vortex physics with cursor interaction, turbulence modes, tool proximity effects\n- Assembly/disassembly animations\n- Multiple dynamic lights reacting to scene state\n- Mobile/responsive support with quality tiers\n\n## ANALYSIS DIMENSIONS - You must address ALL of these:\n\n### 1. PARTICLE SYSTEMS AUDIT (CRITICAL - 30% of analysis)\nCurrent state:\n- Amber dust: main ember-like particles with vertex colors (white-hot to red-orange)\n- Spark system: blue-white secondary particles  \n- Haze: fine sand particles at high count\n- Physics: vortex with gravity well/turbulence modes, shockwave/implosion, saw aerodynamic induction, tool proximity forces\n- Canvas-generated radial gradient textures with corona rings\n\n**Transform to world-class**: How can this feel like Aladdin's golden sand, Fantasia's enchanted choreography, Dune's ethereal motes? Focus on:\n- Curl noise, turbulence fields, fluid simulation approximations\n- Multi-layered systems at different scales\n- Particle-to-geometry interaction (deflection, vortices)\n- Light scattering through particles\n- Emergent organic patterns\n- Trails, clumping, nebulous clouds\n\n### 2. LIGHTING AUDIT (25% of analysis)\nCurrent lights:\n- Ambient (very dim, 0.04)\n- RectAreaLight key (warm amber, upper left)\n- RectAreaLight fill (cool blue, right)\n- RectAreaLight rim (overhead-rear)\n- PointLight groundGlow (warm from below)\n- PointLight orbitLight (animating, warm amber)\n- SpotLight sawSpot (on blade apex)\n- Dynamic: vortexLight, sparkLight, cloudKeyLight, floorRimLight, sawParticleGlow\n- PMREM environment map from canvas gradient\n\n**Evaluate**: Volumetrics? God rays? Caustics? Light scattering? Material response quality?\n\n### 3. ANIMATION & MOTION QUALITY (20% of analysis)\nCurrent animations:\n- Assembly intro with spring easing\n- Idle rotations with different frequencies\n- Float/bob with sin/cos offsets\n- Spin animations with easeInOut\n- Drag inertia\n- Disassembly spread\n- Scan line sweep\n- Camera spring physics with parallax\n- Tool hover tilts\n\n**Assess**: Motion curves quality, secondary motion, procedural variation, reactive behaviors\n\n### 4. INTERACTIVITY UX (15% of analysis)\nCurrent interactions:\n- Mouse tracking for camera parallax and particle vortex\n- Raycasting for tool hover/click\n- Drag-to-rotate tools\n- Double-click disassembly\n- Right-click reverse gravity\n- Middle-click freeze/slingshot\n- Spacebar saw lock\n- Keyboard shortcuts (H, W, S)\n- Touch: single touch gravity, pinch explosion/implosion, swipe gestures\n\n**Evaluate**: Discoverability, delight moments, responsive feedback\n\n### 5. ARTISTIC COMPOSITION (10% of analysis)\n- Color palette: warm amber/orange (#e8a840, #c97512) + cool blue (#4488cc)\n- Atmosphere: dark construction workshop vibe\n- Tool arrangement: triangular composition\n- Background: fog + grids + debris fragments\n\n**Assess**: Color harmony, visual hierarchy, emotional resonance\n\n## OUTPUT FORMAT\n\nStructure your response as:\n\n### Executive Summary\n- Current quality level (1-10)\n- Biggest opportunities for visual impact\n- Quick wins vs. major investments\n\n### Detailed Findings by Dimension\nFor each dimension above:\n1. Current State Assessment (what's working, what's lacking)\n2. Technical Analysis (implementation details)\n3. World-Class References (cite specific films/effects)\n4. Actionable Recommendations (prioritized)\n   - Quick wins (low effort, high impact)\n   - Medium investments \n   - Major enhancements (high effort, transformative)\n\n### Prioritized Roadmap\nTable format: Priority | Improvement | Impact | Effort | Dependencies\n\n### Technical Implementation Notes\n- Specific shader approaches\n- Performance considerations\n- Three.js techniques to employ\n\nFocus on providing SPECIFIC, TECHNICAL recommendations that a developer can implement. Reference specific Three.js features, shader techniques, and visual effects. Cite inspiration from films like Aladdin (2019), Dune, Fantasia, Blade Runner 2049 where relevant."
}
```

**Output:**
```
task_id: ses_31fc2f6c6ffeF9pXJdTdCoa7AV (for resuming to continue this task if needed)

<task_result>
 Now I'll perform the comprehensive analysis using the skills and framework concepts.

---

## 🎨 Three.js Hero Scene — Technical & Artistic Analysis

### Executive Summary

**Current Quality Level: 7.5/10**

This is a **technically sophisticated** scene with impressive particle physics, but it falls short of the world-class visual storytelling seen in films like *Dune* (2021) or *Blade Runner 2049*. The code reveals deep technical investment in vortex physics, yet the **aesthetic execution** needs refinement to achieve the ethereal, cinematic quality desired.

**Biggest Opportunities for Visual Impact:**
1. **Particle System Transformation** — Currently feels like embers; should feel like *Aladdin* golden sand choreography
2. **Volumetric Atmosphere** — Missing the hazy depth of *Dune* or *Blade Runner 2049*
3. **Material Quality** — Tools lack the "hero shot" material sophistication

**Quick Wins vs. Major Investments:**
- **Quick wins** (2-4 hours): Bloom tuning, particle blending modes, scan-line animation polish
- **Medium investments** (1-2 days): Curl noise integration, material refinement, shadow quality
- **Major enhancements** (3-5 days): Volumetric fog, ray-marched god rays, procedural shader textures

---

## 1. PARTICLE SYSTEMS AUDIT (30%)

### Current State Assessment

**What's Working:**
- ✅ Sophisticated vortex physics with 3 interaction modes (gravity well, turbulence, reverse gravity)
- ✅ Tool proximity forces create tool-specific behaviors (hammer = down-column, wrench = spiral, saw = fan scatter)
- ✅ Vertex-colored particles with temperature variation (amber: white-hot → red-orange)
- ✅ Saw aerodynamic induction creates tangential circulation from spinning blade
- ✅ Assembly/disassembly animations with spring easing

**What's Lacking:**
- ❌ No curl noise or organic turbulence — movement feels computational, not fluid
- ❌ Single-scale particles — missing multi-layered depth
- ❌ No particle-to-geometry interaction (deflection, vortices around tools)
- ❌ Limited light scattering — particles don't respond to scene lighting
- ❌ No trails, clumping, or nebulous cloud formations
- ❌ Static appearance — no shimmer, pulse, or life-like breathing

### Technical Analysis

**Current Architecture:**
```javascript
// Three separate systems with similar update loops
const amberSystem = createParticleSystem(AMBER_COUNT, 11);  // 6000 particles
const sparkSystem = createParticleSystem(SPARK_COUNT, 6);   // 2800 particles  
const hazeSystem = createParticleSystem(HAZE_COUNT, 18);    // 4000 particles

// Physics update in JS per-frame — O(n) per system
function updateVortexPhysics(system, mouseWorldPos, delta) {
  // Tangential force, radial force, entropy, damping...
  // ~200 lines of physics calculations
}
```

**Bottleneck:** All 12,800 particles updated in JavaScript every frame. At 60fps on desktop, this is acceptable, but on mobile (reduced to ~2500 particles), the physics complexity is overkill.

### World-Class References

| Film/Effect | Reference Technique | Application |
|-------------|---------------------|-------------|
| **Dune (2021)** | Volumetric sand motes with light scattering | Apply H.G. scattering to particles, match color temp to scene |
| **Aladdin (2019)** | Golden sand choreography — curl noise paths | Implement 3D curl noise for organic, "alive" movement |
| **Blade Runner 2049** | Holographic dust in Las Vegas scene | Add chromatic aberration + anisotropic scattering to particles |
| **Fantasia (1940)** — The Rite of Spring | Organic, evolving patterns | Multi-scale particle layers with scale-dependent behaviors |
| **Interstellar** | Tesseract particle field | Velocity-aligned trails with temporal accumulation |

### Actionable Recommendations

#### 🔥 Quick Wins (Low Effort, High Impact)

1. **Enable Soft Particles (Depth-Aware Blending)**
   ```javascript
   // Add to particle material
   depthWrite: false,
   depthTest: true, // Currently false — enable for soft occlusion
   transparent: true,
   opacity: 0.6,
   alphaTest: 0.01, // Cut hard edges
   ```

2. **Add Temporal Jitter for Organic Movement**
   ```javascript
   // In updateVortexPhysics, add perlin-like drift
   const time = performance.now() * 0.001;
   const driftX = Math.sin(time + i * 0.1) * 0.0001;
   const driftY = Math.cos(time * 0.7 + i * 0.15) * 0.00008;
   vx += driftX;
   vy += driftY;
   ```

3. **Particle Size Variance on Velocity**
   ```javascript
   // Particles stretch when moving fast (motion blur effect)
   const speed = Math.sqrt(vx*vx + vy*vy + vz*vz);
   const stretch = 1 + speed * 5;
   // Apply as scale in shader or vertex attribute
   ```

#### 🔧 Medium Investments

4. **Implement 3D Curl Noise** (500 lines)
   ```javascript
   // Simplex-based curl noise for organic turbulence
   function curlNoise(x, y, z, time) {
     // Returns {x, y, z} rotation-free vector field
     // Use for ambient drift + turbulence
   }
   
   // In physics update:
   if (VORTEX_PARAMS.turbulenceMode > 0.3) {
     const curl = curlNoise(px * 0.5, py * 0.5, pz * 0.5, time * 0.0005);
     vx += curl.x * 0.0002;
     vy += curl.y * 0.0002;
     vz += curl.z * 0.0002;
   }
   ```

5. **Multi-Scale Particle System**
   ```javascript
   // Add a 4th "micro-dust" layer
   const MICRO_COUNT = 8000; // Very small, fast-updating
   const microMat = new THREE.PointsMaterial({
     size: 0.015, // Much smaller
     opacity: 0.25,
     color: 0xaa8855,
     blending: THREE.AdditiveBlending,
   });
   // Simplified physics (no tool proximity) for performance
   ```

6. **Particle-to-Geometry Deflection**
   ```javascript
   // SDF-based collision with tool bounding volumes
   function getToolSDF(point, toolBounds) {
     // Return signed distance to nearest tool surface
     // Negative = inside, positive = outside
   }
   
   // In physics: if sdf < 0.5, push particle along gradient
   ```

#### 🚀 Major Enhancements

7. **Custom Particle Shader Material** (Transform to GPU)
   ```glsl
   // vertex shader: pass velocity, color temp, age
   // fragment shader: radial gradient with chromatic aberration
   // Add: sub-surface scattering approximation for "ember" glow
   ```

8. **Volumetric Particle Lighting**
   - Use `THREE.WebGLRenderTarget` to render particle depth
   - Implement ray-marched god rays from lights through particle volume
   - Reference: *Dune* sandstorm volumetrics

9. **Trail System for Fast Particles**
   - Store previous 8 positions per particle
   - Render as connected line segments with fading opacity
   - Cost: High (requires geometry update) — consider compute shader

---

## 2. LIGHTING AUDIT (25%)

### Current State Assessment

**Light Inventory (8 total):**
1. Ambient (0.04) — extremely dim, as intended
2. RectAreaLight key (warm amber, upper left, 0.18 intensity)
3. RectAreaLight fill (cool blue, right, 0.15 intensity)
4. RectAreaLight rim (overhead-rear, 0.12 intensity)
5. PointLight groundGlow (warm from below, 0.18 intensity)
6. PointLight orbitLight (animating, warm amber, 0.25 intensity)
7. SpotLight sawSpot (on blade apex, 0.6 intensity)
8. Dynamic: vortexLight, sparkLight, cloudKeyLight, floorRimLight, sawParticleGlow

**What's Working:**
- ✅ Three-point lighting setup (key/fill/rim) is cinematographically sound
- ✅ Warm/cool color contrast creates depth
- ✅ Dynamic lights respond to interaction (vortex follows cursor)
- ✅ RectAreaLights provide soft, realistic reflections on metals

**What's Lacking:**
- ❌ **No volumetrics** — fog is simple exponential, no light scattering
- ❌ **No god rays / light shafts** — crucial for "golden hour" mood
- ❌ **No caustics** — metal tools should project caustic patterns on floor
- ❌ **Limited material response** — MeshStandardMaterial is basic; missing clearcoat layers
- ❌ **Static fog** — should breathe with particle turbulence
- ❌ **No screen-space reflections** — floor plane reflections are environment-only

### Technical Analysis

**Environment Map Generation:**
```javascript
// Canvas-generated equirectangular map — clever but low-resolution
const envCvs = document.createElement('canvas');
envCvs.width = 512; envCvs.height = 256; // 512×256 is very low for IBL
const envMap = pmrem.fromEquirectangular(envTex);
// Result: 128×128 effective resolution per face
```

**Recommendation:** Increase to 1024×512 minimum, or use `RoomEnvironment` from Three.js examples.

**Bloom Configuration:**
```javascript
bloomPass = new THREE.UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.40,  // strength
  0.22,  // radius — tight halo
  0.55   // threshold
);
```

**Issue:** Radius=0.22 is very tight, creating artificial-looking halos. **Reference:** *Blade Runner 2049* uses wide, soft bloom (radius 0.6-0.8) with multi-resolution layering.

### World-Class References

| Film | Technique | Application |
|------|-----------|-------------|
| **Dune (2021)** — Arrakis sunlight | Volumetric god rays through dust | Add `VolumetricGodRaysPass` or custom shader |
| **Blade Runner 2049** — Las Vegas | Hazy volumetric fog with anisotropic scattering | Replace `FogExp2` with custom depth-based volumetric shader |
| **Interstellar** — Miller's planet | Caustic light patterns from reflections | Implement SSR + caustic projection on floor |
| **Aladdin (2019)** — Cave of Wonders | Golden caustics and volumetric sparkles | Dynamic light shafts responding to camera |

### Actionable Recommendations

#### 🔥 Quick Wins

1. **Expand Bloom Radius & Add Threshold Variation**
   ```javascript
   bloomPass.radius = 0.45; // Was 0.22
   bloomPass.strength = 0.35; // Slightly lower base
   
   // In animate loop: vary threshold for "pulsing" bloom
   bloomPass.threshold = 0.55 - VORTEX_PARAMS.turbulenceMode * 0.15;
   ```

2. **Add Subtle Caustics to Floor**
   ```javascript
   // Project saw/hub glow as animated caustic pattern
   const causticLight = new THREE.SpotLight(0xff8800, 0.3);
   causticLight.map = createCausticTexture(); // Animated noise texture
   causticLight.position.copy(sawGroup.position);
   causticLight.target = floorPlane;
   ```

3. **Fog Density Breathing**
   ```javascript
   // In animate: fog density responds to turbulence
   const fogBreath = 0.055 + VORTEX_PARAMS.turbulenceMode * 0.015;
   scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, fogBreath, 0.02);
   ```

#### 🔧 Medium Investments

4. **Upgrade Materials to MeshPhysicalMaterial**
   ```javascript
   // Hammer head — add clearcoat for "oiled steel" look
   const steelMat = new THREE.MeshPhysicalMaterial({
     color: 0x5a5a62,
     roughness: 0.08,
     metalness: 0.97,
     clearcoat: 0.3,
     clearcoatRoughness: 0.1,
     envMapIntensity: 0.8,
   });
   
   // Wood handle — add sheen for "polished" look
   const woodMat = new THREE.MeshPhysicalMaterial({
     color: 0xc8952a,
     roughness: 0.85,
     sheen: 0.2,
     sheenColor: 0xffaa44,
   });
   ```

5. **Implement Screen-Space Reflections (SSR)**
   - Use `THREE.SSRPass` from examples (requires Three.js r150+)
   - Alternative: Use `CubeCamera` to capture real-time reflections
   - Target: Floor plane should reflect tools dynamically

6. **Volumetric Light Shafts**
   ```javascript
   // Custom shader material for cone geometry
   const godRayMat = new THREE.ShaderMaterial({
     vertexShader: godRayVert,
     fragmentShader: godRayFrag,
     transparent: true,
     blending: THREE.AdditiveBlending,
     depthWrite: false,
     uniforms: {
       lightPos: { value: new THREE.Vector3() },
       lightColor: { value: new THREE.Color(0xffaa44) },
       density: { value: 0.5 },
       decay: { value: 0.95 },
       weight: { value: 0.4 },
       exposure: { value: 0.6 },
     }
   });
   ```

#### 🚀 Major Enhancements

7. **Real-Time Environment Map Updates**
   - Use `CubeCamera` positioned at scene center
   - Update every 30 frames (not every frame) for performance
   - Tools will reflect actual scene, not just canvas gradient

8. **Volumetric Fog Shader**
   - Replace `THREE.FogExp2` with custom ray-marched volumetrics
   - Particles cast "shadows" in fog volume
   - Reference: NVIDIA's "Volumetric Fog" GDC presentation

9. **Anisotropic Specular on Metals**
   ```javascript
   // For brushed steel look on hammer head
   anisotropy: 0.8,
   anisotropicDirection: new THREE.Vector2(1, 0),
   ```

---

## 3. ANIMATION & MOTION QUALITY (20%)

### Current State Assessment

**Animation Systems:**
- Assembly intro: Spring easing (easeOutSpring with ~12% overshoot)
- Idle rotations: Different frequencies (hammer 0.00018, wrench -0.00014)
- Float/bob: Sin/cos with phase offsets (3.2s, 4.1s, 5.0s periods)
- Spin animations: 820ms duration with easeInOut
- Drag inertia: Velocity decay (0.92 multiplier per frame)
- Disassembly: Spread with rotation (900ms, easeOut)
- Scan line: Linear sweep across grid
- Camera: Spring physics (K=180, C=18, ~8% overshoot)

**What's Working:**
- ✅ Spring physics on camera creates organic, non-mechanical feel
- ✅ Differentiated float periods prevent synchronized bobbing
- ✅ Inertia on drag release feels physical
- ✅ Assembly animation has satisfying "snap"

**What's Lacking:**
- ❌ Limited secondary motion — tools feel rigid, no anticipation/follow-through
- ❌ No squash/stretch on interactions
- ❌ Scan line is linear — no easing, no depth perception
- ❌ Particle animations lack "anticipation" (build-up before blast)
- ❌ Missing micro-animations (tool vibration on hover, subtle tremble)

### Technical Analysis

**Spring Physics Implementation:**
```javascript
// Semi-implicit Euler — correct but could use RK4 for stability
const dt = delta / 1000;
camVelX += (SPRING_K * (targetRotX + swayX - camRotX) - SPRING_C * camVelX) * dt;
camRotX += camVelX * dt;
```

**Issue:** Fixed timestep would improve consistency across frame rates.

### World-Class References

| Reference | Technique | Application |
|-----------|-----------|-------------|
| **Pixar's 12 Principles** — Squash & Stretch | Objects deform under acceleration | Add subtle scale pulse on tool interactions |
| **Disney — Anticipation** | Wind-up before action | Particle "charge-up" before shockwave |
| **Mantis/Dogstudio sites** | Secondary motion chains | Tool parts should have delayed follow-through |
| **Blade Runner 2049** — Hologram flicker | Imperfect, analog motion | Add micro-jitter to scan line, particle shimmer |

### Actionable Recommendations

#### 🔥 Quick Wins

1. **Add Tool Hover Micro-Animation**
   ```javascript
   // In animate loop, when hovered:
   if (hoveredTool === id) {
     const hoverTime = performance.now() * 0.008;
     const breathe = Math.sin(hoverTime) * 0.008;
     toolGroup.scale.setScalar(1 + breathe);
     // Subtle rotation wobble
     toolGroup.rotation.z += Math.sin(hoverTime * 1.3) * 0.001;
   }
   ```

2. **Anticipation Before Shockwave**
   ```javascript
   // On click: particles gather slightly before exploding
   function applyVortexShockwave(system, clickWorldPos) {
     // Phase 1: Gather (100ms)
     // Phase 2: Explode (shockwave)
     // Phase 3: Implosion pull-back
   }
   ```

3. **Scan Line with Easing**
   ```javascript
   // Replace linear scan with easeInOut
   const scanFrac = easeInOut((time * 0.00028) % 1.0);
   ```

#### 🔧 Medium Investments

4. **Secondary Motion on Tool Parts**
   ```javascript
   // When parent tool moves, child parts lag behind
   // Store velocity, apply spring constraint to each part
   hammerParts.forEach((part, i) => {
     const lag = (i + 1) * 0.05; // Different lag per part
     part.position.x += (hammerGroup.position.x - part.userData.prevX) * lag;
     part.userData.prevX = part.position.x;
   });
   ```

5. **Particle "Breathing" Phase Sync**
   ```javascript
   // Sync particle pulse with tool float
   const globalBreath = Math.sin(time * 0.0005) * 0.5 + 0.5;
   VORTEX_PARAMS.breatheAmplitude = 0.0006 * globalBreath;
   ```

6. **Camera Shake on Interactions**
   ```javascript
   // Add trauma-based shake (GC/Wobble technique)
   let trauma = 0;
   // On shockwave: trauma += 0.5
   // In animate:
   const shake = trauma * trauma; // Quadratic decay
   camera.position.x += (Math.random() - 0.5) * shake;
   trauma -= 0.02; // Decay
   ```

#### 🚀 Major Enhancements

7. **Procedural Animation System**
   - Define animation clips as state machines
   - Blend between idle, hover, active states
   - Reference: Unity's Mecanim or Blender's Action Editor

8. **Physics-Based Secondary Motion**
   - Use Verlet integration for tool chains/cables
   - Implement constraint solving for articulated parts

9. **Cinematic Camera Moves**
   - Add "dolly zoom" effect on scroll
   - Implement rack focus (depth of field) changing with interaction

---

## 4. INTERACTIVITY UX (15%)

### Current State Assessment

**Input Mapping:**
| Input | Action | Feedback |
|-------|--------|----------|
| Mouse move | Camera parallax, vortex center | Cursor change, tooltip |
| Hover tool | Tooltip + ripple ring | Visual ripple, emissive boost |
| Click tool | Spin + open panel | Rotation animation, panel slide |
| Double-click tool | Disassembly | Parts spread with sparks |
| Drag tool | Rotate | "Grabbing" cursor, inertia on release |
| Click empty | Shockwave + implosion | Particle blast, light flash |
| Right-click | Reverse gravity | Temporary state change |
| Middle-click | Freeze + slingshot | Delayed explosion |
| Double-click empty | Detonation burst | Big particle blast |
| Spacebar | Saw lock at max speed | Speed boost, visual burst |
| Keyboard H/W/S | Tool panels | Panel open + sparks |
| Touch pinch | Explosion/implosion | Vortex physics |
| Touch swipe | Spin tools / scatter | Inertia transfer |

**What's Working:**
- ✅ Rich interaction vocabulary — "power user" feel
- ✅ Keyboard shortcuts for accessibility
- ✅ Touch gestures map logically to physics
- ✅ Tool proximity creates distinct force signatures

**What's Lacking:**
- ❌ **Discoverability crisis** — No UI hints for most interactions
- ❌ **No onboarding** — Users discover features by accident
- ❌ **Inconsistent affordances** — Middle-click is hidden
- ❌ **No progress indication** — Slingshot charge invisible
- ❌ **Missing haptic feedback** — No vibration API usage

### World-Class References

| Experience | Technique | Application |
|------------|-----------|-------------|
| **Apple Vision Pro** | Progressive disclosure | Show basic interactions first, advanced later |
| **Game: Journey** | Environmental teaching | Particles naturally attract to cursor; no tutorial needed |
| **Nintendo** — "Kishōtenketsu" | Learn without explicit instruction | Structure: introduction → development → twist → conclusion |
| **Airbnb** | Contextual hints | Tooltip: "Drag to rotate • Double-click to explode" |

### Actionable Recommendations

#### 🔥 Quick Wins

1. **Add Contextual Hint Tooltip**
   ```javascript
   // After 3 seconds of no interaction on a tool
   const hintEl = document.createElement('div');
   hintEl.textContent = 'Drag to spin • Double-click to burst';
   hintEl.className = 'tool-hint fade-in';
   // Auto-dismiss after 5 seconds or on interaction
   ```

2. **Visual Slingshot Charge Indicator**
   ```javascript
   // Middle-click: show growing circle around cursor
   // Release: trigger explosion
   const chargeRing = document.createElement('div');
   chargeRing.style.cssText = `
     position: fixed;
     border: 2px solid #4488cc;
     border-radius: 50%;
     pointer-events: none;
     transition: transform 0.6s ease;
   `;
   // Scale from 0 to 1 over 600ms
   ```

3. **Onboarding Micro-Animation**
   ```javascript
   // First visit: subtle pulse on one tool
   if (!localStorage.getItem('hasInteracted')) {
     setTimeout(() => emitRipple('hammer'), 2000);
   }
   ```

#### 🔧 Medium Investments

4. **Interaction HUD**
   - Small, unobtrusive icons showing available actions
   - Fade in on hover, fade out on mouse leave
   - Position: Bottom-right of viewport

5. **Haptic Feedback (Mobile)**
   ```javascript
   // On interaction events
   if (navigator.vibrate && window.matchMedia('(pointer: coarse)').matches) {
     navigator.vibrate(50); // Short pulse
   }
   // On shockwave: navigator.vibrate([30, 50, 30]); // Pattern
   ```

6. **Gesture Trail Visualization**
   ```javascript
   // Draw faint line following cursor during fast movement
   // Shows "wind" effect that will affect particles
   ```

#### 🚀 Major Enhancements

7. **Interactive Tutorial Mode**
   - Step-by-step walkthrough of key features
   - "Try dragging the hammer" with animated hand cursor
   - Skip option for returning users

8. **Gesture Recognition System**
   - Recognize drawn shapes (circle = spin, zigzag = scatter)
   - Machine learning-based classification
   - Adds "magic spell" feel to interactions

9. **Accessibility Mode**
   - Reduce particle count for cognitive accessibility
   - Add keyboard-only navigation path
   - Screen reader announcements for interactions

---

## 5. ARTISTIC COMPOSITION (10%)

### Current State Assessment

**Color Palette:**
- **Primary:** Warm amber/orange (#e8a840, #c97512) — construction, warmth
- **Secondary:** Cool blue (#4488cc) — tech, trust
- **Background:** Near-black (#030405) with warm tint

**Composition:**
- Triangular tool arrangement (hammer left, wrench right, saw back)
- Diagonal grid lines create depth
- Vignette overlay focuses attention
- Golden ratio positioning (approximately)

**What's Working:**
- ✅ Strong warm/cool contrast creates visual interest
- ✅ Tools have clear silhouettes against dark background
- ✅ Blueprint aesthetic (grids, cyan scan line) reinforces theme
- ✅ Typography uses Fraunces (display) + DM Sans (body) — good pairing

**What's Lacking:**
- ❌ **No focal point hierarchy** — All tools compete for attention
- ❌ **Flat depth layering** — Z-depth separation insufficient
- ❌ **Missing color temperature variation** — Everything is warm
- ❌ **No atmospheric perspective** — Background debris same saturation as foreground
- ❌ **Scan line too subtle** — Lost in the composition

### World-Class References

| Film/Brand | Technique | Application |
|------------|-----------|-------------|
| **Dune (2021)** — Color grading | Split-tone: warm highlights, cool shadows | Apply to scene via post-processing |
| **Mubi.com** — Cinematic composition | Strong focal point with radial falloff | Emphasize one tool, de-emphasize others |
| **Awwwards winners** — Typography as image | Headline integrates with 3D scene | Position text within depth layers |
| **lhbzr.com** — Dramatic lighting | High contrast, selective illumination | Darken tools not in focus |

### Actionable Recommendations

#### 🔥 Quick Wins

1. **Strengthen Focal Point**
   ```javascript
   // Hammer is primary: boost its emissive, dim others
   const focalBoost = 1.3;
   hammerGroup.traverse(obj => {
     if (obj.material && obj.material.emissive) {
       obj.material.emissiveIntensity *= focalBoost;
     }
   });
   ```

2. **Add Color Temperature Gradient**
   ```javascript
   // Background: cooler, desaturated
   // Foreground: warmer, saturated
   fragmentGroup.children.forEach((frag, i) => {
     const z = frag.position.z;
     const temp = THREE.MathUtils.mapLinear(z, -18, 0, 0, 1);
     frag.material.color.setHSL(0.08 + temp * 0.02, 0.3 + temp * 0.4, 0.2 + temp * 0.3);
   });
   ```

3. **Enhance Scan Line Visibility**
   ```css
   /* CSS for scan line */
   #scan-line {
     box-shadow: 0 0 8px 2px rgba(68, 136, 204, 0.6);
     animation: scanPulse 2s ease-in-out infinite;
   }
   @keyframes scanPulse {
     0%, 100% { opacity: 0.6; }
     50% { opacity: 1; }
   }
   ```

#### 🔧 Medium Investments

4. **Depth-of-Field Effect**
   ```javascript
   // Add BokehPass or custom depth blur
   // Focus on hammer (z ≈ 2.0), blur saw (z ≈ -0.5)
   const bokehPass = new THREE.BokehPass(scene, camera, {
     focus: 2.0,
     aperture: 0.005,
     maxblur: 0.01,
     width: window.innerWidth,
     height: window.innerHeight
   });
   composer.addPass(bokehPass);
   ```

5. **Vignette Animation**
   ```javascript
   // Vignette breathes with interaction
   const vigOpacity = 0.45 + VORTEX_PARAMS.turbulenceMode * 0.15;
   document.getElementById('scene-vignette').style.opacity = vigOpacity;
   ```

6. **Typography Integration**
   ```css
   /* Position hero text in 3D space */
   #hero-copy {
     transform: translateZ(100px); /* Push forward in depth */
     text-shadow: 0 4px 20px rgba(0,0,0,0.5); /* Depth cue */
   }
   ```

#### 🚀 Major Enhancements

7. **Cinematic Color Grading**
   - Implement LUT (Look-Up Table) post-processing
   - Warm highlights, teal shadows (popular film grade)
   - Reference: *Blade Runner 2049*, *Dune*

8. **Procedural Composition Adjustment**
   - Use golden ratio dynamic repositioning based on viewport
   - Tools subtly shift to maintain composition on resize

9. **Atmospheric Particles in Foreground**
   - Add dust motes floating in front of camera
   - Defocused, large particles for depth
   - Animate with parallax (move slower than camera)

---

## Prioritized Roadmap

| Priority | Improvement | Impact | Effort | Dependencies |
|----------|-------------|--------|--------|--------------|
| **P0** | Increase bloom radius (0.22 → 0.45) | High | 5 min | None |
| **P0** | Add particle soft edges (alphaTest) | High | 10 min | None |
| **P0** | Contextual tool hints | High | 2 hrs | None |
| **P1** | Implement curl noise (basic) | Very High | 4 hrs | None |
| **P1** | Upgrade materials to Physical | High | 3 hrs | None |
| **P1** | Add depth fog breathing | Medium | 1 hr | None |
| **P2** | SSR on floor plane | High | 1 day | Three.js r150+ |
| **P2** | Volumetric god rays | Very High | 2 days | Custom shaders |
| **P2** | Multi-scale particle layers | High | 6 hrs | None |
| **P3** | Custom particle shaders | Very High | 3 days | GLSL expertise |
| **P3** | Real-time env map | Medium | 2 days | CubeCamera |
| **P3** | LUT color grading | Medium | 1 day | Post-processing |

---

## Technical Implementation Notes

### Performance Budgets

**Desktop (60fps):**
- Particles: ~12,000 total (current: acceptable)
- Lights: 8 (ok with RectAreaLight optimization)
- Draw calls: < 50 (batch geometries where possible)

**Mobile (30fps):**
- Particles: 2,500 (already implemented)
- Disable bloom on low-end (already implemented)
- Reduce shadow map resolution (already implemented)

### Shader Techniques to Employ

1. **Curl Noise** (3D rotation-free vector field):
   ```glsl
   vec3 curlNoise(vec3 p) {
     float eps = 0.01;
     vec3 dx = vec3(eps, 0, 0);
     vec3 dy = vec3(0, eps, 0);
     vec3 dz = vec3(0, 0, eps);
     
     float x = noise(p + dy).z - noise(p - dy).z
              - noise(p + dz).y + noise(p - dz).y;
     // ... similar for y, z
     return normalize(vec3(x, y, z));
   }
   ```

2. **Volumetric Scattering** (Ray marching):
   ```glsl
   // March from camera to fragment
   for (float t = 0.0; t < maxDist; t += step) {
     vec3 pos = ro + rd * t;
     float density = getDensity(pos);
     accum += density * lightIntensity(pos) * transmittance;
     transmittance *= exp(-density * absorption);
   }
   ```

3. **Anisotropic Specular** (Brushed metal):
   ```glsl
   float D_GGX_Anisotropic(float NoH, float HoX, float HoY, float ax, float ay) {
     float tmp = pow(HoX / ax, 2.0) + pow(HoY / ay, 2.0) + NoH * NoH;
     return 1.0 / (PI * ax * ay * tmp * tmp);
   }
   ```

### Three.js Version Considerations

**Current: r134**
- Missing: MeshPhysicalMaterial improvements (iridescence, anisotropy)
- Missing: Modern post-processing (Pass.js overhaul)
- Recommendation: Upgrade to r160+ for better SSR, improved bloom

**Breaking Changes to Watch:**
- `outputEncoding` → `outputColorSpace`
- `RectAreaLight` API unchanged
- Post-processing structure changed significantly

---

## Conclusion

This scene demonstrates **exceptional technical craftsmanship** in particle physics and interaction design. The vortex system is genuinely sophisticated, and the tool-specific force signatures show thoughtful design.

To reach **world-class visual quality**, prioritize:

1. **Particle organicism** — Curl noise and multi-scale layering
2. **Atmospheric depth** — Volumetrics and improved fog
3. **Material sophistication** — Physical materials with clearcoat/anisotropy
4. **Color grading** — Cinematic split-tone LUT
5. **UX clarity** — Onboarding and discoverability

The foundation is solid. With these enhancements, this could become a showcase piece rivaling the best WebGL experiences from Active Theory, Mantis, or Dogstudio.
</task_result>
```

---

## Assistant (Plan · moonshotai/kimi-k2.5 · 76.8s)

_Thinking:_

  The deep-thinker agent has provided an incredibly comprehensive analysis. Now I should synthesize this into a concise, well-structured response for the user. Let me present the key findings in an organized format that

 # 🎨 3D Hero Scene Comprehensive Analysis

## Executive Summary

**Current Quality Level: 7.5/10**

Your scene demonstrates exceptional technical sophistication—particularly the vortex physics system with tool-specific force signatures. However, it falls short of world-class cinematic quality like *Dune* (2021) or *Blade Runner 2049*. The gap is primarily in **aesthetic execution** rather than technical capability.

**Biggest Opportunities:**
1. Particle organicism—transform computational embers into Aladdin's golden sand
2. Volumetric atmosphere—add the hazy depth of *Dune*
3. Material sophistication—upgrade to "hero shot" quality

---

## 1. PARTICLE SYSTEMS AUDIT 🌟

### Current State
Your system is technically impressive:
- ✅ 12,800 particles across 3 layers (amber/spark/haze)
- ✅ Sophisticated vortex physics with 3 interaction modes
- ✅ Tool proximity forces (hammer=nail driving, wrench=spiral, saw=fan scatter)
- ✅ Vertex colors with temperature variation

### The Gap
The particles feel **computational, not alive**. Missing:
- Curl noise for organic, fluid-like movement
- Multi-scale depth layers
- Particle-to-geometry interaction (deflection around tools)
- Light scattering response
- Trails, clumping, nebulous formations

### World-Class Targets
| Film | Technique | Application |
|------|-----------|-------------|
| **Aladdin (2019)** | Golden sand choreography | Curl noise paths |
| **Dune (2021)** | Volumetric sand motes | Light scattering |
| **Blade Runner 2049** | Holographic dust | Chromatic aberration |

### Actionable Recommendations

**🔥 Quick Wins:**
```javascript
// 1. Enable soft particles (add to material)
depthWrite: false,
depthTest: true,  // Currently false—enable for soft occlusion
alphaTest: 0.01,  // Cut hard edges

// 2. Add temporal jitter for organic movement
const time = performance.now() * 0.001;
const driftX = Math.sin(time + i * 0.1) * 0.0001;
vx += driftX;
```

**🔧 Medium Investment:**
```javascript
// 3. Implement 3D curl noise (500 lines)
function curlNoise(x, y, z, time) {
  // Returns rotation-free vector field
  // Use for ambient drift + turbulence
}

// 4. Add micro-dust layer (4th system)
const MICRO_COUNT = 8000;
const microMat = new THREE.PointsMaterial({
  size: 0.015,
  opacity: 0.25,
  color: 0xaa8855
});
```

**🚀 Major Enhancement:**
```glsl
// 5. Custom particle shader with:
// - Velocity-aligned trails
// - Chromatic aberration
// - Sub-surface scattering for ember glow
// - Temporal accumulation
```

---

## 2. LIGHTING AUDIT 💡

### Current State
You have **8 lights** with good cinematographic foundation:
- ✅ Three-point setup (key/fill/rim)
- ✅ Warm/cool color contrast
- ✅ Dynamic lights responding to interaction
- ✅ PMREM environment map

### The Gap
- ❌ No volumetrics or god rays
- ❌ No caustics from metal tools
- ❌ Static fog (should breathe with turbulence)
- ❌ Environment map is 512×256 (too low-res)
- ❌ Bloom radius 0.22 is artificially tight

### World-Class Targets
| Film | Technique | Application |
|------|-----------|-------------|
| **Dune** | Volumetric god rays | Light shafts through particles |
| **Blade Runner 2049** | Anisotropic scattering | Hazy volumetric fog |
| **Interstellar** | Caustics | Light patterns on floor |

### Actionable Recommendations

**🔥 Quick Wins:**
```javascript
// 1. Expand bloom radius (0.22 → 0.45)
bloomPass.radius = 0.45;
// Vary threshold for "pulsing" bloom
bloomPass.threshold = 0.55 - VORTEX_PARAMS.turbulenceMode * 0.15;

// 2. Fog density breathing
const fogBreath = 0.055 + VORTEX_PARAMS.turbulenceMode * 0.015;
scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, fogBreath, 0.02);
```

**🔧 Medium Investment:**
```javascript
// 3. Upgrade to MeshPhysicalMaterial
const steelMat = new THREE.MeshPhysicalMaterial({
  color: 0x5a5a62,
  roughness: 0.08,
  metalness: 0.97,
  clearcoat: 0.3,        // Add clearcoat for "oiled steel"
  clearcoatRoughness: 0.1,
  anisotropy: 0.8,       // Brushed metal look
});
```

**🚀 Major Enhancement:**
```javascript
// 4. Real-time environment updates
const cubeCamera = new THREE.CubeCamera(0.1, 100, 256);
// Update every 30 frames for reflections of actual scene
```

---

## 3. ANIMATION & MOTION QUALITY 🎬

### Current State
- ✅ Spring physics on camera (organic overshoot)
- ✅ Differentiated float periods prevent sync
- ✅ Inertia on drag release feels physical

### The Gap
- ❌ Limited secondary motion (tools feel rigid)
- ❌ No anticipation before particle blasts
- ❌ Scan line is linear (no easing)
- ❌ Missing micro-animations

### Actionable Recommendations

**🔥 Quick Wins:**
```javascript
// 1. Tool hover micro-animation
if (hoveredTool === id) {
  const breathe = Math.sin(time * 0.008) * 0.008;
  toolGroup.scale.setScalar(1 + breathe);
  toolGroup.rotation.z += Math.sin(time * 0.010) * 0.001;
}

// 2. Camera shake on shockwave
let trauma = 0;
// On shockwave: trauma += 0.5
// In animate: camera.position.x += (Math.random() - 0.5) * trauma * trauma;
```

**🔧 Medium Investment:**
```javascript
// 3. Secondary motion on tool parts
hammerParts.forEach((part, i) => {
  const lag = (i + 1) * 0.05;
  part.position.x += (hammerGroup.position.x - part.userData.prevX) * lag;
});
```

---

## 4. INTERACTIVITY UX 🖱️

### Current State
Rich interaction vocabulary but **discoverability crisis**:
- ✅ Keyboard shortcuts (H, W, S)
- ✅ Touch gestures (pinch, swipe)
- ✅ Right-click reverse gravity
- ❌ No UI hints for most interactions

### Actionable Recommendations

**🔥 Quick Wins:**
```javascript
// 1. Contextual hint tooltip
// After 3 seconds of no interaction:
hintEl.textContent = 'Drag to spin • Double-click to burst';
hintEl.className = 'tool-hint fade-in';

// 2. Visual slingshot charge indicator
// Middle-click: show growing circle around cursor
```

**🔧 Medium Investment:**
```javascript
// 3. Haptic feedback (mobile)
if (navigator.vibrate && isMobile) {
  navigator.vibrate(50); // Short pulse on interaction
}
```

---

## 5. ARTISTIC COMPOSITION 🎨

### Current State
- ✅ Strong warm/cool contrast
- ✅ Triangular tool arrangement
- ✅ Blueprint aesthetic

### The Gap
- ❌ No focal point hierarchy
- ❌ Flat depth layering
- ❌ Missing atmospheric perspective

### Actionable Recommendations

**🔥 Quick Wins:**
```javascript
// 1. Strengthen focal point (hammer is primary)
hammerGroup.traverse(obj => {
  if (obj.material?.emissive) {
    obj.material.emissiveIntensity *= 1.3;
  }
});

// 2. Color temperature by depth
fragmentGroup.children.forEach(frag => {
  const temp = THREE.MathUtils.mapLinear(frag.position.z, -18, 0, 0, 1);
  frag.material.color.setHSL(0.08 + temp * 0.02, 0.3 + temp * 0.4, 0.2 + temp * 0.3);
});
```

**🚀 Major Enhancement:**
```javascript
// 3. Cinematic color grading with LUT
const lutPass = new THREE.LUTPass();
// Warm highlights, teal shadows (film grade)
```

---

## Prioritized Roadmap

| Priority | Improvement | Impact | Effort |
|----------|-------------|--------|--------|
| **P0** | Increase bloom radius to 0.45 | High | 5 min |
| **P0** | Add particle soft edges (alphaTest) | High | 10 min |
| **P0** | Contextual tool hints | High | 2 hrs |
| **P1** | Basic curl noise implementation | Very High | 4 hrs |
| **P1** | Upgrade to MeshPhysicalMaterial | High | 3 hrs |
| **P2** | Screen-space reflections | High | 1 day |
| **P2** | Volumetric god rays | Very High | 2 days |
| **P3** | Custom particle shaders | Very High | 3 days |

---

## Conclusion

**Your foundation is exceptional.** The vortex physics, tool interactions, and particle systems demonstrate serious technical investment. To reach world-class, prioritize:

1. **Particle organicism** — curl noise makes them feel alive
2. **Atmospheric depth** — volumetrics create cinematic space
3. **Material quality** — Physical materials with clearcoat/anisotropy
4. **UX clarity** — onboarding and discoverability
5. **Color grading** — cinematic split-tone LUT

With these enhancements, this scene could rival work from Active Theory, Mantis, or Dogstudio. The technical sophistication is already there—you just need the **visual polish** to match.

---

