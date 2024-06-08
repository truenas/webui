import {
  makeArrayDeviceSlots,
} from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-array-device-slots.utils';
import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const mockMini30XPlus = {
  name: 'AHCI SGPIOEnclosure 2.00',
  model: 'MINI-3.0-X+',
  controller: true,
  dmi: 'TRUENAS-MINI-3.0-X+',
  status: ['OK'],
  id: '3000000000000001',
  vendor: 'AHCI',
  product: 'SGPIOEnclosure',
  revision: '2.00',
  bsg: '/dev/bsg/8:0:0:0',
  label: 'AHCI SGPIOEnclosure 2.00',
  sg: '/dev/sg0',
  pci: '8:0:0:0',
  rackmount: false,
  top_loaded: false,
  front_slots: 8,
  rear_slots: 0,
  internal_slots: 0,
  elements: {
    'Array Device Slot': makeArrayDeviceSlots(1, 8),
  },
} as DashboardEnclosure;
