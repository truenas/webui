import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';

@Component({
  selector: 'ix-cloud-backup-list',
  templateUrl: './cloud-backup-list.component.html',
  styleUrl: './cloud-backup-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloudBackupListComponent {
  selectedBackup: CloudBackup;
  showMobileDetails = false;

  constructor() {
    this.selectedBackup = { description: 'test' } as CloudBackup;
  }

  closeMobileDetails(): void {
    this.showMobileDetails = false;
  }
}
