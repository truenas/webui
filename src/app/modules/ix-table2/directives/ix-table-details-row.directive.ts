import { Directive, Input, TemplateRef } from '@angular/core';
import { DataProvider } from 'app/modules/ix-table2/interfaces/data-provider.interface';

@Directive({
  selector: '[ix-table-details-row]',
})
export class IxTableDetailsRowDirective<T> {
  @Input() dataProvider: DataProvider<T>;

  constructor(public templateRef: TemplateRef<{ $implicit: T }>) {}

  static ngTemplateContextGuard<T>(
    dir: IxTableDetailsRowDirective<T>,
    ctx: unknown,
  ): ctx is { $implicit: T; index: number } {
    return true;
  }
}
