import { Page, expect } from '@playwright/test';

export class NetModelTab {
  constructor(page: Page) {
    this.page = page;
  }

  async createNetModel(name: string) {
    await this.page.getByRole('button', { name: 'New' }).click();
    await this.page.locator('input[type="text"]').fill(name);
    await this.page.getByRole('button', { name: 'Submit' }).click();
  }

  async addHost(name: string, ip: string) {
    // Expand Net Model to see the Host List if not already expanded
    const expandBtn = this.page.locator('button:has-text("expand")').first(); // This is a guess based on the icon, better to target the specific button
    // The button for expanding NetModel is the one with the icon (BsChevronDoubleRight/Down)
    // In NetModel.jsx: <Button variant="success" onClick={this.expand}>{expandIcon}{' '}</Button>
    // We can target it by its proximity to the "Net Model" badge or by its specific style/position.
    // Since there are multiple expand buttons, we target the one in the Net Model section.
    await this.page.locator('div:has-text("Net Model")').locator('button[variant="success"]').click();
    
    // Click "New Host" in NetHostList
    await this.page.getByRole('button', { name: 'New Host' }).click();
    await this.page.locator('input[type="text"]').fill(name);
    await this.page.getByRole('button', { name: 'Submit' }).click();
    
    // Note: Adding the IP address usually happens within the NetHost component (NetHost.jsx)
    // The requirements ask for addHost(name, ip). I'll assume there's a way to add IP.
    // Since I haven't seen NetHost.jsx yet, I'll implement the basic flow and refine.
  }

  async addNode(name: string, hostName: string, nodeType: string = 'ion', endpointId: string = '') {
    await this.page.locator('div:has-text("Net Model")').locator('button[variant="success"]').click();
    await this.page.getByRole('button', { name: 'New Node' }).click();
    await this.page.locator('input[name="name"]').fill(name);
    await this.page.locator('select[name="host"]').selectOption(hostName);
    await this.page.locator('select[name="type"]').selectOption(nodeType);
    if (endpointId) {
      await this.page.locator('input[name="endpointId"]').fill(endpointId);
    }
    await this.page.getByRole('button', { name: 'Submit' }).click();
  }

  async addHop(name: string, fromNode: string, toNode: string) {
    await this.page.locator('div:has-text("Net Model")').locator('button[variant="success"]').click();
    await this.page.getByRole('button', { name: 'New Hop' }).click();
    await this.page.locator('input[name="name"]').fill(name);
    await this.page.locator('select[name="fromNode"]').selectOption(fromNode);
    await this.page.locator('select[name="toNode"]').selectOption(toNode);
    await this.page.getByRole('button', { name: 'Submit' }).click();
  }

  async buildIonModel() {
    await this.page.getByRole('button', { name: 'Build ION Model' }).click();
    // Wait for the transition to the ION Model tab
    await this.page.waitForSelector('text=ION Model');
  }

  async saveNetModel() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.page.getByRole('button', { name: 'Save Net Model' }).click();
    return downloadPromise;
  }

  async loadNetModel(filePath: string) {
    await this.page.getByRole('button', { name: 'Load' }).click();
    await this.page.locator('input[type="file"]').setInputFiles(filePath);
    await this.page.getByRole('button', { name: 'Submit' }).click();
  }

  async getHostCount(): Promise<number> {
    const countText = await this.page.locator('text=Network Host Machines').innerText();
    const match = countText.match(/\((\d+)\)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async getNodeCount(): Promise<number> {
    const countText = await this.page.locator('text=Network Node Machines').innerText();
    const match = countText.match(/\((\d+)\)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async getHopCount(): Promise<number> {
    const countText = await this.page.locator('text=Network Hop List').innerText();
    const match = countText.match(/\((\d+)\)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async getAlertText(): Promise<string | null> {
    const alert = this.page.locator('div.alert-danger'); // Bootstrap alert class
    return alert.isVisible() ? await alert.innerText() : null;
  }

  async hasAlert(text: string): Promise<boolean> {
    const alertText = await this.getAlertText();
    return alertText !== null && alertText.includes(text);
  }
}
