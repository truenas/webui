import {
  makeArrayDeviceSlots,
} from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-array-device-slots.utils';
import {
  makeEnclosureElements,
} from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-enclosure-elements.utils';
import { makeEnclosure } from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-enclosure.utils';
import { makeSasExpanders } from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-sas-expanders.utils';
import {
  makeTemperatureSensors,
} from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-temperature-sensors.utils';
import {
  makeVoltageSensors,
} from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-voltage-sensors.utils';
import { EnclosureModel } from 'app/enums/enclosure-model.enum';

export const mockM30 = makeEnclosure({
  model: EnclosureModel.M30,
  controller: true,
  rackmount: true,
  front_loaded: true,
  front_slots: 24,
  elements: {
    'Array Device Slot': makeArrayDeviceSlots(1, 24, {
      supportsIdentifyLight: true,
      is_front: true,
    }),
    'SAS Expander': makeSasExpanders(26, 26),
    Enclosure: makeEnclosureElements(28, 29),
    'Temperature Sensors': makeTemperatureSensors(30, 32),
    'Voltage Sensor': makeVoltageSensors(34, 35),
  },
});

export const mockM40 = makeEnclosure({
  ...mockM30,
  model: EnclosureModel.M40,
});

export const mockM50 = makeEnclosure({
  model: EnclosureModel.M50,
  controller: true,
  rackmount: true,
  front_loaded: true,
  front_slots: 24,
  rear_slots: 4,
  elements: {
    'Array Device Slot': {
      ...makeArrayDeviceSlots(1, 24, {
        supportsIdentifyLight: true,
        is_front: true,
      }),
      ...makeArrayDeviceSlots(25, 29, {
        supportsIdentifyLight: true,
        is_rear: true,
      }),
    },
  },
});

export const mockM60 = makeEnclosure({
  ...mockM50,
  model: EnclosureModel.M60,
});
