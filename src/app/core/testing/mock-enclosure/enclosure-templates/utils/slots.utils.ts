import { EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosure, DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';

interface SlotMappingFunction {
  slot: DashboardEnclosureSlot;
  enclosure: DashboardEnclosure;
  index: number;
}

export function mapSlots(
  enclosures: DashboardEnclosure[],
  mappingFunction: ({ slot, index }: SlotMappingFunction) => DashboardEnclosureSlot,
): DashboardEnclosure[] {
  return enclosures.map((enclosure) => {
    const slots = Object.values(enclosure.elements[EnclosureElementType.ArrayDeviceSlot])
      .map((slot, i) => {
        return mappingFunction({ slot, enclosure, index: i });
      });

    return {
      ...enclosure,
      elements: {
        ...enclosure.elements,
        [EnclosureElementType.ArrayDeviceSlot]: slots,
      },
    };
  });
}

export function countSlots(enclosure: DashboardEnclosure): number {
  return Object.keys(enclosure.elements[EnclosureElementType.ArrayDeviceSlot]).length;
}
