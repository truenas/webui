import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, TemplateRef, computed, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { BackupTile } from 'app/interfaces/cloud-backup.interface';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { BackupTaskActionsComponent } from 'app/pages/dashboard/widgets/backup/widget-backup/backup-task-actions/backup-task-actions.component';

@Component({
  selector: 'ix-backup-task-tile',
  templateUrl: './backup-task-tile.component.html',
  styleUrls: ['./backup-task-tile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnIconComponent,
    TranslateModule,
    FormatDateTimePipe,
    NgTemplateOutlet,
  ],
})
export class BackupTaskTileComponent {
  backupActions = input<TemplateRef<BackupTaskActionsComponent>>();
  tile = input<BackupTile>();
  hasSendTasks = input<boolean>();

  /**
   * A group that only pulls gets the prompt to set up a backup of its own. When nothing on the
   * widget sends, the widget shows the prompt once in its own banner instead of in every tile.
   */
  protected readonly showBackupActions = computed(() => Boolean(this.hasSendTasks()) && !this.tile()?.totalSend);
}
