import {
  makeArrayDeviceSlots,
} from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-array-device-slots.utils';
import { makeEnclosure } from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-enclosure.utils';
import { EnclosureModel } from 'app/enums/enclosure-model.enum';

export const mockF60 = makeEnclosure({
  model: EnclosureModel.F60,
  controller: true,
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

export const mockF100 = makeEnclosure({
  ...mockF60,
  model: 'F100',
});

export const mockF130 = makeEnclosure({
  ...mockF60,
  model: 'F130',
});
