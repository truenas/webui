import {
  ChangeDetectionStrategy, Component, EventEmitter, Output, TemplateRef, input,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Role } from 'app/enums/role.enum';
import { BackupTaskActionsComponent } from 'app/pages/dashboard/widgets/backup/widget-backup/backup-task-actions/backup-task-actions.component';

@UntilDestroy()
@Component({
  selector: 'ix-backup-task-empty',
  templateUrl: './backup-task-empty.component.html',
  styleUrl: './backup-task-empty.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackupTaskEmptyComponent {
  backupActions = input<TemplateRef<BackupTaskActionsComponent>>();
  isLoading = input<boolean>();

  @Output() taskAdded = new EventEmitter();
  @Output() addReplicationTask = new EventEmitter();
  @Output() addRsyncTask = new EventEmitter();
  @Output() addCloudSyncTask = new EventEmitter();

  readonly Role = Role;
}
