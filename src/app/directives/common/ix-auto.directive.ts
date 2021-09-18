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
    let elType; let
      elTag;
    this.type ? elType = this.type : elType = 'NEEDS TYPE!';
    this.tag ? elTag = `_${this.tag}` : elTag = '';
    try {
      (this.el.nativeElement as HTMLElement).setAttribute(
        IXAutoDirective.ATTRIBUTE,
        this.identifier ? `${elType}__${this.identifier}${elTag}` : `${elType}__${elTag}`,
      );
    } catch (error) {
      console.error(`Error in ${IXAutoDirective.name}:`, error);
    }
  }
}
