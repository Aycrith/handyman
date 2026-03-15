function getAssetBasename(assetPath) {
  if (!assetPath) return '';

  const normalize = (value) => {
    const decoded = value ? decodeURIComponent(value) : '';
    return decoded.replace(/-([A-Za-z0-9_]{8,})(\.[^.]+)$/u, '$2');
  };

  try {
    const parsed = new URL(assetPath, window.location.href);
    const name = parsed.pathname.split('/').pop();
    return normalize(name);
  } catch (_) {
    const segments = String(assetPath).split(/[\\/]/);
    return normalize(segments[segments.length - 1] || '');
  }
}

function applyAssetScenes(assets, handlers) {
  for (const [assetPath, gltf] of Object.entries(assets || {})) {
    const scene = gltf?.scene;
    if (!scene) continue;

    const handler = handlers[getAssetBasename(assetPath)];
    if (typeof handler === 'function') {
      handler(scene, gltf, assetPath);
    }
  }
}

export { getAssetBasename, applyAssetScenes };
