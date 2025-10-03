import { NetworkInterfaceType, NetworkInterfaceAliasType } from 'app/enums/network-interface.enum';
import {
  NetworkInterface,
  NetworkInterfaceAlias,
  NetworkInterfaceState,
} from 'app/interfaces/network-interface.interface';

/**
 * Extended network interface alias used by dashboard widgets.
 * Adds optional interface property to track which physical interface the alias belongs to.
 */
export interface DashboardNetworkInterfaceAlias extends NetworkInterfaceAlias {
  interface?: string;
}

/**
 * Extended network interface type used by dashboard widgets.
 */
export type DashboardNetworkInterface = NetworkInterface & {
  state: DashboardNicState;
};

/**
 * Extended network interface state used by dashboard widgets.
 * Includes aggregated information about VLANs, LAGG ports, and aliases.
 */
export interface DashboardNicState extends NetworkInterfaceState {
  vlans: (NetworkInterfaceState & { interface?: string })[];
  lagg_ports: string[];
  aliases: DashboardNetworkInterfaceAlias[];
}

/**
 * Processes network interfaces for dashboard display.
 * Aggregates VLANs and aliases under their parent interfaces (LAGG).
 *
 * TODO: Rewrite to have widgets pick what they need instead of doing global processing.
 */
export function processNetworkInterfaces(interfaces: NetworkInterface[]): DashboardNetworkInterface[] {
  const dashboardNetworkInterfaces = interfaces.map((iface) => ({
    ...iface,
    state: {
      ...iface.state,
      vlans: [],
      aliases: [...iface.state.aliases],
    } as DashboardNicState,
  })) as DashboardNetworkInterface[];
  const removeNics: Record<string, number | string> = {};

  const nicKeys: Record<string, number | string> = {};
  interfaces.forEach((networkInterface, index) => {
    nicKeys[networkInterface.name] = index.toString();

    if (networkInterface.type === NetworkInterfaceType.Vlan && networkInterface.state.parent) {
      const parentIndex = parseInt(nicKeys[networkInterface.state.parent] as string);
      dashboardNetworkInterfaces[parentIndex].state.vlans.push({
        ...networkInterface.state,
        interface: undefined,
      });
      removeNics[networkInterface.name] = index;
    }

    if (networkInterface.type === NetworkInterfaceType.LinkAggregation) {
      dashboardNetworkInterfaces[index].state = {
        ...dashboardNetworkInterfaces[index].state,
        lagg_ports: networkInterface.lag_ports,
      } as DashboardNicState;
      networkInterface.lag_ports
        .filter((nic) => Boolean(nicKeys[nic]))
        .forEach((nic) => {
          dashboardNetworkInterfaces[index].state.aliases = dashboardNetworkInterfaces[index].state.aliases.map(
            (alias) => ({ ...alias, interface: nic } as DashboardNetworkInterfaceAlias),
          );
          if (dashboardNetworkInterfaces[nicKeys[nic] as number]) {
            const concatenatedAliases = dashboardNetworkInterfaces[index].state.aliases.concat(
              dashboardNetworkInterfaces[nicKeys[nic] as number].state.aliases,
            );
            dashboardNetworkInterfaces[index].state.aliases = concatenatedAliases;
          }

          dashboardNetworkInterfaces[index].state.vlans = dashboardNetworkInterfaces[index].state.vlans.map(
            (vlan) => ({ ...vlan, interface: nic }),
          );
          dashboardNetworkInterfaces[index].state.vlans = dashboardNetworkInterfaces[index].state.vlans.concat(
            dashboardNetworkInterfaces[nicKeys[nic] as number].state.vlans,
          );

          removeNics[nic] = nicKeys[nic];
        });
    }
  });

  for (let i = dashboardNetworkInterfaces.length - 1; i >= 0; i--) {
    if (removeNics[dashboardNetworkInterfaces[i].name]) {
      dashboardNetworkInterfaces.splice(i, 1);
    } else {
      dashboardNetworkInterfaces[i].state.aliases = dashboardNetworkInterfaces[i].state.aliases.filter(
        (address) => {
          return address.type && [
            NetworkInterfaceAliasType.Inet,
            NetworkInterfaceAliasType.Inet6,
          ].includes(address.type);
        },
      );
    }
  }

  return dashboardNetworkInterfaces;
}

export function getNetworkInterface(
  interfaces: DashboardNetworkInterface[],
  interfaceId: string,
): DashboardNetworkInterface {
  if (!interfaceId) {
    return interfaces[0];
  }

  const networkInterface = interfaces?.find((nics) => nics.name === interfaceId);
  if (!networkInterface) {
    throw new Error(`Network interface ${interfaceId} not found.`);
  }

  return networkInterface;
}
