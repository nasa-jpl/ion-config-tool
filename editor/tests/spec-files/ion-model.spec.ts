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
  });

  test('should build ION model and verify nodes and validation', async ({ page }) => {
    // Workflow:
    // 1. Switch to 'netmodel' tab.
    await appPage.switchTab('netmodel');

    // 2. Trigger buildIonModel().
    await netModelTab.buildIonModel();

    // 3. Verify the 'ionmodel' tab is now active.
    // NetModelTab.buildIonModel() internally waits for 'text=ION Model'
    // We can further verify with expect or just rely on the transition.
    await expect(page).toHaveURL(/.*ionmodel/); // Optional: depends on if the URL changes

    // 4. Verify IonModelTab.getNodeCount() === 3.
    const nodeCount = await ionModelTab.getNodeCount();
    expect(nodeCount).toBe(3);

    // 5. Verify the generated ION Model contains contact/range commands (check getGraphCount() > 0).
    const graphCount = await ionModelTab.getGraphCount();
    expect(graphCount).toBeGreaterThan(0);

    // 6. Verify that saving the ION model (which triggers validation) produces no error alerts.
    await ionModelTab.saveIonModel();
    
    const alertText = await netModelTab.getAlertText();
    expect(alertText).toBeNull();
    
    // 7. Call AppPage.expectNoErrors() at the end.
    await appPage.expectNoErrors();
  });
});
