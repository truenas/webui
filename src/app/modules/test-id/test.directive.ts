import { Directive, ElementRef, HostBinding, input, inject } from '@angular/core';
import { normalizeTestIdParts, SupportedTestId } from 'app/modules/test-id/normalize-test-id.utils';
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
 * <span [ixTest]="[formControl.name, option.label]"></span>
 */
@Directive({
  selector: '[ixTest]',
})
export class TestDirective {
  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private overrideDirective = inject(TestOverrideDirective, { optional: true });

  readonly description = input.required<SupportedTestId>({
    alias: 'ixTest',
  });

  private get normalizedDescription(): string[] {
    const description = this.overrideDirective?.overrideDescription() ?? this.description();
    const segments = Array.isArray(description) ? description : [description];
    // `[ixTest]` has always filtered on plain falsiness, which drops a numeric `0`
    // segment as well as `null`/`undefined`/`''`. Kept here, and deliberately not in
    // `normalizeTestIdParts`, so the ids this directive resolves stay byte-identical
    // without new tn-* call sites inheriting the quirk.
    const normalizedDescription = normalizeTestIdParts(segments.filter((part) => Boolean(part)));

    if (this.overrideDirective?.keepLastPart()) {
      const initialDescription = this.description();
      const normalizedInitialDescription = Array.isArray(initialDescription)
        ? initialDescription
        : [initialDescription];
      const lastPart = normalizedInitialDescription[normalizedInitialDescription.length - 1];
      if (lastPart) {
        normalizedDescription.push(String(lastPart));
      }
    }

    return normalizedDescription;
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
      case 'input':
      case 'button':
      case 'select':
      case 'textarea':
      case 'table':
        return tagName;
      case 'a':
        return 'link';
      case 'div':
      case 'p':
      case 'span':
        return 'text';
      case 'ix-date':
        return tagName.replace('ix-', '');
      default:
        // Fall back to the raw tag name rather than throwing. As more components
        // migrate to tn-*, an unmapped element should degrade to a usable test id
        // instead of crashing the page that renders it.
        return tagName;
    }
  }
}
