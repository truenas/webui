import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { map } from 'rxjs';
import { helptextSharingIscsi } from 'app/helptext/sharing';
import { IscsiWizardComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/iscsi-wizard.component';
import { IscsiService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-portal-wizard-step',
  templateUrl: './portal-wizard-step.component.html',
  styleUrls: ['./portal-wizard-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalWizardStepComponent {
  @Input() form: IscsiWizardComponent['form']['controls']['portal'];

  readonly helptextSharingIscsi = helptextSharingIscsi;

  readonly portalOptions$ = this.iscsiService.listPortals().pipe(
    map((portals) => {
      return portals.map((portal) => {
        const ips = portal.listen.map((ip) => ip.ip).join(', ');
        return {
          label: `${portal.tag} (${ips})`,
          value: portal.id,
        };
      });
    }),
    untilDestroyed(this),
  );

  constructor(
    private iscsiService: IscsiService,
  ) {}
}
