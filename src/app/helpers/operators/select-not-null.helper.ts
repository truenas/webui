import { select } from '@ngrx/store';
import { Selector } from '@ngrx/store/src/models';
import { Observable, pipe, UnaryFunction } from 'rxjs';
import { filter } from 'rxjs/operators';

export function selectNotNull<S, R>(selector: Selector<S, R>): UnaryFunction<Observable<S>, Observable<R>> {
  return pipe(
    select(selector),
    filter((value) => value !== null),
  );
}
