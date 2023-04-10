import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { LicenseFeature } from 'app/enums/license-feature.enum';
import { IscsiWizardComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/iscsi-wizard.component';
import { IscsiService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-iscsi',
  templateUrl: './iscsi.component.html',
  providers: [IscsiService],
})
export class IscsiComponent implements OnInit {
  activeTab = 'configuration';
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
  },
  ];
  protected wizardRoute = ['sharing', 'iscsi', 'wizard'];
  fcEnabled = false;

  constructor(
    protected router: Router,
    protected aroute: ActivatedRoute,
    protected ws: WebSocketService,
    protected translate: TranslateService,
    private store$: Store<AppState>,
    private slideInService: IxSlideInService,
  ) {}

  ngOnInit(): void {
    this.store$.pipe(waitForSystemInfo, untilDestroyed(this)).subscribe(
      (systemInfo) => {
        if (systemInfo.license && systemInfo.license.features.includes(LicenseFeature.FibreChannel)) {
          this.fcEnabled = true;
          this.navLinks.push({
            label: this.translate.instant('Fibre Channel Ports'),
            path: '/sharing/iscsi/fibrechannel',
          });
        }
      },
    );
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.activeTab = params.pk;
    });
  }

  gotoWizard(): void {
    this.slideInService.open(IscsiWizardComponent);
  }
}
