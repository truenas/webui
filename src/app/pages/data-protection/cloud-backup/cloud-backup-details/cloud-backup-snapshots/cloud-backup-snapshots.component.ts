import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';

@Component({
  selector: 'ix-cloud-backup-snapshots',
  templateUrl: './cloud-backup-snapshots.component.html',
  styleUrl: './cloud-backup-snapshots.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloudBackupSnapshotsComponent {
  @Input() backup: CloudBackup;
}
