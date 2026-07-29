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

  /** Whether this step was the selected one on the previous effect run. */
  private wasSelected = false;
  private isFirstRun = true;

  constructor() {
    // Mirror MatStepper's `selectionChange`, which fired only on navigation into a step:
    // emit on the transition from not-selected to selected, but not on the initial run
    // (the initially-selected step never fired) nor when the step list mutates while the
    // selection is unchanged (adding/removing the enclosure or spare step re-runs this effect).
    effect(() => {
      const index = this.stepper.selectedIndex();
      const isSelected = this.stepper.steps()[index] === this.step;

      if (isSelected && !this.wasSelected && !this.isFirstRun) {
        this.activate.emit();
      }

      this.wasSelected = isSelected;
      this.isFirstRun = false;
    });
  }
}
