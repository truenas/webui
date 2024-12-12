import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { DiskIconComponent } from 'app/modules/disk-icon/disk-icon.component';

@Component({
  selector: 'ix-mini-drive-stats',
  templateUrl: './mini-drive-stats.component.html',
  styleUrl: './mini-drive-stats.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    DiskIconComponent,
    TranslateModule,
    DecimalPipe,
  ],
})
export class MiniDriveStatsComponent {
  readonly slot = input.required<DashboardEnclosureSlot>();
}
