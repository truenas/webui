import _ from 'lodash';
import { OperatorFunction, map } from 'rxjs';

export function deepCloneState<T>(): OperatorFunction<T, T> {
  return map((state) => {
    return _.cloneDeep(state);
  });
}
