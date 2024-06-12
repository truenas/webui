import { TiB } from 'app/constants/bytes.constant';
import { countSlots, mapSlots } from 'app/core/testing/mock-enclosure/enclosure-templates/utils/slots.utils';
import { DiskType } from 'app/enums/disk-type.enum';
import { DashboardEnclosure, DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';

export function addDisksToSlots(enclosures: DashboardEnclosure[], percentageToAdd: number): DashboardEnclosure[] {
  const totalSlots = countSlots(enclosures);

  return mapSlots(enclosures, (slot, i) => {
    if (i > totalSlots * percentageToAdd) {
      return slot;
    }

    return addDisk(slot, i);
  });
}

function addDisk(slot: DashboardEnclosureSlot, i: number): DashboardEnclosureSlot {
  return {
    ...slot,
    status: 'OK',
    type: DiskType.Hdd,
    dev: generateDiskName(i),
    size: 10 * TiB,
    model: 'HUH721212AL4200',
    serial: `8DJ61EBH${slot.drive_bay_number}`,
    rotationrate: 7200,
  };
}

function generateDiskName(index: number): string {
  const base = 26;
  const offset = 97; // ASCII value for 'a'
  let result = '';

  if (index < 0) {
    return ''; // Return empty for invalid index
  }

  while (index >= base) {
    result = String.fromCharCode(offset + (index % base)) + result;
    index = Math.floor(index / base) - 1;
  }

  result = 'sd' + String.fromCharCode(offset + index) + result;
  return result;
}
