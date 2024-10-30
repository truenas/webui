import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { NetworkActivityType } from 'app/enums/network-activity-type.enum';
import { NetworkConfiguration } from 'app/interfaces/network-configuration.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxRadioGroupHarness } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.harness';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { NetworkConfigurationComponent } from 'app/pages/network/components/configuration/configuration.component';
import { LanguageService } from 'app/services/language.service';
import { SlideInService } from 'app/services/slide-in.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketService } from 'app/services/ws.service';

describe('NetworkConfigurationComponent', () => {
  let spectator: Spectator<NetworkConfigurationComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  const createComponent = createComponentFactory({
    component: NetworkConfigurationComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockWebSocket([
        mockCall('network.configuration.activity_choices', [
          ['acme', 'ACME'],
          ['catalog', 'Catalog(s) information'],
          ['cloud_sync', 'Cloud sync'],
        ]),
        mockCall('network.configuration.config', {
          activity: {
            activities: [],
            type: NetworkActivityType.Deny,
          },
          domain: 'local',
          domains: [],
          hostname: 'truenas',
          hostname_local: 'truenas',
          hosts: [],
          httpproxy: '',
          id: 1,
          ipv4gateway: '',
          ipv6gateway: '',
          nameserver1: '',
          nameserver2: '',
          nameserver3: '',
          service_announcement: {
            mdns: true,
            netbios: false,
            wsd: true,
          },
          state: {
            ipv4gateway: '192.168.30.2',
            ipv6gateway: '',
            nameserver1: '',
            nameserver2: '',
            nameserver3: '',
          },
        } as NetworkConfiguration),
        mockCall('network.configuration.update'),
      ]),
      mockProvider(SlideInService),
      mockProvider(FormErrorHandlerService),
      mockProvider(DialogService),
      mockProvider(Router),
      mockProvider(LanguageService),
      mockProvider(SystemGeneralService),
      mockProvider(SlideInRef),
      mockAuth(),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  it('loads and shows current network global configuration when form is opened', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(values).toEqual({
      Hostname: 'truenas',
      Domain: 'local',
      'Additional Domains': [],
      'NetBIOS-NS': false,
      mDNS: true,
      'WS-Discovery': true,
      'Nameserver 1': '',
      'Nameserver 2': '',
      'Nameserver 3': '',
      'IPv4 Default Gateway': '192.168.30.2',
      'IPv6 Default Gateway': '',
      'Inherit domain from DHCP': false,
      'Outbound Activity': 'Allow All',
      'HTTP Proxy': '',
      'Host Name Database': [],
    });
  });

  it('shows outbound_network_value select when outbound_network_activity is changed', async () => {
    const radioGroup = await loader.getHarness(IxRadioGroupHarness);
    await radioGroup.setValue('Allow Specific');

    expect(spectator.query('.outbound-network-value')).toBeVisible();
  });

  it('saves network global configuration when saved is pressed', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Hostname: 'truenas01',
      Domain: 'local',
      'Additional Domains': [],
      'NetBIOS-NS': true,
      mDNS: true,
      'WS-Discovery': true,
      'Nameserver 1': '',
      'Nameserver 2': '',
      'Nameserver 3': '',
      'IPv4 Default Gateway': '',
      'IPv6 Default Gateway': '',
      'HTTP Proxy': '',
      'Host Name Database': [],
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenCalledWith(
      'network.configuration.update',
      [{
        activity: {
          activities: [],
          type: NetworkActivityType.Deny,
        },
        domain: 'local',
        domains: [],
        hostname: 'truenas01',
        hostname_b: undefined,
        hostname_virtual: undefined,
        hosts: [],
        httpproxy: '',
        ipv4gateway: '',
        ipv6gateway: '',
        nameserver1: '',
        nameserver2: '',
        nameserver3: '',
        service_announcement: {
          mdns: true,
          netbios: true,
          wsd: true,
        },
      }],
    );
  });

  it('saves activity as ALLOW with activities = [] when "Deny All" is selected', async () => {
    const outboundRadioGroup = await loader.getHarness(IxRadioGroupHarness.with({ selector: '.outbound-network-radio' }));
    await outboundRadioGroup.setValue('Deny All');

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenCalledWith(
      'network.configuration.update',
      [
        expect.objectContaining({
          activity: {
            activities: [],
            type: NetworkActivityType.Allow,
          },
        }),
      ],
    );
  });
});
