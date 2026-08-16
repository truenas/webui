import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TnSortEvent, TnTableComponent } from '@truenas/ui-components';
import { reflectSortIntoTable, restrictToSingleExpandedRow } from './temp-workarounds';

describe('restrictToSingleExpandedRow', () => {
  function newTable(): TnTableComponent<string> {
    return { expandedRows: signal(new Set<unknown>()) } as TnTableComponent<string>;
  }

  function setUpTable(): TnTableComponent<string> {
    const table = newTable();
    TestBed.runInInjectionContext(() => restrictToSingleExpandedRow(signal(table)));
    TestBed.tick();
    return table;
  }

  it('leaves a single expanded row alone', () => {
    const table = setUpTable();

    table.expandedRows.set(new Set(['a']));
    TestBed.tick();

    expect([...table.expandedRows()]).toEqual(['a']);
  });

  it('collapses back to the newly opened row when a second one opens', () => {
    const table = setUpTable();

    table.expandedRows.set(new Set(['a']));
    TestBed.tick();
    table.expandedRows.set(new Set(['a', 'b']));
    TestBed.tick();

    expect([...table.expandedRows()]).toEqual(['b']);
  });

  it('keeps at most one row expanded when a reload swaps in fresh row objects', () => {
    const table = setUpTable();
    const rowA = { id: 'a' };

    table.expandedRows.set(new Set([rowA]));
    TestBed.tick();

    // A reload replaces every row object; the previously expanded reference is gone.
    const reloadedA = { id: 'a' };
    const reloadedB = { id: 'b' };
    table.expandedRows.set(new Set([reloadedA, reloadedB]));
    TestBed.tick();

    expect([...table.expandedRows()]).toEqual([reloadedA]);
  });

  it('forgets the previous table instance, so a rebuilt table starts clean', () => {
    // The table is destroyed and rebuilt whenever the list empties out (search down to no
    // results and back), and rows the dead instance held must not pick the survivor.
    const tableSignal = signal(newTable());
    TestBed.runInInjectionContext(() => restrictToSingleExpandedRow(tableSignal));
    TestBed.tick();

    tableSignal().expandedRows.set(new Set(['a']));
    TestBed.tick();

    const rebuilt = newTable();
    tableSignal.set(rebuilt);
    TestBed.tick();

    // 'a' would have been treated as already-seen (and so pruned in favor of 'b') had the
    // tracking survived the swap.
    rebuilt.expandedRows.set(new Set(['a', 'b']));
    TestBed.tick();

    expect([...rebuilt.expandedRows()]).toEqual(['a']);
  });
});

describe('reflectSortIntoTable', () => {
  function newTable(): TnTableComponent<string> {
    return {
      sortColumn: signal(''),
      sortDirection: signal('' as TnSortEvent['direction']),
    } as TnTableComponent<string>;
  }

  it('reflects the remembered sort into a table mounted after it was set', () => {
    // The list empties out (tn-empty replaces the table), then fills again: the data provider
    // kept its sorting, so the fresh header has to show the arrow again.
    const table = signal<TnTableComponent<string> | undefined>(undefined);
    const sort = signal<TnSortEvent | null>({ column: 'name', direction: 'desc' });
    TestBed.runInInjectionContext(() => reflectSortIntoTable(table, sort));
    TestBed.tick();

    const mounted = newTable();
    table.set(mounted);
    TestBed.tick();

    expect(mounted.sortColumn()).toBe('name');
    expect(mounted.sortDirection()).toBe('desc');
  });

  it('leaves a table alone until a sort is remembered', () => {
    const mounted = newTable();
    const sort = signal<TnSortEvent | null>(null);
    TestBed.runInInjectionContext(() => reflectSortIntoTable(signal(mounted), sort));
    TestBed.tick();

    expect(mounted.sortColumn()).toBe('');

    sort.set({ column: 'size', direction: 'asc' });
    TestBed.tick();

    expect(mounted.sortColumn()).toBe('size');
    expect(mounted.sortDirection()).toBe('asc');
  });
});
