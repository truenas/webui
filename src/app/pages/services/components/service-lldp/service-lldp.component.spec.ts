import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { LldpConfig } from 'app/interfaces/lldp-config.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { ServiceLldpComponent } from 'app/pages/services/components/service-lldp/service-lldp.component';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';

describe('ServiceLldpComponent', () => {
  let spectator: Spectator<ServiceLldpComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  const createComponent = createComponentFactory({
    component: ServiceLldpComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('lldp.config', {
          country: 'country_code1',
          intdesc: true,
          location: 'location1',
        } as LldpConfig),
        mockCall('lldp.country_choices', {
          country_code1: 'country name 1',
          country_code2: 'country name 2',
        }),
        mockCall('lldp.update'),
      ]),
      mockProvider(Router),
      mockProvider(ActivatedRoute),
      mockProvider(DialogService),
      mockProvider(FormErrorHandlerService),
      mockProvider(IxSlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  it('loads and shows current settings for LLDP service when form is opened', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(ws.call).toHaveBeenCalledWith('lldp.config');
    expect(values).toEqual({
      'Interface Description': true,
      Location: 'location1',
      'Country Code': 'country name 1',
    });
  });

  it('sends an update payload to websocket when basic form is filled and saved', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Interface Description': false,
      Location: 'location2',
      'Country Code': 'country name 2',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenCalledWith('lldp.update', [{
      country: 'country_code2',
      intdesc: false,
      location: 'location2',
    }]);
  });
});
