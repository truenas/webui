import {
  AfterViewInit,
  Directive,
  Input,
  ViewContainerRef,
} from '@angular/core';
import { IxBodyCellBaseComponent } from 'app/modules/ix-table2/components/ix-table-body/ix-table-body-cells/ix-body-cell-base/ix-body-cell-base.component';
import { TableColumn } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Directive({
  selector: '[ix-body-cell]',
})
export class IxTableBodyCellDirective<T> implements AfterViewInit {
    @Input() row: T;
    @Input() column: TableColumn<T>;

    constructor(private viewContainer: ViewContainerRef) {}

    ngAfterViewInit(): void {
      this.createComponent();
    }

    createComponent(): void {
      if (!this.column.bodyCellType) {
        this.column.bodyCellType = IxBodyCellBaseComponent;
      }
      this.viewContainer.clear();
      const componentRef = this.viewContainer.createComponent(
        this.column.bodyCellType,
      );

      componentRef.instance.row = this.row;
      componentRef.instance.column = this.column;

      // TODO: Fix code
      // Object.keys(this.column).forEach((key: keyof TableColumn<T>) => {
      //   componentRef.instance[key] = this.column[key];
      // });
    }

    static ngTemplateContextGuard<T>(
      dir: IxTableBodyCellDirective<T>,
      ctx: unknown,
    ): ctx is { $implicit: T; index: number } {
      return true;
    }
}
