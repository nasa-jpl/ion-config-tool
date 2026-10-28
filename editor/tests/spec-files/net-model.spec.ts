import { test, expect } from '@playwright/test';
import { AppPage } from '../page-objects/AppPage';
import { NetModelTab } from '../page-objects/NetModelTab';

test.describe('Net Model Workflow', () => {
  let appPage: AppPage;
  let netModelTab: NetModelTab;

  test.beforeEach(async ({ page }) => {
    appPage = new AppPage(page);
    netModelTab = new NetModelTab(page);

    await appPage.goto();
    await appPage.waitForAppReady();
  });

  test('should create a 3-node net model and verify counts', async ({ page }) => {
    await appPage.switchTab('netmodel');

    await netModelTab.createNetModel('test-3node');

    // Add 3 hosts
    await netModelTab.addHost('host1', '192.168.1.101');
    await netModelTab.addHost('host2', '192.168.1.102');
    await netModelTab.addHost('host3', '192.168.1.103');

    // Add 3 nodes
    await netModelTab.addNode('node1', 'host1', 'ion', '1.1');
    await netModelTab.addNode('node2', 'host2', 'ion', '2.1');
    await netModelTab.addNode('node3', 'host3', 'ion', '3.1');

    // Add 2 hops
    await netModelTab.addHop('hop12', 'node1', 'node2');
    await netModelTab.addHop('hop23', 'node2', 'node3');

    // Verify counts
    expect(await netModelTab.getHostCount()).toBe(3);
    expect(await netModelTab.getNodeCount()).toBe(3);
    expect(await netModelTab.getHopCount()).toBe(2);

    await appPage.expectNoErrors();
  });
});
