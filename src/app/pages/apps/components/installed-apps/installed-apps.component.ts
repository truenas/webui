import {
  Component,
  ChangeDetectionStrategy,
  viewChild,
} from '@angular/core';
import { MatAnchor, MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { App } from 'app/interfaces/app.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { MasterDetailViewComponent } from 'app/modules/master-detail-view/master-detail-view.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AppDetailsPanelComponent } from 'app/pages/apps/components/installed-apps/app-details-panel/app-details-panel.component';
import { AppSettingsButtonComponent } from 'app/pages/apps/components/installed-apps/app-settings-button/app-settings-button.component';
import { DockerStatusComponent } from 'app/pages/apps/components/installed-apps/docker-status/docker-status.component';
import { InstalledAppsListComponent } from 'app/pages/apps/components/installed-apps/installed-apps-list/installed-apps-list.component';

@UntilDestroy()
@Component({
  selector: 'ix-installed-apps',
  templateUrl: './installed-apps.component.html',
  styleUrls: ['./installed-apps.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TranslateModule,
    PageHeaderComponent,
    DockerStatusComponent,
    MatButton,
    RequiresRolesDirective,
    TestDirective,
    IxIconComponent,
    AppSettingsButtonComponent,
    RouterLink,
    MatAnchor,
    AppDetailsPanelComponent,
    MasterDetailViewComponent,
    InstalledAppsListComponent,
  ],
})
export class InstalledAppsComponent {
  readonly installedAppsList = viewChild.required(InstalledAppsListComponent);

  get selectedApp(): App | undefined {
    return this.installedAppsList().selectedApp;
  }

  get appsUpdateAvailable(): number {
    return this.installedAppsList().appsUpdateAvailable;
  }

  get hasUpdates(): boolean {
    return this.installedAppsList().hasUpdates;
  }

  protected readonly requiredRoles = [Role.AppsWrite];

  start(name: string): void {
    this.installedAppsList().start(name);
  }

  stop(name: string): void {
    this.installedAppsList().stop(name);
  }

  onBulkUpgrade(updateAll = false): void {
    this.installedAppsList().onBulkUpgrade(updateAll);
  }
}
