import { EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';
import { getEnclosureLabel } from 'app/pages/system/enclosure/utils/get-enclosure-label.utils';

export interface DiskEnclosureLocation {
  enclosureId: string;
  enclosureLabel: string;
  slot: number;
}

/**
 * Where each disk sits, keyed by its serial. Device names can change between boots, so a disk is matched to its
 * slot by serial, and the enclosure is named and the slot numbered as the Enclosure page shows them.
 */
export function getDiskEnclosureLocations(enclosures: DashboardEnclosure[]): Record<string, DiskEnclosureLocation> {
  const locations: Record<string, DiskEnclosureLocation> = {};
  enclosures.forEach((enclosure) => {
    const slots = Object.values(enclosure.elements?.[EnclosureElementType.ArrayDeviceSlot] || {});
    slots.forEach((slot) => {
      if (!slot.serial || locations[slot.serial]) {
        return;
      }
      locations[slot.serial] = {
        enclosureId: enclosure.id,
        enclosureLabel: getEnclosureLabel(enclosure),
        slot: slot.drive_bay_number,
      };
    });
  });
  return locations;
}
