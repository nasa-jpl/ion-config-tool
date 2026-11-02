import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import http from 'http';

const PIDS_FILE = path.join(process.cwd(), '.server-pids');
const EDITOR_DIR = path.join(__dirname, '../../');
const MOCK_SERVER_PATH = path.join(__dirname, 'mock-server.ts');

async function waitForServer(url: string, timeoutMs: number) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          if (res.statusCode === 200) resolve(true);
          else reject(new Error(`Status: ${res.statusCode}`));
        });
        req.on('error', reject);
        req.setTimeout(2000, () => req.destroy());
      });
      return true;
    } catch (e) {
      // Wait 1s before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`);
}

export default async function setup() {
  console.log('Starting servers...');

  // 0. Clean up any stale server processes from a previous run that were not
  //    properly torn down (e.g. process-tree leak from npx/npm wrapper).
  // Bracket-escaped patterns prevent pkill from matching its own sh -c line.
  // Free ports first so a stale listener cannot pass the readiness check.
  for (const cmd of [
    `fuser -k 8000/tcp 3000/tcp 2>/dev/null || true`,
    `pkill -9 -f "[r]eact-scripts" 2>/dev/null || true`,
    `pkill -9 -f "[m]ock-server.ts" 2>/dev/null || true`,
    `pkill -9 -f "[n]pm exec tsx" 2>/dev/null || true`,
    `pkill -9 -f "[n]ode_modules/.bin/tsx" 2>/dev/null || true`,
    `pkill -9 -f "[n]ode_modules.*tsx.*preflight" 2>/dev/null || true`,
  ]) {
    try {
      execSync(cmd, { stdio: 'ignore' });
    } catch {
      // Non-fatal: returns non-zero when nothing matched.
    }
  }
  console.log('Cleaned up stale server processes.');
  // Give the OS a moment to release the ports.
  await new Promise(resolve => setTimeout(resolve, 1000));


  // 1. Spawn CRA dev server
  const craServer = spawn('npx', ['react-scripts', 'start'], {
    cwd: EDITOR_DIR,
    env: { 
      ...process.env, 
      BROWSER: 'none', 
      PORT: '3000' 
    },
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  craServer.stdout?.pipe(process.stdout);
  craServer.stderr?.pipe(process.stderr);
  console.log(`CRA server spawned with PID: ${craServer.pid}`);

  // 2. Spawn Mock DB server
  const mockServer = spawn('npx', ['tsx', MOCK_SERVER_PATH], {
    cwd: process.cwd(),
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  mockServer.stdout?.pipe(process.stdout);
  mockServer.stderr?.pipe(process.stderr);
  console.log(`Mock server spawned with PID: ${mockServer.pid}`);

  // Store PIDs
  const pids = {
    craServer: craServer.pid,
    mockServer: mockServer.pid,
  };
  fs.writeFileSync(PIDS_FILE, JSON.stringify(pids));
  console.log(`Servers started. PIDs saved to ${PIDS_FILE}`);

  // 3. Readiness check
  try {
    console.log('Waiting for CRA server to be ready at http://localhost:3000...');
    await waitForServer('http://localhost:3000', 30000);
    console.log('CRA server is ready!');
    console.log('Waiting for Mock server to be ready at http://localhost:8000...');
    await waitForServer('http://localhost:8000/api/hosts', 30000);
    console.log('Mock server is ready!');
  } catch (e: any) {
    // Throw rather than process.exit so Playwright still runs globalTeardown
    // and kills the spawned servers.
    throw new Error(`Readiness check failed: ${e.message}`);
  }
}
