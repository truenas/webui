import { mapSlots } from 'app/core/testing/mock-enclosure/enclosure-templates/utils/slots.utils';
import { EnclosureDiskStatus, EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import { VdevType } from 'app/enums/v-dev-type.enum';
import { DashboardEnclosure, DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';

// TODO: Messy.
export function addPoolsToDisks(enclosures: DashboardEnclosure[], percentageToAdd: number): DashboardEnclosure[] {
  const disksPerVdev = 3;
  const poolsToAdd = 40;

  const slotsToUpdate: DashboardEnclosureSlot[] = [];
  enclosures.forEach((enclosure) => {
    const enclosureSlotsWithDisks = Object.values(enclosure.elements[EnclosureElementType.ArrayDeviceSlot])
      .filter((slot) => Boolean(slot.dev));

    const enclosureSlotsToUse = enclosureSlotsWithDisks.slice(
      0,
      Math.floor(enclosureSlotsWithDisks.length * percentageToAdd),
    );

    slotsToUpdate.push(...enclosureSlotsToUse);
  });

  const vdevs = groupDisksIntoVdevs(slotsToUpdate, disksPerVdev);

  let i = 0;
  return mapSlots(enclosures, ({ slot: originalSlot, enclosure }) => {
    const updatedSlot = slotsToUpdate.find((slot) => slot.dev === originalSlot.dev);

    if (!updatedSlot) {
      return originalSlot;
    }

    const vdevIndex = Math.floor(i / disksPerVdev);
    const vdev = vdevs[vdevIndex];
    i = i + 1;

    return {
      ...originalSlot,
      pool_info: {
        pool_name: `pool-${vdevIndex % poolsToAdd + 1}`,
        disk_status: EnclosureDiskStatus.Online,
        disk_read_errors: 0,
        disk_write_errors: 0,
        disk_checksum_errors: 0,
        vdev_name: 'stripe',
        vdev_type: VdevType.Data,
        vdev_disks: vdev.map((disk) => ({
          // TODO: Bug. Enclosure id should come from the disk.
          enclosure_id: enclosure.id,
          slot: disk.drive_bay_number,
          dev: disk.dev,
        })),
      },
    };
  });
}

function groupDisksIntoVdevs(slots: DashboardEnclosureSlot[], disksPerVdev: number): DashboardEnclosureSlot[][] {
  return slots.reduce((acc, slot, index) => {
    const vdevIndex = Math.floor(index / disksPerVdev);
    if (!acc[vdevIndex]) {
      acc[vdevIndex] = [];
    }

    acc[vdevIndex].push(slot);
    return acc;
  }, [] as DashboardEnclosureSlot[][]);
}

export function randomizeDiskStatuses(enclosures: DashboardEnclosure[]): DashboardEnclosure[] {
  const allStatuses = Object.values(EnclosureDiskStatus);
  return mapSlots(enclosures, ({ slot, index }) => {
    if (!slot.pool_info) {
      return slot;
    }

    return {
      ...slot,
      pool_info: {
        ...slot.pool_info,
        disk_status: allStatuses[index % allStatuses.length],
      },
    };
  });
}
