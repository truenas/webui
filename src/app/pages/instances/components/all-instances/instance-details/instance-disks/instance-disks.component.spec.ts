import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { ContainerDeviceType, ContainerStatus } from 'app/enums/container.enum';
import { ContainerFilesystemDevice } from 'app/interfaces/container.interface';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import {
  InstanceDiskFormComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-disks/instance-disk-form/instance-disk-form.component';
import {
  InstanceDisksComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-disks/instance-disks.component';
import {
  DeviceActionsMenuComponent,
} from 'app/pages/instances/components/common/device-actions-menu/device-actions-menu.component';
import { VirtualizationDevicesStore } from 'app/pages/instances/stores/virtualization-devices.store';
import { VirtualizationInstancesStore } from 'app/pages/instances/stores/virtualization-instances.store';
import { fakeVirtualizationInstance } from 'app/pages/instances/utils/fake-virtualization-instance.utils';

describe('InstanceDisksComponent', () => {
  let spectator: Spectator<InstanceDisksComponent>;
  let loader: HarnessLoader;
  const disks = [
    {
      id: 1,
      name: 'disk1',
      dtype: ContainerDeviceType.Filesystem,
      source: '/mnt/source-path',
      target: 'target',
    } as ContainerFilesystemDevice,
    {
      id: 2,
      name: 'disk2',
      dtype: ContainerDeviceType.Filesystem,
      source: null,
      target: 'target',
    } as ContainerFilesystemDevice,
  ];
  const createComponent = createComponentFactory({
    component: InstanceDisksComponent,
    imports: [
      MockComponent(DeviceActionsMenuComponent),
    ],
    providers: [
      mockProvider(VirtualizationInstancesStore, {
        selectedInstance: () => fakeVirtualizationInstance({
          id: 1,
          status: { state: ContainerStatus.Stopped, pid: 0, domain_state: 'stopped' },
        }),
        instanceUpdated: jest.fn(),
      }),
      mockProvider(VirtualizationDevicesStore, {
        isLoading: () => false,
        devices: () => disks,
        loadDevices: jest.fn(),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => of({
          response: true,
        })),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        instance: fakeVirtualizationInstance({ id: 1 }),
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows a list of disks that have source set', () => {
    const diskRows = spectator.queryAll('.device');

    expect(diskRows).toHaveLength(2);
    expect(diskRows[0]).toHaveText('/mnt/source-path → target');
  });

  it('renders a menu to manage the disk', () => {
    const actionsMenu = spectator.queryAll(DeviceActionsMenuComponent);
    expect(actionsMenu).toHaveLength(2);
    expect(actionsMenu[0].device).toBe(disks[0]);
  });

  describe('container', () => {
    it('opens disk form when Add is pressed', async () => {
      const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
      await addButton.click();

      expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(
        InstanceDiskFormComponent,
        { data: { disk: undefined, instance: fakeVirtualizationInstance({ id: 1 }) } },
      );
    });
  });
});
