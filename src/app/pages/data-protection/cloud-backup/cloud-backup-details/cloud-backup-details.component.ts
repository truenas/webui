import {
  ChangeDetectionStrategy, Component, Input, output,
} from '@angular/core';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';

@Component({
  selector: 'ix-cloud-backup-details',
  templateUrl: './cloud-backup-details.component.html',
  styleUrl: './cloud-backup-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloudBackupDetailsComponent {
  @Input() backup: CloudBackup;

  readonly closeMobileDetails = output();

  onCloseMobileDetails(): void {
    this.closeMobileDetails.emit();
  }
}
