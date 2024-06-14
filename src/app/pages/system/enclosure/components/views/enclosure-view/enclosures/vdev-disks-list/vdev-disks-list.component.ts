import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DashboardEnclosureSlotColored } from 'app/interfaces/enclosure.interface';

@Component({
  selector: 'ix-vdev-disks-list',
  styleUrl: './vdev-disks-list.component.scss',
  templateUrl: './vdev-disks-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VdevDisksListComponent {
  selectedSlot = input.required<DashboardEnclosureSlotColored>();
}
