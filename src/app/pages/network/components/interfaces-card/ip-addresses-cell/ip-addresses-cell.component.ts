import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
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
    const addresses = new Set<string>([]);
    let aliasesToProcess: NetworkInterfaceAlias[] = row.aliases;

    if (row.ipv4_dhcp || row.ipv6_auto) {
      aliasesToProcess = [...aliasesToProcess, ...row.state.aliases];
    }

    if (row.hasOwnProperty('failover_aliases')) {
      aliasesToProcess = [...aliasesToProcess, ...row.failover_aliases];
    }

    aliasesToProcess.forEach((alias) => {
      // TODO: See if checks can be removed or replace with enum.
      if (!alias.type.startsWith('INET')) {
        return;
      }

      addresses.add(this.aliasToAddress(alias));
    });

    return Array.from(addresses);
  }

  private aliasToAddress(alias: NetworkInterfaceAlias): string {
    return `${alias.address}/${alias.netmask}`;
  }
}
