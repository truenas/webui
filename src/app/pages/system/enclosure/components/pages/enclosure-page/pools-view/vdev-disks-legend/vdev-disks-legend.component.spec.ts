import { byText } from '@ngneat/spectator';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import {
  VdevDisksLegendComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/pools-view/vdev-disks-legend/vdev-disks-legend.component';

describe('VdevDisksLegendComponent', () => {
  let spectator: Spectator<VdevDisksLegendComponent>;
  const createComponent = createComponentFactory({
    component: VdevDisksLegendComponent,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        selectedSlot: {
          dev: 'sdb',
          pool_info: {
            vdev_disks: [
              { dev: 'sda' },
              { dev: 'sdb' },
              { dev: 'sdc' },
            ],
          },
        } as DashboardEnclosureSlot,
        poolColor: 'red',
      },
    });
  });

  it('renders a list of disks that are part of the same VDEV', () => {
    const diskNames = spectator.queryAll('.disk-name');
    expect(diskNames).toHaveLength(3);
    expect(diskNames[0]).toHaveText('sda');
    expect(diskNames[1]).toHaveText('sdb');
    expect(diskNames[2]).toHaveText('sdc');
  });

  // Device names carry digits, which the library's kebab-casing does not split the way the
  // legacy `[ixTest]` directive did — pinned so a regression in the normalization is caught.
  it('keeps the legacy per-disk test id', () => {
    spectator.setInput('selectedSlot', {
      dev: 'nvme0n1',
      pool_info: { vdev_disks: [{ dev: 'nvme0n1' }] },
    } as DashboardEnclosureSlot);

    expect(spectator.query('.disk-name')).toHaveAttribute('data-test', 'link-select-disk-nvme-0-n-1');
  });

  it('renders list of disks in a VDEV using pool color', () => {
    const diskNames = spectator.queryAll('.disk-name');
    expect(diskNames[0].querySelector('.disk-circle')).toHaveStyle({ background: 'red' });
    expect(diskNames[2].querySelector('.disk-circle')).toHaveStyle({ background: 'red' });
  });

  it('highlights currently selected disk in the list', () => {
    const diskNames = spectator.queryAll('.disk-name');
    expect(diskNames[1].querySelector('.disk-circle')).toHaveClass('selected');
  });

  it('shows Empty drive cage when slot is empty', () => {
    spectator.setInput('selectedSlot', {});

    expect(spectator.fixture.nativeElement).toHaveText('Empty drive cage');
  });

  it('shows No vdev info when disk in the slot is not part of the pool', () => {
    spectator.setInput('selectedSlot', { dev: 'sda' });

    expect(spectator.fixture.nativeElement).toHaveText('No vdev info for this disk');
  });

  it('emits (diskClick) when disk in the list is clicked', () => {
    jest.spyOn(spectator.component.diskClick, 'emit');

    spectator.click(byText('sdc'));

    expect(spectator.component.diskClick.emit).toHaveBeenCalledWith({ dev: 'sdc' });
  });
});
