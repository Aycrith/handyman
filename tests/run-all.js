const { spawnSync } = require('child_process');
const path = require('path');

const tests = [
  'validate-ui.js',
  'validate-effects.js',
  'validate-effects-desktop.js',
];

let failed = false;

for (const testFile of tests) {
  const fullPath = path.join(__dirname, testFile);
  const result = spawnSync(process.execPath, [fullPath], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
