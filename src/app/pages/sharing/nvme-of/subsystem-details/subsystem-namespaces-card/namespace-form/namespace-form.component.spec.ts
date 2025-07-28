import { createComponentFactory, Spectator, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { MiB } from 'app/constants/bytes.constant';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { NvmeOfNamespaceType } from 'app/enums/nvme-of.enum';
import { NvmeOfNamespace } from 'app/interfaces/nvme-of.interface';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  BaseNamespaceFormComponent,
} from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/base-namespace-form.component';
import { NamespaceChanges } from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/namespace-changes.interface';
import {
  NamespaceFormComponent, NamespaceFormParams,
} from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-namespaces-card/namespace-form/namespace-form.component';

describe('NamespaceFormComponent', () => {
  let spectator: Spectator<NamespaceFormComponent>;

  const existingNamespace = {
    id: 2,
    device_type: NvmeOfNamespaceType.File,
    device_path: '/mnt/tank/test-file',
    filesize: 100 * MiB,
  } as NvmeOfNamespace;

  const slideInGetData = jest.fn(() => ({
    subsystemId: 42,
  } as NamespaceFormParams));

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
      mockProvider(SlideInRef, {
        getData: slideInGetData,
        close: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  describe('creating a namespace', () => {
    beforeEach(() => {
      slideInGetData.mockReturnValue({
        subsystemId: 42,
      });
      spectator = createComponent();
    });

    it('creates a namespace for a subsystem', () => {
      const newNamespaceData: NamespaceChanges = {
        device_path: '/mnt/tank/new-file',
        device_type: NvmeOfNamespaceType.File,
        filesize: 200 * MiB,
        enabled: true,
      };

      const baseFormComponent = spectator.query(BaseNamespaceFormComponent);
      baseFormComponent.submitted.emit(newNamespaceData);

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.namespace.create', [{
        ...newNamespaceData,
        subsys_id: 42,
      }]);

      expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({
        response: newNamespaceData,
        error: null,
      });

      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    });
  });

  describe('editing a namespace', () => {
    beforeEach(() => {
      slideInGetData.mockReturnValue({
        namespace: existingNamespace,
        subsystemId: 42,
      });
      spectator = createComponent();
    });

    it('edits an existing namespace', () => {
      const updatedNamespaceData: NamespaceChanges = {
        device_path: '/mnt/tank/updated-file',
        device_type: NvmeOfNamespaceType.File,
        filesize: 200 * MiB,
        enabled: true,
      };

      const baseFormComponent = spectator.query(BaseNamespaceFormComponent);
      baseFormComponent.submitted.emit(updatedNamespaceData);

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.namespace.update', [2, {
        ...updatedNamespaceData,
        subsys_id: 42,
      }]);

      expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({
        response: updatedNamespaceData,
        error: null,
      });

      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    });
  });
});
