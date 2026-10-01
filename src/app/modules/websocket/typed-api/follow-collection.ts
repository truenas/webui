import {
  Observable, scan, startWith, switchMap,
} from 'rxjs';

/**
 * A collection change as the typed client emits it, with its generics erased: `added` and
 * `changed` carry the row under `fields`, `removed` carries only the `id`.
 */
interface CollectionChange<T> {
  msg: string;
  id?: unknown;
  fields?: T;
}

/**
 * Emits `rows$`'s rows, then the rows again after each change `changes$` reports, folded in
 * by `id`. Shared by `TypedApiService.queryAndSubscribe` and its spec double, so the double
 * runs the same folding.
 *
 * Changes accumulate: each one applies to the rows as the previous ones left them. A `changed`
 * row is merged over the existing one, so a partial update keeps the fields it did not name.
 */
export function followCollection<T extends { id?: unknown }>(
  rows$: Observable<T[]>,
  changes$: Observable<CollectionChange<T>>,
): Observable<T[]> {
  return rows$.pipe(
    switchMap((rows) => changes$.pipe(
      scan((current, change) => applyChange(current, change), rows),
      startWith(rows),
    )),
  );
}

function applyChange<T extends { id?: unknown }>(rows: T[], change: CollectionChange<T>): T[] {
  switch (change.msg) {
    case 'added':
      return change.fields ? [...rows, change.fields] : rows;
    case 'changed':
      return rows.map((row) => (row.id === change.id ? { ...row, ...change.fields } : row));
    case 'removed':
      return rows.filter((row) => row.id !== change.id);
    default:
      return rows;
  }
}
