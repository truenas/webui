import {
  Observable, defer, tap, MonoTypeOperatorFunction,
} from 'rxjs';

export function tapOnce<T>(fn: (v: T) => unknown): MonoTypeOperatorFunction<T> {
  return (source$: Observable<T>) => defer(() => {
    let isFirst = true;

    return source$.pipe(
      tap((value) => {
        if (isFirst) {
          fn(value);
          isFirst = false;
        }
      }),
    );
  });
}
