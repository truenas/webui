import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import {
  byText, createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { NetworkActivityType } from 'app/enums/network-activity-type.enum';
import { NetworkConfiguration } from 'app/interfaces/network-configuration.interface';
import { NetworkSummary } from 'app/interfaces/network-summary.interface';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
import { NetworkConfigurationComponent } from 'app/pages/system/network/components/network-configuration/network-configuration.component';
import { NetworkConfigurationCardComponent } from 'app/pages/system/network/components/network-configuration-card/network-configuration-card.component';

describe('NetworkConfigurationCardComponent', () => {
  let spectator: Spectator<NetworkConfigurationCardComponent>;
  let loader: HarnessLoader;
  const configuration = {
    hostname: 'truenas',
    domain: 'local',
    nameserver1: '8.8.8.8',
    nameserver2: '8.8.4.4',
    httpproxy: 'http://proxy.com',
    hosts: ['host1.com', 'host2.com'],
    domains: ['domain.cz'],
    service_announcement: {
      mdns: true,
      wsd: true,
      netbios: false,
    },
    activity: {
      type: NetworkActivityType.Allow,
      activities: ['usage', 'kmip', 'rsync', 'update'],
    },
    hostname_local: 'truenas',
  } as NetworkConfiguration;

  const createComponent = createComponentFactory({
    component: NetworkConfigurationCardComponent,
    imports: [
      CastPipe,
    ],
    providers: [
      mockApi([
        mockCall('network.configuration.config', configuration),
        mockCall('network.general.summary', {
          default_routes: ['192.168.1.1', 'fe80::a00:27ff:fe09:c274'],
          nameservers: ['8.8.8.8', '8.8.4.4', '8.8.1.1'],
        } as NetworkSummary),
      ]),
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('loads network summary and config when component is initialized', () => {
    const api = spectator.inject(ApiService);

    expect(api.call).toHaveBeenCalledWith('network.general.summary');
    expect(api.call).toHaveBeenCalledWith('network.configuration.config');
  });

  it('shows nameservers assigned via settings', () => {
    const dnsServersSection = spectator.query(byText('DNS Servers'))!.parentElement!;
    const dnsServerItems = dnsServersSection.querySelectorAll('mat-list-item');

    expect(dnsServerItems).toHaveLength(3);
    expect(dnsServerItems[0]).toHaveText('Primary');
    expect(dnsServerItems[0]).toHaveText('8.8.8.8');
    expect(dnsServerItems[1]).toHaveText('Secondary');
    expect(dnsServerItems[1]).toHaveText('8.8.4.4');
  });

  it('separately shows nameservers obtained via DHCP and not settings', () => {
    const dnsServersSection = spectator.query(byText('DNS Servers'))!.parentElement!;
    const dnsServerItems = dnsServersSection.querySelectorAll('mat-list-item');

    expect(dnsServerItems).toHaveLength(3);
    expect(dnsServerItems[2]).toHaveText('Nameserver (DHCP)');
    expect(dnsServerItems[2]).toHaveText('8.8.1.1');
  });

  it('shows IPv4 addresses', () => {
    const ipv4Section = spectator.query(byText('IPv4:'))!.parentElement!;
    const addresses = ipv4Section.querySelectorAll('li');

    expect(addresses).toHaveLength(1);
    expect(addresses[0]).toHaveExactText('192.168.1.1');
  });

  it('shows IPv6 addresses', () => {
    const ipv4Section = spectator.query(byText('IPv6:'))!.parentElement!;
    const addresses = ipv4Section.querySelectorAll('li');

    expect(addresses).toHaveLength(1);
    expect(addresses[0]).toHaveExactText('fe80::a00:27ff:fe09:c274');
  });

  it('shows config details', () => {
    const detailsList = spectator.queryAll('.details-list mat-list-item');

    const detailsItems = detailsList.reduce((items, element) => {
      const label = element.querySelector('.label')!.textContent!;
      const value = element.querySelector('.value')!.textContent!;
      items[label.trim()] = value.trim();
      return items;
    }, {} as Record<string, string>);

    expect(detailsItems).toMatchObject({
      'Additional Domains:': 'domain.cz',
      'Domain:': 'local',
      'HTTP Proxy:': 'http://proxy.com',
      'Hostname Database:': 'host1.com, host2.com',
      'Hostname:': 'truenas',
      'Outbound Network:': 'Only allow: usage, kmip, rsync, update',
      'Service Announcement:': 'mDNS, WS-DISCOVERY',
    });
  });

  it('correctly shows cases when only some outbound network activity is denied', () => {
    const mockedApi = spectator.inject(MockApiService);
    mockedApi.mockCall('network.configuration.config', {
      ...configuration,
      activity: {
        type: NetworkActivityType.Deny,
        activities: ['mail', 'kmip'],
      },
    } as NetworkConfiguration);

    spectator.component.ngOnInit();
    spectator.detectChanges();

    const outboundActivity = spectator.query(byText('Outbound Network:')).parentElement.querySelector('.value');
    expect(outboundActivity).toHaveText('Allow all except: mail, kmip');
  });

  it('opens settings form when Settings button is clicked', async () => {
    const slideInRef = spectator.inject(SlideIn);

    const settingsButton = await loader.getHarness(MatButtonHarness.with({ text: 'Settings' }));
    await settingsButton.click();

    expect(slideInRef.open).toHaveBeenCalledWith(NetworkConfigurationComponent, { wide: true });
  });
});
