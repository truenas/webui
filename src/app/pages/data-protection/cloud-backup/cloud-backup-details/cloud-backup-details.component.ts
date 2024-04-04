import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, Output,
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
  @Output() closeMobileDetails = new EventEmitter<void>();

  onCloseMobileDetails(): void {
    this.closeMobileDetails.emit();
  }
}
