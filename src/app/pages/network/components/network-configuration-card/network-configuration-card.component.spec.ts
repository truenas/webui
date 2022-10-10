import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { byText, createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { NetworkActivityType } from 'app/enums/network-activity-type.enum';
import { NetworkConfiguration } from 'app/interfaces/network-configuration.interface';
import { NetworkSummary } from 'app/interfaces/network-summary.interface';
import { NetworkConfigurationComponent } from 'app/pages/network/components/configuration/configuration.component';
import { NetworkConfigurationCardComponent } from 'app/pages/network/components/network-configuration-card/network-configuration-card.component';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('NetworkConfigurationCardComponent', () => {
  let spectator: Spectator<NetworkConfigurationCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: NetworkConfigurationCardComponent,
    imports: [],
    providers: [
      mockWebsocket([
        mockCall('network.configuration.config', {
          hostname: 'truenas',
          domain: 'local',
          nameserver1: '8.8.8.8',
          nameserver2: '8.8.4.4',
          httpproxy: 'http://proxy.com',
          netwait_enabled: true,
          hosts: 'host1.com\nhost2.com',
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
        } as NetworkConfiguration),
        mockCall('network.general.summary', {
          default_routes: ['192.168.1.1', 'fe80::a00:27ff:fe09:c274'],
          nameservers: ['8.8.8.8', '8.8.4.4', '8.8.1.1'],
        } as NetworkSummary),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('loads network summary and config when component is initialized', () => {
    const ws = spectator.inject(WebSocketService);

    expect(ws.call).toHaveBeenCalledWith('network.general.summary');
    expect(ws.call).toHaveBeenCalledWith('network.configuration.config');
  });

  it('shows nameservers assigned via settings', () => {
    const nameserversSection = spectator.query(byText('Nameservers')).parentElement;
    const nameserverItems = nameserversSection.querySelectorAll('mat-list-item');

    expect(nameserverItems).toHaveLength(3);
    expect(nameserverItems[0]).toHaveText('Nameserver 1');
    expect(nameserverItems[0]).toHaveText('8.8.8.8');
    expect(nameserverItems[1]).toHaveText('Nameserver 2');
    expect(nameserverItems[1]).toHaveText('8.8.4.4');
  });

  it('separately shows nameservers obtained via DHCP and not settings', () => {
    const nameserversSection = spectator.query(byText('Nameservers')).parentElement;
    const nameserverItems = nameserversSection.querySelectorAll('mat-list-item');

    expect(nameserverItems).toHaveLength(3);
    expect(nameserverItems[2]).toHaveText('Nameserver (DHCP)');
    expect(nameserverItems[2]).toHaveText('8.8.1.1');
  });

  it('shows IPv4 addresses', () => {
    const ipv4Section = spectator.query(byText('IPv4:')).parentElement;
    const addresses = ipv4Section.querySelectorAll('li');

    expect(addresses.length).toBe(1);
    expect(addresses[0]).toHaveExactText('192.168.1.1');
  });

  it('shows IPv6 addresses', () => {
    const ipv4Section = spectator.query(byText('IPv6:')).parentElement;
    const addresses = ipv4Section.querySelectorAll('li');

    expect(addresses.length).toBe(1);
    expect(addresses[0]).toHaveExactText('fe80::a00:27ff:fe09:c274');
  });

  it('shows config details', () => {
    const detailsList = spectator.queryAll('.details-list li');
    const detailsItems = detailsList.reduce((items, element) => {
      const label = element.querySelector('.label').textContent;
      const value = element.querySelector('.value').textContent;
      items[label.trim()] = value.trim();
      return items;
    }, {} as Record<string, string>);

    expect(detailsItems).toMatchObject({
      'Additional Domains:': 'domain.cz',
      'Domain:': 'local',
      'HTTP Proxy:': 'http://proxy.com',
      'Hostname Database:': 'host1.com\nhost2.com',
      'Hostname:': 'truenas',
      'Netwait:': 'Enabled',
      'Outbound Network:': 'Allow usage, kmip, rsync, update',
      'Service Announcement:': 'mDNS, WS-DISCOVERY',
    });
  });

  it('opens settings form when Settings button is clicked', async () => {
    const ixSlideInService = spectator.inject(IxSlideInService);
    jest.spyOn(ixSlideInService, 'open').mockImplementation();

    const settingsButton = await loader.getHarness(MatButtonHarness.with({ text: 'Settings' }));
    await settingsButton.click();

    expect(ixSlideInService.open).toHaveBeenCalledWith(NetworkConfigurationComponent, { wide: true });
  });
});
