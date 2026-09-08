import {
  ChangeDetectionStrategy, Component, computed, input, output,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnTestIdDirective } from '@truenas/ui-components';
import { DashboardEnclosureSlot, EnclosureVdevDisk } from 'app/interfaces/enclosure.interface';
import { normalizeTestIdParts } from 'app/modules/test-id/normalize-test-id.utils';

@Component({
  selector: 'ix-vdev-disks-legend',
  styleUrl: './vdev-disks-legend.component.scss',
  templateUrl: './vdev-disks-legend.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TnTestIdDirective, TranslateModule],
})
export class VdevDisksLegendComponent {
  readonly selectedSlot = input.required<DashboardEnclosureSlot>();
  readonly poolColor = input.required<string>();

  readonly diskClick = output<EnclosureVdevDisk>();

  /**
   * Device names carry digits (`nvme0n1`), and the library's kebab-casing does not split a
   * letter→digit boundary the way `[ixTest]` did — so the id is pre-normalized here to keep
   * `link-select-disk-nvme-0-n-1` byte-identical. See {@link normalizeTestIdParts}.
   */
  protected readonly vdevDisks = computed(() => (
    this.selectedSlot().pool_info?.vdev_disks?.map((disk) => ({
      disk,
      testId: normalizeTestIdParts(['select-disk', disk.dev]),
    })) ?? []
  ));

  protected isSelectedSlot(disk: EnclosureVdevDisk): boolean {
    return this.selectedSlot().dev === disk.dev;
  }
}
