import { Directive, Input, TemplateRef } from '@angular/core';
import { DataProvider } from 'app/modules/ix-table2/interfaces/data-provider.interface';

@Directive({
  selector: '[ix-table-cell]',
})
export class IxTableCellDirective<T> {
  @Input() dataProvider: DataProvider<T>;
  @Input() columnIndex: number;

  constructor(public templateRef: TemplateRef<{ $implicit: T }>) {}

  static ngTemplateContextGuard<T>(
    dir: IxTableCellDirective<T>,
    ctx: unknown,
  ): ctx is { $implicit: T; index: number } {
    return true;
  }
}
