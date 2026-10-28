import { Page } from '@playwright/test';

export class IonModelTab {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Clicks the save ION model button and returns the download promise.
   */
  async saveIonModel() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.page.getByRole('button', { name: /save ion model/i }).click();
    return downloadPromise;
  }

  /**
   * Clicks the save ION configs button and returns the download promise.
   */
  async saveIonConfigs() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.page.getByRole('button', { name: /save ion configs/i }).click();
    return downloadPromise;
  }

  /**
   * Returns the number of nodes in the ION Model table.
   */
  async getNodeCount(): Promise<number> {
    // Locates rows in the ION Model table. 
    // Assuming the table is the primary table on this tab.
    return await this.page.locator('table tbody tr').count();
  }

  /**
   * Retrieves the node number for a specific node name.
   */
  async getNodeNumber(name: string): Promise<string | null> {
    // Locates the row that contains the specific node name and gets the text of the first cell (the number).
    const row = this.page.locator('table tbody tr', { hasText: name });
    if (await row.count() === 0) {
      return null;
    }
    return (await row.locator('td').first().innerText()).trim();
  }

  /**
   * Returns the number of graphs.
   */
  async getGraphCount(): Promise<number> {
    // Assuming graphs are listed as distinct elements or items in a list.
    // The specific selector would be updated once the DOM is known.
    return await this.page.locator('.graph-item').count();
  }
}
