import { EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import {
  DashboardEnclosure,
  DashboardEnclosureElements,
  DashboardEnclosureSlot,
} from 'app/interfaces/enclosure.interface';
import { getSlotsOfSide } from 'app/pages/system/enclosure/utils/get-slots-of-side.utils';
import { EnclosureSide } from 'app/pages/system/enclosure/utils/supported-enclosures';

describe('getSlotsOfSide', () => {
  const enclosure = {
    elements: {
      [EnclosureElementType.ArrayDeviceSlot]: {
        1: {
          is_front: true,
          is_rear: false,
          is_top: false,
          is_internal: false,
        } as DashboardEnclosureSlot,
        2: {
          is_front: false,
          is_rear: true,
          is_top: false,
          is_internal: false,
        } as DashboardEnclosureSlot,
        3: {
          is_front: false,
          is_rear: false,
          is_top: true,
          is_internal: false,
        } as DashboardEnclosureSlot,
        4: {
          is_front: false,
          is_rear: false,
          is_top: false,
          is_internal: true,
        } as DashboardEnclosureSlot,
      },
    } as DashboardEnclosureElements,
  } as DashboardEnclosure;

  it('returns front slots when requested', () => {
    const result = getSlotsOfSide(enclosure, EnclosureSide.Front);
    expect(result).toEqual([enclosure.elements[EnclosureElementType.ArrayDeviceSlot][1]]);
  });

  it('returns rear slots when requested', () => {
    const result = getSlotsOfSide(enclosure, EnclosureSide.Rear);
    expect(result).toEqual([enclosure.elements[EnclosureElementType.ArrayDeviceSlot][2]]);
  });

  it('returns top slots when requested', () => {
    const result = getSlotsOfSide(enclosure, EnclosureSide.Top);
    expect(result).toEqual([enclosure.elements[EnclosureElementType.ArrayDeviceSlot][3]]);
  });

  it('returns internal slots when requested', () => {
    const result = getSlotsOfSide(enclosure, EnclosureSide.Internal);
    expect(result).toEqual([enclosure.elements[EnclosureElementType.ArrayDeviceSlot][4]]);
  });
});
