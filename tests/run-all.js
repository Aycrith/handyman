const { spawnSync, spawn } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

// Tests that require vite build + preview server (4173)
const PREVIEW_TESTS = ['validate-sections.js', 'validate-a11y.js'];
// Tests that start their own preview (or use vite dev internally)
const SELF_SERVE_TESTS = [
  'validate-hero-assets.js',
  'validate-ui.js',
  'validate-effects.js',
  'validate-effects-desktop.js',
];

// Build once
const buildResult = spawnSync(npmCommand, ['run', 'build'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (buildResult.status !== 0) {
  process.exit(buildResult.status || 1);
}

// Run self-serve tests first (they manage their own server)
let failed = false;
for (const testFile of SELF_SERVE_TESTS) {
  const fullPath = path.join(__dirname, testFile);
  const result = spawnSync(process.execPath, [fullPath], {
    cwd: root,
    stdio: 'inherit',
  });
  if (result.status !== 0) failed = true;
}

// Start preview server for section/a11y tests
let previewProc = null;
let previewStarted = false;

if (PREVIEW_TESTS.length > 0) {
  previewProc = spawn(npmCommand, ['run', 'preview'], {
    cwd: root,
    shell: process.platform === 'win32',
    stdio: 'pipe',
  });

  // Wait for preview server to be ready
  const waitForPreview = () => new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(false), 10000);
    previewProc.stdout.on('data', (data) => {
      const str = data.toString();
      if (str.includes('4173') || str.includes('Local')) {
        clearTimeout(timeout);
        resolve(true);
      }
    });
    previewProc.stderr.on('data', (data) => {
      const str = data.toString();
      if (str.includes('4173') || str.includes('Local')) {
        clearTimeout(timeout);
        resolve(true);
      }
    });
    // Fallback: just wait 3s
    setTimeout(() => { clearTimeout(timeout); resolve(true); }, 3000);
  });

  // Run preview-dependent tests
  waitForPreview().then(() => {
    for (const testFile of PREVIEW_TESTS) {
      const fullPath = path.join(__dirname, testFile);
      const result = spawnSync(process.execPath, [fullPath], {
        cwd: root,
        stdio: 'inherit',
      });
      if (result.status !== 0) failed = true;
    }

    if (previewProc) previewProc.kill();
    process.exit(failed ? 1 : 0);
  });
} else {
  process.exit(failed ? 1 : 0);
}
