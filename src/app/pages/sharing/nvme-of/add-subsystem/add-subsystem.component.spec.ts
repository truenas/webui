import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatStepperHarness, MatStepperNextHarness } from '@angular/material/stepper/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { NvmeOfNamespaceType } from 'app/enums/nvme-of.enum';
import { NvmeOfHost, NvmeOfPort, NvmeOfSubsystem } from 'app/interfaces/nvme-of.interface';
import { DetailsTableHarness } from 'app/modules/details-table/details-table.harness';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
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
  let stepper: MatStepperHarness;
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
      }),
    ],
  });

  beforeEach(async () => {
    // Mock scrollIntoView since it's not available in test environment
    Element.prototype.scrollIntoView = jest.fn();

    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    stepper = await loader.getHarness(MatStepperHarness);
  });

  it('creates a subsystem with ports, hosts, and namespaces', async () => {
    const firstStep = (await stepper.getSteps({ selected: true }))[0];
    const name = await firstStep.getHarness(IxInputHarness.with({ label: 'Subsystem Name' }));
    await name.setValue('subsystem1');
    await spectator.fixture.whenStable();
    await spectator.fixture.whenRenderingDone();

    const details = await firstStep.getHarness(DetailsTableHarness);
    await details.setValues({
      NQN: 'my-nqn',
    });

    // Namespaces
    const addNamespaces = spectator.query(AddSubsystemNamespacesComponent);
    const namespaces = [
      {
        device_path: '/dev/zvol/pool/zvol1',
        device_type: NvmeOfNamespaceType.Zvol,
      },
      {
        device_path: '/mnt/pool/file.img',
        device_type: NvmeOfNamespaceType.File,
      },
    ] as NamespaceChanges[];
    (addNamespaces.namespacesControl as unknown as FormControl).setValue(namespaces);

    const nextButton = await firstStep.getHarness(MatStepperNextHarness.with({ text: 'Next' }));
    await nextButton.click();

    const secondStep = (await stepper.getSteps({ selected: true }))[0];

    // Ports, hosts
    const addPorts = spectator.query(AddSubsystemPortsComponent);
    (addPorts.portsControl as unknown as FormControl).setValue([
      { id: 100 } as NvmeOfPort,
    ]);

    const allowAnyHost = await secondStep.getHarness(IxCheckboxHarness.with({ label: 'Allow any host to connect' }));
    await allowAnyHost.setValue(false);

    const addHosts = spectator.query(AddSubsystemHostsComponent);
    (addHosts.hostsControl as unknown as FormControl).setValue([
      { id: 200 } as NvmeOfHost,
    ]);

    const saveButton = await secondStep.getHarness(MatButtonHarness.with({ text: 'Save' }));
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
