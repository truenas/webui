import {
  Directive, Input, TemplateRef, input,
} from '@angular/core';
import { DataProvider } from 'app/modules/ix-table/interfaces/data-provider.interface';

@Directive({
  selector: '[ix-table-cell]',
  standalone: true,
})
export class IxTableCellDirective<T> {
  readonly dataProvider = input<DataProvider<T> | undefined>(undefined);
  @Input() columnIndex: number;

  constructor(public templateRef: TemplateRef<{ $implicit: T }>) {}

  static ngTemplateContextGuard<T>(
    dir: IxTableCellDirective<T>,
    ctx: unknown,
  ): ctx is { $implicit: T; index: number } {
    return true;
  }
}
