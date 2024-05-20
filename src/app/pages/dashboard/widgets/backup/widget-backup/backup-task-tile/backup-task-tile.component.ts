import {
  ChangeDetectionStrategy, Component, TemplateRef, input,
} from '@angular/core';
import { BackupTile } from 'app/interfaces/cloud-backup.interface';
import { BackupTaskActionsComponent } from 'app/pages/dashboard/widgets/backup/widget-backup/backup-task-actions/backup-task-actions.component';

@Component({
  selector: 'ix-backup-task-tile',
  templateUrl: './backup-task-tile.component.html',
  styleUrls: ['./backup-task-tile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackupTaskTileComponent {
  backupActions = input<TemplateRef<BackupTaskActionsComponent>>();
  tile = input<BackupTile>();
  hasSendTasks = input<boolean>();
}
