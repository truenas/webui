import { Directive, Input, TemplateRef } from '@angular/core';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';

@Directive({
  selector: '[ix-table-details-row]',
})
export class IxTableDetailsRowDirective<T> {
  @Input() dataProvider: ArrayDataProvider<T>;

  constructor(public templateRef: TemplateRef<{ $implicit: T }>) {}

  static ngTemplateContextGuard<T>(
    dir: IxTableDetailsRowDirective<T>,
    ctx: unknown,
  ): ctx is { $implicit: T; index: number } {
    return true;
  }
}
