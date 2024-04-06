import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';

@Component({
  selector: 'ix-cloud-backup-schedule',
  templateUrl: './cloud-backup-schedule.component.html',
  styleUrl: './cloud-backup-schedule.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloudBackupScheduleComponent {
  @Input() backup: CloudBackup;
}
