import {
  ComponentHarness,
  ContentContainerComponentHarness,
  HarnessQuery, parallel,
  TestElement,
} from '@angular/cdk/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { IxCellHarness } from 'app/modules/ix-table/components/ix-table/cell.harness';
import { IxRowHarness } from 'app/modules/ix-table/components/ix-table/row.harness';

export class IxTableHarness extends ContentContainerComponentHarness {
  static readonly hostSelector = 'ix-table';

  readonly getCells = this.locatorForAll(IxCellHarness);
  readonly getRows = this.locatorForAll(IxRowHarness);

  async getHeaderTexts(): Promise<string[]> {
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

  async getCell(row: number, column: number): Promise<IxCellHarness> {
    const cells = await this.getCells();
    const columnCount = await this.getColumnCount();
    return cells[row * columnCount + column];
  }

  async getHarnessInCell<T extends ComponentHarness>(
    query: HarnessQuery<T>,
    row: number,
    column: number,
  ): Promise<T> {
    const cell = await this.getCell(row, column);

    if (!cell) {
      throw new Error(`No cell found at row ${row} and column ${column}`);
    }

    return cell.getHarness(query);
  }

  async getAllHarnessesInCell<T extends ComponentHarness>(
    query: HarnessQuery<T>,
    row: number,
    column: number,
  ): Promise<T[]> {
    const cell = await this.getCell(row, column);

    if (!cell) {
      throw new Error(`No cell found at row ${row} and column ${column}`);
    }

    return cell.getAllHarnesses(query);
  }

  async getHarnessInRow<T extends ComponentHarness>(
    query: HarnessQuery<T>,
    text: string,
  ): Promise<T> {
    const rowNumber = await this.getNumberRowByText(text);
    const row = (await this.getRows())[rowNumber];

    if (!row) {
      throw new Error(`No row found with number ${rowNumber}`);
    }

    return row.getHarness(query);
  }

  async getAllHarnessesInRow<T extends ComponentHarness>(
    query: HarnessQuery<T>,
    text: string,
  ): Promise<T[]> {
    const rowNumber = await this.getNumberRowByText(text);
    const row = (await this.getRows())[rowNumber];

    if (!row) {
      throw new Error(`No row found with number ${rowNumber}`);
    }

    return row.getAllHarnesses(query);
  }

  async getNumberRowByText(text: string): Promise<number> {
    const texts = (await this.getCellTexts()).slice(1);
    for (let i = 0; i < texts.length; i += 1) {
      if (texts[i].includes(text)) {
        return i;
      }
    }
    throw new Error(`No row found with the text '${text}'`);
  }

  async getRowElement(row: number): Promise<TestElement> {
    const rows = await this.locatorForAll('.row')();
    return rows[row];
  }

  async getToggle(row: number): Promise<MatButtonHarness> {
    const toggles = await this.locatorForAll(MatButtonHarness.with({ selector: '[ixTest="toggle-row"]' }))();
    return toggles[row];
  }

  async getCellTexts(): Promise<string[][]> {
    const cells = await this.getCells();
    const texts = await parallel(() => cells.map((cell) => cell.getText()));
    const columnCount = await this.getColumnCount();

    if (!columnCount) {
      throw new Error('Could not determine column count');
    }

    const result: string[][] = [];
    for (let i = 0; i < texts.length; i += columnCount) {
      result.push(texts.slice(i, i + columnCount));
    }

    return result;
  }

  async clickRow(row: number): Promise<void> {
    (await this.getRowElement(row)).click();
  }

  async clickToggle(row: number): Promise<void> {
    (await this.getToggle(row)).click();
  }
}
