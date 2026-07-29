import {
  ChangeDetectionStrategy, Component, input, output,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnTestIdDirective } from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';

@Component({
  selector: 'ix-backup-task-actions',
  templateUrl: './backup-task-actions.component.html',
  styleUrl: './backup-task-actions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RequiresRolesDirective,
    TnTestIdDirective,
    TranslateModule,
  ],
})
export class BackupTaskActionsComponent {
  allCount = input<number>();

  readonly taskAdded = output();
  readonly addReplicationTask = output();
  readonly addCloudSyncTask = output();

  readonly Role = Role;
}
