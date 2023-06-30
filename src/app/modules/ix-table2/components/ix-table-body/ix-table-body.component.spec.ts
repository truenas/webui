import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';
import { IxTableBodyComponent } from 'app/modules/ix-table2/components/ix-table-body/ix-table-body.component';
import { TableColumn } from 'app/modules/ix-table2/interfaces/table-column.interface';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';

interface TestTableData {
  numberField: number;
  stringField: string;
  booleanField: boolean;
}

const testTableData: TestTableData[] = [
  { numberField: 1, stringField: 'a', booleanField: true },
  { numberField: 2, stringField: 'c', booleanField: false },
  { numberField: 4, stringField: 'b', booleanField: false },
  { numberField: 3, stringField: 'd', booleanField: true },
];

const columns: TableColumn<TestTableData>[] = [
  {
    title: 'Number Field',
    propertyName: 'numberField',
    sortable: true,
  },
  {
    title: 'String Field',
    propertyName: 'stringField',
    sortable: true,
  },
  {
    title: 'Boolean Field',
    propertyName: 'booleanField',
  },
];

describe('IxTableBodyComponent', () => {
  let spectator: Spectator<IxTableBodyComponent<TestTableData>>;

  const createComponent = createComponentFactory({
    component: IxTableBodyComponent<TestTableData>,
    imports: [IxTable2Module],
  });

  beforeEach(() => {
    const dataProvider = new ArrayDataProvider<TestTableData>();
    spectator = createComponent({
      props: { columns, dataProvider },
    });
    spectator.component.dataProvider.setRows(testTableData);
    spectator.fixture.detectChanges();
  });

  it('shows rows', () => {
    const rows = spectator.queryAll('.row');
    expect(rows).toHaveLength(4);
    expect(
      spectator.queryAll('.row').map((row) => {
        const values: string[] = [];
        row.querySelectorAll('td').forEach((td) => values.push(td.textContent.trim()));
        return values;
      }),
    ).toEqual([
      ['1', 'a', 'true'],
      ['2', 'c', 'false'],
      ['4', 'b', 'false'],
      ['3', 'd', 'true'],
    ]);
  });
});
