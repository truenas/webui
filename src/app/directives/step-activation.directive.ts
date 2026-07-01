import { Directive, effect, output, inject } from '@angular/core';
import { TnStepComponent, TnStepperComponent } from '@truenas/ui-components';

/**
 * Tells when a specific tn-step was activated.
 * ```
 * <tn-step ixStepActivation (activate)="onActivate()"></tn-step>
 * ```
 */
@Directive({
  selector: '[ixStepActivation]',
  standalone: true,
})
export class StepActivationDirective {
  private step = inject(TnStepComponent);
  private stepper = inject(TnStepperComponent);

  readonly activate = output();

  constructor() {
    effect(() => {
      const index = this.stepper.selectedIndex();
      if (this.stepper.steps()[index] === this.step) {
        this.activate.emit();
      }
    });
  }
}
