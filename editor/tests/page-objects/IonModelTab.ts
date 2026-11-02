import { Page } from '@playwright/test';

const log = (msg: string) => {
  require('fs').appendFileSync('/tmp/pw-ionmodel-fix.log', `${new Date().toISOString()} - ${msg}\n`);
};

export class IonModelTab {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Clicks the save ION model button and returns the download promise.
   * Must be on the ION Model tab for the save button to be visible.
   */
  async saveIonModel() {
    log('saveIonModel: ensuring on ION Model tab');
    await this.page.getByRole('tab', { name: 'ION Model' }).click();
    await this.page.getByRole('button', { name: 'Save ION Model' }).waitFor({ state: 'visible' });
    const downloadPromise = this.page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    await this.page.getByRole('button', { name: 'Save ION Model' }).click();
    log('saveIonModel: clicked Save ION Model button');
    return downloadPromise;
  }

  /**
   * Clicks the save ION configs button and returns the download promise.
   * Must be on the ION Model tab for the save button to be visible.
   */
  async saveIonConfigs() {
    log('saveIonConfigs: ensuring on ION Model tab');
    await this.page.getByRole('tab', { name: 'ION Model' }).click();
    await this.page.getByRole('button', { name: 'Save ION Configs' }).waitFor({ state: 'visible' });
    const downloadPromise = this.page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    await this.page.getByRole('button', { name: 'Save ION Configs' }).click();
    log('saveIonConfigs: clicked Save ION Configs button');
    return downloadPromise;
  }

  /**
   * Returns the number of nodes in the ION Model.
   * Uses the "ION Node Servers (X)" heading in the IonNodeList component.
   * Requires expandMode to be true so IonNodeList is rendered.
   */
  async getNodeCount(): Promise<number> {
    await this.expand();
    const heading = this.page.locator('h6', { hasText: 'ION Node Servers' });
    const countText = await heading.innerText();
    const match = countText.match(/\((\d+)\)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Returns the number of graphs (contact graphs) in the ION Model.
   * Uses the "Contact Graphs (X)" heading in the GraphList component.
   * Requires expandMode to be true so GraphList is rendered.
   */
  async getGraphCount(): Promise<number> {
    await this.expand();
    const heading = this.page.locator('h6', { hasText: 'Contact Graphs' });
    const countText = await heading.innerText();
    const match = countText.match(/\((\d+)\)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Retrieves the node number for a specific node name.
   * Nodes are rendered as IonNode divs, not table rows.
   */
  async getNodeNumber(name: string): Promise<string | null> {
    // IonNode components render as divs with text content
    const nodeElem = this.page.locator('div', { hasText: name });
    if (await nodeElem.count() === 0) {
      return null;
    }
    const nodeText = await nodeElem.first().innerText();
    const match = nodeText.match(/Node Number:\s*(\d+)/);
    return match ? match[1] : null;
  }

  /**
   * Navigates to the ION Model tab.
   */
  async goto() {
    await this.page.getByRole('tab', { name: 'ION Model' }).click();
  }

  /**
   * Expands the Ion Model node list by clicking the expand/contract shutter
   * button. The IonNodeList (which contains the "ION Node Servers" heading)
   * is only rendered when IonModel's expandMode is true, which starts as false.
   */
  async expand() {
    await this.goto();
    // Wait for the IonModel component to be rendered by looking for its
    // expand button (variant="success" with chevron icon). Both IonModel
    // and IonModelLoader may have .btn-success buttons, but the expand
    // button is the one inside the IonModel's ButtonGroup.
    const saveBtn = this.page.getByRole('button', { name: 'Save ION Configs' });
    const btnGroup = saveBtn.locator('xpath=ancestor::div[contains(@class,"btn-group")]').first();
    await btnGroup.waitFor({ state: 'attached', timeout: 15000 });
    const expandBtn = btnGroup.locator('.btn-success').last();
    await expandBtn.waitFor({ state: 'attached', timeout: 10000 });
    // Give React a moment to complete rendering and layout
    await this.page.waitForTimeout(500);
    const heading = this.page.locator('h6', { hasText: 'ION Node Servers' });
    const isExpanded = await heading.isVisible().catch(() => false);
    if (!isExpanded) {
      // The expand button has variant="success" and contains a chevron icon.
      await expandBtn.waitFor({ state: 'visible', timeout: 10000 });
      await expandBtn.click();
      log('Clicked IonModel expand button');
      await heading.waitFor({ state: 'visible', timeout: 5000 });
    } else {
      log('IonModel already expanded');
    }
  }

  /**
   * Triggers building the ION model from the Net Model.
   * Delegates to NetModelTab.buildIonModel() as the build process
   * is owned by the Net Model component.
   */
  async buildModel(netModelTab: NetModelTab) {
    await netModelTab.buildIonModel();
  }

  /**
   * Loads an ION model from a JSON file using the IonModelLoader.
   * Clicks the "Load" button on the ION Model tab, selects a file,
   * and clicks "Submit". This is the correct path for ION model files
   * (which have ionModelName), as opposed to the Net Model loader.
   */
  async loadIonModel(filePath: string) {
    log('loadIonModel: clicking Load button on ION Model tab');
    await this.page.getByRole('button', { name: 'Load' }).click();
    log('loadIonModel: Load button clicked, IonModelLoader should appear');

    // Wait for the file input to appear
    const fileInput = this.page.locator('input#ionmodel[type="file"]');
    await fileInput.waitFor({ state: 'visible', timeout: 5000 });

    // Set the file
    await fileInput.setInputFiles(filePath);
    log(`loadIonModel: set file input to ${filePath}`);

    // Click Submit on the IonModelLoader
    await this.page.getByRole('button', { name: 'Submit' }).click();
    log('loadIonModel: clicked Submit');

    // Wait for the IonModelLoader to be dismissed AND for the IonModel component to render.
    // The IonModelLoader's file input is hidden when IonModel is mounted, but that alone
    // doesn't guarantee the IonModel ButtonGroup (with "Save ION Model", "Save ION Configs")
    // has rendered. Waiting for the "Save ION Model" button ensures the IonModel component
    // is ready — expand() and other methods rely on its ButtonGroup being present.
    const saveIonModelBtn = this.page.getByRole('button', { name: 'Save ION Model' });
    await saveIonModelBtn.waitFor({ state: 'visible', timeout: 10000 });
    log('loadIonModel: IonModel rendered, Save ION Model button visible');
  }
}

