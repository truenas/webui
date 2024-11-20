import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import {
  MatCard, MatCardHeader, MatCardTitle, MatCardContent,
} from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { cloudsyncTransferSettingLabels } from 'app/enums/cloudsync-transfer-setting.enum';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';

@Component({
  selector: 'ix-cloud-backup-stats',
  templateUrl: './cloud-backup-stats.component.html',
  styleUrl: './cloud-backup-stats.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    TranslateModule,
    MapValuePipe,
  ],
})
export class CloudBackupStatsComponent {
  readonly backup = input.required<CloudBackup>();
  protected readonly cloudsyncTransferSettingLabels = cloudsyncTransferSettingLabels;
}
