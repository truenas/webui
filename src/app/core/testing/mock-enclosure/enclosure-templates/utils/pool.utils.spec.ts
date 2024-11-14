import { mapSlots } from 'app/core/testing/mock-enclosure/enclosure-templates/utils/slots.utils';
import { EnclosureDiskStatus, EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import { VdevType } from 'app/enums/v-dev-type.enum';
import {
  DashboardEnclosure, DashboardEnclosureSlot,
  Enclosure,
  EnclosureElement,
} from 'app/interfaces/enclosure.interface';
import { addPoolsToDisks, randomizeDiskStatuses } from './pool.utils';

jest.mock('app/core/testing/mock-enclosure/enclosure-templates/utils/slots.utils');

describe('pool.utils', () => {
  const mockEnclosures: DashboardEnclosure[] = [
    {
      id: '1',
      name: 'Enclosure 1',
      elements: {
        [EnclosureElementType.ArrayDeviceSlot]: {
          1: { dev: 'sd1', drive_bay_number: 1 } as DashboardEnclosureSlot,
          2: { dev: 'sd2', drive_bay_number: 2 } as DashboardEnclosureSlot,
          3: { dev: 'sd3', drive_bay_number: 3 } as DashboardEnclosureSlot,
        } as Record<number, DashboardEnclosureSlot>,
      },
    } as DashboardEnclosure,
    {
      id: '2',
      name: 'Enclosure 2',
      elements: {
        [EnclosureElementType.ArrayDeviceSlot]: {
          1: { dev: 'sd4', drive_bay_number: 1 } as DashboardEnclosureSlot,
          2: { dev: 'sd5', drive_bay_number: 2 } as DashboardEnclosureSlot,
          3: { dev: 'sd6', drive_bay_number: 3 } as DashboardEnclosureSlot,
        } as Record<number, DashboardEnclosureSlot>,
      },
    } as DashboardEnclosure,
  ];

  beforeEach(() => {
    (mapSlots as jest.Mock).mockImplementation(
      (
        enclosures: Enclosure[],
        callback: ({ slot, index, enclosure }: { slot: EnclosureElement; index: number; enclosure: Enclosure }) => void,
      ) => {
        return enclosures.map((enclosure) => {
          return {
            ...enclosure,
            elements: {
              ...enclosure.elements,
              [EnclosureElementType.ArrayDeviceSlot]: Object.values(
                enclosure.elements[EnclosureElementType.ArrayDeviceSlot],
              ).map((slot, index) => callback({ slot, index, enclosure })),
            },
          };
        });
      },
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addPoolsToDisks', () => {
    it('should add pools and update the slot information based on percentageToAdd', () => {
      const result = addPoolsToDisks(mockEnclosures, 1);

      expect(mapSlots).toHaveBeenCalled();
      expect(result).toHaveLength(2);

      const firstSlot = result[0].elements[EnclosureElementType.ArrayDeviceSlot][0];
      expect(firstSlot.pool_info).toEqual({
        pool_name: 'pool-1',
        disk_status: EnclosureDiskStatus.Online,
        disk_read_errors: 0,
        disk_write_errors: 0,
        disk_checksum_errors: 0,
        vdev_name: 'stripe',
        vdev_type: VdevType.Data,
        vdev_disks: [
          { enclosure_id: '1', slot: 1, dev: 'sd1' },
          { enclosure_id: '1', slot: 2, dev: 'sd2' },
          { enclosure_id: '1', slot: 3, dev: 'sd3' },
        ],
      });
    });

    it('should limit the number of slots updated based on percentageToAdd', () => {
      const result = addPoolsToDisks(mockEnclosures, 0.5);

      expect(result).toHaveLength(2);

      const updatedSlots = result
        .flatMap((enclosure) => Object.values(enclosure.elements[EnclosureElementType.ArrayDeviceSlot]))
        .filter((slot) => slot.pool_info);

      expect(updatedSlots).toHaveLength(2);
    });
  });

  describe('randomizeDiskStatuses', () => {
    it('should not update slots that do not have pool_info', () => {
      (mapSlots as jest.Mock).mockImplementation((enclosures: Enclosure[]) => {
        return enclosures.map((enclosure) => {
          return {
            ...enclosure,
            elements: {
              ...enclosure.elements,
              [EnclosureElementType.ArrayDeviceSlot]: Object.values(
                enclosure.elements[EnclosureElementType.ArrayDeviceSlot],
              ).map((slot) => ({ ...slot, pool_info: undefined })),
            },
          };
        });
      });

      const result = randomizeDiskStatuses(mockEnclosures);

      result.flatMap(
        (enclosure) => Object.values(enclosure.elements[EnclosureElementType.ArrayDeviceSlot]),
      ).forEach((slot) => {
        expect(slot.pool_info).toBeUndefined();
      });
    });
  });
});
