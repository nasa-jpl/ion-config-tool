import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { AppPage } from '../page-objects/AppPage';
import { NetModelTab } from '../page-objects/NetModelTab';
import { IonModelTab } from '../page-objects/IonModelTab';

test.describe('Model Roundtrip Identity', () => {
  let appPage: AppPage;
  let netModelTab: NetModelTab;
  let ionModelTab: IonModelTab;

  test.beforeEach(async ({ page }) => {
    appPage = new AppPage(page);
    netModelTab = new NetModelTab(page);
    ionModelTab = new IonModelTab(page);
    await appPage.goto();
    await appPage.waitForAppReady();
    await appPage.switchTab('netmodel');
  });

  test('should preserve net model identity after save and reload', async ({ page }) => {
    // 1. Create a basic 3-node net model
    await netModelTab.createNetModel('Roundtrip-Net');
    
    await netModelTab.addHost('Host1', '127.0.0.1');
    await netModelTab.addHost('Host2', '127.0.0.2');
    await netModelTab.addHost('Host3', '127.0.0.3');
    
    await netModelTab.addNode('Node1', 'Host1');
    await netModelTab.addNode('Node2', 'Host2');
    await netModelTab.addNode('Node3', 'Host3');
    
    await netModelTab.addHop('Hop1-2', 'Node1', 'Node2');
    await netModelTab.addHop('Hop2-3', 'Node2', 'Node3');

    const originalHosts = await netModelTab.getHostCount();
    const originalNodes = await netModelTab.getNodeCount();
    const originalHops = await netModelTab.getHopCount();

    // 2. Call saveNetModel() and wait for the download
    const downloadPromise = await netModelTab.saveNetModel();
    const download = await downloadPromise;
    
    // 3. Save the downloaded content to a temporary file
    const tempFilePath = path.join(os.tmpdir(), `net-model-roundtrip-${Date.now()}.json`);
    await download.saveAs(tempFilePath);

    // 4. Reload the file using loadNetModel(tempFilePath)
    await netModelTab.loadNetModel(tempFilePath);

    // 5. Verify that the counts match the original
    expect(await netModelTab.getHostCount()).toBe(originalHosts);
    expect(await netModelTab.getNodeCount()).toBe(originalNodes);
    expect(await netModelTab.getHopCount()).toBe(originalHops);

    await appPage.expectNoErrors();
    
    // Cleanup
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  });

  test('should preserve ion model identity after save and reload', async ({ page }) => {
    // 1. Build the ION model from a net model
    await netModelTab.createNetModel('Roundtrip-ION');
    await netModelTab.addHost('H1', '1.1.1.1');
    await netModelTab.addHost('H2', '2.2.2.2');
    await netModelTab.addNode('N1', 'H1');
    await netModelTab.addNode('N2', 'H2');
    await netModelTab.addHop('H1-2', 'N1', 'N2');
    
    await netModelTab.buildIonModel();
    await appPage.switchTab('ionmodel');
    
    const originalNodes = await ionModelTab.getNodeCount();
    const originalGraphs = await ionModelTab.getGraphCount();

    // 2. Call saveIonModel() and wait for the download
    const downloadPromise = await ionModelTab.saveIonModel();
    const download = await downloadPromise;

    // 3. Save to temporary file
    const tempFilePath = path.join(os.tmpdir(), `ion-model-roundtrip-${Date.now()}.json`);
    await download.saveAs(tempFilePath);

    // 4. Reload the file
    // Since IonModelTab doesn't have its own load, we use NetModelTab's load 
    // which is the standard way to load the model configuration.
    await appPage.switchTab('netmodel');
    await netModelTab.loadNetModel(tempFilePath);
    await netModelTab.buildIonModel();
    await appPage.switchTab('ionmodel');

    // 5. Verify that the number of nodes and graphs matches the original
    expect(await ionModelTab.getNodeCount()).toBe(originalNodes);
    expect(await ionModelTab.getGraphCount()).toBe(originalGraphs);

    await appPage.expectNoErrors();

    // Cleanup
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  });
});
