import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const PIDS_FILE = path.join(process.cwd(), '.server-pids');
const DOWNLOADS_DIR = '/tmp/pwt-downloads';

export default async function teardown() {
  console.log('Starting global teardown...');

  // 1. Kill servers — attempt process-group kill first, then pkill as fallback
  if (fs.existsSync(PIDS_FILE)) {
    try {
      const data = fs.readFileSync(PIDS_FILE, 'utf8');
      const pids: Record<string, number> = JSON.parse(data);
      
      for (const [server, pid] of Object.entries(pids)) {
        try {
          // Kill the process group (negative PID) so child processes (e.g. the
          // real node/tsx process spawned by npx) are also terminated.
          process.kill(-pid, 'SIGKILL');
          console.log(`Stopped ${server} (PID: ${pid}, process group)`);
        } catch (e: any) {
          // The process group leader may have already exited; try killing the
          // positive PID as a fallback.
          try {
            process.kill(pid, 'SIGKILL');
            console.log(`Stopped ${server} (PID: ${pid}, direct SIGKILL fallback)`);
          } catch {
            console.log(`${server} (PID: ${pid}) was already stopped or could not be killed.`);
          }
        }
      }
    } catch (e) {
      console.error('Error reading PID file during teardown:', e);
    }
  }

  // 2. Final cleanup: kill any remaining server processes by command pattern.
  //    This catches orphaned child processes that escaped process-group kill
  //    (e.g. when npx spawns node which spawns a grandchild in a new group).
  // Bracket patterns keep pkill from matching this sh -c command line (see
  // global-setup.ts). Ports are freed too, in case a stale listener survived.
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
  console.log('Final cleanup of orphaned server processes complete.');

  // Remove PIDs file
  if (fs.existsSync(PIDS_FILE)) {
    try {
      fs.unlinkSync(PIDS_FILE);
      console.log('Server PIDs file removed.');
    } catch (e) {
      console.error('Error removing PID file:', e);
    }
  }

  // 3. Clean up temporary artifacts
  if (fs.existsSync(DOWNLOADS_DIR)) {
    try {
      // Remove all files and folders inside /tmp/pwt-downloads
      const files = fs.readdirSync(DOWNLOADS_DIR);
      for (const file of files) {
        const filePath = path.join(DOWNLOADS_DIR, file);
        if (fs.lstatSync(filePath).isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(filePath);
        }
      }
      console.log(`Cleaned up artifacts in ${DOWNLOADS_DIR}`);
    } catch (e) {
      console.error(`Error cleaning up ${DOWNLOADS_DIR}:`, e);
    }
  } else {
    console.log(`Downloads directory ${DOWNLOADS_DIR} does not exist; skipping cleanup.`);
  }

  console.log('Global teardown completed.');
}


