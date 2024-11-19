import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { VirtualizationDeviceType } from 'app/enums/virtualization.enum';
import { VirtualizationDisk, VirtualizationProxy } from 'app/interfaces/virtualization.interface';
import {
  InstanceDisksComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-disks/instance-disks.component';
import {
  DeleteDeviceButtonComponent,
} from 'app/pages/virtualization/components/common/delete-device-button/delete-device-button.component';
import { VirtualizationDevicesStore } from 'app/pages/virtualization/stores/virtualization-devices.store';

describe('InstanceDisksComponent', () => {
  let spectator: Spectator<InstanceDisksComponent>;
  const disks = [
    {
      dev_type: VirtualizationDeviceType.Disk,
      source: '/mnt/source-path',
      destination: 'destination',
    } as VirtualizationDisk,
    {
      dev_type: VirtualizationDeviceType.Disk,
      source: null,
      destination: 'destination',
    } as VirtualizationDisk,
    {
      name: 'proxy2',
    } as VirtualizationProxy,
  ];
  const createComponent = createComponentFactory({
    component: InstanceDisksComponent,
    imports: [
      MockComponent(DeleteDeviceButtonComponent),
    ],
    providers: [
      mockProvider(VirtualizationDevicesStore, {
        isLoading: () => false,
        selectedInstance: () => ({ id: 'my-instance' }),
        devices: () => disks,
        loadDevices: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows a list of disks that have source set', () => {
    const diskRows = spectator.queryAll('.disk');

    expect(diskRows).toHaveLength(1);
    expect(diskRows[0]).toHaveText('source-path → destination');
  });

  it('renders a button to delete the disk', () => {
    const deleteButtons = spectator.queryAll(DeleteDeviceButtonComponent);
    expect(deleteButtons).toHaveLength(1);
    expect(deleteButtons[0].device).toBe(disks[0]);
  });
});
