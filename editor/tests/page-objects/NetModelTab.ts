import { Page, expect } from '@playwright/test';
import fs from 'fs';

const log = (msg: string) => {
  fs.appendFileSync('/tmp/pw-netmodel-fix.log', `${new Date().toISOString()} - ${msg}\n`);
};

export class NetModelTab {
  page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Expands the Net Model section by clicking the expand/contract button
   * in the NetModel header's ButtonGroup. The expand button is a
   * success-variant Button (btn-success class) inside the ButtonGroup
   * that contains the "Build ION Model" and "Save Net Model" buttons.
   */
  async expandNetModel() {
    try {
      // Check if "New Host" is already visible (meaning the Net Model card is expanded
      // and the host list section is rendered)
      const newHostBtn = this.page.getByRole('button', { name: 'New Host' });
      const isExpanded = await newHostBtn.isVisible().catch(() => false);
      if (!isExpanded) {
        // The expand button is the btn-success button in the ButtonGroup
        // that contains the "Build ION Model" button.
        const buildBtn = this.page.getByRole('button', { name: 'Build ION Model' });
        const buttonGroup = buildBtn.locator('xpath=ancestor::div[contains(@class,"btn-group")]');
        const expandButton = buttonGroup.locator('.btn-success').last();
        await expandButton.waitFor({ state: 'visible', timeout: 5000 });
        await expandButton.click();
        log('Clicked Net Model expand button');
        // Wait for the host list section to appear (indicates expand completed)
        await newHostBtn.waitFor({ state: 'visible', timeout: 5000 });
      } else {
        log('Net Model section already expanded');
      }
    } catch (e) {
      log(`Error expanding Net Model: ${e}`);
      throw e;
    }
  }

  /**
   * Ensures the Net Host List sub-section is expanded.
   * The "New Host" button is in the header row (always visible when NetModel is expanded).
   * The expand button (btn-success) in the same ButtonGroup toggles the Card showing
   * the actual host entries. Clicking it ensures the list content is visible.
   */
  async expandHostList() {
    try {
      // The "New Host" button confirms the Host List component is rendered
      const newHostBtn = this.page.getByRole('button', { name: 'New Host' });
      await newHostBtn.waitFor({ state: 'visible', timeout: 10000 });

      // Find the expand button in the ButtonGroup containing "New Host"
      const buttonGroup = newHostBtn.locator('xpath=ancestor::div[contains(@class,"btn-group")]');
      const expandButton = buttonGroup.locator('.btn-success').last();
      await expandButton.waitFor({ state: 'visible', timeout: 5000 });
      await expandButton.click();
      log('Clicked Host List expand button');

      // Wait a moment for the card to render
      await this.page.waitForTimeout(500);
    } catch (e) {
      log(`Error expanding host list: ${e}`);
      throw e;
    }
  }

  /**
   * Ensures the Net Node List sub-section is expanded.
   */
  async expandNodeList() {
    try {
      const newNodeBtn = this.page.getByRole('button', { name: 'New Node' });
      await newNodeBtn.waitFor({ state: 'visible', timeout: 10000 });

      const buttonGroup = newNodeBtn.locator('xpath=ancestor::div[contains(@class,"btn-group")]');
      const expandButton = buttonGroup.locator('.btn-success').last();
      await expandButton.waitFor({ state: 'visible', timeout: 5000 });
      await expandButton.click();
      log('Clicked Node List expand button');

      await this.page.waitForTimeout(500);
    } catch (e) {
      log(`Error expanding node list: ${e}`);
      throw e;
    }
  }

  /**
   * Ensures the Net Hop List sub-section is expanded.
   */
  async expandHopList() {
    try {
      const newHopBtn = this.page.getByRole('button', { name: 'New Hop' });
      await newHopBtn.waitFor({ state: 'visible', timeout: 10000 });

      const buttonGroup = newHopBtn.locator('xpath=ancestor::div[contains(@class,"btn-group")]');
      const expandButton = buttonGroup.locator('.btn-success').last();
      await expandButton.waitFor({ state: 'visible', timeout: 5000 });
      await expandButton.click();
      log('Clicked Hop List expand button');

      await this.page.waitForTimeout(500);
    } catch (e) {
      log(`Error expanding hop list: ${e}`);
      throw e;
    }
  }

  /**
   * Creates a new Net Model by clicking the "New" button (in the Net Model
   * tab's button area), entering a name, and clicking "Submit".
   * The "New" button is in App.jsx's makeNetModelButtonsElem, outside NetModel.
   */
  async createNetModel(name: string) {
    try {
      await this.page.getByRole('button', { name: 'New' }).waitFor({ state: 'visible', timeout: 5000 });
      await this.page.getByRole('button', { name: 'New' }).click();
      log('Clicked New button');

      // The "New Net Model" form has a text input for the model name
      await this.page.locator('input[type="text"]').last().fill(name);
      await this.page.getByRole('button', { name: 'Submit' }).click();
      log(`Created net model: ${name}`);

      // Wait for the Net Model tab content to be ready (expand button visible)
      await this.expandNetModel();
    } catch (e) {
      log(`Error creating net model: ${e}`);
      throw e;
    }
  }

  /**
   * Adds a host to the net model. This requires:
   * 1. The Net Model to be expanded (so sub-lists are visible)
   * 2. Clicking "New Host", entering name, clicking "Submit"
   */
  async addHost(name: string, ip?: string) {
    try {
      await this.expandNetModel();

      // Ensure the host list is expanded (but don't toggle it — only click if collapsed)
      const expandBtnGroup = this.page.locator('div.btn-group', { has: this.page.locator('button:has-text("New Host")') });
      const hostListExpandBtn = expandBtnGroup.locator('.btn-success').last();
      if (await hostListExpandBtn.isVisible()) {
        // Check current state — if the list content (host entries) is not visible, expand it
        const hostEntries = this.page.locator('text=Net Host');
        const isCollapsed = await hostEntries.count() === 0;
        if (isCollapsed) {
          await hostListExpandBtn.click();
          await this.page.waitForTimeout(500);
        }
      }

      const newHostBtn = this.page.getByRole('button', { name: 'New Host' });
      await newHostBtn.waitFor({ state: 'visible', timeout: 10000 });
      await newHostBtn.click();
      log('Clicked New Host button');

      // The "New Host" form has a single text input for the host name
      // Scoped to the New Host row: existing host editors keep their inputs
      // in the DOM, so document-wide locators hit the wrong element.
      const newHostForm = this.page.locator('div.row', { has: this.page.locator('b', { hasText: 'New Host Name:' }) });
      const newHostInput = newHostForm.locator('input[type="text"]');
      await newHostInput.fill(name);
      await newHostForm.getByRole('button', { name: 'Submit' }).click();
      log(`Added host: ${name}`);

      // Wait for either the form to disappear (successful submission)
      // or an alert to appear (validation error — form stays open).
      let formHidden = true;
      await newHostInput.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {
        formHidden = false;
      });
      if (!formHidden) {
        log('Form stayed open (validation error), waiting for alert instead');
        await this.page.locator('div.alert-danger').waitFor({ state: 'visible', timeout: 5000 });
      }

      // If an IP address was provided, add it to the host.
      // The host was created with no IPs. To add an IP, we click "Show" on
      // the host (opens the editor panel), then find the "New IP Address"
      // input and "Add" button to add the IP via the NEW-NETADDR dispatch.
      if (ip) {
        // Click "Edit" on the host entry to open its editor panel.
        // The host entry is a Container with the host name as a <b> label.
        // We must click "Edit" (not "Show") to get editable inputs.
        const hostEntry = this.page.locator('b', { hasText: name });
        await hostEntry.waitFor({ state: 'visible', timeout: 5000 });
        const hostRow = hostEntry.locator('xpath=ancestor::div[contains(@class,"container-fluid")][1]');

        // Click "Edit" to enter edit mode (forces viewMode=true and editMode=true)
        const editBtn = hostRow.locator('.btn-primary');
        await editBtn.waitFor({ state: 'visible', timeout: 5000 });
        await editBtn.click();
        log(`Clicked Edit for host: ${name}`);

        // Now in editor mode. The host editor renders an "add" NetAddr item
        // with a text input (the add-mode NetAddr input). Fill the IP into
        // the last text input and click Add.
        await this.page.locator('input[type="text"]').last().waitFor({ state: 'visible', timeout: 5000 });
        await this.page.locator('input[type="text"]').last().fill(ip);

        const addBtn = this.page.getByRole('button', { name: 'Add' });
        await addBtn.waitFor({ state: 'visible', timeout: 5000 });
        await addBtn.click();
        log(`Added IP address: ${ip} to host: ${name}`);

        // Wait for the editor to settle after adding the IP
        await this.page.waitForTimeout(500);

        // Submit the host editor to save changes and exit edit mode.
        // The Edit/Submit button is in the host header's ButtonGroup
        // (variant="primary" in the top row containing <b>{hostKey}</b>).
        // We scope to avoid matching the NetAddr "Add" button which is also
        // btn-primary but lives in a lower row.
        const hdrRow = hostRow.locator('b').filter({ hasText: name }).locator('xpath=ancestor::div[contains(@class,"row")][1]');
        const hdrSubmitBtn = hdrRow.locator('.btn-primary');
        if (await hdrSubmitBtn.count() === 1 && await hdrSubmitBtn.textContent() === 'Submit') {
          await hdrSubmitBtn.click();
          log(`Submitted host editor for: ${name}`);
          await this.page.waitForTimeout(500);
        }
      }
    } catch (e) {
      log(`Error adding host ${name}: ${e}`);
      throw e;
    }
  }

  /**
   * Adds a node to the net model. This requires:
   * 1. The Net Model to be expanded (so sub-lists are visible)
   * 2. Clicking "New Node", entering name, clicking "Submit"
   *
   * The hostName parameter is accepted for API compatibility with other spec
   * files but is not used during node creation — nodes are created with an
   * empty host and must be edited separately to set the host.
   */
    async addNode(name: string, hostName: string = '') {
      try {
        await this.expandNetModel();

        // Ensure the node list sub-section is expanded (so node entries are visible).
        // The "New Node" button is always visible, but the node entries are inside
        // a <Card> that only renders when the list's expandMode is true.
        const newNodeBtn = this.page.getByRole('button', { name: 'New Node' });
        if (await newNodeBtn.isVisible().catch(() => false)) {
          const nodeListExpandBtnGroup = newNodeBtn.locator('xpath=ancestor::div[contains(@class,"btn-group")]');
          const nodeListExpandBtn = nodeListExpandBtnGroup.locator('.btn-success').last();
          if (await nodeListExpandBtn.isVisible()) {
            // Check current state — if the node list content (node entries) is not visible, expand it
            const nodeEntries = this.page.locator('b', { hasText: name });
            const isCollapsed = await nodeEntries.count() === 0;
            if (isCollapsed) {
              await nodeListExpandBtn.click();
              await this.page.waitForTimeout(500);
            }
          }
        }

        await newNodeBtn.waitFor({ state: 'visible', timeout: 10000 });
        await newNodeBtn.click();
        log('Clicked New Node button');

        // The "New Node" form has a single text input for the node name
        await this.page.locator('input[type="text"]').last().fill(name);
        await this.page.getByRole('button', { name: 'Submit' }).click();
        log(`Added node: ${name}`);

        // Wait for the node to appear in the list
        const nodeEntry = this.page.locator('b', { hasText: name }).locator('xpath=ancestor::div[contains(@class,"container-fluid")][1]');
        await nodeEntry.waitFor({ state: 'visible', timeout: 5000 });

        if (hostName) {
          // Use the Edit button workflow to associate the node with a host.
          // The Edit/Submit button is the primary-variant button (variant="primary")
          // in the ButtonGroup. We cannot use getByRole('button', { name: 'Edit' })
          // because after the first click the label changes to "Submit", causing the
          // locator to match a different node's Edit button (or no button) on the
          // second click — which hangs with multiple nodes.
          // Instead, target by variant class which is stable across the label change.
          const editBtn = nodeEntry.locator('.btn-primary');
          await editBtn.waitFor({ state: 'visible', timeout: 5000 });
          await editBtn.click();
          log(`Clicked Edit for node: ${name}`);

          // Wait for the host <select> to appear in the editor panel.
          // The editor has two select elements: Host Name and Add/Drop ION Service.
          // Use .first() to target the Host Name dropdown (the first select in the panel).
          const hostDropdown = nodeEntry.locator('select').first();
          await hostDropdown.waitFor({ state: 'visible', timeout: 5000 });
          await hostDropdown.selectOption({ label: hostName });
          log(`Selected host: ${hostName}`);

          // Click "Submit" — the same button, now labeled "Submit"
          await editBtn.click();
          log(`Submitted host association for node ${name} to ${hostName}`);
        }
      } catch (e) {
        log(`Error adding node ${name}: ${e}`);
        throw e;
      }
    }

  /**
   * Adds a hop to the net model and optionally sets its from/to nodes, IPs,
   * and bpLayer. This requires:
   * 1. The Net Model to be expanded (so sub-lists are visible)
   * 2. Clicking "New Hop", entering name, clicking "Submit"
   * 3. (Optional) Entering edit mode and setting fromNode, toNode, fromIP,
   *    toIP, and bpLayer
   *
   * After creating the hop with just a name, the hop has no fromNode/toNode
   * set (both are empty strings). This causes buildIonModel() to fail with
   * "Invalid From Node Name for Net Hop". So if fromNode and toNode are
   * provided, we enter the hop editor and set them via the dropdown selectors.
   * The fromIP and toIP dropdowns are populated from the selected node's
   * host's ipAddrs list; if fromIP/toIP are provided, we select them as well.
   * Without valid IPs, checkNetModel() fails with "Invalid 'From IP Addr'"
   * or "Invalid 'To IP Addr'".
   */
  async addHop(name: string, fromNode: string = '', toNode: string = '', bpLayer: string = '', fromIP: string = '', toIP: string = '') {
    try {
      await this.expandNetModel();

      // Ensure the hop list sub-section is expanded (so the hop list Card renders)
      const newHopBtn = this.page.getByRole('button', { name: 'New Hop' });
      await newHopBtn.waitFor({ state: 'visible', timeout: 10000 });

      // Expand the hop list Card if collapsed, mirroring the node list pattern
      const hopListExpandBtnGroup = newHopBtn.locator('xpath=ancestor::div[contains(@class,"btn-group")]');
      const hopListExpandBtn = hopListExpandBtnGroup.locator('.btn-success').last();
      if (await hopListExpandBtn.isVisible()) {
        const hopEntries = this.page.locator('text=Node-to-Node Hops');
        const isCollapsed = await hopEntries.count() === 0;
        if (isCollapsed) {
          await hopListExpandBtn.click();
          await this.page.waitForTimeout(500);
        }
      }

      await newHopBtn.click();
      log('Clicked New Hop button');

      // Scoped to the New Hop row: existing hop editors keep text inputs in
      // the DOM, so document-wide locators hit the wrong one.
      const newHopForm = this.page.locator('div.row', { has: this.page.locator('b', { hasText: 'New Hop Name:' }) });
      await newHopForm.locator('input[type="text"]').fill(name);
      await newHopForm.getByRole('button', { name: 'Submit' }).click();
      log(`Added hop: ${name}`);

      // Wait for the hop entry to appear in the list — the hop name is
      // rendered as a bold label, not as an input. We cannot wait for
      // input[type="text"] to be hidden because readonly display inputs
      // remain in the DOM after form submission.
      const hopEntry = this.page.locator('b', { hasText: name });
      await hopEntry.waitFor({ state: 'visible', timeout: 5000 });

      // If fromNode/toNode are provided, enter edit mode and set them.
      // Without these, the hop has empty fromNode/toNode and buildIonModel()
      // will fail with "Invalid From Node Name for Net Hop".
      if (fromNode && toNode) {
        await this.page.waitForTimeout(500);
        // Click "Edit" on the hop entry to open its editor panel.
        // The hop entry is a Container with the hop name as a <b> label.
        // We click ".btn-primary" (the Edit/Submit button) directly — it
        // sets viewMode=true and editMode=true, rendering makeHopEditor().
        const hopEntry = this.page.locator('b', { hasText: name });
        const hopRow = hopEntry.locator('xpath=ancestor::div[contains(@class,"container-fluid")][1]');
        const editBtn = hopRow.locator('.btn-primary').first();
        await editBtn.waitFor({ state: 'visible', timeout: 5000 });
        await editBtn.click();
        log('Clicked Edit for hop editor');

        // The editor is inside the same container-fluid as the hop entry's bold name.
        // The editor has multiple selects: fromNode, fromIP, toNode, toIP, bpLayer, etc.
        // We find each select by looking for its sibling <b> label text.
        const editor = hopRow;

        // fromNode select — find the row with "From Node Name" label, then get the select
        const fromNodeRow = editor.locator('text="From Node Name"').locator('xpath=ancestor::div[contains(@class,"row")][1]');
        const fromNodeSel = fromNodeRow.locator('select');
        await fromNodeSel.waitFor({ state: 'visible', timeout: 5000 });
        await fromNodeSel.selectOption({ value: fromNode });
        log(`Selected fromNode: ${fromNode}`);

        // fromIP select — populated from the selected fromNode's host ipAddrs.
        // We need to wait for the options to populate after selecting fromNode.
        if (fromIP) {
          const fromIPRow = editor.locator('text="From IP"').locator('xpath=ancestor::div[contains(@class,"row")][1]');
          const fromIPSel = fromIPRow.locator('select');
          await fromIPSel.waitFor({ state: 'visible', timeout: 5000 });
          // Wait a moment for the IP options to populate from the node selection
          await this.page.waitForTimeout(500);
          await fromIPSel.selectOption({ value: fromIP });
          log(`Selected fromIP: ${fromIP}`);
        }

        // toNode select — row with "To Node Name" label
        const toNodeRow = editor.locator('text="To Node Name"').locator('xpath=ancestor::div[contains(@class,"row")][1]');
        const toNodeSel = toNodeRow.locator('select');
        await toNodeSel.waitFor({ state: 'visible', timeout: 5000 });
        await toNodeSel.selectOption({ value: toNode });
        log(`Selected toNode: ${toNode}`);

        // toIP select — populated from the selected toNode's host ipAddrs.
        if (toIP) {
          const toIPRow = editor.locator('text="To IP"').locator('xpath=ancestor::div[contains(@class,"row")][1]');
          const toIPSel = toIPRow.locator('select');
          await toIPSel.waitFor({ state: 'visible', timeout: 5000 });
          // Wait a moment for the IP options to populate from the node selection
          await this.page.waitForTimeout(500);
          await toIPSel.selectOption({ value: toIP });
          log(`Selected toIP: ${toIP}`);
        }

        // bpLayer select (if provided)
        if (bpLayer) {
          const bpLayerRow = editor.locator('text="BP Protocol Layer CLA"').locator('xpath=ancestor::div[contains(@class,"row")][1]');
          const bpLayerSel = bpLayerRow.locator('select');
          await bpLayerSel.waitFor({ state: 'visible', timeout: 5000 });
          await bpLayerSel.selectOption({ value: bpLayer });
          log(`Selected bpLayer: ${bpLayer}`);
        }

        // Click Submit (the Edit button now shows "Submit")
        const submitBtn = editor.locator('button:has-text("Submit")');
        await submitBtn.waitFor({ state: 'visible', timeout: 5000 });
        await submitBtn.click();
        log('Submitted hop edits');
      }
    } catch (e) {
      log(`Error adding hop ${name}: ${e}`);
      throw e;
    }
  }

  async createIncompleteNode() {
    await this.addNode('IncompleteNode');
  }

  async validateModel() {
    await this.page.getByRole('button', { name: 'Build ION Model' }).click();
    await this.page.waitForSelector('div.alert-danger', { state: 'visible' });
  }

  /**
   * Clicks Build ION Model. On failure, throws the app's error message
   * unless expectFailure is true, in which case the alert remains for
   * the caller to assert.
   */
  async buildIonModel(options: { expectFailure?: boolean } = {}) {
    await this.page.getByRole('button', { name: 'Build ION Model' }).waitFor({ state: 'visible' });
    await this.page.getByRole('button', { name: 'Build ION Model' }).click();
    
    // Wait for either the success modal button or an error alert
    const successBtn = this.page.getByRole('button', { name: 'Show ION Model' });
    const errorAlert = this.page.locator('div.alert-danger');
    
    await Promise.race([
      successBtn.waitFor({ state: 'visible', timeout: 10000 }),
      errorAlert.waitFor({ state: 'visible', timeout: 10000 })
    ]);

    if (await successBtn.isVisible()) {
      await successBtn.click();
      log('Navigated to ION Model tab');
    } else if (!options.expectFailure) {
      // Fail here with the app's message; continuing would surface later as a
      // missing ION Model control timeout.
      const msg = (await errorAlert.first().innerText()).trim();
      throw new Error(`Build ION Model failed: ${msg}`);
    }
  }

  async saveNetModel() {
    const downloadPromise = this.page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    await this.page.getByRole('button', { name: 'Save Net Model' }).click();
    return downloadPromise;
  }

  async loadNetModel(filePath: string) {
    await this.page.getByRole('button', { name: 'Load' }).click();
    await this.page.locator('input[type="file"]').setInputFiles(filePath);
    await this.page.getByRole('button', { name: 'Submit' }).click();
  }

  /**
   * Navigates to the Net Model tab directly (without going through AppPage.switchTab).
   */
  async goto() {
    await this.page.getByRole('tab', { name: 'Net Model' }).click();
  }

  /**
   * Gets the host count from the "Network Host Machines (X)" label.
   */
  async getHostCount(): Promise<number> {
    const countText = await this.page.locator('h6', { hasText: 'Network Host Machines' }).innerText();
    const match = countText.match(/\((\d+)\)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Gets the node count from the "DTN Nodes  (X)" label.
   * Note: There are two spaces between "DTN Nodes" and the count in the source.
   */
  async getNodeCount(): Promise<number> {
    const countText = await this.page.locator('h6', { hasText: 'DTN Nodes' }).innerText();
    const match = countText.match(/\((\d+)\)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Gets the hop count from the "Node-to-Node Hops (X)" label.
   */
  async getHopCount(): Promise<number> {
    const countText = await this.page.locator('h6', { hasText: 'Node-to-Node Hops' }).innerText();
    const match = countText.match(/\((\d+)\)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async getAlertText(): Promise<string | null> {
    const alert = this.page.locator('div.alert-danger'); // Bootstrap alert class
    if ((await alert.count()) === 0) return null;
    return alert.isVisible() ? await alert.first().innerText() : null;
  }

  async hasAlert(text: string): Promise<boolean> {
    const alertText = await this.getAlertText();
    return alertText !== null && alertText.includes(text);
  }
}
