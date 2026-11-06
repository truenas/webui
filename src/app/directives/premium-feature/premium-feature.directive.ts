import {
  Directive, effect, input, TemplateRef, untracked, ViewContainerRef, inject, inputBinding,
} from '@angular/core';
import { type TnTestIdValue } from '@truenas/ui-components';
import {
  PremiumFeatureWrapperComponent,
} from 'app/directives/premium-feature/premium-feature-wrapper.component';

/**
 * Shows a feature the appliance isn't entitled to dimmed and inert with a "Premium" tag, instead of
 * hiding it: `*ixPremiumFeature="hasVersioning(); testId: 's3-versioning'"`. Truthy renders plainly,
 * and so does `undefined` (still loading), so a section doesn't flash the tag on boot. Presentation
 * only: controls keep their values, so a form that must omit a denied field has to do it itself.
 */
@Directive({
  selector: '[ixPremiumFeature]',
})
export class PremiumFeatureDirective {
  private templateRef = inject<TemplateRef<HTMLElement>>(TemplateRef);
  private viewContainerRef = inject(ViewContainerRef);

  private rendered: boolean | null = null;

  /**
   * Whether the appliance is entitled to what this wraps. `undefined` while
   * the entitlement map loads, and treated as entitled — see the class note.
   */
  readonly ixPremiumFeature = input<boolean | undefined>();

  /** Distinguishes this badge from the others on the same screen. */
  readonly ixPremiumFeatureTestId = input<TnTestIdValue>();

  constructor() {
    effect(() => {
      const locked = this.ixPremiumFeature() === false;
      untracked(() => this.render(locked));
    });
  }

  private render(locked: boolean): void {
    if (this.rendered === locked) {
      return;
    }
    this.rendered = locked;

    this.viewContainerRef.clear();

    if (!locked) {
      this.viewContainerRef.createEmbeddedView(this.templateRef);
      return;
    }

    this.viewContainerRef.createComponent(PremiumFeatureWrapperComponent, {
      bindings: [
        inputBinding('template', () => this.templateRef),
        inputBinding('testId', () => this.ixPremiumFeatureTestId()),
      ],
    });
  }
}
