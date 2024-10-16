import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, TemplateRef, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { BackupTile } from 'app/interfaces/cloud-backup.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { FormatDateTimePipe } from 'app/modules/pipes/format-date-time/format-datetime.pipe';
import { BackupTaskActionsComponent } from 'app/pages/dashboard/widgets/backup/widget-backup/backup-task-actions/backup-task-actions.component';

@Component({
  selector: 'ix-backup-task-tile',
  templateUrl: './backup-task-tile.component.html',
  styleUrls: ['./backup-task-tile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NgTemplateOutlet,
    IxIconComponent,
    TranslateModule,
    FormatDateTimePipe,
  ],
})
export class BackupTaskTileComponent {
  backupActions = input<TemplateRef<BackupTaskActionsComponent>>();
  tile = input<BackupTile>();
  hasSendTasks = input<boolean>();
}
