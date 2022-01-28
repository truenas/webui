import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Returns an observable that resolves to true if any of inputs resolve to true.
 */
export function combineLatestIsAny(input$: Observable<unknown>[]): Observable<boolean> {
  return combineLatest(input$).pipe(map((values) => {
    return values.some(Boolean);
  }));
}
