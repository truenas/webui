import {
  firstValueFrom, of, throwError,
} from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';

interface TestTableData {
  numberField: number;
  stringField: string;
  booleanField: boolean;
  size?: number;
}

const testTableData: TestTableData[] = [
  {
    numberField: 1, stringField: 'a', booleanField: true, size: 17179869999,
  },
  { numberField: 2, stringField: 'c', booleanField: false },
  { numberField: 4, stringField: 'b', booleanField: false },
  { numberField: 3, stringField: 'd', booleanField: true },
];

describe('AsyncDataProvider', () => {
  it('sets rows after init', async () => {
    const request$ = of(testTableData);
    const dataProvider = new AsyncDataProvider<TestTableData>(request$);
    dataProvider.load();

    expect(dataProvider.totalRows).toBe(4);
    expect(await firstValueFrom(dataProvider.currentPage$)).toEqual(testTableData);
  });

  it('sets EmptyType when there is data', async () => {
    const request$ = of(testTableData);
    const dataProvider = new AsyncDataProvider(request$);
    dataProvider.load();

    expect(await firstValueFrom(dataProvider.emptyType$)).toBe(EmptyType.NoSearchResults);
  });

  it('sets EmptyType when not data', async () => {
    const dataProvider = new AsyncDataProvider(of<TestTableData[]>([]));
    dataProvider.load();

    expect(await firstValueFrom(dataProvider.emptyType$)).toBe(EmptyType.NoPageData);
  });

  it('sets EmptyType on loading', async () => {
    const dataProvider = new AsyncDataProvider<TestTableData>(of());
    dataProvider.load();

    expect(await firstValueFrom(dataProvider.emptyType$)).toBe(EmptyType.Loading);
  });

  it('sets EmptyType on error', async () => {
    const dataProvider = new AsyncDataProvider<TestTableData>(throwError(() => new Error()));
    dataProvider.load();

    expect(await firstValueFrom(dataProvider.emptyType$)).toBe(EmptyType.Errors);
  });

  it('filters rows based on query and columns', async () => {
    const request$ = of(testTableData);
    const dataProvider = new AsyncDataProvider<TestTableData>(request$);
    dataProvider.load();

    dataProvider.setFilter({ query: 'c', columnKeys: ['stringField'] });
    expect(dataProvider.totalRows).toBe(1);
    expect(
      await firstValueFrom(dataProvider.currentPage$),
    ).toEqual([{ numberField: 2, stringField: 'c', booleanField: false }]);
  });

  it('filters rows based on "size" query param with a pre-defined margin', async () => {
    const request$ = of(testTableData);
    const dataProvider = new AsyncDataProvider<TestTableData>(request$);
    dataProvider.load();

    dataProvider.setFilter({ query: '16.3 gib', columnKeys: ['size'] });
    expect(dataProvider.totalRows).toBe(1);
    expect(
      await firstValueFrom(dataProvider.currentPage$),
    ).toEqual([{
      numberField: 1, stringField: 'a', booleanField: true, size: 17179869999,
    }]);
  });
});
