import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import os from 'os';
import { AppPage } from '../page-objects/AppPage';
import { NetModelTab } from '../page-objects/NetModelTab';
import { IonModelTab } from '../page-objects/IonModelTab';
import * as testHelpers from '../helpers/test-helpers';

test.describe('ION Config Download', () => {
  test('should download a zip containing config files for all 3 nodes', async ({ page }) => {
    const appPage = new AppPage(page);
    const netModelTab = new NetModelTab(page);
    const ionModelTab = new IonModelTab(page);

    await appPage.goto();
    await appPage.waitForAppReady();

    // Setup: Build a 3-node ION model
    const modelName = 'test-ion-model';
    await appPage.switchTab('netmodel');
    await netModelTab.createNetModel(modelName);

    const nodes = [
      { name: 'node1', host: 'host1' },
      { name: 'node2', host: 'host2' },
      { name: 'node3', host: 'host3' },
    ];

    // We need hosts to associate nodes with
    // Host IPs must be unique; the app rejects duplicates ("IP Address is already used.").
    for (const [i, node] of nodes.entries()) {
      await netModelTab.addHost(node.host, `127.0.0.${i + 1}`);
    }

    for (const node of nodes) {
      await netModelTab.addNode(node.name, node.host);
    }

    await netModelTab.buildIonModel();

    // Verify we are on ION Model tab and have 3 nodes
    await expect(page.getByRole('tab', { name: 'ION Model' })).toHaveAttribute('aria-selected', 'true');
    expect(await ionModelTab.getNodeCount()).toBe(3);

    // Call saveIonConfigs() and capture the download event
    const downloadPromise = ionModelTab.saveIonConfigs();
    const download = await downloadPromise;

    // Verify the filename is {name}-ionconfig.zip
    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toBe(`${modelName}-ionconfig.zip`);

    // Use test-helpers.extractZip to extract the archive to a temporary directory
    const downloadPath = await download.path();
    if (!downloadPath) throw new Error('Download path is null');
    
    const tempExtractDir = path.join(os.tmpdir(), `ion-config-test-${Date.now()}`);
    await testHelpers.extractZip(downloadPath, tempExtractDir);

    // The zip contains a root folder named after the network (this.props.name),
    // with node subdirectories nested inside it. Navigate into the root folder
    // to find the 3 node directories.
    const extractedEntries = fs.readdirSync(tempExtractDir);
    console.log('DEBUG: tempExtractDir entries:', extractedEntries);
    let nodeDirRoot = tempExtractDir;
    if (extractedEntries.length === 1) {
      const soleEntry = path.join(tempExtractDir, extractedEntries[0]);
      if (fs.statSync(soleEntry).isDirectory()) {
        nodeDirRoot = soleEntry;
      }
    }
    console.log('DEBUG: nodeDirRoot:', nodeDirRoot);
    console.log('DEBUG: nodeDirRoot entries:', fs.readdirSync(nodeDirRoot));

    // Verify that there are 3 subdirectories (one for each node)
    const extractedDirs = fs.readdirSync(nodeDirRoot).filter(f => 
      fs.statSync(path.join(nodeDirRoot, f)).isDirectory()
    );
    console.log('DEBUG: extractedDirs:', extractedDirs);
    expect(extractedDirs).toHaveLength(3);

    // For each node directory, verify the presence of required files
    // Note: Files are prefixed with the node name in the zip (e.g., node1.ionconfig).
    // ltprc is not included because no LTP links are configured in this test model.
    const requiredFiles = [
      'ionconfig',
      'ionrc',
      'bpv7rc',
      'ionsecrc',
    ];

    for (const dir of extractedDirs) {
      const dirPath = path.join(nodeDirRoot, dir);
      const filesInDir = fs.readdirSync(dirPath);
      console.log(`DEBUG: dir=${dir}, files=${JSON.stringify(filesInDir)}`);

      // Verify base required files (prefixed with node name in the zip)
      const prefixedRequiredFiles = requiredFiles.map(f => `${dir}.${f}`);
      for (const file of prefixedRequiredFiles) {
        expect(filesInDir).toContain(file);
      }

      // Verify start_<nodename>.sh
      // Note: The folder name in the ZIP is typically the node name
      expect(filesInDir).toContain(`start_${dir}.sh`);
    }

    // Call AppPage.expectNoErrors() at the end
    await appPage.expectNoErrors();

    // Cleanup temporary directory
    fs.rmSync(tempExtractDir, { recursive: true, force: true });
  });
});
