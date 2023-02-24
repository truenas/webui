import {
  MatFooterRowHarness,
  MatHeaderRowHarness,
  MatRowHarness,
  MatRowHarnessColumnsText,
  MatTableHarness,
} from '@angular/material/table/testing';
/**
 * This class provides sugar syntax to make it easier to work with tables.
 */
export class IxTableHarness extends MatTableHarness {
  static override hostSelector = '.ix-table';
  protected override _headerRowHarness = MatHeaderRowHarness;
  protected override _rowHarness = MatRowHarness;
  protected override _footerRowHarness = MatFooterRowHarness;

  async getHeaderRow(): Promise<MatRowHarnessColumnsText> {
    const headers: MatHeaderRowHarness[] = await this.getHeaderRows();
    const headerRow: MatRowHarnessColumnsText = await headers[0].getCellTextByColumnName();

    return headerRow;
  }

  async getCells(includeHeaderRow = false): Promise<string[][]> {
    const cells = await this.getCellTextByIndex();

    if (includeHeaderRow) {
      const headers = await this.getHeaderRows();
      const headerRow = await headers[0].getCellTextByIndex();
      cells.unshift(headerRow);
    }

    return Promise.resolve(cells);
  }

  async getFirstRow(): Promise<MatRowHarnessColumnsText> {
    const rows = await this.getRows();
    return rows[0].getCellTextByColumnName();
  }
}
