import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ContainerDeviceType, ContainerStatus } from 'app/enums/container.enum';
import { ContainerFilesystemDevice } from 'app/interfaces/container.interface';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import {
  InstanceFilesystemDeviceFormComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-filesystem-devices/instance-filesystem-device-form/instance-filesystem-device-form.component';
import {
  InstanceFilesystemDevicesComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-filesystem-devices/instance-filesystem-devices.component';
import {
  DeviceActionsMenuComponent,
} from 'app/pages/instances/components/common/device-actions-menu/device-actions-menu.component';
import { ContainerDevicesStore } from 'app/pages/instances/stores/container-devices.store';
import { ContainerInstancesStore } from 'app/pages/instances/stores/container-instances.store';
import { fakeContainerInstance } from 'app/pages/instances/utils/fake-container-instance.utils';

describe('InstanceFilesystemDevicesComponent', () => {
  let spectator: Spectator<InstanceFilesystemDevicesComponent>;
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
    component: InstanceFilesystemDevicesComponent,
    imports: [
      MockComponent(DeviceActionsMenuComponent),
    ],
    providers: [
      mockAuth(),
      mockProvider(ContainerInstancesStore, {
        selectedInstance: () => fakeContainerInstance({
          id: 1,
          status: { state: ContainerStatus.Stopped, pid: 0, domain_state: 'stopped' },
        }),
        instanceUpdated: jest.fn(),
      }),
      mockProvider(ContainerDevicesStore, {
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
        instance: fakeContainerInstance({ id: 1 }),
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
        InstanceFilesystemDeviceFormComponent,
        { data: { disk: undefined, instance: fakeContainerInstance({ id: 1 }) } },
      );
    });
  });
});
