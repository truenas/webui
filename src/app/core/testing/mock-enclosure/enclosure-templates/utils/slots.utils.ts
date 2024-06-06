import { mapValues } from 'lodash';
import { EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosure, DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';

export function mapSlots(
  enclosures: DashboardEnclosure[],
  mappingFunction: (slot: DashboardEnclosureSlot, index: number) => DashboardEnclosureSlot,
): DashboardEnclosure[] {
  return enclosures.map((enclosure) => {
    let i = -1;
    const slots = mapValues(enclosure.elements[EnclosureElementType.ArrayDeviceSlot], (slot) => {
      i = i + 1;
      return mappingFunction(slot, i);
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

export function countSlots(enclosures: DashboardEnclosure[]): number {
  return enclosures.reduce((acc, enclosure) => {
    return acc + Object.keys(enclosure.elements[EnclosureElementType.ArrayDeviceSlot]).length;
  }, 0);
}

export function countSlotsBy(
  enclosures: DashboardEnclosure[],
  predicate: (slot: DashboardEnclosureSlot) => boolean,
): number {
  return enclosures.reduce((acc, enclosure) => {
    return acc + Object.values(enclosure.elements[EnclosureElementType.ArrayDeviceSlot]).filter(predicate).length;
  }, 0);
}
