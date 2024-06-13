import {
  makeArrayDeviceSlots,
} from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-array-device-slots.utils';
import { makeEnclosure } from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-enclosure.utils';

export const mockEs12 = makeEnclosure({
  model: 'ES12',
  controller: false,
  rackmount: true,
  front_slots: 12,
  elements: {
    'Array Device Slot': makeArrayDeviceSlots(1, 12, {
      supportsIdentifyLight: true,
      is_front: true,
    }),
  },
});

export const mockEs24 = makeEnclosure({
  model: 'ES24',
  controller: false,
  rackmount: true,
  front_slots: 24,
  elements: {
    'Array Device Slot': makeArrayDeviceSlots(1, 24, {
      supportsIdentifyLight: true,
      is_front: true,
    }),
  },
});

export const mockEs24F = makeEnclosure({
  ...mockEs24,
  model: 'ES24F',
});

export const mockEs24N = makeEnclosure({
  ...mockEs24,
  model: 'ES24N',
});

export const mockEs60 = makeEnclosure({
  model: 'ES60',
  controller: false,
  rackmount: true,
  front_slots: 60,
  elements: {
    'Array Device Slot': makeArrayDeviceSlots(1, 60, {
      supportsIdentifyLight: true,
      is_front: true,
    }),
  },
});

export const mockEs60G2 = makeEnclosure({
  ...mockEs60,
  model: 'ES60G2',
});

export const mockEs102 = makeEnclosure({
  model: 'ES102',
  controller: false,
  rackmount: true,
  front_slots: 102,
  elements: {
    'Array Device Slot': makeArrayDeviceSlots(1, 102, {
      supportsIdentifyLight: true,
      is_front: true,
    }),
  },
});

export const mockEs102G2 = makeEnclosure({
  ...mockEs102,
  model: 'ES102G2',
});
