import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import {
  createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { CHAINED_COMPONENT_REF, SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { AllowedAddressesFormComponent } from 'app/pages/system/advanced/allowed-addresses/allowed-addresses-form/allowed-addresses-form.component';
import { DialogService } from 'app/services/dialog.service';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('AllowedAddressesComponent', () => {
  let spectator: Spectator<AllowedAddressesFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  const componentRef = { close: jest.fn() };
  const createComponent = createComponentFactory({
    component: AllowedAddressesFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebSocket([
        mockCall('system.general.update'),
        mockCall('system.general.ui_restart'),
        mockCall('system.general.config', {
          ui_allowlist: ['1.1.1.1/32'],
        } as SystemGeneralConfig),
      ]),
      mockProvider(IxChainedSlideInService, {
        pushComponent: jest.fn(() => of()),
        components$: of([]),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      { provide: CHAINED_COMPONENT_REF, useValue: componentRef },
      { provide: SLIDE_IN_DATA, useValue: undefined },
      provideMockStore(),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  it('shows allowed addresses when editing a form', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(values).toEqual({ 'IP Address': '1.1.1.1/32' });
  });

  it('sends an update payload to websocket and closes modal when save is pressed', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({ 'IP Address': '2.2.2.2' });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenCalledWith('system.general.update', [
      { ui_allowlist: ['2.2.2.2'] },
    ]);
  });
});
