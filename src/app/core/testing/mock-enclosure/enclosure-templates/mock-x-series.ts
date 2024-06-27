import {
  makeArrayDeviceSlots,
} from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-array-device-slots.utils';
import { makeEnclosure } from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-enclosure.utils';
import { EnclosureModel } from 'app/enums/enclosure-model.enum';

export const mockX10 = makeEnclosure({
  model: EnclosureModel.X10,
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

export const mockX20 = makeEnclosure({
  ...mockX10,
  model: EnclosureModel.X20,
});
