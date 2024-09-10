import {
  AfterViewInit, ChangeDetectorRef,
  ComponentRef,
  Directive,
  Input,
  OnChanges,
  ViewContainerRef,
} from '@angular/core';
import { IxCellTextComponent } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';

@Directive({
  selector: '[ix-body-cell]',
})
export class IxTableBodyCellDirective<T> implements AfterViewInit, OnChanges {
  @Input() row: T;
  @Input() column: Column<T, ColumnComponent<T>>;

  private componentRef: ComponentRef<ColumnComponent<T>>;

  constructor(
    private viewContainer: ViewContainerRef,
    private cdr: ChangeDetectorRef,
  ) {}

  ngAfterViewInit(): void {
    this.createComponent();
  }

  ngOnChanges(): void {
    if (!this.componentRef) {
      return;
    }
    this.setComponentProps();
  }

  createComponent(): void {
    if (!this.column.type) {
      this.column.type = IxCellTextComponent;
    }
    this.viewContainer.clear();
    this.componentRef = this.viewContainer.createComponent(
      this.column.type,
    );

    this.setComponentProps();
  }

  private setComponentProps(): void {
    this.componentRef.instance.setRow(this.row);
    Object.keys(this.column).forEach((key: keyof ColumnComponent<T>) => {
      if (key === 'value') {
        return;
      }
      // TODO: Replace never.
      this.componentRef.instance[key] = this.column[key] as never;
    });

    this.cdr.detectChanges();
  }

  static ngTemplateContextGuard<T>(
    dir: IxTableBodyCellDirective<T>,
    ctx: unknown,
  ): ctx is { $implicit: T; index: number } {
    return true;
  }
}
