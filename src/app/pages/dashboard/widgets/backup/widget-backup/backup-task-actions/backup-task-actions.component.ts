import {
  ChangeDetectionStrategy, Component, EventEmitter, Output, input,
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

  @Output() taskAdded = new EventEmitter();
  @Output() addReplicationTask = new EventEmitter();
  @Output() addCloudSyncTask = new EventEmitter();

  readonly Role = Role;
}
