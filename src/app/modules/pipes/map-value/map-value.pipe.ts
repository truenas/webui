import { Pipe, PipeTransform } from '@angular/core';

/**
 * Use in templates to get value of a map, i.e.
 * ```
 * {{ productType | mapValue: productTypeLabels }}
 * ```
 */
@Pipe({
  name: 'mapValue',
  standalone: true,
})
export class MapValuePipe implements PipeTransform {
  transform<T, R>(value: T, map: Map<T, R>): R {
    return map.get(value);
  }
}
