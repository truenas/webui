import {
  Directive, ElementRef, Input, OnChanges,
} from '@angular/core';

@Directive({
  selector: '[ix-auto]',
})
export class IXAutoDirective implements OnChanges {
  static readonly ATTRIBUTE = 'ix-auto';

  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('ix-auto') tag: string;
  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('ix-auto-type') type: string;
  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('ix-auto-identifier') identifier: string;

  constructor(private el: ElementRef) {}

  ngOnChanges(): void {
    const elType = this.type || 'NEEDS TYPE!';
    let elTag;
    if (this.tag) {
      elTag = `_${this.tag}`;
    } else {
      elTag = '';
    }
    try {
      (this.el.nativeElement as HTMLElement).setAttribute(
        IXAutoDirective.ATTRIBUTE,
        this.identifier ? `${elType}__${this.identifier}${elTag}` : `${elType}__${elTag}`,
      );
    } catch (error: unknown) {
      console.error(`Error in ${IXAutoDirective.name}:`, error);
    }
  }
}
