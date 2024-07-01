import { countSlotsBy, mapSlots } from 'app/core/testing/mock-enclosure/enclosure-templates/utils/slots.utils';
import { EnclosureDiskStatus } from 'app/enums/enclosure-slot-status.enum';
import { VdevType } from 'app/enums/v-dev-type.enum';
import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';

// TODO: Only creates single disk vdevs in the same pool. Improve.
export function addPoolsToDisks(enclosures: DashboardEnclosure[], percentageToAdd: number): DashboardEnclosure[] {
  return mapSlots(enclosures, ({ slot, enclosure, index }) => {
    const totalDisks = countSlotsBy([enclosure], ({ dev }) => Boolean(dev));

    if (index >= totalDisks * percentageToAdd) {
      return slot;
    }

    return {
      ...slot,
      pool_info: {
        pool_name: 'Test Pool',
        disk_status: EnclosureDiskStatus.Online,
        disk_read_errors: 0,
        disk_write_errors: 0,
        disk_checksum_errors: 0,
        vdev_name: 'stripe',
        vdev_type: VdevType.Data,
        vdev_disks: [{
          enclosure_id: '5b0bd6d1a30714bf',
          slot: slot.drive_bay_number,
          dev: slot.dev,
        }],
      },
    };
  });
}
