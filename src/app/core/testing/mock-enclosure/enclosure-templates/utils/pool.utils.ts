import { mapSlots } from 'app/core/testing/mock-enclosure/enclosure-templates/utils/slots.utils';
import { EnclosureDiskStatus, EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import { VdevType } from 'app/enums/v-dev-type.enum';
import { DashboardEnclosure, DashboardEnclosureSlot, EnclosureSlotPoolInfo } from 'app/interfaces/enclosure.interface';

const disksPerVdev = 3;
const totalPools = 40;

export function addPoolsToDisks(enclosures: DashboardEnclosure[], percentageToAdd: number): DashboardEnclosure[] {
  const slotsToUpdate = getSlotsToUpdate(enclosures, percentageToAdd);
  const vdevs = groupDisksIntoVdevs(slotsToUpdate);

  return updateEnclosureSlotsWithPoolInfo(enclosures, slotsToUpdate, vdevs);
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

function getSlotsToUpdate(enclosures: DashboardEnclosure[], percentageToAdd: number): DashboardEnclosureSlot[] {
  const slotsToUpdate: DashboardEnclosureSlot[] = [];

  enclosures.forEach((enclosure) => {
    const enclosureSlotsWithDisks = Object.values(enclosure.elements[EnclosureElementType.ArrayDeviceSlot])
      .filter((slot) => Boolean(slot.dev));

    const slotsToUse = enclosureSlotsWithDisks.slice(
      0,
      Math.floor(enclosureSlotsWithDisks.length * percentageToAdd),
    );

    slotsToUpdate.push(...slotsToUse);
  });

  return slotsToUpdate;
}

function groupDisksIntoVdevs(slots: DashboardEnclosureSlot[]): DashboardEnclosureSlot[][] {
  return slots.reduce((vdevs, slot, index) => {
    const vdevIndex = Math.floor(index / disksPerVdev);
    if (!vdevs[vdevIndex]) {
      vdevs[vdevIndex] = [];
    }
    vdevs[vdevIndex].push(slot);
    return vdevs;
  }, [] as DashboardEnclosureSlot[][]);
}

function updateEnclosureSlotsWithPoolInfo(
  enclosures: DashboardEnclosure[],
  slotsToUpdate: DashboardEnclosureSlot[],
  vdevs: DashboardEnclosureSlot[][],
): DashboardEnclosure[] {
  let diskIndex = 0;

  return mapSlots(enclosures, ({ slot: originalSlot, enclosure }) => {
    const updatedSlot = slotsToUpdate.find((slot) => slot.dev === originalSlot.dev);

    if (!updatedSlot) {
      return originalSlot;
    }

    const vdevIndex = Math.floor(diskIndex / disksPerVdev);
    const vdev = vdevs[vdevIndex];
    diskIndex += 1;

    return {
      ...originalSlot,
      pool_info: createPoolInfo(vdev, vdevIndex, enclosure),
    };
  });
}

function createPoolInfo(
  vdev: DashboardEnclosureSlot[],
  vdevIndex: number,
  enclosure: DashboardEnclosure,
): EnclosureSlotPoolInfo {
  return {
    pool_name: `pool-${(vdevIndex % totalPools) + 1}`,
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
  };
}
