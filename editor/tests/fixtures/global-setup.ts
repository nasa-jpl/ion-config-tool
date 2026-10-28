import { spawn } from 'child_process';
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

  // 1. Spawn CRA dev server
  const craServer = spawn('npx', ['react-scripts', 'start'], {
    cwd: EDITOR_DIR,
    env: { 
      ...process.env, 
      BROWSER: 'none', 
      PORT: '3000' 
    },
    detached: true,
    stdio: 'ignore',
  });

  // 2. Spawn Mock DB server
  const mockServer = spawn('npx', ['tsx', MOCK_SERVER_PATH], {
    cwd: process.cwd(),
    detached: true,
    stdio: 'ignore',
  });

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
  } catch (e: any) {
    console.error(`Readiness check failed: ${e.message}`);
    process.exit(1);
  }
}


