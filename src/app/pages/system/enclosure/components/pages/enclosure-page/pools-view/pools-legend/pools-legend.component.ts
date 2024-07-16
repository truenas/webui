import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { chain } from 'lodash';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { unassignedColor } from 'app/pages/system/enclosure/utils/unassigned-color.const';

@Component({
  selector: 'ix-pools-legend',
  templateUrl: './pools-legend.component.html',
  styleUrls: ['./pools-legend.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoolsLegendComponent {
  readonly slots = input.required<DashboardEnclosureSlot[]>();
  readonly poolColors = input.required<Record<string, string>>();

  readonly legend = computed(() => {
    const poolColors = this.poolColors();

    return chain(this.slots())
      .map((slot) => slot.pool_info?.pool_name || null)
      .uniq()
      .map((poolName) => {
        if (poolName === null) {
          return [this.translate.instant('Unassigned'), unassignedColor] as [string, string];
        }

        return [poolName, poolColors[poolName]] as [string, string];
      })
      .value();
  });

  constructor(
    private translate: TranslateService,
  ) {}
}
