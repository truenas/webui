import { createComponentFactory, Spectator, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { MiB } from 'app/constants/bytes.constant';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { NvmeOfNamespaceType } from 'app/enums/nvme-of.enum';
import { NvmeOfNamespace } from 'app/interfaces/nvme-of.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  BaseNamespaceFormComponent,
} from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/base-namespace-form.component';
import { NamespaceChanges } from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/namespace-changes.interface';
import {
  NamespaceFormComponent,
} from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-namespaces-card/namespace-form/namespace-form.component';

describe('NamespaceFormComponent', () => {
  let spectator: Spectator<NamespaceFormComponent>;

  const existingNamespace = {
    id: 2,
    device_type: NvmeOfNamespaceType.File,
    device_path: '/mnt/tank/test-file',
    filesize: 100 * MiB,
  } as NvmeOfNamespace;

  const createComponent = createComponentFactory({
    component: NamespaceFormComponent,
    imports: [
      MockComponent(BaseNamespaceFormComponent),
    ],
    providers: [
      mockApi([
        mockCall('nvmet.namespace.create'),
        mockCall('nvmet.namespace.update'),
      ]),
      mockProvider(SnackbarService),
    ],
  });

  describe('creating a namespace', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          namespaceData: { subsystemId: 42 },
        },
      });
    });

    it('creates a namespace for a subsystem and emits it through `closed`', () => {
      const emitSpy = jest.fn();
      spectator.component.closed.subscribe(emitSpy);

      const newNamespaceData: NamespaceChanges = {
        device_path: '/mnt/tank/new-file',
        device_type: NvmeOfNamespaceType.File,
        filesize: 200 * MiB,
      };

      const baseFormComponent = spectator.query(BaseNamespaceFormComponent);
      baseFormComponent.submitted.emit(newNamespaceData);

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.namespace.create', [{
        ...newNamespaceData,
        subsys_id: 42,
      }]);

      expect(emitSpy).toHaveBeenCalledWith(newNamespaceData);

      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
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
    });

    it('edits an existing namespace and emits it through `closed`', () => {
      const emitSpy = jest.fn();
      spectator.component.closed.subscribe(emitSpy);

      const updatedNamespaceData: NamespaceChanges = {
        device_path: '/mnt/tank/updated-file',
        device_type: NvmeOfNamespaceType.File,
        filesize: 200 * MiB,
      };

      const baseFormComponent = spectator.query(BaseNamespaceFormComponent);
      baseFormComponent.submitted.emit(updatedNamespaceData);

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.namespace.update', [2, {
        ...updatedNamespaceData,
        subsys_id: 42,
      }]);

      expect(emitSpy).toHaveBeenCalledWith(updatedNamespaceData);

      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    });
  });
});
