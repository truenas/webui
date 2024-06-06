import {
  makeArrayDeviceSlots,
} from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-array-device-slots.utils';
import {
  makeEnclosureElements,
} from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-enclosure-elements.utils';
import {
  makeSasExpanders,
} from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-sas-expanders.utils';
import {
  makeTemperatureSensors,
} from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-temperature-sensors.utils';
import {
  makeVoltageSensors,
} from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-voltage-sensors.utils';
import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';

export const mockM40 = {
  name: 'iX 4024Sp c205',
  model: 'M40',
  controller: true,
  dmi: 'TRUENAS-M40-HA',
  status: ['OK'],
  id: '5b0bd6d1a30714bf',
  vendor: 'iX',
  product: '4024Sp',
  revision: 'c205',
  bsg: '/dev/bsg/0:0:23:0',
  sg: '/dev/sg25',
  pci: '0:0:23:0',
  rackmount: true,
  top_loaded: false,
  front_slots: 24,
  rear_slots: 0,
  internal_slots: 0,
  label: 'M40',
  elements: {
    'Array Device Slot': makeArrayDeviceSlots(1, 24, {
      supportsIdentifyLight: true,
    }),
    'SAS Expander': makeSasExpanders(26, 26),
    Enclosure: makeEnclosureElements(28, 29),
    'Temperature Sensors': makeTemperatureSensors(30, 32),
    'Voltage Sensors': makeVoltageSensors(34, 35),
  },
} as DashboardEnclosure;
