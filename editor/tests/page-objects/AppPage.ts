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
    await this.page.goto('/');
  }

  /**
   * Clicks the corresponding tab to switch views.
   * @param tabName The name of the tab to switch to.
   */
  async switchTab(tabName: 'nodedb' | 'netmodel' | 'ionmodel') {
    // Assuming tabs are identified by a data-testid or specific text/role
    // Adjust the selector based on the actual implementation
    await this.page.getByRole('tab', { name: tabName }).click();
  }

  /**
   * Waits for the application to be ready by ensuring a key element is visible.
   */
  async waitForAppReady() {
    // Wait for any of the main tabs to be visible to ensure React has mounted
    await this.page.waitForSelector('[role="tablist"]', { state: 'visible' });
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
    expect(errors, `Expected no console errors, but found ${errors.length}: ${errors.join(', ')}`).toHaveLength(0);
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
}
