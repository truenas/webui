import {
  BehaviorSubject, OperatorFunction, pipe, map, tap,
  filter,
} from 'rxjs';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';

export type LoadingMap = Map<number | string, boolean>;

export function accumulateLoadingState<T>(
  id: number | string,
  container$: BehaviorSubject<LoadingMap>,
): OperatorFunction<T, T> {
  return pipe(
    toLoadingState(),
    tap((state) => container$.next(container$.getValue().set(id, state.isLoading))),
    filter((state) => !state.isLoading),
    map((state) => state.value),
  );
}
