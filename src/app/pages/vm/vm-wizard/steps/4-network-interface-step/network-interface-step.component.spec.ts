import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnCheckboxHarness, TnFormFieldHarness, TnInputHarness, TnSelectHarness, TnStepperComponent,
} from '@truenas/ui-components';
import { provideTnFormFieldErrors } from 'app/core/providers/tn-form-field-errors.provider';
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
      // Mirrors main.ts: tn-form-field resolves validator messages through this app-wide resolver.
      provideTnFormFieldErrors(),
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

  // Middleware validates custom MACs as colon-separated only; the dash-separated form this
  // field used to accept saved fine and then failed at VM start.
  it('rejects a dash-separated MAC address with a message naming the expected format', async () => {
    const macAddress = await loader.getHarness(TnInputHarness.with({ selector: '[formControlName="nic_mac"]' }));
    await macAddress.setValue('10-66-6a-1f-f1-b1');

    const macField = await loader.getHarness(TnFormFieldHarness.with({ label: 'Mac Address' }));
    expect(await macField.getErrorMessage())
      .toBe('MAC address must be colon-separated, for example 00:a0:98:1b:2c:3d');
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
