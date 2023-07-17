import {
  AfterViewInit,
  Directive,
  Input,
  ViewContainerRef,
} from '@angular/core';
import { IxCellTextComponent } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Directive({
  selector: '[ix-body-cell]',
})
export class IxTableBodyCellDirective<T> implements AfterViewInit {
  @Input() row: T;
  @Input() column: Column<T, ColumnComponent<T>>;

  constructor(private viewContainer: ViewContainerRef) {}

  ngAfterViewInit(): void {
    this.createComponent();
  }

  createComponent(): void {
    if (!this.column.type) {
      this.column.type = IxCellTextComponent;
    }
    this.viewContainer.clear();
    const componentRef = this.viewContainer.createComponent(
      this.column.type,
    );

    componentRef.instance.setRow(this.row);
    Object.keys(this.column).forEach((key: keyof ColumnComponent<T>) => {
      // TODO: Replace never.
      componentRef.instance[key] = this.column[key] as never;
    });
  }

  static ngTemplateContextGuard<T>(
    dir: IxTableBodyCellDirective<T>,
    ctx: unknown,
  ): ctx is { $implicit: T; index: number } {
    return true;
  }
}
