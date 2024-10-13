import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import {
  MatCard, MatCardHeader, MatCardTitle, MatCardContent,
} from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';

@Component({
  selector: 'ix-cloud-backup-excluded-paths',
  templateUrl: './cloud-backup-excluded-paths.component.html',
  styleUrl: './cloud-backup-excluded-paths.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    TranslateModule,
  ],
})
export class CloudBackupExcludedPathsComponent {
  readonly backup = input.required<CloudBackup>();
}
