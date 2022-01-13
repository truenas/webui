import { HarnessPredicate } from '@angular/cdk/testing';
import {
  MatFooterRowHarness,
  MatHeaderRowHarness,
  MatRowHarness,
  MatRowHarnessColumnsText,
  MatTableHarness,
  TableHarnessFilters,
} from '@angular/material/table/testing';
/**
 * This class provides sugar syntax to make it easier to work with tables.
 */
export class IxTableHarness extends MatTableHarness {
  static override hostSelector = '.ix-table';
  protected override _headerRowHarness = MatHeaderRowHarness;
  protected override _rowHarness = MatRowHarness;
  protected override _footerRowHarness = MatFooterRowHarness;

  /**
   * Gets a `HarnessPredicate` that can be used to search for a table with specific attributes.
   * @param options Options for narrowing the search
   * @return a `HarnessPredicate` configured with the given options.
   */
  static override with(options: TableHarnessFilters = {}): HarnessPredicate<IxTableHarness> {
    return new HarnessPredicate(IxTableHarness, options);
  }

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
