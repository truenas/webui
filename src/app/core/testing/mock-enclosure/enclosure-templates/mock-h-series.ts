import {
  makeArrayDeviceSlots,
} from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-array-device-slots.utils';
import { makeEnclosure } from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-enclosure.utils';
import { EnclosureModel } from 'app/enums/enclosure-model.enum';

export const mockH10 = makeEnclosure({
  model: EnclosureModel.H10,
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

export const mockH20 = makeEnclosure({
  ...mockH10,
  model: EnclosureModel.H20,
});

export const mockH30 = makeEnclosure({
  ...mockH20,
  model: EnclosureModel.H30,
});
