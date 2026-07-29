import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnCheckboxHarness, TnInputHarness, TnRadioHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { NetworkActivityType } from 'app/enums/network-activity-type.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { NetworkConfiguration, NetworkConfigurationActivity } from 'app/interfaces/network-configuration.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { LanguageService } from 'app/modules/language/language.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { NetworkConfigurationComponent } from 'app/pages/system/network/components/network-configuration/network-configuration.component';
import { SystemGeneralService } from 'app/services/system-general.service';

describe('NetworkConfigurationComponent', () => {
  let spectator: Spectator<NetworkConfigurationComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

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
      mockProvider(FormErrorHandlerService),
      mockProvider(DialogService),
      mockProvider(Router),
      mockProvider(LanguageService),
      mockProvider(SystemGeneralService),
      provideMockStore({
        initialState: {
          systemInfo: {
            systemInfo: null,
            productType: ProductType.CommunityEdition,
            isIxHardware: false,
            buildYear: 2024,
          },
        },
      }),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  it('loads and shows current network global configuration when form is opened', async () => {
    const hostname = await loader.getHarness(TnInputHarness.with({ name: 'hostname' }));
    const domain = await loader.getHarness(TnInputHarness.with({ name: 'domain' }));
    const ipv4gateway = await loader.getHarness(TnInputHarness.with({ name: 'ipv4gateway' }));
    const netbios = await loader.getHarness(TnCheckboxHarness.with({ label: 'NetBIOS-NS' }));
    const mdns = await loader.getHarness(TnCheckboxHarness.with({ label: 'mDNS' }));
    const wsd = await loader.getHarness(TnCheckboxHarness.with({ label: 'WS-Discovery' }));
    const inheritDhcp = await loader.getHarness(TnCheckboxHarness.with({ label: 'Inherit domain from DHCP' }));
    const allowAllOption = await loader.getHarness(TnRadioHarness.with({ label: 'Allow All' }));

    expect(await hostname.getValue()).toBe('truenas');
    expect(await domain.getValue()).toBe('local');
    expect(await ipv4gateway.getValue()).toBe('192.168.30.2');
    expect(await netbios.isChecked()).toBe(false);
    expect(await mdns.isChecked()).toBe(true);
    expect(await wsd.isChecked()).toBe(true);
    expect(await inheritDhcp.isChecked()).toBe(false);
    expect(await allowAllOption.isChecked()).toBe(true);
  });

  it('shows outbound_network_value select when outbound_network_activity is changed', async () => {
    // The outbound_network_value select is the only tn-select in this form and is rendered
    // only for the "Allow/Deny Specific" activities, so its presence is asserted via harness count.
    expect(await loader.getAllHarnesses(TnSelectHarness)).toHaveLength(0);

    const allowSpecificOption = await loader.getHarness(TnRadioHarness.with({ label: 'Allow Specific' }));
    await allowSpecificOption.check();

    expect(await loader.getAllHarnesses(TnSelectHarness)).toHaveLength(1);
  });

  it('saves network global configuration when saved is pressed', async () => {
    const hostname = await loader.getHarness(TnInputHarness.with({ name: 'hostname' }));
    await hostname.setValue('truenas01');

    const netbios = await loader.getHarness(TnCheckboxHarness.with({ label: 'NetBIOS-NS' }));
    await netbios.check();

    // TnInputHarness.setValue('') throws on an empty value, so clear the gateway via the control.
    spectator.component.form.controls.ipv4gateway.setValue('');

    const allowSpecificOption = await loader.getHarness(TnRadioHarness.with({ label: 'Allow Specific' }));
    await allowSpecificOption.check();

    const services = await loader.getHarness(TnSelectHarness);
    await services.selectOption('Cloud sync');

    spectator.component.submit();

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
    const denyAllOption = await loader.getHarness(TnRadioHarness.with({ label: 'Deny All' }));
    await denyAllOption.check();

    spectator.component.submit();

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
