import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import {
  TintingFunction,
} from 'app/pages/system/enclosure/components/enclosure-side/enclosure-svg/enclosure-svg.component';
import { unassignedColor } from 'app/pages/system/enclosure/utils/unassigned-color.const';

export function makePoolTintFunction(poolColors: Record<string, string>): TintingFunction {
  return (slot: DashboardEnclosureSlot) => {
    if (!slot.dev) {
      return null;
    }

    if (!slot.pool_info) {
      return unassignedColor;
    }

    return poolColors[slot.pool_info?.pool_name];
  };
}
