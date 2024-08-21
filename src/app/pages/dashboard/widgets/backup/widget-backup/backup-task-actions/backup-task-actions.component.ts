import {
  ChangeDetectionStrategy, Component, input, output,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Role } from 'app/enums/role.enum';

@UntilDestroy()
@Component({
  selector: 'ix-backup-task-actions',
  templateUrl: './backup-task-actions.component.html',
  styleUrl: './backup-task-actions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackupTaskActionsComponent {
  allCount = input<number>();

  readonly taskAdded = output();
  readonly addReplicationTask = output();
  readonly addCloudSyncTask = output();

  readonly Role = Role;
}
