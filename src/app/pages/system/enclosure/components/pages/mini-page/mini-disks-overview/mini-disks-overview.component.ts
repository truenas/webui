import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { chain } from 'lodash-es';
import { EnclosureDiskStatus } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';

@Component({
  selector: 'ix-mini-disks-overview',
  templateUrl: './mini-disks-overview.component.html',
  styleUrl: './mini-disks-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MiniDisksOverviewComponent {
  readonly slots = input.required<DashboardEnclosureSlot[]>();

  protected readonly totalPools = computed(() => {
    return chain(this.slots())
      .map((slot) => slot.pool_info?.pool_name)
      .filter((slot) => slot !== undefined)
      .uniq()
      .value()
      .length;
  });

  protected readonly totalDisks = computed(() => {
    return this.slots().filter((slot) => slot.dev).length;
  });

  protected readonly failedDisks = computed(() => {
    return this.slots()
      .filter((slot) => slot.pool_info?.disk_status === EnclosureDiskStatus.Faulted)
      .length;
  });
}
