import { Directive, ElementRef, Input, OnChanges } from '@angular/core';

@Directive({
  // tslint:disable-next-line: directive-selector
  selector: '[ix-auto]'
})
export class DataTableCellDirective implements OnChanges {
  public static readonly ATTRIBUTE = 'ix-auto';

  @Input('ix-auto') public column: string;
  @Input('ix-auto-type') public type: string;

  // tslint:disable-next-line: no-input-rename
  @Input('ix-auto-identifier') public identifier: string;

  public constructor(private el: ElementRef) {}

  public ngOnChanges(): void {
    let elType, elColumn;
    this.type ? elType = this.type : elType = 'NEEDS TYPE!';
    this.column ? elColumn = `_${this.column}` : elColumn = '';
    try {
      (this.el.nativeElement as HTMLElement).setAttribute(
        DataTableCellDirective.ATTRIBUTE,
        this.identifier ? `${elType}__${this.identifier}${elColumn}` : `${elType}__${elColumn}`
      );
    } catch (error) {
      console.error(`Error in ${DataTableCellDirective.name}:`, error);
    }
  }
}
