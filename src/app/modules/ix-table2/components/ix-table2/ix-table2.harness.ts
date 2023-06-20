import { ComponentHarness, TestElement } from '@angular/cdk/testing';
import { MatButtonHarness } from '@angular/material/button/testing';

export class IxTable2Harness extends ComponentHarness {
  static hostSelector = 'ix-table2';

  async getHeaderRow(): Promise<string[]> {
    const headerCells = await this.locatorForAll('th')();
    return Promise.all(headerCells.map((cell) => cell.text()));
  }

  async getRowCount(): Promise<number> {
    const rows = await this.locatorForAll('.row')();
    return rows.length;
  }

  async getColumnCount(): Promise<number> {
    const headerCells = await this.locatorForAll('th')();
    return headerCells.length;
  }

  async getRowElement(row: number): Promise<TestElement> {
    const rows = await this.locatorForAll('.row')();
    return rows[row];
  }

  async getToggle(row: number): Promise<MatButtonHarness> {
    const toogles = await this.locatorForAll(MatButtonHarness.with({ selector: '[ixTest="toggle-row"]' }))();
    return toogles[row];
  }

  async getCells(includeHeaderRow = false): Promise<string[][]> {
    const headers = await this.getHeaderRow();
    const cells = await this.locatorForAll('.row td')();
    const values: string[][] = [];

    if (includeHeaderRow) {
      values.push(headers);
    }

    const items: string[] = [];
    for (const [, item] of cells.entries()) {
      items.push(await item.text());
    }

    const size = (await this.getColumnCount()) + 1;
    for (let i = 0; i < cells.length / size; i++) {
      values.push(items.slice(i * size, i * size + size));
    }

    return values;
  }

  async clickRow(row: number): Promise<void> {
    (await this.getRowElement(row)).click();
  }

  async clickToogle(row: number): Promise<void> {
    (await this.getToggle(row)).click();
  }
}
