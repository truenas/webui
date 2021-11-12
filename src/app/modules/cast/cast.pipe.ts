import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'cast' })
export class CastPipe implements PipeTransform {
  /**
   * Cast (S: SuperType) into (T: Type) using generics.
   * @param value (S: SuperType) obtained from input type.
   * @optional @param type (T CastingType)
   * @returns (T: Type) obtained by optional @param type OR assignment type.
   */
  // eslint-disable-next-line unused-imports/no-unused-vars
  transform<S, T extends S>(value: S, type?: { new (): T }): T {
    return value as T;
  }
}
