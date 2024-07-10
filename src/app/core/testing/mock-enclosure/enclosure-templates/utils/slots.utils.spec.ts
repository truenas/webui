import { EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import {
  DashboardEnclosure,
  DashboardEnclosureSlot,
  DashboardEnclosureElements,
} from 'app/interfaces/enclosure.interface';
import { mapSlots, countSlots } from './slots.utils';

describe('mapSlots', () => {
  it('should correctly map slots for each enclosure', () => {
    const enclosures = [
      {
        elements: {
          [EnclosureElementType.ArrayDeviceSlot]: {
            1: { model: 'test1' } as DashboardEnclosureSlot,
            2: { model: 'test2' } as DashboardEnclosureSlot,
          },
        } as DashboardEnclosureElements,
      },
    ] as DashboardEnclosure[];

    const result = mapSlots(enclosures, ({ slot }) => ({
      ...slot,
      model: `mapped-${slot.model}`,
    }));

    expect(result).toEqual([
      {
        elements: {
          [EnclosureElementType.ArrayDeviceSlot]: {
            1: { model: 'mapped-test1' } as DashboardEnclosureSlot,
            2: { model: 'mapped-test2' } as DashboardEnclosureSlot,
          },
        } as DashboardEnclosureElements,
      },
    ]);
  });
});

describe('countSlots', () => {
  it('should return the correct number of slots', () => {
    const enclosure = {
      elements: {
        [EnclosureElementType.ArrayDeviceSlot]: {
          1: {} as DashboardEnclosureSlot,
          2: {} as DashboardEnclosureSlot,
        },
      } as DashboardEnclosureElements,
    } as DashboardEnclosure;
    const result = countSlots(enclosure);
    expect(result).toBe(2);
  });
});
