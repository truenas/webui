import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cast',
  standalone: true,
})
export class CastPipe implements PipeTransform {
  /**
   * @usage
   * Use this to cast types in templates similarly to as.
   * Picks up type automatically:
   * [formControl]="abstractControl | cast"
   */
  transform<S, T extends S>(value: S): T {
    return value as T;
  }
}
