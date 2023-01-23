import {
  Directive, ElementRef, HostBinding, Input,
} from '@angular/core';
import { snakeCase } from 'lodash';

@Directive({
  selector: '[ixTest]',
})
export class TestDirective {
  @Input('ixTest') description: number | string | (string | number)[];

  constructor(
    private elementRef: ElementRef<HTMLElement>,
  ) {}

  get normalizedDescription(): string[] {
    const description = Array.isArray(this.description) ? this.description : [this.description];

    return description.map((part) => snakeCase(String(part)));
  }

  @HostBinding('attr.data-test')
  get attribute(): string {
    return [
      this.getElementType(),
      ...this.normalizedDescription,
    ]
      .filter((part) => part)
      .join('-');
  }

  private getElementType(): string {
    const tagName = this.elementRef.nativeElement.tagName.toLowerCase();

    switch (tagName) {
      case 'tr':
        return 'row';
      case 'mat-slide-toggle':
        return 'toggle';
      case 'mat-checkbox':
      case 'mat-option':
      case 'mat-select':
      case 'mat-radio-group':
      case 'mat-radio-button':
        return tagName.replace('mat-', '');
      case 'input':
      case 'button':
      case 'select':
      case 'textarea':
        return tagName;
      default:
        console.error('Unsupported element type in [ixTest]', tagName);
        return '';
    }
  }
}
