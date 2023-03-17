import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { IscsiWizardComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/iscsi-wizard.component';

@UntilDestroy()
@Component({
  selector: 'ix-portal-wizard-step',
  templateUrl: './portal-wizard-step.component.html',
  styleUrls: ['./portal-wizard-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalWizardStepComponent {
  @Input() form: IscsiWizardComponent['form']['controls']['portal'];
}
