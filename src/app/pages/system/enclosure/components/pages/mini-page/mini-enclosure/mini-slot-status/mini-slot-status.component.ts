import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { EnclosureDiskStatus, enclosureDiskStatusLabels } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';

@Component({
  selector: 'ix-mini-slot-status',
  templateUrl: './mini-slot-status.component.html',
  styleUrl: './mini-slot-status.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MiniSlotStatusComponent {
  readonly slot = input.required<DashboardEnclosureSlot>();

  readonly EnclosureDiskStatus = EnclosureDiskStatus;

  readonly enclosureDiskStatusLabels = enclosureDiskStatusLabels;
}
