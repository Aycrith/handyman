/**
 * src/scene/world-debug-overlay.js
 *
 * Renders a compact overlay showing world orchestrator state when ?sceneDebug=1.
 * Shows active world, transition progress, loaded worlds, and quality tier.
 */

let overlayEl = null;
let enabled = false;

function init() {
  const params = new URLSearchParams(window.location.search);
  enabled = params.get('sceneDebug') === '1' || params.get('sceneDebug') === 'true';
  if (!enabled) return;

  overlayEl = document.createElement('div');
  overlayEl.id = 'world-debug-overlay';
  Object.assign(overlayEl.style, {
    position: 'fixed',
    bottom: '12px',
    right: '12px',
    zIndex: '99999',
    background: 'rgba(0,0,0,0.82)',
    color: '#e0e0e0',
    fontFamily: 'monospace',
    fontSize: '11px',
    lineHeight: '1.5',
    padding: '10px 14px',
    borderRadius: '6px',
    pointerEvents: 'none',
    maxWidth: '320px',
    backdropFilter: 'blur(4px)',
    border: '1px solid rgba(255,255,255,0.08)',
  });
  document.body.appendChild(overlayEl);
}

function update(diagnostics) {
  if (!enabled || !overlayEl || !diagnostics || !diagnostics.enabled) return;

  const world = diagnostics.activeWorld || '—';
  const scroll = diagnostics.scrollProgress?.toFixed(3) || '0.000';
  const loaded = diagnostics.loadedWorlds?.join(', ') || 'none';
  const total = diagnostics.totalWorlds || 0;
  const tCount = diagnostics.transitionCount || 0;

  let transInfo = 'none';
  if (diagnostics.activeTransition) {
    const t = diagnostics.activeTransition;
    transInfo = `${t.from}→${t.to} [${t.technique}] ${(t.progress * 100).toFixed(1)}%`;
  }

  overlayEl.innerHTML =
    `<div style="color:#f0c040;font-weight:bold;margin-bottom:4px">World System</div>` +
    `<div>Active: <span style="color:#7df">${world}</span></div>` +
    `<div>Scroll: <span style="color:#aaa">${scroll}</span></div>` +
    `<div>Transition: <span style="color:#faa">${transInfo}</span></div>` +
    `<div>Loaded: <span style="color:#afa">${diagnostics.loadedWorlds?.length || 0}/${total}</span></div>` +
    `<div style="color:#888;font-size:10px;margin-top:4px">${loaded}</div>` +
    `<div style="color:#888;font-size:10px">Transitions: ${tCount}</div>`;
}

function dispose() {
  if (overlayEl && overlayEl.parentNode) {
    overlayEl.parentNode.removeChild(overlayEl);
  }
  overlayEl = null;
  enabled = false;
}

export { init as initWorldDebugOverlay, update as updateWorldDebugOverlay, dispose as disposeWorldDebugOverlay };
