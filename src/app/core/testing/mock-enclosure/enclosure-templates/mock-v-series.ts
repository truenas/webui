import {
  makeArrayDeviceSlots,
} from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-array-device-slots.utils';
import { makeEnclosure } from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-enclosure.utils';
import { EnclosureModel } from 'app/enums/enclosure-model.enum';

const vSeriesConfig = {
  controller: true,
  rackmount: true,
  front_loaded: true,
  front_slots: 24,
  rear_slots: 4,
  elements: {
    'Array Device Slot': {
      ...makeArrayDeviceSlots(1, 24, {
        is_front: true,
      }),
      ...makeArrayDeviceSlots(25, 28, {
        is_rear: true,
      }),
    },
  },
};

export const mockV140 = makeEnclosure({
  ...vSeriesConfig,
  model: EnclosureModel.V140,
});

export const mockV160 = makeEnclosure({
  ...vSeriesConfig,
  model: EnclosureModel.V160,
});
