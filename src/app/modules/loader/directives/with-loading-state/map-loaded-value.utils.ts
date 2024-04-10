import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';

export function mapLoadedValue<T, M>(state: LoadingState<T>, transform: (value: T) => M): LoadingState<M> {
  return {
    ...state,
    value: state.value ? transform(state.value) : null,
  };
}
