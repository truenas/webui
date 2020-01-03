import { Directive, ElementRef, Input, OnChanges } from '@angular/core';

@Directive({
  // tslint:disable-next-line: directive-selector
  selector: '[ix-datatable-cell]'
})
export class DataTableCellDirective implements OnChanges {
  public static readonly ATTRIBUTE = 'ix-table-cell';

  @Input('ix-datatable-cell') public column: string;

  // tslint:disable-next-line: no-input-rename
  @Input('ix-datatable-cell-identifier') public identifier: string;

  public constructor(private el: ElementRef) {}

  public ngOnChanges(): void {
    try {
      (this.el.nativeElement as HTMLElement).setAttribute(
        DataTableCellDirective.ATTRIBUTE,
        this.identifier ? `${this.identifier}_${this.column}` : this.column
      );
    } catch (error) {
      console.error(`Error in ${DataTableCellDirective.name}:`, error);
    }
  }
}
