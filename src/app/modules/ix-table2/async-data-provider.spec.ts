import { firstValueFrom, of, tap } from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { AsyncDataProvider } from 'app/modules/ix-table2/async-data-provider';

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

describe('AsyncDataProvider', () => {
  it('sets rows after init', async () => {
    const request$ = of(testTableData);
    const dataProvider = new AsyncDataProvider<TestTableData>(request$);

    expect(dataProvider.rows).toEqual(testTableData);
    expect(await firstValueFrom(dataProvider.currentPage$)).toEqual(testTableData);
  });

  it('sets EmptyType when there is data', async () => {
    const request$ = of(testTableData);
    const dataProvider = new AsyncDataProvider<TestTableData>(request$);

    expect(await firstValueFrom(dataProvider.emptyType$)).toBe(EmptyType.NoSearchResults);
  });

  it('sets EmptyType when not data', async () => {
    const request$ = of([]);
    const dataProvider = new AsyncDataProvider<TestTableData>(request$);

    expect(await firstValueFrom(dataProvider.emptyType$)).toBe(EmptyType.NoPageData);
  });

  it('sets EmptyType on loading', async () => {
    const request$ = of();
    const dataProvider = new AsyncDataProvider<TestTableData>(request$);

    expect(await firstValueFrom(dataProvider.emptyType$)).toBe(EmptyType.Loading);
  });

  it('sets EmptyType on error', async () => {
    const request$ = of([]).pipe(tap(() => { throw new Error(); }));
    const dataProvider = new AsyncDataProvider<TestTableData>(request$);

    expect(await firstValueFrom(dataProvider.emptyType$)).toBe(EmptyType.Errors);
  });
});
