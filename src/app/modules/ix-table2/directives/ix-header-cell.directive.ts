import {
  AfterViewInit,
  Directive,
  Input,
  ViewContainerRef,
} from '@angular/core';
import { IxHeaderCellTextComponent } from 'app/modules/ix-table2/components/ix-table-head/head-cells/ix-header-cell-text/ix-header-cell-text.component';
import { DataProvider } from 'app/modules/ix-table2/interfaces/data-provider.interface';
import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Directive({
  selector: '[ix-header-cell]',
})
export class IxTableHeaderCellDirective<T> implements AfterViewInit {
  @Input() dataProvider: DataProvider<T>;
  @Input() column: Column<T, ColumnComponent<T>>;

  constructor(private viewContainer: ViewContainerRef) {}

  ngAfterViewInit(): void {
    this.createComponent();
  }

  createComponent(): void {
    if (!this.column.headerType) {
      this.column.headerType = IxHeaderCellTextComponent;
    }
    this.viewContainer.clear();
    const componentRef = this.viewContainer.createComponent(
      this.column.headerType,
    );

    componentRef.instance.dataProvider = this.dataProvider;
    Object.keys(this.column).forEach((key: keyof ColumnComponent<T>) => {
      componentRef.instance[key] = this.column[key] as never;
    });
  }

  static ngTemplateContextGuard<T>(
    dir: IxTableHeaderCellDirective<T>,
    ctx: unknown,
  ): ctx is { $implicit: T; index: number } {
    return true;
  }
}
