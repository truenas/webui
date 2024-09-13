import {
  ChangeDetectionStrategy, Component, input, output,
} from '@angular/core';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';

@Component({
  selector: 'ix-cloud-backup-details',
  templateUrl: './cloud-backup-details.component.html',
  styleUrl: './cloud-backup-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloudBackupDetailsComponent {
  readonly backup = input.required<CloudBackup>();

  readonly closeMobileDetails = output();

  onCloseMobileDetails(): void {
    this.closeMobileDetails.emit();
  }
}
