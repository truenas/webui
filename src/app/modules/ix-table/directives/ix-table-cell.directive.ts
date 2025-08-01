import { Directive, input, model, TemplateRef, inject } from '@angular/core';
import { DataProvider } from 'app/modules/ix-table/interfaces/data-provider.interface';

@Directive({
  selector: '[ix-table-cell]',
})
export class IxTableCellDirective<T> {
  templateRef = inject<TemplateRef<{
    $implicit: T;
  }>>(TemplateRef);

  readonly dataProvider = input<DataProvider<T>>();
  readonly columnIndex = model<number>();

  static ngTemplateContextGuard<T>(
    dir: IxTableCellDirective<T>,
    ctx: unknown,
  ): ctx is { $implicit: T; index: number } {
    return true;
  }
}
