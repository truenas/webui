import {
  Component,
  ChangeDetectionStrategy,
  input,
  output, computed,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnIconComponent, TnMenuComponent, TnMenuItemComponent, TnMenuTriggerDirective,
} from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { AppState } from 'app/enums/app-state.enum';
import { Role } from 'app/enums/role.enum';
import { App } from 'app/interfaces/app.interface';

@Component({
  selector: 'ix-installed-apps-list-bulk-actions',
  templateUrl: './installed-apps-list-bulk-actions.component.html',
  styleUrls: ['./installed-apps-list-bulk-actions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnMenuTriggerDirective,
    TnMenuComponent,
    TnMenuItemComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TnIconComponent,
    TranslateModule,
  ],
})

export class InstalledAppsListBulkActionsComponent {
  readonly checkedApps = input.required<App[]>();
  readonly bulkStart = output();
  readonly bulkStop = output();
  readonly bulkUpdate = output();
  readonly bulkDelete = output();

  protected readonly requiredRoles = [Role.AppsWrite];

  protected isBulkStartDisabled = computed(() => {
    return this.checkedApps().every(
      (app) => [AppState.Running, AppState.Deploying].includes(app.state),
    );
  });

  protected isBulkStopDisabled = computed(() => {
    return this.checkedApps().every(
      (app) => [AppState.Stopped, AppState.Crashed].includes(app.state),
    );
  });

  protected isBulkUpdateDisabled = computed(() => {
    return !this.checkedApps().some((app) => app.upgrade_available);
  });
}
