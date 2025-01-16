import { LinkState, NetworkInterfaceAliasType, NetworkInterfaceType } from 'app/enums/network-interface.enum';
import { NetworkInterface } from 'app/interfaces/network-interface.interface';
import { processNetworkInterfaces } from './widget-interface.utils';

describe('processNetworkInterfaces', () => {
  it('should process network interfaces correctly', () => {
    const interfaces = [
      {
        name: 'eno1',
        type: NetworkInterfaceType.Physical,
        state: {
          name: 'eno1',
          link_state: LinkState.Up,
          link_address: '3c:ec:ef:8d:5e:ba',
          aliases: [
            {
              type: 'LINK',
              address: '3c:ec:ef:8d:5e:ba',
            },
          ],
        },
      },
      {
        name: 'eno2',
        type: NetworkInterfaceType.Physical,
        state: {
          name: 'eno2',
          link_state: LinkState.Down,
          link_address: '3c:ec:ef:8d:5e:ba',
          aliases: [
            {
              type: NetworkInterfaceAliasType.Inet6,
              address: '3c:ec:ef:8d:5e:ba',
            },
          ],
        },
      },
      {
        name: 'ens11f0',
        type: NetworkInterfaceType.Physical,
        state: {
          name: 'ens11f0',
          link_state: 'LINK_STATE_DOWN',
          aliases: [
            {
              type: 'LINK',
              address: '8c:dc:d4:b5:38:bc',
            },
          ],
        },
      },
      {
        id: 'ens11f1',
        name: 'ens11f1',
        type: NetworkInterfaceType.Physical,
        state: {
          name: 'ens11f1',
          aliases: [
            {
              type: 'LINK',
              address: '8c:dc:d4:b5:38:bd',
            },
          ],
        },
      },
      {
        id: 'bond0',
        name: 'bond0',
        type: NetworkInterfaceType.LinkAggregation,
        state: {
          name: 'bond0',
          link_state: LinkState.Up,
          aliases: [
            {
              type: 'LINK',
              address: '3c:ec:ef:8d:5e:ba',
            },
          ],
          protocol: 'FAILOVER',
          ports: [
            {
              name: 'eno1',
              flags: [],
            },
            {
              name: 'eno2',
              flags: [],
            },
          ],
        },
        lag_ports: ['eno1', 'eno2', 'enp180s0f0', 'enp180s0f1'],
      },
      {
        id: 'br0',
        name: 'br0',
        type: NetworkInterfaceType.Bridge,
        state: {
          name: 'br0',
          link_state: LinkState.Up,
          aliases: [
            {
              type: 'INET',
              address: '10.0.0.2',
              netmask: 24,
              broadcast: '10.0.0.255',
            },
            {
              type: 'LINK',
              address: '2e:13:ce:95:71:6a',
            },
          ],
        },
        bridge_members: ['bond0'],
      } as NetworkInterface,
    ] as NetworkInterface[];

    expect(processNetworkInterfaces(interfaces)).toEqual([
      {
        name: 'ens11f0',
        state: {
          aliases: [],
          link_state: 'LINK_STATE_DOWN',
          name: 'ens11f0',
          vlans: [],
        },
        type: 'PHYSICAL',
      },
      {
        id: 'ens11f1',
        name: 'ens11f1',
        state: {
          aliases: [],
          name: 'ens11f1',
          vlans: [],
        },
        type: 'PHYSICAL',
      },
      {
        id: 'bond0',
        lag_ports: ['eno1', 'eno2', 'enp180s0f0', 'enp180s0f1'],
        name: 'bond0',
        state: {
          aliases: [{ address: '3c:ec:ef:8d:5e:ba', type: 'INET6' }],
          lagg_ports: ['eno1', 'eno2', 'enp180s0f0', 'enp180s0f1'],
          link_state: 'LINK_STATE_UP',
          name: 'bond0',
          ports: [
            { flags: [], name: 'eno1' },
            { flags: [], name: 'eno2' },
          ],
          protocol: 'FAILOVER',
          vlans: [],
        },
        type: 'LINK_AGGREGATION',
      },
      {
        bridge_members: ['bond0'],
        id: 'br0',
        name: 'br0',
        state: {
          aliases: [
            {
              address: '10.0.0.2',
              broadcast: '10.0.0.255',
              netmask: 24,
              type: 'INET',
            },
          ],
          link_state: 'LINK_STATE_UP',
          name: 'br0',
          vlans: [],
        },
        type: 'BRIDGE',
      },
    ]);
  });
});
