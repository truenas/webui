import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { LicenseFeature } from 'app/enums/license-feature.enum';
import { WebSocketService, IscsiService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'iscsi',
  templateUrl: './iscsi.component.html',
  providers: [IscsiService],
})
export class IscsiComponent implements OnInit {
  activeTab = 'configuration';
  navLinks = [{
    label: this.translate.instant('Target Global Configuration') as string,
    path: '/sharing/iscsi/configuration',
  },
  {
    label: this.translate.instant('Portals') as string,
    path: '/sharing/iscsi/portals',
  },
  {
    label: this.translate.instant('Initiators Groups') as string,
    path: '/sharing/iscsi/initiator',
  },
  {
    label: this.translate.instant('Authorized Access') as string,
    path: '/sharing/iscsi/auth',
  },
  {
    label: this.translate.instant('Targets') as string,
    path: '/sharing/iscsi/target',
  },
  {
    label: this.translate.instant('Extents') as string,
    path: '/sharing/iscsi/extent',
  },
  {
    label: this.translate.instant('Associated Targets') as string,
    path: '/sharing/iscsi/associatedtarget',
  },
  ];
  protected route_wizard = ['sharing', 'iscsi', 'wizard'];
  fcEnabled = false;

  constructor(
    protected router: Router,
    protected aroute: ActivatedRoute,
    protected ws: WebSocketService,
    protected translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.ws.call('system.info').pipe(untilDestroyed(this)).subscribe(
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
      this.activeTab = params['pk'];
    });
  }

  gotoWizard(): void {
    this.router.navigate(new Array('/').concat(this.route_wizard));
  }
}
