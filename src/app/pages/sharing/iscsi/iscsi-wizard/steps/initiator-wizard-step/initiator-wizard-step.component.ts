import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { helptextSharingIscsi } from 'app/helptext/sharing';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IscsiWizardComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/iscsi-wizard.component';

@UntilDestroy()
@Component({
  selector: 'ix-initiator-wizard-step',
  templateUrl: './initiator-wizard-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IxChipsComponent,
    TranslateModule,
  ],
})
export class InitiatorWizardStepComponent {
  form = input<IscsiWizardComponent['form']['controls']['initiator']>();

  readonly helptextSharingIscsi = helptextSharingIscsi;
}
