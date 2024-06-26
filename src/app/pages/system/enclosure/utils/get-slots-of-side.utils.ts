import { EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import { assertUnreachable } from 'app/helpers/assert-unreachable.utils';
import { DashboardEnclosure, DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { EnclosureSide } from 'app/pages/system/enclosure/utils/supported-enclosures';

export function getSlotsOfSide(enclosure: DashboardEnclosure, side: EnclosureSide): DashboardEnclosureSlot[] {
  return Object.values(enclosure.elements[EnclosureElementType.ArrayDeviceSlot]).filter((slot) => {
    switch (side) {
      case EnclosureSide.Front:
        return slot.is_front;
      case EnclosureSide.Rear:
        return slot.is_rear;
      case EnclosureSide.Top:
        return slot.is_top;
      case EnclosureSide.Internal:
        return slot.is_internal;
      default:
        assertUnreachable(side);
        return false;
    }
  });
}
