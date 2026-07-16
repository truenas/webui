import { ChangeDetectionStrategy, Component, computed, inject, DestroyRef } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent, TnTabComponent, TnTabsComponent, type TabChangeEvent,
} from '@truenas/ui-components';
import { filter, map, startWith } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { GlobalTargetConfigurationComponent } from 'app/pages/sharing/iscsi/global-target-configuration/global-target-configuration.component';
import { IscsiWizardComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/iscsi-wizard.component';
import { iscsiElements } from 'app/pages/sharing/iscsi/iscsi.elements';
import { IscsiService } from 'app/services/iscsi.service';
import { LicenseService } from 'app/services/license.service';

@Component({
  selector: 'ix-iscsi',
  templateUrl: './iscsi.component.html',
  styleUrls: ['./iscsi.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TnTabsComponent,
    TnTabComponent,
    TranslateModule,
    RouterOutlet,
    UiSearchDirective,
  ],
})
export class IscsiComponent {
  private translate = inject(TranslateService);
  private formPanel = inject(FormSidePanelService);
  private iscsiService = inject(IscsiService);
  private license = inject(LicenseService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  protected readonly searchableElements = iscsiElements;
  protected readonly requiredRoles = [Role.SharingIscsiWrite];

  protected readonly hasFibreChannel = toSignal(
    this.license.hasFibreChannel$.pipe(startWith(false)),
  );

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly navLinks = computed(() => {
    const links = [
      {
        label: this.translate.instant('Targets'),
        path: '/sharing/iscsi/targets',
        slug: 'targets',
      },
      {
        label: this.translate.instant('Extents'),
        path: '/sharing/iscsi/extents',
        slug: 'extents',
      },
      {
        label: this.translate.instant('Initiators'),
        path: '/sharing/iscsi/initiators',
        slug: 'initiators',
      },
      {
        label: this.translate.instant('Portals'),
        path: '/sharing/iscsi/portals',
        slug: 'portals',
      },
      {
        label: this.translate.instant('Authorized Access'),
        path: '/sharing/iscsi/authorized-access',
        slug: 'authorized-access',
      },
    ];

    if (this.hasFibreChannel()) {
      links.push({
        label: this.translate.instant('Fibre Channel Ports'),
        path: '/sharing/iscsi/fibre-channel-ports',
        slug: 'fibre-channel-ports',
      });
    }

    return links;
  });

  protected readonly activeTabIndex = computed(() => {
    const url = this.currentUrl() ?? '';
    const index = this.navLinks().findIndex((link) => url.startsWith(link.path));
    return index === -1 ? 0 : index;
  });

  protected onTabChange(event: TabChangeEvent): void {
    // tn-tabs re-emits the current index while initializing (index === previousIndex)
    // and the URL-driven [selectedIndex] binding already reflects router state — only
    // a genuine user tab switch should navigate.
    if (event.index === event.previousIndex || event.index === this.activeTabIndex()) {
      return;
    }
    const link = this.navLinks()[event.index];
    if (link) {
      this.router.navigate([link.path]);
    }
  }

  protected openWizard(): void {
    // Opened footerless — the wizard's stepper owns its own Next/Back/Save buttons.
    this.formPanel.open(IscsiWizardComponent, {
      title: this.translate.instant('iSCSI Wizard'),
      wide: true,
      footerless: true,
    })
      .onSuccess((response) => {
        this.iscsiService.refreshData(response);
      }, this.destroyRef);
  }

  protected openGlobalTargetConfiguration(): void {
    this.formPanel.open(GlobalTargetConfigurationComponent, {
      title: this.translate.instant('iSCSI Global Configuration'),
    });
  }
}
