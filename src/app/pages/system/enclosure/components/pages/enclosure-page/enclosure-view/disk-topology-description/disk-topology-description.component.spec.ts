import { byText } from '@ngneat/spectator';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MapValuePipe } from 'app/core/pipes/map-value.pipe';
import { VdevType } from 'app/enums/v-dev-type.enum';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import {
  DiskTopologyDescriptionComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/enclosure-view/disk-topology-description/disk-topology-description.component';

describe('DiskTopologyDescriptionComponent', () => {
  let spectator: Spectator<DiskTopologyDescriptionComponent>;
  const createComponent = createComponentFactory({
    component: DiskTopologyDescriptionComponent,
    declarations: [
      MapValuePipe,
    ],
  });

  function getItemValue(title: string): string {
    const titleElement = spectator.query<HTMLElement>(byText(title));
    return titleElement.nextElementSibling.textContent;
  }

  describe('occupied', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          selectedSlot: {
            drive_bay_number: 1,
            dev: 'sda',
            pool_info: {
              vdev_name: 'stripe',
              vdev_type: VdevType.Data,
            },
          } as DashboardEnclosureSlot,
        },
      });
    });

    it('shows name of the device', () => {
      expect(spectator.query('h1')).toHaveText('sda');
    });

    it('shows topology', () => {
      expect(getItemValue('Topology:')).toBe('stripe');
    });

    it('shows device category', () => {
      expect(getItemValue('Category:')).toMatch('Data');
    });

    it('shows slot number', () => {
      expect(getItemValue('Slot:')).toBe('1');
    });
  });

  it('only shows slot number when slot is empty', () => {
    spectator = createComponent({
      props: {
        selectedSlot: {
          drive_bay_number: 1,
        } as DashboardEnclosureSlot,
      },
    });

    expect(spectator.query('h1')).not.toExist();

    const values = spectator.queryAll('.value');
    expect(values).toHaveLength(1);
    expect(getItemValue('Slot:')).toBe('1');
  });
});
