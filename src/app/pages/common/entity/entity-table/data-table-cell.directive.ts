import { Directive, ElementRef, Input, OnChanges } from '@angular/core';

@Directive({
  // tslint:disable-next-line: directive-selector
  selector: '[ix-auto]'
})
export class DataTableCellDirective implements OnChanges {
  public static readonly ATTRIBUTE = 'ix-auto';

  @Input('ix-auto') public tag: string;
  @Input('ix-auto-type') public type: string;

  // tslint:disable-next-line: no-input-rename
  @Input('ix-auto-identifier') public identifier: string;

  public constructor(private el: ElementRef) {}

  public ngOnChanges(): void {
    console.log(this.tag, this.identifier)
    let elType, elTag;
    this.type ? elType = this.type : elType = 'NEEDS TYPE!';
    this.tag ? elTag = `_${this.tag}` : elTag = '';
    try {
      (this.el.nativeElement as HTMLElement).setAttribute(
        DataTableCellDirective.ATTRIBUTE,
        this.identifier ? `${elType}__${this.identifier}${elTag}` : `${elType}__${elTag}`
      );
    } catch (error) {
      console.error(`Error in ${DataTableCellDirective.name}:`, error);
    }
  }
}
