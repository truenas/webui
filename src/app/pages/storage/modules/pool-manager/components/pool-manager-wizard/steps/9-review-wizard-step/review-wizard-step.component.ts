import { Component } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'ix-review-wizard-step',
  templateUrl: './review-wizard-step.component.html',
  styleUrls: ['./review-wizard-step.component.scss'],
})
export class ReviewWizardStepComponent {
}
