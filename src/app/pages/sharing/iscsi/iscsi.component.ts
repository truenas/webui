import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { IscsiWizardComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/iscsi-wizard.component';
import { IscsiService } from 'app/services/iscsi.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-iscsi',
  templateUrl: './iscsi.component.html',
  styleUrls: ['./iscsi.component.scss'],
  providers: [IscsiService],
})
export class IscsiComponent {
  @Input() activeTab = 'configuration';
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

  constructor(
    protected router: Router,
    protected ws: WebSocketService,
    protected translate: TranslateService,
    private slideInService: IxSlideInService,
  ) {}

  gotoWizard(): void {
    this.slideInService.open(IscsiWizardComponent);
  }
}
