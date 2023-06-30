import {
  AfterViewInit,
  Directive,
  Input,
  ViewContainerRef,
} from '@angular/core';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';
import { IxHeaderCellBaseComponent } from 'app/modules/ix-table2/components/ix-table-head/ix-table-head-cells/ix-header-cell-base/ix-header-cell-base.component';
import { TableColumn } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Directive({
  selector: '[ix-header-cell]',
})
export class IxTableHeaderCellDirective<T> implements AfterViewInit {
    @Input() dataProvider: ArrayDataProvider<T>;
    @Input() column: TableColumn<T>;

    constructor(private viewContainer: ViewContainerRef) {}

    ngAfterViewInit(): void {
      this.createComponent();
    }

    createComponent(): void {
      if (!this.column.headerCellType) {
        this.column.headerCellType = IxHeaderCellBaseComponent;
      }
      this.viewContainer.clear();
      const componentRef = this.viewContainer.createComponent(
        this.column.headerCellType,
      );

      componentRef.instance.dataProvider = this.dataProvider;
      componentRef.instance.column = this.column;

      // TODO: Fix code
      // Object.keys(this.column).forEach((key: keyof TableColumn<T>) => {
      //   componentRef.instance[key] = this.column[key];
      // });
    }

    static ngTemplateContextGuard<T>(
      dir: IxTableHeaderCellDirective<T>,
      ctx: unknown,
    ): ctx is { $implicit: T; index: number } {
      return true;
    }
}
