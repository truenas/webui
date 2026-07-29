import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnCheckboxHarness, TnInputHarness, TnSelectHarness, TnStepperComponent,
} from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { VmNicType } from 'app/enums/vm.enum';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  NetworkInterfaceStepComponent,
} from 'app/pages/vm/vm-wizard/steps/4-network-interface-step/network-interface-step.component';

describe('NetworkInterfaceStepComponent', () => {
  let spectator: Spectator<NetworkInterfaceStepComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: NetworkInterfaceStepComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(TnStepperComponent),
      mockApi([
        mockCall('vm.random_mac', '00:00:00:00:00:01'),
        mockCall('vm.device.nic_attach_choices', {
          BRIDGE: ['eno1'],
          MACVLAN: ['eno2'],
        }),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  async function fillForm(): Promise<void> {
    const nicType = await loader.getHarness(TnSelectHarness.with({ selector: '[formControlName="nic_type"]' }));
    await nicType.selectOption('VirtIO');

    const macAddress = await loader.getHarness(TnInputHarness.with({ selector: '[formControlName="nic_mac"]' }));
    await macAddress.setValue('00:00:00:00:00:AA');

    const nicAttach = await loader.getHarness(TnSelectHarness.with({ selector: '[formControlName="nic_attach"]' }));
    await nicAttach.selectOption('eno1');

    const trustGuestFilters = await loader.getHarness(
      TnCheckboxHarness.with({ selector: '[formControlName="trust_guest_rx_filters"]' }),
    );
    await trustGuestFilters.check();
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

    const macAddress = await loader.getHarness(TnInputHarness.with({ selector: '[formControlName="nic_mac"]' }));
    expect(await macAddress.getValue()).toBe('00:00:00:00:00:01');
  });
});
