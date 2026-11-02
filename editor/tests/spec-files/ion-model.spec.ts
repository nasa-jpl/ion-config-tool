import { test, expect } from '@playwright/test';
import { AppPage } from '../page-objects/AppPage';
import { NetModelTab } from '../page-objects/NetModelTab';
import { IonModelTab } from '../page-objects/IonModelTab';

test.describe('ION Model', () => {
  let appPage: AppPage;
  let netModelTab: NetModelTab;
  let ionModelTab: IonModelTab;

  test.beforeEach(async ({ page }) => {
    appPage = new AppPage(page);
    netModelTab = new NetModelTab(page);
    ionModelTab = new IonModelTab(page);

    await appPage.goto();
    await appPage.waitForAppReady();

    // Setup: Create a basic 3-node Net Model
    await appPage.switchTab('netmodel');
    await netModelTab.createNetModel('Test Net Model');
    
    // Adding hosts for the nodes
    await netModelTab.addHost('Host1', '127.0.0.1');
    await netModelTab.addHost('Host2', '127.0.0.2');
    await netModelTab.addHost('Host3', '127.0.0.3');

    // Adding nodes
    await netModelTab.addNode('Node1', 'Host1');
    await netModelTab.addNode('Node2', 'Host2');
    await netModelTab.addNode('Node3', 'Host3');

    // Build the ION model from the Net Model — subsequent tests verify
    // node counts, graph counts, and save behavior.
    await netModelTab.buildIonModel();
  });

  test('should build ION model and verify nodes and validation', async ({ page }) => {
    // buildIonModel() is called in beforeEach; verify the 'ionmodel' tab is active.
    // NetModelTab.buildIonModel() internally waits for 'text=ION Model'
    // 1. Verify we're on the ION Model tab (URL does not change; check active tab instead)
    await expect(ionModelTab.page.getByRole('tab', { name: 'ION Model' })).toHaveAttribute('aria-selected', 'true');

    // 2. Verify IonModelTab.getNodeCount() === 3.
    const nodeCount = await ionModelTab.getNodeCount();
    expect(nodeCount).toBe(3);

    // 3. Verify the generated ION Model contains contact/range commands (check getGraphCount() > 0).
    const graphCount = await ionModelTab.getGraphCount();
    expect(graphCount).toBeGreaterThan(0);

    // 4. Verify that saving the ION model (which triggers validation) produces no error alerts.
    await ionModelTab.saveIonModel();
    
    const alertText = await netModelTab.getAlertText();
    expect(alertText).toBeNull();
    
    // 5. Call AppPage.expectNoErrors() at the end.
    await appPage.expectNoErrors();
  });
});
