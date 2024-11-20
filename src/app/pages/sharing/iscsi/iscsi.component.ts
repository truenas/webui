import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatTabNav, MatTabLink, MatTabNavPanel } from '@angular/material/tabs';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { IscsiWizardComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/iscsi-wizard.component';
import { iscsiElements } from 'app/pages/sharing/iscsi/iscsi.elements';
import { IscsiService } from 'app/services/iscsi.service';
import { SlideInService } from 'app/services/slide-in.service';
import { AssociatedTargetListComponent } from './associated-target/associated-target-list/associated-target-list.component';
import { AuthorizedAccessListComponent } from './authorized-access/authorized-access-list/authorized-access-list.component';
import { ExtentListComponent } from './extent/extent-list/extent-list.component';
import { InitiatorListComponent } from './initiator/initiator-list/initiator-list.component';
import { PortalListComponent } from './portal/portal-list/portal-list.component';
import { TargetListComponent } from './target/target-list/target-list.component';
import { TargetGlobalConfigurationComponent } from './target-global-configuration/target-global-configuration.component';

@Component({
  selector: 'ix-iscsi',
  templateUrl: './iscsi.component.html',
  styleUrls: ['./iscsi.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [IscsiService],
  standalone: true,
  imports: [
    PageHeaderComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    MatTabNav,
    MatTabLink,
    MatTabNavPanel,
    TargetGlobalConfigurationComponent,
    UiSearchDirective,
    PortalListComponent,
    InitiatorListComponent,
    AuthorizedAccessListComponent,
    TargetListComponent,
    ExtentListComponent,
    AssociatedTargetListComponent,
    TranslateModule,
    RouterLinkActive,
    RouterOutlet,
    RouterLink,
  ],
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
    private slideInService: SlideInService,
  ) {}

  gotoWizard(): void {
    this.slideInService.open(IscsiWizardComponent);
  }
}
