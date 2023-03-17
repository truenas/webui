import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { IscsiWizardComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/iscsi-wizard.component';

@UntilDestroy()
@Component({
  selector: 'ix-device-wizard-step',
  templateUrl: './device-wizard-step.component.html',
  styleUrls: ['./device-wizard-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceWizardStepComponent {
  @Input() form: IscsiWizardComponent['form']['controls']['device'];
}
