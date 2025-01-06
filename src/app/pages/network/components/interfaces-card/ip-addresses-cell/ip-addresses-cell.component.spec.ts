import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { NetworkInterfaceAliasType } from 'app/enums/network-interface.enum';
import { NetworkInterface, NetworkInterfaceAlias } from 'app/interfaces/network-interface.interface';
import {
  IpAddressesCellComponent,
} from 'app/pages/network/components/interfaces-card/ip-addresses-cell/ip-addresses-cell.component';

describe('IpAddressesCellComponent', () => {
  let spectator: Spectator<IpAddressesCellComponent<NetworkInterface>>;
  const createComponent = createComponentFactory({
    component: IpAddressesCellComponent<NetworkInterface>,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows network interface aliases', () => {
    spectator.component.setRow({
      aliases: [
        { address: '77.23.44.2', netmask: 24, type: NetworkInterfaceAliasType.Inet },
        { address: '77.23.45.2', netmask: 24, type: NetworkInterfaceAliasType.Inet },
      ],
    } as NetworkInterface);
    spectator.detectComponentChanges();

    const addresses = spectator.queryAll('ul li');
    expect(addresses).toHaveLength(2);
    expect(addresses[0]).toHaveText('77.23.44.2/24');
    expect(addresses[1]).toHaveText('77.23.45.2/24');
  });

  it('shows NICs state aliases for interfaces with DHCP', () => {
    spectator.component.setRow({
      ipv4_dhcp: true,
      aliases: [] as NetworkInterfaceAlias[],
      state: {
        aliases: [
          { address: '56.23.44.2', netmask: 24, type: NetworkInterfaceAliasType.Inet },
          { address: '56.23.45.2', netmask: 24, type: NetworkInterfaceAliasType.Inet },
        ],
      },
    } as NetworkInterface);
    spectator.detectComponentChanges();

    const addresses = spectator.queryAll('ul li');
    expect(addresses).toHaveLength(2);
    expect(addresses[0]).toHaveText('56.23.44.2/24');
    expect(addresses[1]).toHaveText('56.23.45.2/24');
  });

  it('shows failover aliases', () => {
    spectator.component.setRow({
      aliases: [] as NetworkInterfaceAlias[],
      failover_aliases: [
        { address: '33.12.44.2', netmask: 24, type: NetworkInterfaceAliasType.Inet },
        { address: '33.12.45.2', netmask: 24, type: NetworkInterfaceAliasType.Inet },
      ],
    } as NetworkInterface);
    spectator.detectComponentChanges();

    const addresses = spectator.queryAll('ul li');
    expect(addresses).toHaveLength(2);
    expect(addresses[0]).toHaveText('33.12.44.2/24');
    expect(addresses[1]).toHaveText('33.12.45.2/24');
  });

  it('shows virtual addresses if any', () => {
    spectator.component.setRow({
      aliases: [] as NetworkInterfaceAlias[],
      failover_virtual_aliases: [
        { address: '33.10.44.2', netmask: 24, type: NetworkInterfaceAliasType.Inet },
        { address: '33.10.45.2', netmask: 24, type: NetworkInterfaceAliasType.Inet },
      ],
    } as NetworkInterface);
    spectator.detectComponentChanges();

    const addresses = spectator.queryAll('ul li');
    expect(addresses).toHaveLength(2);
    expect(addresses[0]).toHaveText('33.10.44.2/24 (VIP)');
    expect(addresses[1]).toHaveText('33.10.45.2/24 (VIP)');
  });
});
