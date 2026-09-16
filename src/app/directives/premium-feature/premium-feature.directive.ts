import {
  ComponentRef, Directive, Input, TemplateRef, ViewContainerRef, inject, inputBinding,
} from '@angular/core';
import {
  PremiumFeatureWrapperComponent,
} from 'app/directives/premium-feature/premium-feature-wrapper.component';

/**
 * Shows a premium feature the appliance is not entitled to, rather than hiding
 * it: the content renders dimmed and inert, with a "Premium" tag that explains
 * how to get it.
 *
 * ```html
 * <ix-fieldset *ixPremiumFeature="hasVersioning(); testId: 's3-versioning'" [title]="'Versioning' | translate">
 * ```
 *
 * The argument is the entitlement, so it reads as the positive: truthy renders
 * the content plainly. `undefined` — which is what the entitlement selectors
 * report while the map is still loading — counts as entitled here, so a gated
 * section does not flash a Premium tag on the way up and then lose it.
 *
 * Presentation only. Whether a denied feature can still be *submitted* is the
 * form's own business: the controls keep their values, so a payload built from
 * `getRawValue()` still carries what the record already had, and a form that
 * must omit a field when denied has to say so itself.
 */
@Directive({
  selector: '[ixPremiumFeature]',
})
export class PremiumFeatureDirective {
  private templateRef = inject<TemplateRef<HTMLElement>>(TemplateRef);
  private viewContainerRef = inject(ViewContainerRef);

  private wrapper: ComponentRef<PremiumFeatureWrapperComponent> | undefined;
  private rendered: boolean | null = null;

  private testId = '';

  /**
   * Whether the appliance is entitled to what this wraps. `undefined` while
   * the entitlement map loads, and treated as entitled — see the class note.
   */
  // eslint-disable-next-line @angular-eslint/prefer-signals
  @Input()
  set ixPremiumFeature(entitled: boolean | undefined) {
    const locked = entitled === false;
    if (this.rendered === locked) {
      return;
    }
    this.rendered = locked;

    this.viewContainerRef.clear();
    this.wrapper = undefined;

    if (!locked) {
      this.viewContainerRef.createEmbeddedView(this.templateRef);
      return;
    }

    this.wrapper = this.viewContainerRef.createComponent(PremiumFeatureWrapperComponent, {
      bindings: [
        inputBinding('template', () => this.templateRef),
        inputBinding('testId', () => this.testId),
      ],
    });
  }

  /** Distinguishes this badge from the others on the same screen. */
  // eslint-disable-next-line @angular-eslint/prefer-signals
  @Input()
  set ixPremiumFeatureTestId(testId: string) {
    this.testId = testId;
  }
}
