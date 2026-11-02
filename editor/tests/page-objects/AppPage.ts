import { Page, expect } from '@playwright/test';

export class AppPage {
  private page: Page;
  private consoleErrors: string[] = [];

  constructor(page: Page) {
    this.page = page;
    this.setupErrorListeners();
  }

  private setupErrorListeners() {
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        this.consoleErrors.push(`console.error: ${msg.text()}`);
      }
    });
    this.page.on('pageerror', (err) => {
      this.consoleErrors.push(`pageerror: ${err.message}`);
    });
  }

  /**
   * Navigates to the application base URL.
   */
  async goto() {
    await this.page.addInitScript(() => { delete (window as any).showSaveFilePicker; });
    await this.page.goto('/');
  }

  /**
   * Clicks the corresponding tab to switch views.
   * @param tabName The name of the tab to switch to.
   */
  async switchTab(tabName: 'nodedb' | 'netmodel' | 'ionmodel') {
    const tabLabelMap: Record<string, string> = {
      'nodedb': 'Node DB',
      'netmodel': 'Net Model',
      'ionmodel': 'ION Model',
    };
    const label = tabLabelMap[tabName];
    if (!label) {
      throw new Error(`Unknown tab name: ${tabName}`);
    }
    await this.page.getByRole('tab', { name: label }).click();
  }

  /**
   * Waits for the application to be ready by ensuring a key element is visible.
   */
  async waitForAppReady() {
    // Wait for any of the main tabs to be visible to ensure React has mounted
    await this.page.waitForSelector('[role="tab"]', { state: 'visible' });
  }

  /**
   * Captures and returns all console.error and pageerror events.
   */
  async getConsoleErrors(): Promise<string[]> {
    return [...this.consoleErrors];
  }

  /**
   * Asserts that no console errors were captured during the session.
   */
  async expectNoErrors() {
    const errors = await this.getConsoleErrors();
    // Filter out known errors that are expected with the mock test environment:
    // 1. React's non-boolean attribute warnings (collapsible="true", expanded)
    // 2. 404 resource load errors from fetches to mock server endpoints we don't fully implement
    const realErrors = errors.filter(e => {
      if (e.includes('non-boolean attribute')) return false;
      if (e.includes('boolean attribute')) return false;
      if (e.includes('Failed to load resource') && e.includes('404')) return false;
      return true;
    });
    expect(realErrors, `Expected no console errors, but found ${realErrors.length}: ${realErrors.join(', ')}`).toHaveLength(0);
  }

  /**
   * Sets a file for a file input element.
   * @param filePath The path to the file to upload.
   */
  async setFileInput(filePath: string) {
    // Assuming there is a primary file input on the page. 
    // Adjust the selector if a specific element is needed.
    await this.page.setInputFiles('input[type="file"]', filePath);
  }

  async getAlertText(): Promise<string | null> {
    const alert = this.page.locator('div.alert-danger');
    if ((await alert.count()) === 0) return null;
    return alert.isVisible() ? await alert.first().innerText() : null;
  }

  async loadFile(filePath: string) {
    await this.switchTab('netmodel');
    await this.page.getByRole('button', { name: /load/i }).click();
    await this.page.locator('input[type="file"]').waitFor({ state: 'visible' });
    await this.page.locator('input[type="file"]').setInputFiles(filePath);
    await this.page.getByRole('button', { name: /submit/i }).click();
    await this.page.locator('div.alert-danger').waitFor({ state: 'visible', timeout: 10000 });
  }
}
