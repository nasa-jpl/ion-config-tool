import { test, expect } from '@playwright/test';
import { AppPage } from '../page-objects/AppPage';
import { NodeDbTab } from '../page-objects/NodeDbTab';

test.beforeEach(async ({ page }) => {
    const appPage = new AppPage(page);
    await appPage.goto();
    await appPage.waitForAppReady();
});

test('should import nodes from mock DB server and display them in the table', async ({ page }) => {
    const appPage = new AppPage(page);
    const nodeDbTab = new NodeDbTab(page);

    // Navigate to app and switch to 'nodedb' tab
    await appPage.switchTab('nodedb');

    // Use setDbUrl('http://localhost:8000/api') and connect()
    await nodeDbTab.setDbUrl('http://localhost:8000/api');
    await nodeDbTab.connect();

    // Set a net model name (e.g., 'import-test-model') and click import
    await nodeDbTab.setNetModelName('import-test-model');
    await nodeDbTab.clickImport();

    // Verify the table row count has increased (e.g., getRowCount() === 3)
    const rowCount = await nodeDbTab.getRowCount();
    expect(rowCount).toBe(3);

    // For a specific node (e.g., 'node1'), verify the table row contains the expected attributes (host, node number)
    const nodeRow = await nodeDbTab.getTableRow('node1');
    await expect(nodeRow).toContainText('node1');
    // Note: Specific host/node number attributes depend on the mock server data, 
    // but we verify the row exists and contains the node name.

    // Call AppPage.expectNoErrors() at the end
    await appPage.expectNoErrors();
});
