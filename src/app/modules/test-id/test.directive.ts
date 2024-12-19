import {
  Directive, ElementRef, HostBinding, input, Optional,
} from '@angular/core';
import { kebabCase } from 'lodash-es';
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
  standalone: true,
})
export class TestDirective {
  readonly description = input.required<number | string | (string | number)[]>({
    alias: 'ixTest',
  });

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    @Optional() private overrideDirective: TestOverrideDirective,
  ) {}

  get normalizedDescription(): string[] {
    const description = this.overrideDirective?.overrideDescription() ?? this.description();
    let normalizedDescription = Array.isArray(description) ? description : [description];

    normalizedDescription = normalizedDescription
      .filter((part) => part)
      .map((part) => kebabCase(String(part)));

    if (this.overrideDirective?.keepLastPart()) {
      const initialDescription = this.description();
      const normalizedInitialDescription = Array.isArray(initialDescription)
        ? initialDescription
        : [initialDescription];
      normalizedDescription.push(normalizedInitialDescription[normalizedInitialDescription.length - 1]);
    }

    return normalizedDescription as string[];
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
      case 'mat-button-toggle-group':
      case 'mat-button-toggle':
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
      case 'span':
        return 'text';
      case 'ix-date':
        return tagName.replace('ix-', '');
      default:
        throw new Error(`Unknown element type: ${tagName}`);
    }
  }
}
