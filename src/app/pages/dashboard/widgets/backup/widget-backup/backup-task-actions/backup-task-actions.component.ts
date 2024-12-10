import {
  ChangeDetectionStrategy, Component, input, output,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { TestDirective } from 'app/modules/test-id/test.directive';

@UntilDestroy()
@Component({
  selector: 'ix-backup-task-actions',
  templateUrl: './backup-task-actions.component.html',
  styleUrl: './backup-task-actions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    RequiresRolesDirective,
    TestDirective,
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
