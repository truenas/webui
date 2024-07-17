import {
  ChangeDetectionStrategy, Component, input, output,
} from '@angular/core';
import { DashboardEnclosureSlot, EnclosureVdevDisk } from 'app/interfaces/enclosure.interface';

@Component({
  selector: 'ix-vdev-disks-legend',
  styleUrl: './vdev-disks-legend.component.scss',
  templateUrl: './vdev-disks-legend.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VdevDisksLegendComponent {
  readonly selectedSlot = input.required<DashboardEnclosureSlot>();
  readonly poolColor = input.required<string>();

  readonly diskClick = output<EnclosureVdevDisk>();

  protected isSelectedSlot(disk: EnclosureVdevDisk): boolean {
    return this.selectedSlot().dev === disk.dev;
  }
}
