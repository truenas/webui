import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';

@Component({
  selector: 'ix-mini-drive-stats',
  templateUrl: './mini-drive-stats.component.html',
  styleUrl: './mini-drive-stats.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MiniDriveStatsComponent {
  readonly slot = input.required<DashboardEnclosureSlot>();
}
