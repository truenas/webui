import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DynamicDnsConfig } from 'app/interfaces/dynamic-dns.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { ServiceDynamicDnsComponent } from 'app/pages/services/components/service-dynamic-dns/service-dynamic-dns.component';
import { DialogService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('ServiceDynamicDnsComponent', () => {
  let spectator: Spectator<ServiceDynamicDnsComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  const createComponent = createRoutingFactory({
    component: ServiceDynamicDnsComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('dyndns.config', {
          provider: 'myip.com',
          checkip_ssl: true,
          checkip_server: 'checkip.com',
          checkip_path: '/path',
          ssl: true,
          domain: ['domain1.com', 'domain2.com'],
          period: 300,
          username: 'steve',
          password: 'rogers',
        } as DynamicDnsConfig),
        mockCall('dyndns.provider_choices', {
          'changeip.com': 'changeip.com',
          'myip.com': 'myip.com',
        }),
        mockCall('dyndns.update'),
      ]),
      mockProvider(IxSlideInService),
      mockProvider(FormErrorHandlerService),
      mockProvider(DialogService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  it('shows current settings for Dynamic DNS service when form is opened', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(ws.call).toHaveBeenCalledWith('dyndns.config');
    expect(values).toEqual({
      Provider: 'myip.com',
      'CheckIP Server SSL': true,
      'CheckIP Server': 'checkip.com',
      'CheckIP Path': '/path',
      SSL: true,
      'Domain Name': ['domain1.com', 'domain2.com'],
      'Update Period': '300',
      Username: 'steve',
      Password: 'rogers',
    });
  });

  it('sends an update payload to websocket when form is saved', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Provider: 'changeip.com',
      'CheckIP Server SSL': false,
      'CheckIP Server': 'new-checkip.com',
      'CheckIP Path': '/new-checkin-path',
      SSL: false,
      'Domain Name': ['new-domain1.com', 'new-domain2.com'],
      'Update Period': 400,
      Username: 'peter',
      Password: '12345678',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenCalledWith('dyndns.update', [{
      provider: 'changeip.com',
      checkip_ssl: false,
      checkip_server: 'new-checkip.com',
      checkip_path: '/new-checkin-path',
      ssl: false,
      domain: ['new-domain1.com', 'new-domain2.com'],
      period: 400,
      username: 'peter',
      password: '12345678',
    }]);
  });

  it('shows custom fields and saves them when provider is "custom"', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Provider: 'Custom Provider',
    });
    await form.fillForm({
      'Custom Server': 'custom-server.com',
      'Custom Path': '/custom-path',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenCalledWith('dyndns.update', [
      expect.objectContaining({
        provider: 'custom',
        custom_ddns_server: 'custom-server.com',
        custom_ddns_path: '/custom-path',
      }),
    ]);
  });
});
