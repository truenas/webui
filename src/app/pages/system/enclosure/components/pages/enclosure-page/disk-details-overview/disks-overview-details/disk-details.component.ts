import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { enclosureDiskStatusLabels } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';

@Component({
  selector: 'ix-disk-details',
  templateUrl: './disk-details.component.html',
  styleUrls: ['./disk-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskDetailsComponent {
  readonly selectedSlot = input.required<DashboardEnclosureSlot>();

  readonly enclosureDiskStatusLabels = enclosureDiskStatusLabels;
}
