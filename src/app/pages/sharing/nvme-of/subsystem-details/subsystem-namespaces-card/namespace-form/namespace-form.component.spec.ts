import { createComponentFactory, Spectator, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { firstValueFrom } from 'rxjs';
import { MiB } from 'app/constants/bytes.constant';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { NvmeOfNamespaceType } from 'app/enums/nvme-of.enum';
import { NvmeOfNamespace } from 'app/interfaces/nvme-of.interface';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
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

  const slideInGetData = jest.fn<NamespaceFormParams, []>(() => ({
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
      mockProvider(SlideInRef, {
        getData: slideInGetData,
        close: jest.fn(),
        requireConfirmationWhen: jest.fn(),
      }),
    ],
  });

  describe('creating a namespace', () => {
    beforeEach(() => {
      slideInGetData.mockReturnValue({ subsystemId: 42 });
      spectator = createComponent();
    });

    it('issues a create call with subsys_id and closes with the form changes', async () => {
      const newNamespaceData: NamespaceChanges = {
        device_path: '/mnt/tank/new-file',
        device_type: NvmeOfNamespaceType.File,
        filesize: 200 * MiB,
      };

      const result = spectator.component.handleSubmit(newNamespaceData);

      // Trigger the request and assert API call shape.
      await firstValueFrom(result.request$);

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.namespace.create', [{
        ...newNamespaceData,
        subsys_id: 42,
      }]);
      expect(result.successMessage).toBe('Namespace created.');
      expect(result.closeWith?.(null)).toEqual(newNamespaceData);
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

    it('issues an update call and closes with the form changes', async () => {
      const updatedNamespaceData: NamespaceChanges = {
        device_path: '/mnt/tank/updated-file',
        device_type: NvmeOfNamespaceType.File,
        filesize: 200 * MiB,
      };

      const result = spectator.component.handleSubmit(updatedNamespaceData);
      await firstValueFrom(result.request$);

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.namespace.update', [2, {
        ...updatedNamespaceData,
        subsys_id: 42,
      }]);
      expect(result.successMessage).toBe('Namespace updated.');
      expect(result.closeWith?.(null)).toEqual(updatedNamespaceData);
    });
  });
});
