import { Directive, OnInit, output, inject } from '@angular/core';
import { MatStep, MatStepper } from '@angular/material/stepper';
import { UntilDestroy } from '@ngneat/until-destroy';

/**
 * Tells when a specific mat-step was activated.
 * ```
 * <mat-step ixStepActivation (activate)="onActivate()"></mat-step>
 * ```
 */
@UntilDestroy()
@Directive({
  selector: '[ixStepActivation]',
})
export class StepActivationDirective implements OnInit {
  private step = inject(MatStep);
  private stepper = inject(MatStepper);

  readonly activate = output();

  ngOnInit(): void {
    this.stepper.selectionChange.subscribe((event) => {
      if (this.step !== event.selectedStep) {
        return;
      }

      this.activate.emit();
    });
  }
}
