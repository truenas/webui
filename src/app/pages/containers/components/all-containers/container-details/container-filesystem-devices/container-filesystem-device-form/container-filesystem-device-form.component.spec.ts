import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnInputHarness } from '@truenas/ui-components';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ContainerDeviceType, ContainerType } from 'app/enums/container.enum';
import { Container, ContainerFilesystemDevice } from 'app/interfaces/container.interface';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  ContainerFilesystemDeviceFormComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-filesystem-devices/container-filesystem-device-form/container-filesystem-device-form.component';
import { FilesystemService } from 'app/services/filesystem.service';

describe('ContainerFilesystemDeviceFormComponent', () => {
  let spectator: Spectator<ContainerFilesystemDeviceFormComponent>;
  let loader: HarnessLoader;
  const container = { id: 1, type: ContainerType.Container } as Container;
  const existingDisk = {
    id: 456,
    dtype: ContainerDeviceType.Filesystem,
    source: '/mnt/from',
    target: '/to',
  } as ContainerFilesystemDevice;

  const createComponent = createComponentFactory({
    component: ContainerFilesystemDeviceFormComponent,
    providers: [
      mockAuth(),
      mockApi([
        mockCall('container.device.create'),
        mockCall('container.device.update'),
      ]),
      mockProvider(SnackbarService),
      mockProvider(FilesystemService),
    ],
  });

  const setSource = async (value: string): Promise<void> => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({ 'Host Directory Source': value });
  };

  const getTargetInput = (): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: '[formControlName="target"]' }),
  );

  describe('creating a filesystem device', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: { container, disk: undefined },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('does not render its own Save button — the side panel host owns it', async () => {
      const saveButtons = await loader.getAllHarnesses(TnButtonHarness.with({ label: 'Save' }));
      expect(saveButtons).toHaveLength(0);
    });

    it('creates a new filesystem device for the container provided when the host submits', async () => {
      const closedSpy = jest.fn();
      spectator.component.closed.subscribe(closedSpy);

      await setSource('/mnt/path');
      await (await getTargetInput()).setValue('/target');

      spectator.component.submit();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('container.device.create', [{
        container: 1,
        attributes: {
          source: '/mnt/path',
          target: '/target',
          dtype: ContainerDeviceType.Filesystem,
        },
      }]);
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
      expect(closedSpy).toHaveBeenCalledWith(true);
    });

    it('exposes canSubmit reflecting form validity', async () => {
      expect(spectator.component.canSubmit()).toBe(false);

      await setSource('/mnt/source');
      expect(spectator.component.canSubmit()).toBe(false);

      await (await getTargetInput()).setValue('/dest');
      expect(spectator.component.canSubmit()).toBe(true);
    });
  });

  describe('editing a filesystem device', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: { container, disk: existingDisk },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows values for the filesystem device that is being edited', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const values = await form.getValues();

      expect(values).toMatchObject({
        'Host Directory Source': '/mnt/from',
      });
      expect(await (await getTargetInput()).getValue()).toBe('/to');
    });

    it('saves the updated filesystem device when the host submits', async () => {
      const closedSpy = jest.fn();
      spectator.component.closed.subscribe(closedSpy);

      await setSource('/mnt/updated');
      await (await getTargetInput()).setValue('/new-target');

      spectator.component.submit();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('container.device.update', [456, {
        attributes: {
          source: '/mnt/updated',
          target: '/new-target',
          dtype: ContainerDeviceType.Filesystem,
        },
      }]);
      expect(closedSpy).toHaveBeenCalledWith(true);
    });
  });
});
