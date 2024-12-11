import { CdkStepper } from '@angular/cdk/stepper';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { VmNicType } from 'app/enums/vm.enum';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import {
  NetworkInterfaceStepComponent,
} from 'app/pages/vm/vm-wizard/steps/4-network-interface-step/network-interface-step.component';
import { ApiService } from 'app/services/websocket/api.service';

describe('NetworkInterfaceStepComponent', () => {
  let spectator: Spectator<NetworkInterfaceStepComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: NetworkInterfaceStepComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(CdkStepper),
      mockApi([
        mockCall('vm.random_mac', '00:00:00:00:00:01'),
        mockCall('vm.device.nic_attach_choices', {
          eno1: 'eno1',
          eno2: 'eno2',
        }),
      ]),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  async function fillForm(): Promise<void> {
    await form.fillForm({
      'Adapter Type': 'VirtIO',
      'Mac Address': '00:00:00:00:00:AA',
      'Attach NIC': 'eno1',
      'Trust Guest Filters': true,
    });
  }

  it('shows form with fields related to NIC', async () => {
    await fillForm();

    expect(spectator.component.form.value).toEqual({
      nic_attach: 'eno1',
      nic_mac: '00:00:00:00:00:AA',
      nic_type: VmNicType.Virtio,
      trust_guest_rx_filters: true,
    });
  });

  it('returns field summary when getSummary() is called', async () => {
    await fillForm();

    expect(spectator.component.getSummary()).toEqual([
      {
        label: 'NIC',
        value: 'VirtIO (eno1)',
      },
    ]);
  });

  it('generates random MAC when form is initialized', async () => {
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('vm.random_mac');

    const macAddress = await form.getControl('Mac Address') as IxInputHarness;
    expect(await macAddress.getValue()).toBe('00:00:00:00:00:01');
  });
});
