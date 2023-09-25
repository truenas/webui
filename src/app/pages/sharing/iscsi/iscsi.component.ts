import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { IscsiWizardComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/iscsi-wizard.component';
import { IscsiService } from 'app/services/iscsi.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { PageTitleService } from 'app/services/page-title.service';
import { WebSocketService } from 'app/services/ws.service';

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

  constructor(
    protected router: Router,
    protected aroute: ActivatedRoute,
    protected ws: WebSocketService,
    protected translate: TranslateService,
    private slideInService: IxSlideInService,
    private pageTitle: PageTitleService,
  ) {}

  ngOnInit(): void {
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.activeTab = params.pk as string;
      // TODO: Do something better in the future.
      setTimeout(() => {
        this.pageTitle.setTitle('iSCSI');
      }, 0);
    });
  }

  gotoWizard(): void {
    this.slideInService.open(IscsiWizardComponent);
  }
}
