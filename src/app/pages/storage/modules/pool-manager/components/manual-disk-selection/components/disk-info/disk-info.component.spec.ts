import { byText, createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { DiskType } from 'app/enums/disk-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import {
  DiskInfoComponent,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/components/disk-info/disk-info.component';

describe('DiskInfoComponent', () => {
  let spectator: Spectator<DiskInfoComponent>;
  const createComponent = createComponentFactory({
    component: DiskInfoComponent,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        disk: {
          enclosure: {
            drive_bay_number: 1,
          },
          model: 'FR102-K',
          serial: '1234567890',
          type: DiskType.Hdd,
        } as DetailsDisk,
      },
    });
  });

  function getValueByLabel(label: string): string {
    const labelElement = spectator.query(byText(`${label}:`));
    return labelElement.nextElementSibling.textContent;
  }

  it('adds .no-slot class when there is no enclosure', () => {
    spectator.setInput({
      disk: {
        enclosure: null,
      } as DetailsDisk,
    });

    expect(spectator.query('.container')).toHaveClass('no-slot');
  });

  it('shows enclosure slot when enclosure is available', () => {
    expect(getValueByLabel('Slot')).toBe('1');
  });

  it('shows disk model', () => {
    expect(getValueByLabel('Model')).toBe('FR102-K');
  });

  it('shows disk type', () => {
    expect(getValueByLabel('Type')).toBe('HDD');
  });

  it('shows disk serial', () => {
    expect(getValueByLabel('Serial')).toBe('1234567890');
  });
});
