import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatTabNav, MatTabLink, MatTabNavPanel } from '@angular/material/tabs';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { async } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { GlobalTargetConfigurationComponent } from 'app/pages/sharing/iscsi/global-target-configuration/global-target-configuration.component';
import { IscsiWizardComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/iscsi-wizard.component';
import { iscsiElements } from 'app/pages/sharing/iscsi/iscsi.elements';
import { IscsiService } from 'app/services/iscsi.service';

@UntilDestroy()
@Component({
  selector: 'ix-iscsi',
  templateUrl: './iscsi.component.html',
  styleUrls: ['./iscsi.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    PageHeaderComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    MatTabNav,
    MatTabNavPanel,
    TranslateModule,
    RouterOutlet,
    UiSearchDirective,
    AsyncPipe,
    MatTabLink,
    RouterLinkActive,
    RouterLink,
  ],
})
export class IscsiComponent {
  protected readonly searchableElements = iscsiElements;
  protected readonly requiredRoles = [Role.SharingIscsiWrite];

  protected readonly navLinks$ = this.iscsiService.hasFibreChannel().pipe(
    startWith(false),
    map((hasFibreChannel) => {
      const links = [
        {
          label: this.translate.instant('Targets'),
          path: '/sharing/iscsi/targets',
        },
        {
          label: this.translate.instant('Extents'),
          path: '/sharing/iscsi/extents',
        },
        {
          label: this.translate.instant('Initiators'),
          path: '/sharing/iscsi/initiators',
        },
        {
          label: this.translate.instant('Portals'),
          path: '/sharing/iscsi/portals',
        },
        {
          label: this.translate.instant('Authorized Access'),
          path: '/sharing/iscsi/authorized-access',
        },
      ];

      if (hasFibreChannel) {
        links.push({
          label: this.translate.instant('Fibre Channel Ports'),
          path: '/sharing/iscsi/fibre-channel-ports',
        });
      }

      return links;
    }),
  );

  constructor(
    private translate: TranslateService,
    private slideIn: SlideIn,
    private iscsiService: IscsiService,
  ) {}

  openWizard(): void {
    this.slideIn.open(IscsiWizardComponent)
      .pipe(
        filter((response) => !!response.response),
        untilDestroyed(this),
      )
      .subscribe(({ response }) => {
        this.iscsiService.refreshData(response);
      });
  }

  openGlobalTargetConfiguration(): void {
    this.slideIn.open(GlobalTargetConfigurationComponent);
  }

  protected readonly async = async;
}
