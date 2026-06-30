import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness } from '@truenas/ui-components';
import { MockComponents } from 'ng-mocks';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { NvmeOfNamespaceType } from 'app/enums/nvme-of.enum';
import { NvmeOfHost, NvmeOfPort, NvmeOfSubsystem } from 'app/interfaces/nvme-of.interface';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  AddSubsystemHostsComponent,
} from 'app/pages/sharing/nvme-of/add-subsystem/add-subsystem-hosts/add-subsystem-hosts.component';
import {
  AddSubsystemNamespacesComponent,
} from 'app/pages/sharing/nvme-of/add-subsystem/add-subsystem-namespaces/add-subsystem-namespaces.component';
import {
  AddSubsystemPortsComponent,
} from 'app/pages/sharing/nvme-of/add-subsystem/add-subsystem-ports/add-subsystem-ports.component';
import { AddSubsystemComponent } from 'app/pages/sharing/nvme-of/add-subsystem/add-subsystem.component';
import { NamespaceChanges } from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/namespace-changes.interface';
import { NvmeOfService } from 'app/pages/sharing/nvme-of/services/nvme-of.service';

describe('AddSubsystemComponent', () => {
  let spectator: Spectator<AddSubsystemComponent>;
  let loader: HarnessLoader;
  const newSubsystem = { id: 7 } as NvmeOfSubsystem;
  const createComponent = createComponentFactory({
    component: AddSubsystemComponent,
    imports: [
      ReactiveFormsModule,
      MockComponents(
        AddSubsystemHostsComponent,
        AddSubsystemNamespacesComponent,
        AddSubsystemPortsComponent,
      ),
    ],
    providers: [
      mockProvider(NvmeOfService, {
        associatePorts: jest.fn(() => of(undefined)),
        associateHosts: jest.fn(() => of(undefined)),
      }),
      mockAuth(),
      mockApi([
        mockCall('nvmet.subsys.create', newSubsystem),
        mockCall('nvmet.namespace.create'),
      ]),
      mockProvider(SlideInRef, {
        close: jest.fn(),
        requireConfirmationWhen: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('creates a subsystem with ports, hosts, and namespaces', async () => {
    spectator.component.form.patchValue({
      name: 'subsystem1',
      subnqn: 'my-nqn',
      namespaces: [
        {
          device_path: '/dev/zvol/pool/zvol1',
          device_type: NvmeOfNamespaceType.Zvol,
        },
        {
          device_path: '/mnt/pool/file.img',
          device_type: NvmeOfNamespaceType.File,
        },
      ] as NamespaceChanges[],
      allowAnyHost: false,
      allowedHosts: [{ id: 200 } as NvmeOfHost],
      ports: [{ id: 100 } as NvmeOfPort],
    });
    spectator.detectChanges();

    const nextButton = await loader.getHarness(TnButtonHarness.with({ label: 'Next' }));
    await nextButton.click();
    spectator.detectChanges();

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.subsys.create', [
      {
        name: 'subsystem1',
        subnqn: 'my-nqn',
        allow_any_host: false,
      },
    ]);
    expect(spectator.inject(NvmeOfService).associatePorts).toHaveBeenCalledWith(newSubsystem, [{ id: 100 }]);
    expect(spectator.inject(NvmeOfService).associateHosts).toHaveBeenCalledWith(newSubsystem, [{ id: 200 }]);

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.namespace.create', [{
      subsys_id: 7,
      device_type: NvmeOfNamespaceType.Zvol,
      device_path: '/dev/zvol/pool/zvol1',
    }]);

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.namespace.create', [{
      subsys_id: 7,
      device_type: NvmeOfNamespaceType.File,
      device_path: '/mnt/pool/file.img',
    }]);

    expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({
      response: newSubsystem,
    });
  });
});
