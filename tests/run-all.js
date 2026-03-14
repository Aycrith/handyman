const { spawnSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const buildResult = spawnSync(npmCommand, ['run', 'build'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (buildResult.status !== 0) {
  process.exit(buildResult.status || 1);
}

const tests = [
  'validate-hero-assets.js',
  'validate-ui.js',
  'validate-effects.js',
  'validate-effects-desktop.js',
];

let failed = false;

for (const testFile of tests) {
  const fullPath = path.join(__dirname, testFile);
  const result = spawnSync(process.execPath, [fullPath], {
    cwd: root,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
