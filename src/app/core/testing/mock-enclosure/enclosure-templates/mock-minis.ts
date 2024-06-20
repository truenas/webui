import {
  makeArrayDeviceSlots,
} from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-array-device-slots.utils';
import { makeEnclosure } from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-enclosure.utils';

export const mockMini3E = makeEnclosure({
  model: 'MINI-3.0-E',
  controller: true,
  rackmount: false,
  front_loaded: true,
  front_slots: 4,
  internal_slots: 2,
  elements: {
    'Array Device Slot': {
      ...makeArrayDeviceSlots(1, 4, {
        is_front: true,
      }),
      ...makeArrayDeviceSlots(5, 7, {
        is_internal: true,
      }),
    },
  },
});

// eslint-disable-next-line @typescript-eslint/naming-convention
export const mockMini3EPlus = makeEnclosure({
  ...mockMini3E,
  model: 'MINI-3.0-E+',
});

export const mockMini3X = makeEnclosure({
  model: 'MINI-3.0-X',
  controller: true,
  rackmount: false,
  front_slots: 7,
  front_loaded: true,
  elements: {
    'Array Device Slot': makeArrayDeviceSlots(1, 7, {
      is_front: true,
    }),
  },
});

// eslint-disable-next-line @typescript-eslint/naming-convention
export const mockMini3XPlus = makeEnclosure({
  ...mockMini3X,
  model: 'MINI-3.0-X+',
});

export const mockMini3Xl = makeEnclosure({
  model: 'MINI-3.0-XL',
  controller: true,
  rackmount: false,
  front_loaded: true,
  front_slots: 9,
  internal_slots: 1,
  elements: {
    'Array Device Slot': {
      ...makeArrayDeviceSlots(1, 9, {
        is_front: true,
      }),
      ...makeArrayDeviceSlots(10, 11, {
        is_internal: true,
      }),
    },
  },
});

export const mockMiniR = makeEnclosure({
  model: 'MINI-R',
  controller: true,
  rackmount: true,
  front_loaded: true,
  front_slots: 12,
  elements: {
    'Array Device Slot': makeArrayDeviceSlots(1, 12, {
      supportsIdentifyLight: true,
      is_front: true,
    }),
  },
});
