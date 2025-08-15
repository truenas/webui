import { Directive, input, TemplateRef, inject } from '@angular/core';
import { DataProvider } from 'app/modules/ix-table/interfaces/data-provider.interface';

@Directive({
  selector: '[ix-table-details-row]',
})
export class IxTableDetailsRowDirective<T> {
  templateRef = inject<TemplateRef<{
    $implicit: T;
  }>>(TemplateRef);

  readonly dataProvider = input.required<DataProvider<T>>();

  static ngTemplateContextGuard<T>(
    dir: IxTableDetailsRowDirective<T>,
    ctx: unknown,
  ): ctx is { $implicit: T; index: number } {
    return true;
  }
}
