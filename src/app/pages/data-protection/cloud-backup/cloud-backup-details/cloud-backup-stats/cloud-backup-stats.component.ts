import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { cloudsyncTransferSettingLabels } from 'app/enums/cloudsync-transfer-setting.enum';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';

@Component({
  selector: 'ix-cloud-backup-stats',
  templateUrl: './cloud-backup-stats.component.html',
  styleUrl: './cloud-backup-stats.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloudBackupStatsComponent {
  @Input() backup: CloudBackup;
  protected readonly cloudsyncTransferSettingLabels = cloudsyncTransferSettingLabels;
}
