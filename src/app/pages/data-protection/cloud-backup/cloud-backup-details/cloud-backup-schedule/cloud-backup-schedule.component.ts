import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { TaskService } from 'app/services/task.service';

@Component({
  selector: 'ix-cloud-backup-schedule',
  templateUrl: './cloud-backup-schedule.component.html',
  styleUrl: './cloud-backup-schedule.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloudBackupScheduleComponent {
  @Input() backup: CloudBackup;

  get frequency(): string {
    return this.taskService.getTaskCronDescription(scheduleToCrontab(this.backup.schedule));
  }

  get schedule(): string {
    return (this.backup.enabled ? scheduleToCrontab(this.backup.schedule) : this.translate.instant('Disabled'));
  }

  constructor(
    private taskService: TaskService,
    private translate: TranslateService,
  ) {}
}
