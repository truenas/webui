import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { LicenseFeature } from 'app/enums/license-feature.enum';
import { WebSocketService, IscsiService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'iscsi',
  templateUrl: './iscsi.component.html',
  providers: [IscsiService],
})
export class IscsiComponent implements OnInit {
  activedTab = 'configuration';
  navLinks = [{
    label: T('Target Global Configuration') as string,
    path: '/sharing/iscsi/configuration',
  },
  {
    label: T('Portals') as string,
    path: '/sharing/iscsi/portals',
  },
  {
    label: T('Initiators Groups') as string,
    path: '/sharing/iscsi/initiator',
  },
  {
    label: T('Authorized Access') as string,
    path: '/sharing/iscsi/auth',
  },
  {
    label: T('Targets') as string,
    path: '/sharing/iscsi/target',
  },
  {
    label: T('Extents') as string,
    path: '/sharing/iscsi/extent',
  },
  {
    label: T('Associated Targets') as string,
    path: '/sharing/iscsi/associatedtarget',
  },
  ];
  protected route_wizard = ['sharing', 'iscsi', 'wizard'];
  fcEnabled = false;
  constructor(protected router: Router, protected aroute: ActivatedRoute, protected ws: WebSocketService) {}

  ngOnInit(): void {
    this.ws.call('system.info').pipe(untilDestroyed(this)).subscribe(
      (systemInfo) => {
        if (systemInfo.license && systemInfo.license.features.indexOf(LicenseFeature.FibreChannel) > -1) {
          this.fcEnabled = true;
          this.navLinks.push({
            label: T('Fibre Channel Ports'),
            path: '/sharing/iscsi/fibrechannel',
          });
        }
      },
    );
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.activedTab = params['pk'];
    });
  }

  gotoWizard(): void {
    this.router.navigate(new Array('/').concat(this.route_wizard));
  }
}
