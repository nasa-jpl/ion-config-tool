import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const PIDS_FILE = path.join(process.cwd(), '.server-pids');
const DOWNLOADS_DIR = '/tmp/pwt-downloads';

export default async function teardown() {
  console.log('Starting global teardown...');

  // 1. Kill servers
  if (fs.existsSync(PIDS_FILE)) {
    try {
      const data = fs.readFileSync(PIDS_FILE, 'utf8');
      const pids: Record<string, number> = JSON.parse(data);
      
      for (const [server, pid] of Object.entries(pids)) {
        try {
          // Using kill -9 to ensure processes are terminated, as they were detached
          process.kill(pid, 'SIGKILL');
          console.log(`Stopped ${server} (PID: ${pid})`);
        } catch (e) {
          console.log(`${server} (PID: ${pid}) was already stopped or could not be killed.`);
        }
      }
      
      // Remove PIDs file
      fs.unlinkSync(PIDS_FILE);
      console.log('Server PIDs file removed.');
    } catch (e) {
      console.error('Error during server teardown:', e);
    }
  } else {
    console.log('No server PIDs file found; skipping server stop.');
  }

  // 2. Clean up temporary artifacts
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


