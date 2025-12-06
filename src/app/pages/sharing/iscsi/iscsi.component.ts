import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatTabNav, MatTabLink, MatTabNavPanel } from '@angular/material/tabs';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { filter, startWith } from 'rxjs/operators';
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
import { LicenseService } from 'app/services/license.service';

@UntilDestroy()
@Component({
  selector: 'ix-iscsi',
  templateUrl: './iscsi.component.html',
  styleUrls: ['./iscsi.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    MatTabLink,
    RouterLinkActive,
    RouterLink,
  ],
})
export class IscsiComponent {
  private translate = inject(TranslateService);
  private slideIn = inject(SlideIn);
  private iscsiService = inject(IscsiService);
  private license = inject(LicenseService);

  protected readonly searchableElements = iscsiElements;
  protected readonly requiredRoles = [Role.SharingIscsiWrite];

  protected readonly hasFibreChannel = toSignal(
    this.license.hasFibreChannel$.pipe(startWith(false)),
  );

  protected readonly navLinks = computed(() => {
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

    if (this.hasFibreChannel()) {
      links.push({
        label: this.translate.instant('Fibre Channel Ports'),
        path: '/sharing/iscsi/fibre-channel-ports',
      });
    }

    return links;
  });

  protected openWizard(): void {
    this.slideIn.open(IscsiWizardComponent)
      .pipe(
        filter((response) => !!response.response),
        untilDestroyed(this),
      )
      .subscribe(({ response }) => {
        this.iscsiService.refreshData(response);
      });
  }

  protected openGlobalTargetConfiguration(): void {
    this.slideIn.open(GlobalTargetConfigurationComponent);
  }
}
