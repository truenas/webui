import {
  makeArrayDeviceSlots,
} from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-array-device-slots.utils';

describe('makeArrayDeviceSlots', () => {
  it('generates a list of enclosure slots with given parameters', () => {
    const slots = makeArrayDeviceSlots(1, 3, {
      is_top: true,
      supportsIdentifyLight: true,
    });

    expect(slots).toMatchObject({
      1: {
        descriptor: 'slot01',
        dev: null,
        drive_bay_light_status: null,
        drive_bay_number: 1,
        is_front: false,
        is_internal: false,
        is_rear: false,
        is_top: true,
        model: null,
        pool_info: null,
        rotationrate: null,
        serial: null,
        size: null,
        status: 'OK',
        supports_identify_light: true,
        type: null,
      },
      2: {
        descriptor: 'slot02',
        dev: null,
        drive_bay_light_status: null,
        drive_bay_number: 2,
        is_front: false,
        is_internal: false,
        is_rear: false,
        is_top: true,
        model: null,
        pool_info: null,
        rotationrate: null,
        serial: null,
        size: null,
        status: 'OK',
        supports_identify_light: true,
        type: null,
      },
      3: {
        descriptor: 'slot03',
        dev: null,
        drive_bay_light_status: null,
        drive_bay_number: 3,
        is_front: false,
        is_internal: false,
        is_rear: false,
        is_top: true,
        model: null,
        pool_info: null,
        rotationrate: null,
        serial: null,
        size: null,
        status: 'OK',
        supports_identify_light: true,
        type: null,
      },
    });
  });
});
