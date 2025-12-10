import {
  makeArrayDeviceSlots,
} from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-array-device-slots.utils';
import {
  makeEnclosureElements,
} from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-enclosure-elements.utils';
import { makeEnclosure } from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-enclosure.utils';
import {
  makeSasConnectors,
} from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-sas-connectors.utils';
import { makeSasExpanders } from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-sas-expanders.utils';
import {
  makeTemperatureSensors,
} from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-temperature-sensors.utils';
import {
  makeVoltageSensors,
} from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-voltage-sensors.utils';
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
    'SAS Expander': makeSasExpanders(29, 30),
    Enclosure: makeEnclosureElements(31, 32),
    'Temperature Sensors': makeTemperatureSensors(33, 35),
    'Voltage Sensor': makeVoltageSensors(36, 37),
    'SAS Connector': makeSasConnectors(38, 49),
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
