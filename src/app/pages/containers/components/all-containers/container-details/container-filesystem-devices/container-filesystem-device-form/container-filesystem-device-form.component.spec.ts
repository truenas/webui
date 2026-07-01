import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnInputHarness } from '@truenas/ui-components';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ContainerDeviceType, ContainerType } from 'app/enums/container.enum';
import { Container, ContainerFilesystemDevice } from 'app/interfaces/container.interface';
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

  const setSource = async (value: string): Promise<void> => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({ 'Host Directory Source': value });
  };

  const getTargetInput = (): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: '[formControlName="target"]' }),
  );

  describe('SlideIn host - creating a filesystem device', () => {
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

    it('renders the modal header when hosted in a SlideIn', () => {
      expect(spectator.query(ModalHeaderComponent)).toExist();
    });

    it('creates a new filesystem device for the container provided when form is submitted', async () => {
      await setSource('/mnt/path');
      await (await getTargetInput()).setValue('/target');

      const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
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

  describe('SlideIn host - editing a filesystem device', () => {
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

    it('shows values for the filesystem device that is being edited', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const values = await form.getValues();

      expect(values).toMatchObject({
        'Host Directory Source': '/mnt/from',
      });
      expect(await (await getTargetInput()).getValue()).toBe('/to');
    });

    it('saves updated filesystem device when form is saved', async () => {
      await setSource('/mnt/updated');
      await (await getTargetInput()).setValue('/new-target');

      const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
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

  describe('SlideIn host - form validation', () => {
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
      const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));

      expect(await saveButton.isDisabled()).toBe(true);

      await setSource('/mnt/source');
      expect(await saveButton.isDisabled()).toBe(true);

      await (await getTargetInput()).setValue('/dest');
      expect(await saveButton.isDisabled()).toBe(false);
    });
  });

  describe('side-panel host (no SlideInRef)', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          container: { id: 1, type: ContainerType.Container } as Container,
          disk: undefined,
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('does not render its own modal header or Save button', async () => {
      expect(spectator.query(ModalHeaderComponent)).not.toExist();
      const saveButtons = await loader.getAllHarnesses(TnButtonHarness.with({ label: 'Save' }));
      expect(saveButtons).toHaveLength(0);
    });

    it('exposes canSubmit reflecting form validity', async () => {
      expect(spectator.component.canSubmit()).toBe(false);

      await setSource('/mnt/source');
      await (await getTargetInput()).setValue('/dest');

      expect(spectator.component.canSubmit()).toBe(true);
    });

    it('submits via the host-facing submit() and emits closed on success', async () => {
      const closedSpy = jest.fn();
      spectator.component.closed.subscribe(closedSpy);

      await setSource('/mnt/source');
      await (await getTargetInput()).setValue('/dest');

      spectator.component.submit();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('container.device.create', [{
        container: 1,
        attributes: {
          source: '/mnt/source',
          target: '/dest',
          dtype: ContainerDeviceType.Filesystem,
        },
      }]);
      expect(closedSpy).toHaveBeenCalledWith(true);
    });

    it('resolves the disk input when editing in a side panel', async () => {
      spectator.setInput('disk', {
        id: 99,
        dtype: ContainerDeviceType.Filesystem,
        source: '/mnt/existing',
        target: '/mounted',
      } as ContainerFilesystemDevice);
      spectator.component.ngOnInit();
      spectator.detectChanges();

      const form = await loader.getHarness(IxFormHarness);
      const values = await form.getValues();

      expect(values).toMatchObject({
        'Host Directory Source': '/mnt/existing',
      });
      expect(await (await getTargetInput()).getValue()).toBe('/mounted');
    });
  });
});
