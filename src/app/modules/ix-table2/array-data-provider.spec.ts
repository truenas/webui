import { SortDirection } from '@swimlane/ngx-datatable';
import { firstValueFrom } from 'rxjs';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';

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

describe('ArrayDataProvider', () => {
  it('setRows', async () => {
    const dataProvider = new ArrayDataProvider<TestTableData>();
    dataProvider.setRows(testTableData);

    expect(dataProvider.rows).toEqual(testTableData);
    expect(await firstValueFrom(dataProvider.currentPage$)).toEqual(testTableData);
  });

  it('setSorting', async () => {
    const dataProvider = new ArrayDataProvider<TestTableData>();
    dataProvider.setRows(testTableData);

    dataProvider.setSorting({ active: 1, direction: SortDirection.desc, propertyName: 'stringField' });
    expect(dataProvider.sorting).toEqual({ active: 1, direction: SortDirection.desc, propertyName: 'stringField' });
    expect(await firstValueFrom(dataProvider.currentPage$)).toEqual([
      { numberField: 3, stringField: 'd', booleanField: true },
      { numberField: 2, stringField: 'c', booleanField: false },
      { numberField: 4, stringField: 'b', booleanField: false },
      { numberField: 1, stringField: 'a', booleanField: true },
    ]);

    dataProvider.setSorting({ active: 2, direction: SortDirection.asc, propertyName: 'numberField' });
    expect(dataProvider.sorting).toEqual({ active: 2, direction: SortDirection.asc, propertyName: 'numberField' });
    expect(await firstValueFrom(dataProvider.currentPage$)).toEqual([
      { numberField: 1, stringField: 'a', booleanField: true },
      { numberField: 2, stringField: 'c', booleanField: false },
      { numberField: 3, stringField: 'd', booleanField: true },
      { numberField: 4, stringField: 'b', booleanField: false },
    ]);
  });

  it('setPagination', async () => {
    const dataProvider = new ArrayDataProvider<TestTableData>();
    dataProvider.setRows(testTableData);

    dataProvider.setPagination({ pageNumber: 2, pageSize: 2 });
    expect(dataProvider.pagination).toEqual({ pageNumber: 2, pageSize: 2 });
    expect(await firstValueFrom(dataProvider.currentPage$)).toEqual([
      { numberField: 4, stringField: 'b', booleanField: false },
      { numberField: 3, stringField: 'd', booleanField: true },
    ]);
  });
});
