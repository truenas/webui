import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { uniq } from 'lodash-es';
import { EnclosureDiskStatus } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';

@Component({
  selector: 'ix-mini-disks-overview',
  templateUrl: './mini-disks-overview.component.html',
  styleUrl: './mini-disks-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TranslateModule],
})
export class MiniDisksOverviewComponent {
  readonly slots = input.required<DashboardEnclosureSlot[]>();

  protected readonly totalPools = computed(() => {
    const slots = this.slots();
    const slotsWithValidPools = slots.map((slot) => slot.pool_info?.pool_name);
    const validSlots = slotsWithValidPools.filter((slot) => slot !== undefined);
    return uniq(validSlots).length;
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
