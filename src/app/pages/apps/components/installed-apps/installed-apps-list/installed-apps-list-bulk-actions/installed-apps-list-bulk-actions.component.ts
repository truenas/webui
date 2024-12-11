import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { AppState } from 'app/enums/app-state.enum';
import { Role } from 'app/enums/role.enum';
import { App } from 'app/interfaces/app.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';

@UntilDestroy()
@Component({
  selector: 'ix-installed-apps-list-bulk-actions',
  templateUrl: './installed-apps-list-bulk-actions.component.html',
  styleUrls: ['./installed-apps-list-bulk-actions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    RequiresRolesDirective,
    IxIconComponent,
    MatButton,
    TranslateModule,
  ],
})

export class InstalledAppsListBulkActionsComponent {
  readonly checkedApps = input.required<App[]>();
  readonly bulkStart = output();
  readonly bulkStop = output();
  readonly bulkUpgrade = output();
  readonly bulkDelete = output();

  protected readonly requiredRoles = [Role.AppsWrite];

  get isBulkStartDisabled(): boolean {
    return this.checkedApps().every(
      (app) => [AppState.Running, AppState.Deploying].includes(app.state),
    );
  }

  get isBulkStopDisabled(): boolean {
    return this.checkedApps().every(
      (app) => [AppState.Stopped, AppState.Crashed].includes(app.state),
    );
  }

  get isBulkUpgradeDisabled(): boolean {
    return !this.checkedApps().some((app) => app.upgrade_available);
  }
}
