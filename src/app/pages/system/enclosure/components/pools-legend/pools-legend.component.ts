import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { uniq } from 'lodash-es';
import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';
import { getSlotsOfSide } from 'app/pages/system/enclosure/utils/get-slots-of-side.utils';
import { EnclosureSide } from 'app/pages/system/enclosure/utils/supported-enclosures';
import { unassignedColor } from 'app/pages/system/enclosure/utils/unassigned-color.const';

@Component({
  selector: 'ix-pools-legend',
  templateUrl: './pools-legend.component.html',
  styleUrls: ['./pools-legend.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class PoolsLegendComponent {
  readonly enclosure = input.required<DashboardEnclosure>();
  readonly side = input.required<EnclosureSide>();
  readonly poolColors = input.required<Record<string, string>>();

  readonly slots = computed(() => {
    return getSlotsOfSide(this.enclosure(), this.side());
  });

  readonly legend = computed(() => {
    const poolColors = this.poolColors();

    const slots = this.slots();

    const poolsFromSlots = slots.map((slot) => slot.pool_info?.pool_name || null);
    const uniqPools = uniq(poolsFromSlots);
    return uniqPools.map((poolName) => {
      if (poolName === null) {
        return [this.translate.instant('Unassigned'), unassignedColor] as [string, string];
      }

      return [poolName, poolColors[poolName]] as [string, string];
    });
  });

  constructor(
    private translate: TranslateService,
  ) {}
}
