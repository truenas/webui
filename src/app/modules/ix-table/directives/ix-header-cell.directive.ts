import {
  AfterViewInit,
  Directive, input,
  ViewContainerRef,
} from '@angular/core';
import { IxHeaderCellTextComponent } from 'app/modules/ix-table/components/ix-table-head/head-cells/ix-header-cell-text/ix-header-cell-text.component';
import { Column, ColumnComponent, ColumnKeys } from 'app/modules/ix-table/interfaces/column-component.class';
import { DataProvider } from 'app/modules/ix-table/interfaces/data-provider.interface';

@Directive({
  selector: '[ix-header-cell]',
  standalone: true,
})
export class IxTableHeaderCellDirective<T> implements AfterViewInit {
  readonly dataProvider = input<DataProvider<T>>();
  readonly column = input<Column<T, ColumnComponent<T>>>();

  constructor(private viewContainer: ViewContainerRef) {}

  ngAfterViewInit(): void {
    this.createComponent();
  }

  createComponent(): void {
    if (!this.column().headerType) {
      this.column().headerType = IxHeaderCellTextComponent;
    }
    this.viewContainer.clear();
    const componentRef = this.viewContainer.createComponent(
      this.column().headerType,
    );

    componentRef.instance.dataProvider = this.dataProvider();
    Object.keys(this.column()).forEach((key: ColumnKeys<T>) => {
      // TODO: replace never
      componentRef.instance[key] = this.column()[key] as never;
    });
  }

  static ngTemplateContextGuard<T>(
    dir: IxTableHeaderCellDirective<T>,
    ctx: unknown,
  ): ctx is { $implicit: T; index: number } {
    return true;
  }
}
