import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ContainerDeviceType, ContainerStatus } from 'app/enums/container.enum';
import { ContainerFilesystemDevice } from 'app/interfaces/container.interface';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
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
  let formPanel: FormSidePanelService;
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
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.cancel()),
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
    formPanel = spectator.inject(FormSidePanelService);
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
    it('opens the form side panel to add a disk', async () => {
      const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
      await addButton.click();

      expect(formPanel.open).toHaveBeenCalledWith(ContainerFilesystemDeviceFormComponent, {
        title: 'Add Disk',
        inputs: {
          disk: undefined,
          container: fakeContainer({ id: 1 }),
        },
      });
    });

    it('opens the form side panel with the disk being edited', () => {
      const component = spectator.component as unknown as { editDisk: (disk: ContainerFilesystemDevice) => void };
      component.editDisk(disks[0]);

      expect(formPanel.open).toHaveBeenCalledWith(ContainerFilesystemDeviceFormComponent, {
        title: 'Edit Disk',
        inputs: {
          disk: disks[0],
          container: fakeContainer({ id: 1 }),
        },
      });
    });

    it('reloads devices when the form reports a successful save', async () => {
      jest.spyOn(formPanel, 'open').mockReturnValueOnce(SlideInResult.success(true));

      const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
      await addButton.click();

      expect(spectator.inject(ContainerDevicesStore).reload).toHaveBeenCalled();
    });

    it('does not reload devices when the form is cancelled', async () => {
      const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
      await addButton.click();

      expect(spectator.inject(ContainerDevicesStore).reload).not.toHaveBeenCalled();
    });
  });
});
