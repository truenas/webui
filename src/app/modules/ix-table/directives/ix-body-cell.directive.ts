import {
  AfterViewInit, ChangeDetectorRef,
  ComponentRef,
  Directive,
  OnChanges,
  ViewContainerRef,
  input,
} from '@angular/core';
import { IxCellTextComponent } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { Column, ColumnComponent, ColumnKeys } from 'app/modules/ix-table/interfaces/column-component.class';

@Directive({
  selector: '[ix-body-cell]',
  standalone: true,
})
export class IxTableBodyCellDirective<T> implements AfterViewInit, OnChanges {
  readonly row = input.required<T>();
  readonly column = input.required<Column<T, ColumnComponent<T>>>();

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
    const type = this.column().type || IxCellTextComponent;
    this.viewContainer.clear();
    this.componentRef = this.viewContainer.createComponent(type);

    this.setComponentProps();
  }

  private setComponentProps(): void {
    this.componentRef.instance.setRow(this.row());
    Object.keys(this.column()).forEach((key: ColumnKeys<T>) => {
      this.componentRef.instance[key] = this.column()[key] as never;
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
