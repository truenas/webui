import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, Spectator, mockProvider } from '@ngneat/spectator/jest';
import { MiB } from 'app/constants/bytes.constant';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { NvmeOfNamespaceType } from 'app/enums/nvme-of.enum';
import { NvmeOfNamespace } from 'app/interfaces/nvme-of.interface';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  mockExplorerCreateZvol, selectNamespaceType,
} from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/testing/namespace-form.testing';
import {
  NamespaceFormComponent,
} from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-namespaces-card/namespace-form/namespace-form.component';
import { FilesystemService } from 'app/services/filesystem.service';

describe('NamespaceFormComponent', () => {
  let spectator: Spectator<NamespaceFormComponent>;
  let loader: HarnessLoader;

  const existingNamespace = {
    id: 2,
    device_type: NvmeOfNamespaceType.File,
    device_path: '/mnt/tank/test-file',
    filesize: 100 * MiB,
  } as NvmeOfNamespace;

  const createComponent = createComponentFactory({
    component: NamespaceFormComponent,
    overrideComponents: [mockExplorerCreateZvol()],
    providers: [
      mockApi([
        mockCall('nvmet.namespace.create'),
        mockCall('nvmet.namespace.update'),
      ]),
      mockAuth(),
      ...ixFormTestingProviders(),
      mockProvider(FilesystemService),
    ],
  });

  describe('creating a namespace', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          namespaceData: { subsystemId: 42 },
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('creates a namespace for a subsystem and signals success through `closed`', async () => {
      const closedSpy = jest.fn();
      spectator.component.closed.subscribe(closedSpy);

      await selectNamespaceType(loader, 'Existing File');
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        'Path To File': '/mnt/tank/new-file',
      });

      spectator.component.submit();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.namespace.create', [{
        device_path: '/mnt/tank/new-file',
        device_type: NvmeOfNamespaceType.File,
        filesize: undefined,
        subsys_id: 42,
      }]);
      // The opener reloads from the store, so `closed` only has to signal success.
      expect(closedSpy).toHaveBeenCalledWith(true);
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Namespace created.');
    });

    it('keeps Save disabled until a device path is chosen', async () => {
      expect(spectator.component.canSubmit()).toBe(false);

      await selectNamespaceType(loader, 'Existing File');
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        'Path To File': '/mnt/tank/new-file',
      });

      expect(spectator.component.canSubmit()).toBe(true);
    });
  });

  describe('editing a namespace', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          namespaceData: {
            namespace: existingNamespace,
            subsystemId: 42,
          },
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('prefills from the existing namespace', async () => {
      const form = await loader.getHarness(IxFormHarness);

      expect(await form.getValues()).toEqual({
        'Path To File': '/mnt/tank/test-file',
      });
    });

    it('updates an existing namespace and signals success through `closed`', async () => {
      const closedSpy = jest.fn();
      spectator.component.closed.subscribe(closedSpy);

      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        'Path To File': '/mnt/tank/updated-file',
      });

      spectator.component.submit();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.namespace.update', [2, {
        device_path: '/mnt/tank/updated-file',
        device_type: NvmeOfNamespaceType.File,
        filesize: undefined,
        subsys_id: 42,
      }]);
      expect(closedSpy).toHaveBeenCalledWith(true);
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Namespace updated.');
    });
  });
});
