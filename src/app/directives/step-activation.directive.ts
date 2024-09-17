import {
  Directive, OnInit,
  output,
} from '@angular/core';
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
  standalone: true,
})
export class StepActivationDirective implements OnInit {
  readonly activate = output();

  constructor(
    private step: MatStep,
    private stepper: MatStepper,
  ) {}

  ngOnInit(): void {
    this.stepper.selectionChange.subscribe((event) => {
      if (this.step !== event.selectedStep) {
        return;
      }

      this.activate.emit();
    });
  }
}
