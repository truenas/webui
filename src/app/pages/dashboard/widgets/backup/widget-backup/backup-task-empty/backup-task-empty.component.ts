import {
  ChangeDetectionStrategy, Component, TemplateRef, input, output,
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

  readonly taskAdded = output();
  readonly addReplicationTask = output();
  readonly addRsyncTask = output();
  readonly addCloudSyncTask = output();

  readonly Role = Role;
}
