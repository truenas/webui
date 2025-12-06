import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ContainerDeviceType, ContainerType } from 'app/enums/container.enum';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  ContainerFilesystemDeviceFormComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-filesystem-devices/container-filesystem-device-form/container-filesystem-device-form.component';
import { FilesystemService } from 'app/services/filesystem.service';

describe('ContainerFilesystemDeviceFormComponent', () => {
  let spectator: Spectator<ContainerFilesystemDeviceFormComponent>;
  let loader: HarnessLoader;
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

  describe('creating a filesystem device', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, {
            getData: () => ({
              container: { id: 1, type: ContainerType.Container },
            }),
            close: jest.fn(),
            requireConfirmationWhen: jest.fn(),
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('creates a new filesystem device for the container provided when form is submitted', async () => {
      const form = await loader.getHarness(IxFormHarness);

      await form.fillForm({
        'Host Directory Source': '/mnt/path',
        'Container Mount Path': '/target',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({
        response: true,
      });
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('container.device.create', [{
        container: 1,
        attributes: {
          source: '/mnt/path',
          target: '/target',
          dtype: ContainerDeviceType.Filesystem,
        },
      }]);
    });
  });

  describe('editing a filesystem device', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, {
            getData: () => ({
              container: { id: 1, type: ContainerType.Container },
              disk: {
                id: 456,
                name: 'existing-disk',
                dtype: ContainerDeviceType.Filesystem,
                source: '/mnt/from',
                target: '/to',
              },
            }),
            close: jest.fn(),
            requireConfirmationWhen: jest.fn(),
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows a title for editing a disk', () => {
      expect(spectator.query(ModalHeaderComponent)).toExist();
    });

    it('shows values for the filesystem device that is being edited', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const values = await form.getValues();

      expect(values).toMatchObject({
        'Host Directory Source': '/mnt/from',
        'Container Mount Path': '/to',
      });
    });

    it('saves updated filesystem device when form is saved', async () => {
      const form = await loader.getHarness(IxFormHarness);

      await form.fillForm({
        'Host Directory Source': '/mnt/updated',
        'Container Mount Path': '/new-target',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('container.device.update', [456, {
        attributes: {
          source: '/mnt/updated',
          target: '/new-target',
          dtype: ContainerDeviceType.Filesystem,
        },
      }]);

      expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({
        response: true,
      });
    });
  });

  describe('form validation', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, {
            getData: () => ({
              container: { id: 1, type: ContainerType.Container },
            }),
            close: jest.fn(),
            requireConfirmationWhen: jest.fn(),
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('requires source and target fields for filesystem device', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));

      expect(await saveButton.isDisabled()).toBe(true);

      await form.fillForm({
        'Host Directory Source': '/mnt/source',
      });
      expect(await saveButton.isDisabled()).toBe(true);

      await form.fillForm({
        'Container Mount Path': '/dest',
      });
      expect(await saveButton.isDisabled()).toBe(false);
    });

    it('shows form title for new disk', () => {
      expect(spectator.query(ModalHeaderComponent)).toExist();
    });
  });
});
