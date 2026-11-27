import { Injectable, inject } from '@angular/core';
import { ValidationError } from '@angular/forms/signals';
import { TranslateService } from '@ngx-translate/core';
import { NetworkInterfaceType } from 'app/enums/network-interface.enum';

@Injectable()
export class InterfaceNameValidatorService {
  private translate = inject(TranslateService);

  /** A bridge, LAG or VLAN name must be its type's prefix followed by a number (`br0`, `bond1`, `vlan10`). */
  validate(type: NetworkInterfaceType | null, name: string): ValidationError | null {
    const prefix = this.getNamePrefix(type);
    if (!name || !prefix || new RegExp(`^${prefix}\\d+$`).test(name)) {
      return null;
    }

    return { kind: 'pattern', message: this.getNameFormatMessage(type) };
  }

  getNameFormatMessage(type: NetworkInterfaceType): string {
    const prefix = this.getNamePrefix(type);
    let interfaceName = '';
    switch (type) {
      case NetworkInterfaceType.Bridge:
        interfaceName = this.translate.instant('Bridge interface');
        break;
      case NetworkInterfaceType.LinkAggregation:
        interfaceName = this.translate.instant('Link aggregation interface');
        break;
      case NetworkInterfaceType.Vlan:
        interfaceName = this.translate.instant('VLAN interface');
        break;
      default:
        console.error('Unsupported interface type', type);
    }

    return this.translate.instant(
      '{interfaceName} must start with "{prefix}" followed by a unique number',
      { prefix, interfaceName },
    );
  }

  getNamePrefix(type: NetworkInterfaceType | null): string {
    switch (type) {
      case NetworkInterfaceType.Bridge:
        return 'br';
      case NetworkInterfaceType.LinkAggregation:
        return 'bond';
      case NetworkInterfaceType.Vlan:
        return 'vlan';
      default:
        return '';
    }
  }
}
