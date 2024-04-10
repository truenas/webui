import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';

@Component({
  selector: 'ix-cloud-backup-stats',
  templateUrl: './cloud-backup-stats.component.html',
  styleUrl: './cloud-backup-stats.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloudBackupStatsComponent {
  @Input() backup: CloudBackup;
}
