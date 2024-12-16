import { FibreChannelHost, FibreChannelPort, FibreChannelStatus } from 'app/interfaces/fibre-channel.interface';
import { buildPortsTableRow } from 'app/pages/sharing/iscsi/fibre-channel-ports/build-ports-table-row.utils';

describe('buildPortsTableRow', () => {
  it('combines hosts, ports and statuses into table rows', () => {
    const hosts = [
      { alias: 'fc0', npiv: 2 },
      { alias: 'fc1', npiv: 1 },
    ] as FibreChannelHost[];

    const ports = [
      {
        port: 'fc0',
        wwpn: 'naa.220034800d75aec4',
        wwpn_b: 'naa.220034800d75aec5',
        target: {
          id: 1,
          iscsi_target_name: 'target1',
        },
      },
      {
        port: 'fc0/1',
        wwpn: 'naa.220034800d75aec8',
        wwpn_b: 'naa.220034800d75aec9',
        target: {
          id: 2,
          iscsi_target_name: 'target2',
        },
      },
      {
        port: 'fc1',
        wwpn: 'naa.220034800d75aec6',
        wwpn_b: 'naa.220034800d75aec7',
        target: {
          id: 2,
          iscsi_target_name: 'target2',
        },
      },
    ] as FibreChannelPort[];

    const statuses = [
      {
        port: 'fc0',
        A: {
          port_state: 'Online',
        },
        B: {
          port_state: 'Offline',
        },
      },
      {
        port: 'fc1',
        A: {
          port_state: 'Online',
        },
        B: {
          port_state: 'Online',
        },
      },
    ] as FibreChannelStatus[];

    const result = buildPortsTableRow(hosts, ports, statuses);

    expect(result).toEqual([
      {
        name: 'fc0',
        wwpn: 'naa.220034800d75aec4',
        wwpn_b: 'naa.220034800d75aec5',
        aPortState: 'Online',
        bPortState: 'Offline',
        target: {
          id: 1,
          iscsi_target_name: 'target1',
        },
        host: {
          alias: 'fc0',
          npiv: 2,
        },
        isPhysical: true,
      },
      {
        name: 'fc0/1',
        wwpn: 'naa.220034800d75aec8',
        wwpn_b: 'naa.220034800d75aec9',
        target: {
          id: 2,
          iscsi_target_name: 'target2',
        },
        aPortState: undefined,
        bPortState: undefined,
        isPhysical: false,
        host: undefined,
      },
      {
        name: 'fc0/2',
        host: undefined,
        target: undefined,
        aPortState: undefined,
        bPortState: undefined,
        isPhysical: false,
        wwpn: undefined,
        wwpn_b: undefined,
      },
      {
        name: 'fc1',
        wwpn: 'naa.220034800d75aec6',
        wwpn_b: 'naa.220034800d75aec7',
        target: {
          id: 2,
          iscsi_target_name: 'target2',
        },
        aPortState: 'Online',
        bPortState: 'Online',
        host: {
          alias: 'fc1',
          npiv: 1,
        },
        isPhysical: true,
      },
      {
        name: 'fc1/1',
        host: undefined,
        target: undefined,
        aPortState: undefined,
        bPortState: undefined,
        isPhysical: false,
        wwpn: undefined,
        wwpn_b: undefined,
      },
    ]);
  });
});
