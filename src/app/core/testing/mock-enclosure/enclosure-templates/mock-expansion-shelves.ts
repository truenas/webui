import {
  makeArrayDeviceSlots,
} from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-array-device-slots.utils';
import { makeEnclosure } from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-enclosure.utils';
import { EnclosureModel } from 'app/enums/enclosure-model.enum';

export const mockEs12 = makeEnclosure({
  model: EnclosureModel.Es12,
  controller: false,
  rackmount: true,
  front_slots: 12,
  front_loaded: true,
  elements: {
    'Array Device Slot': makeArrayDeviceSlots(1, 12, {
      supportsIdentifyLight: true,
      is_front: true,
    }),
  },
});

export const mockEs24 = makeEnclosure({
  model: EnclosureModel.Es24,
  controller: false,
  rackmount: true,
  front_slots: 24,
  front_loaded: true,
  elements: {
    'Array Device Slot': makeArrayDeviceSlots(1, 24, {
      supportsIdentifyLight: true,
      is_front: true,
    }),
  },
});

export const mockEs24F = makeEnclosure({
  ...mockEs24,
  model: EnclosureModel.Es24F,
});

export const mockEs24N = makeEnclosure({
  ...mockEs24,
  model: EnclosureModel.Es24N,
});

export const mockEs60 = makeEnclosure({
  model: EnclosureModel.Es60,
  controller: false,
  rackmount: true,
  top_slots: 60,
  top_loaded: true,
  elements: {
    'Array Device Slot': makeArrayDeviceSlots(1, 60, {
      supportsIdentifyLight: true,
      is_top: true,
    }),
  },
});

export const mockEs60G2 = makeEnclosure({
  ...mockEs60,
  model: EnclosureModel.Es60G2,
});

export const mockEs60G3 = makeEnclosure({
  ...mockEs60,
  model: EnclosureModel.Es60G3,
});

export const mockEs102 = makeEnclosure({
  model: EnclosureModel.Es102,
  controller: false,
  rackmount: true,
  top_slots: 102,
  top_loaded: true,
  elements: {
    'Array Device Slot': makeArrayDeviceSlots(1, 102, {
      supportsIdentifyLight: true,
      is_top: true,
    }),
  },
});

export const mockEs102G2 = makeEnclosure({
  ...mockEs102,
  model: EnclosureModel.Es102G2,
});
