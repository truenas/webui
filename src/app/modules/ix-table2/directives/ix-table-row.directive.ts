import { Directive, Input, TemplateRef } from '@angular/core';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';

@Directive({
  selector: '[ix-table-row]',
})
export class IxTableRowDirective<T> {
  @Input() dataProvider!: ArrayDataProvider<T>;
  @Input() columnIndex!: number;

  constructor(public templateRef: TemplateRef<{ $implicit: T }>) {}

  static ngTemplateContextGuard<T>(
    dir: IxTableRowDirective<T>,
    ctx: unknown,
  ): ctx is { $implicit: T; index: number } {
    return true;
  }
}
