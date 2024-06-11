import {
  makeArrayDeviceSlots,
} from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-array-device-slots.utils';
import { makeEnclosure } from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-enclosure.utils';

export const mockR10 = makeEnclosure({
  model: 'R10',
  controller: true,
  rackmount: true,
  front_slots: 16,
  elements: {
    'Array Device Slot': makeArrayDeviceSlots(1, 16, {
      is_front: true,
    }),
  },
});

export const mockR20 = makeEnclosure({
  model: 'R20',
  controller: true,
  rackmount: true,
  front_slots: 12,
  rear_slots: 2,
  elements: {
    'Array Device Slot': {
      ...makeArrayDeviceSlots(1, 12, {
        is_front: true,
      }),
      ...makeArrayDeviceSlots(13, 14, {
        is_rear: true,
      }),
    },
  },
});

export const mockR20A = makeEnclosure({
  ...mockR20,
  model: 'R20A',
});

export const mockR20B = makeEnclosure({
  ...mockR20,
  model: 'R20B',
});

export const mockR30 = makeEnclosure({
  model: 'R30',
  controller: true,
  rackmount: true,
  front_slots: 12,
  internal_slots: 4,
  elements: {
    'Array Device Slot': {
      ...makeArrayDeviceSlots(1, 12, {
        is_front: true,
      }),
      ...makeArrayDeviceSlots(13, 16, {
        is_internal: true,
      }),
    },
  },
});

export const mockR40 = makeEnclosure({
  model: 'R40',
  controller: true,
  rackmount: true,
  front_slots: 48,
  elements: {
    'Array Device Slot': makeArrayDeviceSlots(1, 48, {
      is_front: true,
    }),
  },
});

export const mockR50 = makeEnclosure({
  model: 'R50',
  controller: true,
  rackmount: true,
  top_slots: 48,
  rear_slots: 4,
  elements: {
    'Array Device Slot': {
      ...makeArrayDeviceSlots(1, 48, {
        is_top: true,
      }),
      ...makeArrayDeviceSlots(49, 52, {
        is_rear: true,
      }),
    },
  },
});

export const mockR50B = makeEnclosure({
  ...mockR50,
  model: 'R50B',
});

export const mockR50Bm = makeEnclosure({
  ...mockR50,
  model: 'R50BM',
});
