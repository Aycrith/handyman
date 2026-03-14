const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function ensureBuild(root) {
  const result = spawnSync(npmCommand, ['run', 'build'], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    throw new Error('Failed to build the Vite app before preview.');
  }
}

function waitForServer(url, timeoutMs = 20000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });

      req.on('error', () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Timed out waiting for preview server at ${url}`));
          return;
        }
        setTimeout(attempt, 200);
      });
    };

    attempt();
  });
}

function startStaticServer(rootPath, port) {
  const root = path.resolve(rootPath);
  ensureBuild(root);

  return new Promise((resolve, reject) => {
    const child = spawn(
      npmCommand,
      ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
      {
        cwd: root,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: process.platform === 'win32',
      }
    );

    let settled = false;
    const output = [];
    const record = (chunk) => {
      const text = chunk.toString();
      output.push(text);
      if (output.length > 20) output.shift();
    };

    child.stdout.on('data', record);
    child.stderr.on('data', record);

    child.once('exit', (code) => {
      if (settled) return;
      settled = true;
      reject(new Error(`Vite preview exited early with code ${code}\n${output.join('')}`));
    });

    waitForServer(`http://127.0.0.1:${port}/`)
      .then(() => {
        if (settled) return;
        settled = true;
        resolve({
          close: () => new Promise((closeResolve) => {
            child.once('exit', () => closeResolve());
            child.kill();
          }),
        });
      })
      .catch((error) => {
        if (settled) return;
        settled = true;
        child.kill();
        reject(error);
      });
  });
}

module.exports = { startStaticServer };
