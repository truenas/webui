import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatStepperHarness, MatStepperNextHarness } from '@angular/material/stepper/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
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
  AddSubsystemPortsComponent,
} from 'app/pages/sharing/nvme-of/add-subsystem/add-subsystem-ports/add-subsystem-ports.component';
import { AddSubsystemComponent } from 'app/pages/sharing/nvme-of/add-subsystem/add-subsystem.component';
import { NvmeOfService } from 'app/pages/sharing/nvme-of/services/nvme-of.service';

describe('AddSubsystemComponent', () => {
  let spectator: Spectator<AddSubsystemComponent>;
  let loader: HarnessLoader;
  let stepper: MatStepperHarness;
  const newSubsystem = { id: 7 } as NvmeOfSubsystem;
  const createComponent = createComponentFactory({
    component: AddSubsystemComponent,
    imports: [
      MockComponents(
        AddSubsystemHostsComponent,
        AddSubsystemPortsComponent,
      ),
    ],
    providers: [
      mockProvider(NvmeOfService, {
        associatePorts: jest.fn(() => of(undefined)),
        associateHosts: jest.fn(() => of(undefined)),
      }),
      mockApi([
        mockCall('nvmet.subsys.create', newSubsystem),
      ]),
      mockProvider(SlideInRef, {
        close: jest.fn(),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    stepper = await loader.getHarness(MatStepperHarness);
  });

  it('creates a host', async () => {
    const firstStep = (await stepper.getSteps({ selected: true }))[0];
    const name = await firstStep.getHarness(IxInputHarness.with({ label: 'Subsystem Name' }));
    await name.setValue('subsystem1');

    const details = await firstStep.getHarness(DetailsTableHarness);
    await details.setValues({
      NQN: 'my-nqn',
    });

    const nextButton = await firstStep.getHarness(MatStepperNextHarness.with({ text: 'Next' }));
    await nextButton.click();

    const secondStep = (await stepper.getSteps({ selected: true }))[0];
    const allowAnyHost = await secondStep.getHarness(IxCheckboxHarness.with({ label: 'Allow any host to connect' }));
    await allowAnyHost.setValue(false);

    // Ports and hosts are set here
    const addPorts = spectator.query(AddSubsystemPortsComponent);
    (addPorts.portsControl as unknown as FormControl).setValue([
      { id: 100 } as NvmeOfPort,
    ]);

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
        ana: false,
      },
    ]);
    expect(spectator.inject(NvmeOfService).associatePorts).toHaveBeenCalledWith(newSubsystem, [{ id: 100 }]);
    expect(spectator.inject(NvmeOfService).associateHosts).toHaveBeenCalledWith(newSubsystem, [{ id: 200 }]);
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({
      response: newSubsystem,
      error: null,
    });
  });
});
