import {
  ChangeDetectionStrategy, Component, input, output,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';
import { MobileBackButtonComponent } from 'app/modules/buttons/mobile-back-button/mobile-back-button.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { CloudBackupExcludedPathsComponent } from './cloud-backup-excluded-paths/cloud-backup-excluded-paths.component';
import { CloudBackupScheduleComponent } from './cloud-backup-schedule/cloud-backup-schedule.component';
import { CloudBackupSnapshotsComponent } from './cloud-backup-snapshots/cloud-backup-snapshots.component';
import { CloudBackupStatsComponent } from './cloud-backup-stats/cloud-backup-stats.component';

@Component({
  selector: 'ix-cloud-backup-details',
  templateUrl: './cloud-backup-details.component.html',
  styleUrl: './cloud-backup-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TestDirective,
    IxIconComponent,
    CloudBackupScheduleComponent,
    CloudBackupStatsComponent,
    CloudBackupExcludedPathsComponent,
    CloudBackupSnapshotsComponent,
    TranslateModule,
    MobileBackButtonComponent,
  ],
})
export class CloudBackupDetailsComponent {
  readonly backup = input.required<CloudBackup>();

  readonly closeMobileDetails = output();

  onCloseMobileDetails(): void {
    this.closeMobileDetails.emit();
  }
}
