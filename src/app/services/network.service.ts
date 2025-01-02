import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Choices } from 'app/interfaces/choices.interface';
import { Option } from 'app/interfaces/option.interface';
import { AllNetworkInterfacesUpdate } from 'app/interfaces/reporting.interface';
import { ApiService } from 'app/modules/websocket/api.service';

@Injectable({ providedIn: 'root' })
export class NetworkService {
  macRegex = /\b([0-9A-F]{2}[:-]){5}([0-9A-F]){2}\b/i;

  ipv4Regex = /^((25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})$/;
  ipv4CidrRegex = /^((25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})(\/(3[0-2]|[1-2][0-9]|[0-9]))$/;
  ipv4CidrOptionalRegex = /^((25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})(\/(3[0-2]|[1-2][0-9]|[0-9]))?$/;

  ipv6Regex = /^([0-9a-f]|:){1,4}(:([0-9a-f]{0,4})*){1,7}(:((25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1?[0-9]{1,2}))?$/i;
  ipv6CidrRegex = /^([0-9a-f]|:){1,4}(:([0-9a-f]{0,4})*){1,7}(:((25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1?[0-9]{1,2}))?(\/(12[0-8]|1[0-1][0-9]|[1-9][0-9]|[0-9]))$/i;
  ipv6CidrOptionalRegex = /^([0-9a-f]|:){1,4}(:([0-9a-f]{0,4})*){1,7}(:((25[0-5]|2[0-4][0-9]|1?[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1?[0-9]{1,2}))?(\/(12[0-8]|1[0-1][0-9]|[1-9][0-9]|[0-9]))?$/i;

  ipv4OrIpv6 = new RegExp('(' + this.ipv6Regex.source + ')|(' + this.ipv4Regex.source + ')');
  ipv4OrIpv6Cidr = new RegExp('(' + this.ipv6CidrRegex.source + ')|(' + this.ipv4CidrRegex.source + ')');
  ipv4OrIpv6CidrOptional = new RegExp('(' + this.ipv6CidrOptionalRegex.source + ')|(' + this.ipv4CidrOptionalRegex.source + ')');

  hostnameRegex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9])$/;

  constructor(protected api: ApiService) {}

  getVlanParentInterfaceChoices(): Observable<Choices> {
    return this.api.call('interface.vlan_parent_interface_choices');
  }

  getLaggPortsChoices(id?: string): Observable<Choices> {
    return this.api.call('interface.lag_ports_choices', id ? [id] : []);
  }

  getLaggProtocolChoices(): Observable<string[]> {
    return this.api.call('interface.lag_supported_protocols');
  }

  getBridgeMembersChoices(id?: string): Observable<Choices> {
    return this.api.call('interface.bridge_members_choices', id ? [id] : []);
  }

  getV4Netmasks(): Option[] {
    return Array(34).fill(0).map(
      (_, i) => {
        if (i === 0) {
          return { label: '---------', value: '' };
        }
        return { label: String(33 - i), value: String(33 - i) };
      },
    );
  }

  getV6PrefixLength(): Option[] {
    return Array(34).fill(0).map(
      (_, i) => {
        if (i === 0) {
          return { label: '---------', value: '' };
        }
        return { label: String((33 - i) * 4), value: String((33 - i) * 4) };
      },
    );
  }

  subscribeToInOutUpdates(): Observable<AllNetworkInterfacesUpdate> {
    return this.api.subscribe('reporting.realtime').pipe(
      map((event) => event.fields?.interfaces),
      filter(Boolean),
    );
  }
}
