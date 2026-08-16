import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import {
  TableDetailsRowComponent,
} from 'app/modules/tn-table/components/table-details-row/table-details-row.component';
import { TableColumn } from 'app/modules/tn-table/interfaces/table-column.interface';

interface TestRow {
  name: string;
  size: number;
  enabled: boolean;
  lastRun: number;
}

const testRow: TestRow = {
  name: 'first', size: 0, enabled: false, lastRun: 1653730000000,
};

describe('TableDetailsRowComponent', () => {
  let spectator: Spectator<TableDetailsRowComponent<TestRow>>;

  const createComponent = createComponentFactory({
    component: TableDetailsRowComponent<TestRow>,
  });

  function setColumns(hiddenColumns: TableColumn<TestRow>[]): void {
    spectator = createComponent({
      props: { hiddenColumns, row: testRow, uniqueRowTag: 'row-first' },
    });
  }

  it('prints a hidden column from its propertyName', () => {
    setColumns([{ title: 'Name', propertyName: 'name' }]);

    expect(spectator.query('.table-hidden-columns')).toHaveText('Name:');
    expect(spectator.query('.table-hidden-columns')).toHaveText('first');
  });

  it('prefers getValue over the raw property', () => {
    setColumns([{ title: 'Size', propertyName: 'size', getValue: (row) => `${row.size} B` }]);

    expect(spectator.query('.table-hidden-columns')).toHaveText('0 B');
  });

  it('prefers formatValue over getValue, for a value the table formats in its own cell', () => {
    setColumns([{
      title: 'Enabled',
      propertyName: 'enabled',
      getValue: (row) => row.enabled,
      formatValue: (row) => (row.enabled ? 'Yes' : 'No'),
    }]);

    expect(spectator.query('.table-hidden-columns')).toHaveText('No');
  });

  it('keeps a falsy value rather than blanking it', () => {
    setColumns([{ title: 'Size', propertyName: 'size' }]);

    expect(spectator.query('.table-hidden-columns')).toHaveText('0');
  });

  it('carries the row tag in the printed value test id, matching the table cells', () => {
    setColumns([{ title: 'Name', propertyName: 'name' }]);

    expect(spectator.query('[data-test="text-name-row-first-row-text"]')).toExist();
  });

  // The ix cell components tagged a value by cell kind, so a hidden Yes/No or relative-date
  // column resolved its own suffix rather than `row-text` — selectors aimed at those values keep
  // matching in the details row.
  it('tags the printed value with the suffix the column\'s own cell resolves', () => {
    setColumns([{
      title: 'Recursive',
      propertyName: 'enabled',
      formatValue: (row) => (row.enabled ? 'Yes' : 'No'),
      testIdSuffix: 'row-yesno',
    }]);

    expect(spectator.query('[data-test="text-recursive-row-first-row-yesno"]')).toExist();
  });

  it('renders nothing when every column is visible', () => {
    setColumns([]);

    expect(spectator.query('.table-hidden-columns')).not.toExist();
  });
});
