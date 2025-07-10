import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import {
  MatCard, MatCardHeader, MatCardTitle, MatCardContent,
} from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { cloudsyncTransferSettingLabels } from 'app/enums/cloudsync-transfer-setting.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';

@Component({
  selector: 'ix-cloud-backup-stats',
  templateUrl: './cloud-backup-stats.component.html',
  styleUrl: './cloud-backup-stats.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  formatRateLimit(value: number): string {
    // Convert KiB to bytes, then format using binary units (base 2)
    const bytesValue = value * 1024;
    return `${buildNormalizedFileSize(bytesValue, 'B', 2)}/s`;
  }
}
