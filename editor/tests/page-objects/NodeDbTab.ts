import { Page, Locator } from '@playwright/test';

export class NodeDbTab {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    /**
     * Sets the DB connection URL by filling host and port separately.
     * The UI has two inputs: "Host/IP Address" and "Port".
     */
    async setDbUrl(url: string) {
        const parsedUrl = new URL(url);
        const host = parsedUrl.hostname;
        const port = parsedUrl.port;
        await this.page.getByPlaceholder('Host/IP Address').fill(host);
        if (port) {
            await this.page.getByPlaceholder('Port').fill(port);
        }
    }

    async connect() {
        await this.page.getByRole('button', { name: 'Connect' }).click();
        // Wait for the success alert indicating connection established
        await this.page.getByRole('alert').filter({ hasText: 'Connected to' }).waitFor({ state: 'visible', timeout: 30000 });
        // The node table and import navbar only render after DbNodes completes
        // its full async fetch chain (hosts → nodes → destinations → protocols → inducts)
        // and sets nodeTable. The navbar is the reliable indicator that loading is done.
        await this.page.locator('nav.fixed-bottom').waitFor({ state: 'visible', timeout: 30000 });
        // Now the node table should be populated with rows
        await this.page.locator('table tbody tr').first().waitFor({ state: 'visible', timeout: 10000 });
    }

    /**
     * Sets the Net Model Name field in the import form.
     * The label "Net Model Name (no spaces):" exists as text but has no
     * programmatic htmlFor/id association with the input. The input is
     * inside a fixed-bottom navbar.
     */
    async setNetModelName(name: string) {
        // The navbar only renders after the full async fetch chain completes
        // (after setNodeTable is called). Wait for the input directly with a
        // generous timeout.
        const navbarInput = this.page.locator('nav.fixed-bottom input.form-control');
        await navbarInput.waitFor({ state: 'visible', timeout: 30000 });
        await navbarInput.fill(name);
    }

    async clickImport() {
        await this.page.getByRole('button', { name: 'Import' }).click();
        // Wait for the modal or action to complete
        await this.page.waitForTimeout(500);
    }

    async getTableRow(nodeName: string): Promise<Locator> {
        return this.page.locator('tbody tr').filter({ hasText: nodeName });
    }

    async getRowCount(): Promise<number> {
        return await this.page.locator('table tbody tr').count();
    }
}
