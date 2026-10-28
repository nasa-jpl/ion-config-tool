import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as unzipper from 'unzipper';

/**
 * Helper to clear and fill an input field.
 */
export async function fillInput(page: Page, selector: string, value: string): Promise<void> {
  await page.fill(selector, '');
  await page.fill(selector, value);
}

/**
 * Helper to click a button.
 */
export async function clickButton(page: Page, selector: string): Promise<void> {
  await page.click(selector);
}

/**
 * Reads a JSON file from disk and returns the parsed object.
 */
export function parseDownloadedJson(filePath: string): any {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Uses the unzipper package to extract a ZIP file to a directory.
 */
export async function extractZip(zipPath: string, destDir: string): Promise<void> {
  if (!fs.existsSync(destDir)) {
    await fs.promises.mkdir(destDir, { recursive: true });
  }
  await fs.createReadStream(zipPath)
    .pipe(unzipper.Extract({ path: destDir }))
    .promise();
}
