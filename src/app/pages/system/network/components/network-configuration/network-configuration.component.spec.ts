import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { NetworkActivityType } from 'app/enums/network-activity-type.enum';
import { NetworkConfiguration, NetworkConfigurationActivity } from 'app/interfaces/network-configuration.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxRadioGroupHarness } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.harness';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { LanguageService } from 'app/modules/language/language.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { NetworkConfigurationComponent } from 'app/pages/system/network/components/network-configuration/network-configuration.component';
import { SystemGeneralService } from 'app/services/system-general.service';

describe('NetworkConfigurationComponent', () => {
  let spectator: Spectator<NetworkConfigurationComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const slideInRef: SlideInRef<undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  const createComponent = createComponentFactory({
    component: NetworkConfigurationComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('network.configuration.activity_choices', [
          ['acme', 'ACME'],
          ['catalog', 'Catalog(s) information'],
          ['cloud_sync', 'Cloud sync'],
        ]),
        mockCall('network.configuration.config', {
          activity: {
            activities: [],
            type: NetworkActivityType.Deny,
          } as NetworkConfigurationActivity,
          domain: 'local',
          domains: [] as string[],
          hostname: 'truenas',
          hostname_local: 'truenas',
          hosts: [] as string[],
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
      mockProvider(SlideIn),
      mockProvider(FormErrorHandlerService),
      mockProvider(DialogService),
      mockProvider(Router),
      mockProvider(LanguageService),
      mockProvider(SystemGeneralService),
      mockProvider(SlideInRef, slideInRef),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
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
      Primary: '',
      Secondary: '',
      Tertiary: '',
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
      Primary: '',
      Secondary: '',
      Tertiary: '',
      'IPv4 Default Gateway': '',
      'IPv6 Default Gateway': '',
      'HTTP Proxy': '',
      'Host Name Database': [],
      'Outbound Activity': 'Allow Specific',
      Services: ['Cloud sync'],
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(api.call).toHaveBeenCalledWith(
      'network.configuration.update',
      [{
        activity: {
          activities: ['cloud_sync'],
          type: NetworkActivityType.Allow,
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

    expect(api.call).toHaveBeenCalledWith(
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
