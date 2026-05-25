import { Directive, ElementRef, HostBinding, input, inject } from '@angular/core';
import { environment } from 'environments/environment';
import { kebabCase } from 'lodash-es';
import { TestOverrideDirective } from 'app/modules/test-id/test-override/test-override.directive';

type SupportedTestId = number | string | null | undefined | (string | number | null | undefined)[];

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
  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private overrideDirective = inject(TestOverrideDirective, { optional: true });

  readonly description = input.required<SupportedTestId>({
    alias: 'ixTest',
  });

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
      case 'tn-icon':
        return 'icon';
      case 'tn-button':
      case 'tn-icon-button':
        return 'button';
      case 'tn-menu-item':
        return 'menu-item';
      case 'tn-select':
        return 'select';
      case 'div':
      case 'p':
      case 'span':
        return 'text';
      case 'ix-date':
      case 'ix-checkbox':
      case 'ix-select':
        return tagName.replace('ix-', '');
      default:
        // Policy:
        //   - In dev/test we still throw, so CI and local runs fail loudly on a missing
        //     mapping and force contributors to add an explicit case below.
        //   - In production we degrade to a console warning + prefix-stripped fallback
        //     so a missing mapping never crashes user-facing pages over a test attribute.
        // Always prefer adding an explicit `case 'tn-foo':` mapping to relying on the
        // fallback — the fallback exists only to keep production resilient, not as the
        // contract.
        if (!environment.production) {
          throw new Error(`Unknown element type: ${tagName}. Add a mapping in test.directive.ts.`);
        }
        console.warn(`[ixTest] Unknown element type: ${tagName}. Add a mapping in test.directive.ts.`);
        return tagName.replace(/^(ix|tn|mat)-/, '');
    }
  }
}
