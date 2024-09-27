import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
  inject,
} from '@angular/core';
import { uniq } from 'lodash-es';
import { NetworkInterfaceAliasType } from 'app/enums/network-interface.enum';
import { NetworkInterface, NetworkInterfaceAlias } from 'app/interfaces/network-interface.interface';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';

@Component({
  selector: 'ix-ip-addresses-cell',
  templateUrl: './ip-addresses-cell.component.html',
  styleUrls: ['./ip-addresses-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class IpAddressesCellComponent<T> extends ColumnComponent<T> {
  protected addresses: string[] = [];
  private readonly cdr = inject(ChangeDetectorRef);

  override setRow = (row: T): void => {
    this.row.set(row);
    this.addresses = this.extractAddresses(row as NetworkInterface);
    this.cdr.markForCheck();
  };

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

    return uniq(addresses);
  }

  private aliasesToAddress(aliases: NetworkInterfaceAlias[]): string[] {
    return aliases
      .filter((alias) => alias.type?.startsWith(NetworkInterfaceAliasType.Inet))
      .map((alias) => `${alias.address}/${alias.netmask}`);
  }
}

export function ipAddressesColumn<T>(
  options: Partial<IpAddressesCellComponent<T>>,
): Column<T, IpAddressesCellComponent<T>> {
  return { type: IpAddressesCellComponent, ...options };
}
