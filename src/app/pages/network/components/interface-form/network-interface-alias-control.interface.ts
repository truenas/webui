import ipRegex from 'ip-regex';
import { NetworkInterfaceAliasType } from 'app/enums/network-interface.enum';
import { NetworkInterface, NetworkInterfaceAlias } from 'app/interfaces/network-interface.interface';

export interface NetworkInterfaceFormAlias {
  address: string;
  failover_address: string;
  failover_virtual_address: string;
}

export function interfaceAliasesToFormAliases(networkInterface: NetworkInterface): NetworkInterfaceFormAlias[] {
  return networkInterface.aliases.map((alias, i) => {
    const failoverAlias = networkInterface.failover_aliases?.[i];
    const failoverVirtualAlias = networkInterface.failover_virtual_aliases?.[i];

    return {
      address: `${alias.address}/${alias.netmask}`,
      failover_address: failoverAlias?.address,
      failover_virtual_address: failoverVirtualAlias?.address,
    };
  });
}

export function formAliasesToInterfaceAliases(
  formAliases: NetworkInterfaceFormAlias[],
): {
    aliases: NetworkInterfaceAlias[];
    failover_aliases: NetworkInterfaceAlias[];
    failover_virtual_aliases: NetworkInterfaceAlias[];
  } {
  const aliases: NetworkInterfaceAlias[] = [];
  const failoverAliases: { address: string }[] = [];
  const failoverVirtualAliases: { address: string }[] = [];

  formAliases.forEach((alias) => {
    const [address, netmask] = alias.address.split('/');
    aliases.push({
      address,
      type: ipRegex.v6().test(address) ? NetworkInterfaceAliasType.Inet6 : NetworkInterfaceAliasType.Inet,
      netmask: parseInt(netmask, 10),
    });

    if (alias.failover_address) {
      failoverAliases.push({
        address: alias.failover_address,
      });
    }

    if (alias.failover_virtual_address) {
      failoverVirtualAliases.push({
        address: alias.failover_virtual_address,
      });
    }
  });

  return {
    aliases,
    failover_aliases: failoverAliases,
    failover_virtual_aliases: failoverVirtualAliases,
  };
}
