import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ContainerDeviceType, ContainerStatus } from 'app/enums/container.enum';
import { ContainerFilesystemDevice } from 'app/interfaces/container.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
import {
  ContainerFilesystemDeviceFormComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-filesystem-devices/container-filesystem-device-form/container-filesystem-device-form.component';
import {
  ContainerFilesystemDevicesComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-filesystem-devices/container-filesystem-devices.component';
import {
  DeviceActionsMenuComponent,
} from 'app/pages/containers/components/common/device-actions-menu/device-actions-menu.component';
import { ContainerDevicesStore } from 'app/pages/containers/stores/container-devices.store';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';
import { fakeContainer } from 'app/pages/containers/utils/fake-container.utils';
import { FilesystemService } from 'app/services/filesystem.service';

describe('ContainerFilesystemDevicesComponent', () => {
  let spectator: Spectator<ContainerFilesystemDevicesComponent>;
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
    component: ContainerFilesystemDevicesComponent,
    imports: [
      MockComponent(DeviceActionsMenuComponent),
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('container.device.create'),
        mockCall('container.device.update'),
      ]),
      mockProvider(SnackbarService),
      mockProvider(FilesystemService),
      mockProvider(UnsavedChangesService, {
        showConfirmDialog: () => of(true),
      }),
      mockProvider(ContainersStore, {
        selectedContainer: () => fakeContainer({
          id: 1,
          status: { state: ContainerStatus.Stopped, pid: 0, domain_state: 'stopped' },
        }),
        containerUpdated: jest.fn(),
      }),
      mockProvider(ContainerDevicesStore, {
        isLoading: () => false,
        devices: () => disks,
        loadDevices: jest.fn(),
        reload: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        container: fakeContainer({ id: 1 }),
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

  describe('side panel', () => {
    it('opens the side panel with the form to add a disk', async () => {
      expect(spectator.query(ContainerFilesystemDeviceFormComponent)).not.toExist();

      const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
      await addButton.click();
      spectator.detectChanges();

      const form = spectator.query(ContainerFilesystemDeviceFormComponent);
      expect(form).toExist();
      expect(form.disk()).toBeUndefined();
      expect(form.container()).toEqual(fakeContainer({ id: 1 }));
    });

    it('opens the side panel with the disk being edited', () => {
      const component = spectator.component as unknown as { editDisk: (disk: ContainerFilesystemDevice) => void };
      component.editDisk(disks[0]);
      spectator.detectChanges();

      const form = spectator.query(ContainerFilesystemDeviceFormComponent);
      expect(form).toExist();
      expect(form.disk()).toBe(disks[0]);
    });

    it('reloads devices and closes the panel when the form reports a successful save', async () => {
      const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
      await addButton.click();
      spectator.detectChanges();

      const form = spectator.query(ContainerFilesystemDeviceFormComponent);
      form.closed.emit(true);
      spectator.detectChanges();

      expect(spectator.inject(ContainerDevicesStore).reload).toHaveBeenCalled();
      expect(spectator.query(ContainerFilesystemDeviceFormComponent)).not.toExist();
    });

    it('closes the panel without reloading when the form is cancelled', async () => {
      const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
      await addButton.click();
      spectator.detectChanges();

      const form = spectator.query(ContainerFilesystemDeviceFormComponent);
      form.closed.emit(false);
      spectator.detectChanges();

      expect(spectator.inject(ContainerDevicesStore).reload).not.toHaveBeenCalled();
      expect(spectator.query(ContainerFilesystemDeviceFormComponent)).not.toExist();
    });
  });
});
