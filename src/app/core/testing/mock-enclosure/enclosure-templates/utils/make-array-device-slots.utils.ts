import { keyBy, range } from 'lodash-es';
import { EnclosureStatus } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';

export function makeArrayDeviceSlots(
  from: number,
  to: number,
  options: {
    supportsIdentifyLight?: boolean;
    is_front?: boolean;
    is_top?: boolean;
    is_rear?: boolean;
    is_internal?: boolean;
  },
): Record<number, DashboardEnclosureSlot> {
  const slots = range(from, to + 1).map((slot) => {
    return {
      drive_bay_number: slot,
      descriptor: `slot${slot.toString().padStart(2, '0')}`,
      status: EnclosureStatus.Ok,
      dev: null,
      supports_identify_light: options.supportsIdentifyLight ?? false,
      drive_bay_light_status: null,
      size: null,
      model: null,
      serial: null,
      type: null,
      rotationrate: null,
      pool_info: null,
      is_front: options.is_front ?? false,
      is_top: options.is_top ?? false,
      is_rear: options.is_rear ?? false,
      is_internal: options.is_internal ?? false,
    };
  });

  return keyBy(slots, 'drive_bay_number');
}
