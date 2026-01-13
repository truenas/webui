import {
  ChangeDetectionStrategy, Component, computed, input, output,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { AppState } from 'app/enums/app-state.enum';
import { Role } from 'app/enums/role.enum';
import { App } from 'app/interfaces/app.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-app-bulk-actions-panel',
  templateUrl: './app-bulk-actions-panel.component.html',
  styleUrls: ['./app-bulk-actions-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatCardActions,
    MatButton,
    TranslateModule,
    RequiresRolesDirective,
    TestDirective,
  ],
})
export class AppBulkActionsPanelComponent {
  readonly checkedApps = input.required<App[]>();

  readonly bulkStart = output();
  readonly bulkStop = output();
  readonly bulkUpdate = output();
  readonly bulkDelete = output();

  protected readonly requiredRoles = [Role.AppsWrite];

  protected readonly isBulkStartDisabled = computed(() => {
    return this.checkedApps().every(
      (app) => [AppState.Running, AppState.Deploying].includes(app.state),
    );
  });

  protected readonly isBulkStopDisabled = computed(() => {
    return this.checkedApps().every(
      (app) => [AppState.Stopped, AppState.Crashed].includes(app.state),
    );
  });

  protected readonly isBulkUpdateDisabled = computed(() => {
    return !this.checkedApps().some((app) => app.upgrade_available);
  });
}
