import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnCardComponent } from '@truenas/ui-components';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';

@Component({
  selector: 'ix-cloud-backup-excluded-paths',
  templateUrl: './cloud-backup-excluded-paths.component.html',
  styleUrl: './cloud-backup-excluded-paths.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TranslateModule,
  ],
})
export class CloudBackupExcludedPathsComponent {
  readonly backup = input.required<CloudBackup>();
}
