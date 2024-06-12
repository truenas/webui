import { keyBy, range } from 'lodash';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';

export function makeArrayDeviceSlots(
  from: number,
  to: number,
  options?: {
    supportsIdentifyLight?: boolean;
  },
): Record<number, DashboardEnclosureSlot> {
  const slots = range(from, to + 1).map((slot) => {
    return {
      drive_bay_number: slot,
      descriptor: `slot${slot.toString().padStart(2, '0')}`,
      status: 'Not installed',
      dev: null,
      is_top: false,
      is_front: true,
      is_rear: false,
      is_internal: false,
      supports_identify_light: options?.supportsIdentifyLight ?? false,
      size: null,
      model: null,
      serial: null,
      type: null,
      rotationrate: null,
      pool_info: null,
    };
  });

  return keyBy(slots, 'drive_bay_number');
}
