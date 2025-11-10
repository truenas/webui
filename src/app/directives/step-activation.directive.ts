import { DestroyRef, Directive, OnInit, output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatStep, MatStepper } from '@angular/material/stepper';

/**
 * Tells when a specific mat-step was activated.
 * ```
 * <mat-step ixStepActivation (activate)="onActivate()"></mat-step>
 * ```
 */
@Directive({
  selector: '[ixStepActivation]',
})
export class StepActivationDirective implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private step = inject(MatStep);
  private stepper = inject(MatStepper);

  readonly activate = output();

  ngOnInit(): void {
    this.stepper.selectionChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (this.step !== event.selectedStep) {
        return;
      }

      this.activate.emit();
    });
  }
}
