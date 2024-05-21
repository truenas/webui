import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';

@Component({
  selector: 'ix-cloud-backup-excluded-paths',
  templateUrl: './cloud-backup-excluded-paths.component.html',
  styleUrl: './cloud-backup-excluded-paths.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloudBackupExcludedPathsComponent {
  readonly backup = input.required<CloudBackup>();
}
