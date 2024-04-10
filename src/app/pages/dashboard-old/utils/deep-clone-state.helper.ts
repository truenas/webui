import _ from 'lodash';
import { OperatorFunction, map } from 'rxjs';

/**
 * @deprecated Only use for legacy code. Never code should not be mutating objects anyway.
 */
export function deepCloneState<T>(): OperatorFunction<T, T> {
  return map((state) => {
    return _.cloneDeep(state);
  });
}
