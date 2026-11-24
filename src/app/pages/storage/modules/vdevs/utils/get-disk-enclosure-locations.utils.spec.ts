import { EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosure, DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { getDiskEnclosureLocations } from 'app/pages/storage/modules/vdevs/utils/get-disk-enclosure-locations.utils';

describe('getDiskEnclosureLocations', () => {
  const enclosures = [
    {
      id: 'enc1',
      name: 'iX 4024Sp e001',
      label: 'iX 4024Sp e001',
      model: 'M50',
      elements: {
        [EnclosureElementType.ArrayDeviceSlot]: {
          1: { drive_bay_number: 1, serial: 'SERIAL1', dev: 'sda' } as DashboardEnclosureSlot,
          2: { drive_bay_number: 2, serial: null, dev: null } as DashboardEnclosureSlot,
        },
      },
    },
    {
      id: 'enc2',
      name: 'ES24',
      label: 'Shelf A',
      model: 'ES24',
      elements: {
        [EnclosureElementType.ArrayDeviceSlot]: {
          7: { drive_bay_number: 7, serial: 'SERIAL2', dev: 'sdb' } as DashboardEnclosureSlot,
        },
      },
    },
  ] as DashboardEnclosure[];

  it('maps each disk serial to its enclosure label and slot, as the Enclosure page names them', () => {
    expect(getDiskEnclosureLocations(enclosures)).toEqual({
      SERIAL1: { enclosureId: 'enc1', enclosureLabel: 'M50', slot: 1 },
      SERIAL2: { enclosureId: 'enc2', enclosureLabel: 'Shelf A', slot: 7 },
    });
  });

  it('returns no locations when the system has no enclosures', () => {
    expect(getDiskEnclosureLocations([])).toEqual({});
  });
});
