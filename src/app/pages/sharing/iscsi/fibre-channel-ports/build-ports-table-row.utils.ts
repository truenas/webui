import { keyBy } from 'lodash-es';
import {
  FibreChannelHost,
  FibreChannelPort,
  FibreChannelStatus,
  FibreChannelTarget,
} from 'app/interfaces/fibre-channel.interface';

export interface FibreChannelPortRow {
  name: string;
  target: FibreChannelTarget | undefined;
  wwpn: string | undefined;
  wwpn_b: string | undefined;
  aPortState: string;
  bPortState: string;
  host: FibreChannelHost | undefined;
  isPhysical: boolean;
}

export function buildPortsTableRow(
  hosts: FibreChannelHost[],
  ports: FibreChannelPort[],
  statuses: FibreChannelStatus[],
): FibreChannelPortRow[] {
  const indexedPorts = keyBy(ports, 'port');
  const indexedStatuses = keyBy(statuses, 'port');

  const rows: FibreChannelPortRow[] = [];
  hosts.forEach((host) => {
    rows.push({
      name: host.alias,
      target: indexedPorts[host.alias]?.target,
      // A physical port only has an `fcport` record once it is mapped to a target, so fall back to
      // the host's own WWPNs. Resolved here rather than in the template so the value the user sees
      // is also the value the table searches and sorts by.
      wwpn: indexedPorts[host.alias]?.wwpn || host.wwpn || undefined,
      wwpn_b: indexedPorts[host.alias]?.wwpn_b || host.wwpn_b || undefined,
      aPortState: indexedStatuses[host.alias]?.A?.port_state,
      bPortState: indexedStatuses[host.alias]?.B?.port_state,
      isPhysical: true,
      host,
    });

    for (let i = 1; i <= host.npiv; i++) {
      const portName = `${host.alias}/${i}`;
      rows.push({
        name: portName,
        target: indexedPorts[portName]?.target,
        wwpn: indexedPorts[portName]?.wwpn || undefined,
        wwpn_b: indexedPorts[portName]?.wwpn_b || undefined,
        aPortState: indexedStatuses[portName]?.A?.port_state,
        bPortState: indexedStatuses[portName]?.B?.port_state,
        isPhysical: false,
        host: undefined,
      });
    }
  });

  return rows;
}
