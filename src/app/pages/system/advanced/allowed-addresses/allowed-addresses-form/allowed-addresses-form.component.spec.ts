import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import {
  createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { AllowedAddressesFormComponent } from 'app/pages/system/advanced/allowed-addresses/allowed-addresses-form/allowed-addresses-form.component';

describe('AllowedAddressesComponent', () => {
  let spectator: Spectator<AllowedAddressesFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;
  const componentRef: SlideInRef<unknown, unknown> = {
    close: jest.fn(),
    getData: jest.fn(),
    requireConfirmationWhen: jest.fn(),
  };
  const createComponent = createComponentFactory({
    component: AllowedAddressesFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('system.general.update'),
        mockCall('system.general.ui_restart'),
        mockCall('system.general.config', {
          ui_allowlist: ['1.1.1.1/32'],
        } as SystemGeneralConfig),
      ]),
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
        components$: of([]),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideInRef, componentRef),
      provideMockStore(),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  it('shows allowed addresses when editing a form', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(values).toEqual({ 'IP Address/Subnet': '1.1.1.1/32' });
  });

  it('sends an update payload with specific IP address', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({ 'IP Address/Subnet': '2.2.2.2' });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(api.call).toHaveBeenCalledWith('system.general.update', [
      { ui_allowlist: ['2.2.2.2'] },
    ]);
  });

  it('sends an update payload with an IP address and a subnet mask', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({ 'IP Address/Subnet': '192.168.1.0/24' });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(api.call).toHaveBeenCalledWith('system.general.update', [
      { ui_allowlist: ['192.168.1.0/24'] },
    ]);
  });
});
