import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { EnclosureDiskStatus } from 'app/enums/enclosure-slot-status.enum';
import { VDevType } from 'app/enums/v-dev-type.enum';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { IdentifyLightComponent } from 'app/pages/system/enclosure/components/identify-light/identify-light.component';
import {
  MiniDriveDetailsComponent,
} from 'app/pages/system/enclosure/components/pages/mini-page/mini-drive-details/mini-drive-details.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { getItemValueFactory } from 'app/pages/system/enclosure/utils/get-item-value-factory.utils';

describe('MiniDriveDetailsComponent', () => {
  let spectator: Spectator<MiniDriveDetailsComponent>;
  const slot = {
    model: 'A3',
    rotationrate: 7200,
    serial: '12345',
    supports_identify_light: true,
    pool_info: {
      pool_name: 'pool1',
      disk_status: EnclosureDiskStatus.Online,
      vdev_name: 'raidz1-0',
      vdev_type: VDevType.Data,
    },
  } as DashboardEnclosureSlot;

  let getItemValue: (name: string) => string;

  const createComponent = createComponentFactory({
    component: MiniDriveDetailsComponent,
    declarations: [
      MockComponent(IdentifyLightComponent),
    ],
    imports: [
      MapValuePipe,
    ],
    providers: [
      mockProvider(EnclosureStore, {
        selectSlot: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        slot,
      },
    });
    getItemValue = getItemValueFactory(spectator);
  });

  it('shows pool for the selected slot', () => {
    expect(getItemValue('Pool:')).toMatch('pool1');
  });

  it('shows disk model', () => {
    expect(getItemValue('Model:')).toBe('A3');
  });

  it('shows disk serial', () => {
    expect(getItemValue('Serial:')).toMatch('12345');
  });

  it('shows disk rotation rate', () => {
    expect(getItemValue('Rotation Rate:')).toMatch('7200 RPM');
  });

  it('shows disk status', () => {
    expect(getItemValue('Status:')).toMatch('Online');
  });

  it('unselects a slot when X is pressed', () => {
    spectator.click('ix-icon');

    expect(spectator.inject(EnclosureStore).selectSlot).toHaveBeenCalledWith(null);
  });

  it('shows friendly VDEV name for data drives', () => {
    expect(getItemValue('VDEV:')).toMatch('RAIDZ1');
  });

  it('shows friendly VDEV name for spare drives', () => {
    spectator.setInput('slot', {
      pool_info: {
        pool_name: 'pool1',
        disk_status: EnclosureDiskStatus.Online,
        vdev_name: 'spare-0',
        vdev_type: VDevType.Spare,
      },
    } as DashboardEnclosureSlot);
    spectator.detectChanges();

    expect(getItemValue('VDEV:')).toMatch('Spare');
  });

  it('shows friendly VDEV names for different RAID types', () => {
    // Test RAIDZ1
    spectator.setInput('slot', {
      pool_info: {
        pool_name: 'pool1',
        disk_status: EnclosureDiskStatus.Online,
        vdev_name: 'raidz1-0',
        vdev_type: VDevType.Data,
      },
    } as DashboardEnclosureSlot);
    spectator.detectChanges();
    expect(getItemValue('VDEV:')).toMatch('RAIDZ1');

    // Test Mirror
    spectator.setInput('slot', {
      pool_info: {
        pool_name: 'pool1',
        disk_status: EnclosureDiskStatus.Online,
        vdev_name: 'mirror-0',
        vdev_type: VDevType.Data,
      },
    } as DashboardEnclosureSlot);
    spectator.detectChanges();
    expect(getItemValue('VDEV:')).toMatch('Mirror');

    // Test Stripe (Single Disk)
    spectator.setInput('slot', {
      pool_info: {
        pool_name: 'pool1',
        disk_status: EnclosureDiskStatus.Online,
        vdev_name: 'stripe',
        vdev_type: VDevType.Data,
      },
    } as DashboardEnclosureSlot);
    spectator.detectChanges();
    expect(getItemValue('VDEV:')).toMatch('Single Disk');

    // Test Cache
    spectator.setInput('slot', {
      pool_info: {
        pool_name: 'pool1',
        disk_status: EnclosureDiskStatus.Online,
        vdev_name: 'cache-0',
        vdev_type: VDevType.Cache,
      },
    } as DashboardEnclosureSlot);
    spectator.detectChanges();
    expect(getItemValue('VDEV:')).toMatch('Cache');
  });

  it('shows "Unassigned" for drives without pool info', () => {
    spectator.setInput('slot', {
      pool_info: null,
    } as DashboardEnclosureSlot);
    spectator.detectChanges();

    expect(getItemValue('VDEV:')).toMatch('Unassigned');
  });

  it('shows "Disk not attached to any pools" when this is the case', () => {
    spectator.setInput('slot', {
      pool_info: null,
    } as DashboardEnclosureSlot);
    spectator.detectChanges();

    expect(getItemValue('Pool:')).toMatch('Disk not attached to any pools.');
  });

  it('shows identify light when enclosure slot has support for it', () => {
    expect(spectator.query(IdentifyLightComponent)).toExist();
  });

  it('uses MapValuePipe to translate disk status labels', () => {
    // Test that different statuses are properly translated through MapValuePipe
    const statusTests = [
      { status: EnclosureDiskStatus.Online, expected: 'Online' },
      { status: EnclosureDiskStatus.Faulted, expected: 'Faulted' },
      { status: EnclosureDiskStatus.Degraded, expected: 'Degraded' },
      { status: EnclosureDiskStatus.Unknown, expected: 'Unknown' },
      { status: EnclosureDiskStatus.Offline, expected: 'Offline' },
    ];

    statusTests.forEach(({ status, expected }) => {
      spectator.setInput('slot', {
        model: 'Test Model',
        pool_info: {
          pool_name: 'pool1',
          disk_status: status,
          vdev_name: 'test-vdev',
          vdev_type: VDevType.Data,
        },
      } as DashboardEnclosureSlot);
      spectator.detectChanges();

      expect(getItemValue('Status:')).toMatch(expected);
    });
  });

  it('getFriendlyVdevName method correctly transforms technical names', () => {
    const component = spectator.component;

    // Test various VDEV types and names
    expect(component.getFriendlyVdevName('spare-0', VDevType.Spare)).toBe('Spare');
    expect(component.getFriendlyVdevName('cache-0', VDevType.Cache)).toBe('Cache');
    expect(component.getFriendlyVdevName('log-0', VDevType.Log)).toBe('Log');
    expect(component.getFriendlyVdevName('special-0', VDevType.Special)).toBe('Metadata');
    expect(component.getFriendlyVdevName('dedup-0', VDevType.Dedup)).toBe('Dedup');

    // Test RAID types
    expect(component.getFriendlyVdevName('raidz1-0', VDevType.Data)).toBe('RAIDZ1');
    expect(component.getFriendlyVdevName('raidz2-0', VDevType.Data)).toBe('RAIDZ2');
    expect(component.getFriendlyVdevName('raidz3-0', VDevType.Data)).toBe('RAIDZ3');
    expect(component.getFriendlyVdevName('raidz-0', VDevType.Data)).toBe('RAIDZ1');
    expect(component.getFriendlyVdevName('mirror-0', VDevType.Data)).toBe('Mirror');
    expect(component.getFriendlyVdevName('stripe', VDevType.Data)).toBe('Single Disk');
    expect(component.getFriendlyVdevName('draid1-0', VDevType.Data)).toBe('dRAID1');
    expect(component.getFriendlyVdevName('draid2-0', VDevType.Data)).toBe('dRAID2');
    expect(component.getFriendlyVdevName('draid3-0', VDevType.Data)).toBe('dRAID3');

    // Test fallback for unknown names
    expect(component.getFriendlyVdevName('unknown-vdev-name', VDevType.Data)).toBe('unknown-vdev-name');
  });
});
