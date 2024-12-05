import {
  Directive, input, TemplateRef,
} from '@angular/core';
import { DataProvider } from 'app/modules/ix-table/interfaces/data-provider.interface';

@Directive({
  selector: '[ix-table-details-row]',
  standalone: true,
})
export class IxTableDetailsRowDirective<T> {
  readonly dataProvider = input.required<DataProvider<T>>();

  constructor(public templateRef: TemplateRef<{ $implicit: T }>) {}

  static ngTemplateContextGuard<T>(
    dir: IxTableDetailsRowDirective<T>,
    ctx: unknown,
  ): ctx is { $implicit: T; index: number } {
    return true;
  }
}
