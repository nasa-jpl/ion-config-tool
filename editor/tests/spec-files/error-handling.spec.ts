import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { AppPage } from '../page-objects/AppPage';
import { NetModelTab } from '../page-objects/NetModelTab';
import { IonModelTab } from '../page-objects/IonModelTab';

test.describe('Error Handling', () => {
  let appPage: AppPage;
  let netModelTab: NetModelTab;
  let ionModelTab: IonModelTab;

  test.beforeEach(async ({ page }) => {
    appPage = new AppPage(page);
    netModelTab = new NetModelTab(page);
    ionModelTab = new IonModelTab(page);
    await appPage.waitForAppReady();
  });

  test('should show error when building ION model from empty net model', async ({ page }) => {
    await netModelTab.goto();
    // Ensure model is empty (0 hops)
    // Assuming clearModel or similar exists, or we just start fresh
    
    await ionModelTab.goto();
    await ionModelTab.buildModel();
    
    const alertText = await appPage.getAlertText();
    expect(alertText).toMatch(/Error|Warning/);
    
    await appPage.expectNoErrors();
  });

  test('should show error when loading corrupted JSON', async ({ page }) => {
    const tempFilePath = path.join(require('os').tmpdir(), `corrupted_${Date.now()}.json`);
    fs.writeFileSync(tempFilePath, '{ "invalid": json ');

    await appPage.loadFile(tempFilePath);
    
    const alertText = await appPage.getAlertText();
    expect(alertText).toMatch(/Failed to parse/);
    
    await appPage.expectNoErrors();
    
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  });

  test('should block submission of empty names', async ({ page }) => {
    await netModelTab.goto();
    
    const initialCount = await netModelTab.getHostCount();
    await netModelTab.addHost(''); // Empty name
    
    const finalCount = await netModelTab.getHostCount();
    expect(finalCount).toBe(initialCount);
    
    await appPage.expectNoErrors();
  });

  test('should show alert for duplicate names', async ({ page }) => {
    await netModelTab.goto();
    
    await netModelTab.addHost('HostA');
    await netModelTab.addHost('HostA');
    
    const alertText = await appPage.getAlertText();
    expect(alertText).toMatch(/duplicate name/i);
    
    await appPage.expectNoErrors();
  });

  test('should show validation errors for incomplete model', async ({ page }) => {
    await netModelTab.goto();
    
    // Create a node without a host (assuming this is possible via API/UI for the test)
    await netModelTab.createIncompleteNode(); 
    
    await netModelTab.validateModel();
    
    const alertText = await appPage.getAlertText();
    expect(alertText).toMatch(/validation error/i);
    
    await appPage.expectNoErrors();
  });
});
