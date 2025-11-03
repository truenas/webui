import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { VirtualizationDeviceType, VirtualizationType } from 'app/enums/virtualization.enum';
import { VirtualizationVolume } from 'app/interfaces/container.interface';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  InstanceDiskFormComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-disks/instance-disk-form/instance-disk-form.component';
import { FilesystemService } from 'app/services/filesystem.service';

describe('InstanceDiskFormComponent', () => {
  let spectator: Spectator<InstanceDiskFormComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: InstanceDiskFormComponent,
    providers: [
      mockAuth(),
      mockApi([
        mockCall('container.device.create'),
        mockCall('container.device.update'),
      ]),
      mockProvider(SnackbarService),
      mockProvider(FilesystemService),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of({
            id: 'my-volume',
          } as VirtualizationVolume),
        })),
      }),
    ],
  });

  describe('creating a disk', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, {
            getData: () => ({
              instance: { id: 'my-instance', type: VirtualizationType.Container },
            }),
            close: jest.fn(),
            requireConfirmationWhen: jest.fn(),
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('creates a new disk for the instance provided when form is submitted', async () => {
      const form = await loader.getHarness(IxFormHarness);

      await form.fillForm({
        Source: '/mnt/path',
        Destination: 'destination',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({
        response: true,
      });
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('container.device.create', [{
        container: 'my-instance',
        attributes: {
          source: '/mnt/path',
          destination: 'destination',
          dev_type: VirtualizationDeviceType.Disk,
        },
      }]);
    });
  });

  describe('editing a disk', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, {
            getData: () => ({
              instance: { id: 'my-instance', type: VirtualizationType.Container },
              disk: {
                id: 456,
                name: 'existing-disk',
                source: '/mnt/from',
                destination: 'to',
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

    it('shows values for the disk that is being edited', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const values = await form.getValues();

      expect(values).toEqual({
        Source: '/mnt/from',
        Destination: 'to',
      });
    });

    it('saves updated disk when form is saved', async () => {
      const form = await loader.getHarness(IxFormHarness);

      await form.fillForm({
        Source: '/mnt/updated',
        Destination: 'new-destination',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('container.device.update', [456, {
        attributes: {
          source: '/mnt/updated',
          destination: 'new-destination',
          dev_type: VirtualizationDeviceType.Disk,
          name: 'existing-disk',
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
              instance: { id: 'my-instance', type: VirtualizationType.Container },
            }),
            close: jest.fn(),
            requireConfirmationWhen: jest.fn(),
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('requires source and destination fields', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));

      expect(await saveButton.isDisabled()).toBe(true);

      await form.fillForm({
        Source: '/mnt/source',
      });
      expect(await saveButton.isDisabled()).toBe(true);

      await form.fillForm({
        Destination: 'dest',
      });
      expect(await saveButton.isDisabled()).toBe(false);
    });

    it('shows form title for new disk', () => {
      expect(spectator.query(ModalHeaderComponent)).toExist();
    });

    it('creates a new disk for a VM', async () => {
      const selectVolumeButton = await loader.getHarness(MatButtonHarness.with({ text: 'Select Volume' }));
      await selectVolumeButton.click();

      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        'I/O Bus': 'Virtio-BLK',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({
        response: true,
      });
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('container.device.create', [{
        container: 'my-instance',
        attributes: {
          source: 'my-volume',
          dev_type: VirtualizationDeviceType.Disk,
          io_bus: DiskIoBus.VirtioBlk,
        },
      }]);
    });
  });
});
