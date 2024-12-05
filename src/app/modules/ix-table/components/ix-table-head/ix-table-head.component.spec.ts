import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';

interface TestTableData {
  numberField: number;
  stringField: string;
  booleanField: boolean;
}

const columns = createTable<TestTableData>([
  textColumn({
    title: 'Number Field',
    propertyName: 'numberField',
  }),
  textColumn({
    title: 'String Field',
    propertyName: 'stringField',
  }),
  textColumn({
    title: 'Boolean Field',
    propertyName: 'booleanField',
    disableSorting: true,
  }),
], {
  uniqueRowTag: (row) => 'row' + row.numberField.toString(),
  ariaLabels: (row) => ['Column', row.stringField],
});

let headers: HTMLDivElement[];

describe('IxTableHeadComponent', () => {
  let spectator: Spectator<IxTableHeadComponent<TestTableData>>;

  const createComponent = createComponentFactory({
    component: IxTableHeadComponent<TestTableData>,
  });

  beforeEach(() => {
    const dataProvider = new ArrayDataProvider<TestTableData>();
    spectator = createComponent({
      props: { columns, dataProvider },
    });
    headers = spectator.queryAll('th');
  });

  it('shows titles', () => {
    expect(headers.map((header) => header.querySelector('.title').textContent.trim())).toEqual([
      'Number Field',
      'String Field',
      'Boolean Field',
    ]);
  });

  it('sets sorting when clicking on one heading', () => {
    const dataProvider = spectator.component.dataProvider();
    expect(headers).toHaveLength(3);
    expect(dataProvider.sorting).toEqual({ active: null, direction: null, propertyName: null });
    headers[0].click();
    expect(dataProvider.sorting).toEqual({ active: 0, direction: SortDirection.Asc, propertyName: 'numberField' });
    headers[0].click();
    expect(dataProvider.sorting).toEqual({ active: 0, direction: SortDirection.Desc, propertyName: 'numberField' });
    headers[0].click();
    expect(dataProvider.sorting).toEqual({ active: 0, direction: null, propertyName: 'numberField' });
  });

  it('sets sorting when clicking on different headings', () => {
    const dataProvider = spectator.component.dataProvider();
    expect(headers).toHaveLength(3);

    expect(dataProvider.sorting).toEqual({ active: null, direction: null, propertyName: null });
    headers[0].click();
    expect(dataProvider.sorting).toEqual({ active: 0, direction: SortDirection.Asc, propertyName: 'numberField' });
    headers[1].click();
    expect(dataProvider.sorting).toEqual({ active: 1, direction: SortDirection.Asc, propertyName: 'stringField' });
  });

  it('sets sorting when clicking on an unsortable heading', () => {
    const dataProvider = spectator.component.dataProvider();
    expect(headers).toHaveLength(3);

    expect(dataProvider.sorting).toEqual({ active: null, direction: null, propertyName: null });
    headers[2].click();
    expect(dataProvider.sorting).toEqual({ active: null, direction: null, propertyName: null });
  });
});
