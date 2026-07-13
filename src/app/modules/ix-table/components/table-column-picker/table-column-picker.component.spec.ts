import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { TnSelectHarness } from '@truenas/ui-components';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { preferredColumnsUpdated } from 'app/store/preferences/preferences.actions';
import { TableColumnPickerComponent } from './table-column-picker.component';

interface Row { name: string; path: string }

describe('TableColumnPickerComponent', () => {
  let spectator: Spectator<TableColumnPickerComponent<Row>>;
  let loader: HarnessLoader;
  let store$: MockStore;

  const makeColumns = (): Column<Row, ColumnComponent<Row>>[] => ([
    { propertyName: 'name', title: 'Name', hidden: false },
    { propertyName: 'path', title: 'Path', hidden: false },
    { hidden: false }, // actions column: no title -> not user-toggleable
  ] as Column<Row, ColumnComponent<Row>>[]);

  const createComponent = createComponentFactory({
    component: TableColumnPickerComponent<Row>,
    providers: [
      provideMockStore({
        initialState: { preferences: { preferences: { tableDisplayedColumns: [] } } },
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        columns: makeColumns(),
        columnPreferencesKey: 'testList',
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    store$ = spectator.inject(MockStore);
    jest.spyOn(store$, 'dispatch');
    spectator.detectChanges();
  });

  it('lists only the titled columns as options', async () => {
    const select = await loader.getHarness(TnSelectHarness);
    await select.open();
    expect(await select.getOptions()).toEqual(['Name', 'Path']);
  });

  it('emits updated column copies and persists when a column is toggled off', async () => {
    let emitted: Column<Row, ColumnComponent<Row>>[] | undefined;
    spectator.component.columnsChange.subscribe((columns) => emitted = columns);

    const select = await loader.getHarness(TnSelectHarness);
    await select.open();
    await select.selectOption('Path');

    expect(emitted?.find((column) => column.propertyName === 'path')?.hidden).toBe(true);
    expect(emitted?.find((column) => column.propertyName === 'name')?.hidden).toBe(false);
    // Input columns are not mutated — visibility only changes via the emitted copies.
    expect(spectator.component.columns().find((column) => column.propertyName === 'path')?.hidden).toBe(false);
    expect(store$.dispatch).toHaveBeenCalledWith(preferredColumnsUpdated({
      tableDisplayedColumns: [{ title: 'testList', columns: ['Name'] }],
    }));
  });

  it('keeps at least one column visible', async () => {
    let emitted: Column<Row, ColumnComponent<Row>>[] | undefined;
    spectator.component.columnsChange.subscribe((columns) => emitted = columns);

    const select = await loader.getHarness(TnSelectHarness);
    await select.open();
    await select.selectOption('Path');
    await select.selectOption('Name'); // would empty the selection -> reverted without emitting

    const visible = emitted?.filter((column) => column.title && !column.hidden);
    expect(visible).toHaveLength(1);
    expect(visible?.[0]?.propertyName).toBe('name');
  });

  it('restores visibility from saved preferences', () => {
    store$.setState({ preferences: { preferences: { tableDisplayedColumns: [{ title: 'testList', columns: ['Name'] }] } } });

    spectator = createComponent({
      props: { columns: makeColumns(), columnPreferencesKey: 'testList' },
      detectChanges: false,
    });
    let emitted: Column<Row, ColumnComponent<Row>>[] | undefined;
    spectator.component.columnsChange.subscribe((columns) => emitted = columns);
    spectator.detectChanges();

    expect(emitted?.find((column) => column.propertyName === 'path')?.hidden).toBe(true);
  });
});
