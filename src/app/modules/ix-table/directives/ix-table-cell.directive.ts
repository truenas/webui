import {
  Directive, input, model, TemplateRef,
} from '@angular/core';
import { DataProvider } from 'app/modules/ix-table/interfaces/data-provider.interface';

@Directive({
  selector: '[ix-table-cell]',
  standalone: true,
})
export class IxTableCellDirective<T> {
  readonly dataProvider = input<DataProvider<T>>();
  readonly columnIndex = model<number>();

  constructor(public templateRef: TemplateRef<{ $implicit: T }>) {}

  static ngTemplateContextGuard<T>(
    dir: IxTableCellDirective<T>,
    ctx: unknown,
  ): ctx is { $implicit: T; index: number } {
    return true;
  }
}
