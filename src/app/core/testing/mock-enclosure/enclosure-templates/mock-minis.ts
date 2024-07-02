import {
  makeArrayDeviceSlots,
} from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-array-device-slots.utils';
import { makeEnclosure } from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-enclosure.utils';
import { EnclosureModel } from 'app/enums/enclosure-model.enum';

export const mockMini3E = makeEnclosure({
  model: EnclosureModel.Mini3E,
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
      ...makeArrayDeviceSlots(5, 6, {
        is_internal: true,
      }),
    },
  },
});

// eslint-disable-next-line @typescript-eslint/naming-convention
export const mockMini3EPlus = makeEnclosure({
  ...mockMini3E,
  model: EnclosureModel.Mini3EPlus,
});

export const mockMini3X = makeEnclosure({
  model: EnclosureModel.Mini3X,
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
  model: EnclosureModel.Mini3XPlus,
});

export const mockMini3XlPlus = makeEnclosure({
  model: EnclosureModel.Mini3XlPlus,
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
      ...makeArrayDeviceSlots(10, 10, {
        is_internal: true,
      }),
    },
  },
});

export const mockMiniR = makeEnclosure({
  model: EnclosureModel.MiniR,
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
