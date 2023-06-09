import {
  Directive, ElementRef, HostBinding, Input, Optional,
} from '@angular/core';
import { kebabCase } from 'lodash';
import { assertUnreachable } from 'app/helpers/assert-unreachable.utils';
import { TestOverrideDirective } from 'app/modules/test-id/test-override/test-override.directive';

/**
 * Adds test attribute to the element for the benefit of Release Engineering.
 * Prefer not to use test attributes in our unit tests.
 *
 * Usage:
 * Add some description to [ixTest]. Both string and array of strings are supported.
 * Do NOT add element type, in most cases it'll be added automatically.
 *
 * Examples:
 * <button ixTest="reset-settings">Reset Settings</button>
 * <input [ixTest]="formControl.name">
 * <mat-option [ixTest]="[formControl.name, option.label]"></mat-option>
 */
@Directive({
  selector: '[ixTest]',
})
export class TestDirective {
  @Input('ixTest') description: number | string | (string | number)[];

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    @Optional() private overrideDirective: TestOverrideDirective,
  ) {}

  get normalizedDescription(): string[] {
    const description = this.overrideDirective?.overrideDescription ?? this.description;
    const normalizedDescription = Array.isArray(description) ? description : [description];

    return normalizedDescription
      .filter((part) => part)
      .map((part) => kebabCase(String(part)));
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
      case 'mat-icon':
      case 'mat-row':
      case 'mat-slider':
        return tagName.replace('mat-', '');
      case 'input':
      case 'button':
      case 'select':
      case 'textarea':
      case 'table':
        return tagName;
      case 'a':
        return 'link';
      case 'ix-icon':
        return 'icon';
      case 'div':
      case 'p':
        return 'text';
      default:
        assertUnreachable(tagName as never);
        return '';
    }
  }
}
