import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { EnclosureDiskStatus } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import {
  DiskDetailsComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/disk-details-overview/disks-overview-details/disk-details.component';
import { getItemValueFactory } from 'app/pages/system/enclosure/utils/get-item-value-factory.utils';

describe('DiskDetailsComponent', () => {
  let spectator: Spectator<DiskDetailsComponent>;
  let getItemValue: (label: string) => string;
  const createComponent = createComponentFactory({
    component: DiskDetailsComponent,
    imports: [
      MapValuePipe,
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        selectedSlot: {
          model: 'A3',
          serial: '12345',
          rotationrate: 7200,
          pool_info: {
            pool_name: 'pool1',
            disk_status: EnclosureDiskStatus.Online,
            disk_read_errors: 1,
            disk_write_errors: 2,
            disk_checksum_errors: 3,
          },
        } as DashboardEnclosureSlot,
      },
    });

    getItemValue = getItemValueFactory(spectator);
  });

  it('shows pool name', () => {
    expect(getItemValue('Pool')).toMatch('pool1');
  });

  it('shows Not attached to any pools when disk is not part of the pool', () => {
    spectator.setInput('selectedSlot', {
      pool_info: null,
    } as DashboardEnclosureSlot);

    expect(getItemValue('Pool')).toMatch('Disk not attached to any pools.');
  });

  it('shows disk model', () => {
    expect(getItemValue('Model')).toBe('A3');
  });

  it('shows disk serial', () => {
    expect(getItemValue('Serial')).toBe('12345');
  });

  it('shows disk rotation rate', () => {
    expect(getItemValue('Rotation Rate')).toMatch('7200 RPM');
  });

  it('shows disk status', () => {
    expect(getItemValue('Status')).toMatch('Online');
  });

  it('shows disk read errors', () => {
    expect(getItemValue('Read Errors')).toBe('1');
  });

  it('shows disk write errors', () => {
    expect(getItemValue('Write Errors')).toBe('2');
  });

  it('shows disk checksum errors', () => {
    expect(getItemValue('Checksum Errors')).toBe('3');
  });
});
