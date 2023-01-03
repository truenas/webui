import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { SmartPowerMode } from 'app/enums/smart-power.mode';
import { SmartConfig } from 'app/interfaces/smart-test.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { DialogService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { ServiceSmartComponent } from './service-smart.component';

describe('ServiceSmartComponent', () => {
  let spectator: Spectator<ServiceSmartComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  const createComponent = createComponentFactory({
    component: ServiceSmartComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('smart.config', {
          interval: 30,
          powermode: SmartPowerMode.Never,
          critical: 10,
          difference: 20,
          informational: 35,
        } as SmartConfig),
        mockCall('smart.update'),
      ]),
      mockProvider(IxSlideInService),
      mockProvider(FormErrorHandlerService),
      mockProvider(DialogService),
      mockProvider(Router),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  it('shows current settings for SMART service when form is opened', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(ws.call).toHaveBeenCalledWith('smart.config');
    expect(values).toEqual({
      'Check Interval': '30',
      'Power Mode': 'Never',
      Difference: '20',
      Informational: '35',
      Critical: '10',
    });
  });

  it('sends an update payload to websocket when form is saved', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Check Interval': 60,
      'Power Mode': 'Sleep',
      Difference: 20,
      Informational: 90,
      Critical: 92,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenCalledWith('smart.update', [{
      interval: 60,
      powermode: SmartPowerMode.Sleep,
      difference: 20,
      informational: 90,
      critical: 92,
    }]);
  });
});
