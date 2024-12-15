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
      wwpn: indexedPorts[host.alias]?.wwpn,
      wwpn_b: indexedPorts[host.alias]?.wwpn_b,
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
        wwpn: indexedPorts[portName]?.wwpn,
        wwpn_b: indexedPorts[portName]?.wwpn_b,
        aPortState: indexedStatuses[portName]?.A?.port_state,
        bPortState: indexedStatuses[portName]?.B?.port_state,
        isPhysical: false,
        host: undefined,
      });
    }
  });

  return rows;
}
