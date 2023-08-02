import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import _ from 'lodash';
import { NetworkInterface, NetworkInterfaceAlias } from 'app/interfaces/network-interface.interface';
import { ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';

@Component({
  selector: 'ix-ip-addresses-cell',
  templateUrl: './ip-addresses-cell.component.html',
  styleUrls: ['./ip-addresses-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IpAddressesCellComponent extends ColumnComponent<NetworkInterface> {
  protected addresses: string[] = [];

  setRow(row: NetworkInterface): void {
    this.addresses = this.extractAddresses(row);
  }

  extractAddresses(row: NetworkInterface): string[] {
    const addresses = this.aliasesToAddress(row.aliases);

    if (row.ipv4_dhcp || row.ipv6_auto) {
      addresses.push(...this.aliasesToAddress(row.state.aliases));
    }

    if (row.hasOwnProperty('failover_aliases')) {
      addresses.push(...this.aliasesToAddress(row.failover_aliases));
    }

    if (row.hasOwnProperty('failover_virtual_aliases')) {
      const virtualAddresses = row.failover_virtual_aliases.map((alias) => `${alias.address}/${alias.netmask} (VIP)`);
      addresses.push(...virtualAddresses);
    }

    return _.uniq(addresses);
  }

  private aliasesToAddress(aliases: NetworkInterfaceAlias[]): string[] {
    return aliases
      // TODO: See if checks can be removed or replace with enum.
      .filter((alias) => alias.type.startsWith('INET'))
      .map((alias) => `${alias.address}/${alias.netmask}`);
  }
}
