import { Directive, ElementRef, Input, OnChanges } from '@angular/core';

@Directive({
  selector: '[ix-auto]'
})

export class IXAutoDirective implements OnChanges {
  public static readonly ATTRIBUTE = 'ix-auto';

  @Input('ix-auto') public tag: string;
  @Input('ix-auto-type') public type: string;
  @Input('ix-auto-identifier') public identifier: string;

  public constructor(private el: ElementRef) {}

  public ngOnChanges(): void {
    let elType, elTag;
    this.type ? elType = this.type : elType = 'NEEDS TYPE!';
    this.tag ? elTag = `_${this.tag}` : elTag = '';
    try {
      (this.el.nativeElement as HTMLElement).setAttribute(
        IXAutoDirective.ATTRIBUTE,
        this.identifier ? `${elType}__${this.identifier}${elTag}` : `${elType}__${elTag}`
      );
    } catch (error) {
      console.error(`Error in ${IXAutoDirective.name}:`, error);
    }
  }
}
