import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Role } from 'app/enums/role.enum';
import { IscsiWizardComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/iscsi-wizard.component';
import { iscsiElements } from 'app/pages/sharing/iscsi/iscsi.elements';
import { IscsiService } from 'app/services/iscsi.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@Component({
  selector: 'ix-iscsi',
  templateUrl: './iscsi.component.html',
  styleUrls: ['./iscsi.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [IscsiService],
})
export class IscsiComponent {
  readonly requiredRoles = [Role.SharingIscsiWrite];
  readonly activeTab = input('configuration');

  navLinks = [{
    label: this.translate.instant('Target Global Configuration'),
    path: '/sharing/iscsi/configuration',
  },
  {
    label: this.translate.instant('Portals'),
    path: '/sharing/iscsi/portals',
  },
  {
    label: this.translate.instant('Initiators Groups'),
    path: '/sharing/iscsi/initiator',
  },
  {
    label: this.translate.instant('Authorized Access'),
    path: '/sharing/iscsi/auth',
  },
  {
    label: this.translate.instant('Targets'),
    path: '/sharing/iscsi/target',
  },
  {
    label: this.translate.instant('Extents'),
    path: '/sharing/iscsi/extent',
  },
  {
    label: this.translate.instant('Associated Targets'),
    path: '/sharing/iscsi/associatedtarget',
  }];

  protected readonly searchableElements = iscsiElements;

  constructor(
    protected translate: TranslateService,
    private slideInService: IxSlideInService,
  ) {}

  gotoWizard(): void {
    this.slideInService.open(IscsiWizardComponent);
  }
}
