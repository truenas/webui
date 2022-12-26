import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { PoolManagerWizardForm } from 'app/pages/storage/modules/pool-manager/interfaces/pool-manager-wizard-form';

@UntilDestroy()
@Component({
  selector: 'ix-general-wizard-step',
  templateUrl: './general-wizard-step.component.html',
  styleUrls: ['./general-wizard-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneralWizardStepComponent {
  @Input() form: PoolManagerWizardForm['general'];
}
