import { Injectable } from '@angular/core';
import * as isCidr from 'is-cidr';
import { Observable } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';
import { WebSocketService } from './ws.service';

@Injectable({ providedIn: 'root' })
export class NetworkService {
  ipv4_regex = /^((25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})$/;
  ipv4_cidr_regex = /^((25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})(\/(3[0-2]|[1-2][0-9]|[0-9]))$/;
  ipv4_cidr_optional_regex = /^((25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})(\/(3[0-2]|[1-2][0-9]|[0-9]))?$/;

  ipv6_regex = /^([0-9a-f]|:){1,4}(:([0-9a-f]{0,4})*){1,7}(:((25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1?[0-9]{1,2}))?$/i;
  ipv6_cidr_regex = /^([0-9a-f]|:){1,4}(:([0-9a-f]{0,4})*){1,7}(:((25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1?[0-9]{1,2}))?(\/(12[0-8]|1[0-1][0-9]|[1-9][0-9]|[0-9]))$/i;
  ipv6_cidr_optional_regex = /^([0-9a-f]|:){1,4}(:([0-9a-f]{0,4})*){1,7}(:((25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1?[0-9]{1,2}))?(\/(12[0-8]|1[0-1][0-9]|[1-9][0-9]|[0-9]))?$/i;

  ipv4_or_ipv6 = new RegExp('(' + this.ipv6_regex.source + ')|(' + this.ipv4_regex.source + ')');
  ipv4_or_ipv6_cidr = new RegExp('(' + this.ipv6_cidr_regex.source + ')|(' + this.ipv4_cidr_regex.source + ')');
  ipv4_or_ipv6_cidr_optional = new RegExp('(' + this.ipv6_cidr_optional_regex.source + ')|(' + this.ipv4_cidr_optional_regex.source + ')');
  ipv4_or_ipv6_cidr_or_none = new RegExp('(' + this.ipv4_or_ipv6_cidr + ')?');

  hostname_regex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;

  constructor(protected ws: WebSocketService) {}

  getVlanParentInterfaceChoices(): Observable<any[]> {
    return this.ws.call('interface.vlan_parent_interface_choices');
  }

  getLaggPortsChoices(id: string = null): Observable<any[]> {
    return this.ws.call('interface.lag_ports_choices', [id]);
  }

  getLaggProtocolChoices(): Observable<any[]> {
    return this.ws.call('interface.lag_supported_protocols', []);
  }

  getBridgeMembersChoices(id: string = null): Observable<any[]> {
    return this.ws.call('interface.bridge_members_choices', [id]);
  }

  getVmNicChoices(): Observable<any[]> {
    return this.ws.call('vm.device.nic_attach_choices', []);
  }

  getV4Netmasks(): Option[] {
    return Array(33).fill(0).map(
      (x, i) => {
        if (i == 0) {
          return { label: '---------', value: '' };
        }
        return { label: String(33 - i), value: String(33 - i) };
      },
    );
  }

  getV6PrefixLength(): Option[] {
    return Array(34).fill(0).map(
      (x, i) => {
        if (i == 0) {
          return { label: '---------', value: '' };
        }
        return { label: String((33 - i) * 4), value: String((33 - i) * 4) };
      },
    );
  }

  authNetworkValidator(str: string): boolean {
    if (isCidr.v4(str) || isCidr.v6(str)) {
      return true;
    }
    return false;
  }
}
