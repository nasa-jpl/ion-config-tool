import { Page, Locator } from '@playwright/test';

export class NodeDbTab {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async setDbUrl(url: string) {
        // Assuming the DB API URL field is an input associated with a label or has a specific placeholder/id
        // Using a generic selector that would typically match such a field in this context
        await this.page.getByLabel('DB API URL').fill(url);
    }

    async connect() {
        // Clicks the connect/update button for the DB URL
        await this.page.getByRole('button', { name: /Connect|Update/i }).click();
    }

    async setNetModelName(name: string) {
        // Fills the "Net Model Name" field in the import form
        await this.page.getByLabel('Net Model Name').fill(name);
    }

    async clickImport() {
        // Clicks the "Import" button
        await this.page.getByRole('button', { name: 'Import' }).click();
    }

    async getTableRow(nodeName: string): Promise<Locator> {
        // Returns the table row element containing the node name
        // This searches for a row that contains the text of the nodeName
        return this.page.locator('tr', { hasText: nodeName });
    }

    async getRowCount(): Promise<number> {
        // Returns the number of rows in the node table
        // Assuming rows are defined by 'tr' elements within a table body
        return await this.page.locator('table tbody tr').count();
    }
}
