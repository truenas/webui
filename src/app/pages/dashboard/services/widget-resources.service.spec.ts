import {
  createServiceFactory,
  SpectatorService,
} from '@ngneat/spectator/jest';
import { firstValueFrom } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getTestScheduler } from 'app/core/testing/utils/get-test-scheduler.utils';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { CloudSyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { Direction } from 'app/enums/direction.enum';
import {
  LinkState, NetworkInterfaceAliasType, NetworkInterfaceFlag, NetworkInterfaceType,
} from 'app/enums/network-interface.enum';
import { TransferMode } from 'app/enums/transfer-mode.enum';
import { App } from 'app/interfaces/app.interface';
import { CloudSyncTask } from 'app/interfaces/cloud-sync-task.interface';
import { NetworkInterface } from 'app/interfaces/network-interface.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';

const pools = [
  { id: 1, name: 'pool_1' },
  { id: 2, name: 'pool_2' },
] as Pool[];

const apps = [
  { id: '1', name: 'app_1' },
  { id: '2', name: 'app_2' },
] as App[];

const interfaceEth0 = {
  name: 'interface',
  identifier: 'eth0',
  legend: ['time', 'received', 'sent'],
  start: 1735281261,
  end: 1735281265,
  data: [
    [1740117920, 2.2, 0.5],
    [1740117921, 2.3, 1.2],
    [1740117922, 2.4, 1.1],
  ],
  aggregations: { min: [0], mean: [5], max: [10] },
};

describe('WidgetResourcesService', () => {
  let spectator: SpectatorService<WidgetResourcesService>;
  let testScheduler: TestScheduler;

  const nics: NetworkInterface[] = [
    {
      id: 'ens1',
      name: 'ens1',
      fake: false,
      type: NetworkInterfaceType.Physical,
      state: {
        name: 'ens1',
        orig_name: 'ens1',
        description: 'ens1',
        mtu: 1500,
        cloned: false,
        flags: [
          NetworkInterfaceFlag.Broadcast,
          NetworkInterfaceFlag.Multicast,
          NetworkInterfaceFlag.Up,
          NetworkInterfaceFlag.Running,
          NetworkInterfaceFlag.LowerUp,
        ],
        nd6_flags: [
          'HOMEADDRESS',
        ],
        capabilities: [
          'tx-scatter-gather',
          'tx-checksum-ipv4',
          'tx-vlan-hw-insert',
          'rx-vlan-hw-parse',
          'tx-generic-segmentation',
          'rx-gro',
          'tx-tcp-segmentation',
          'rx-checksum',
        ],
        link_state: LinkState.Up,
        media_type: 'Ethernet',
        media_subtype: 'autoselect',
        active_media_type: 'Ethernet',
        active_media_subtype: '100Mb/s MII',
        supported_media: [
          '10baseT/Half',
          '10baseT/Full',
          '100baseT/Half',
          '100baseT/Full',
        ],
        media_options: null,
        link_address: '52:54:00:2c:4d:f9',
        aliases: [
          {
            type: NetworkInterfaceAliasType.Inet,
            address: '10.220.38.162',
            netmask: 22,
            broadcast: '10.220.39.255',
          },
          {
            type: NetworkInterfaceAliasType.Inet,
            address: '10.220.39.70',
            netmask: 32,
            broadcast: '10.220.39.70',
          },
          {
            type: NetworkInterfaceAliasType.Inet6,
            address: 'fe80::5054:ff:fe2c:4df9',
            netmask: 64,
            broadcast: 'fe80::ffff:ffff:ffff:ffff',
          },
          {
            type: NetworkInterfaceAliasType.Link,
            address: '52:54:00:2c:4d:f9',
          },
        ],
        vrrp_config: [
          {
            address: '10.220.39.70',
            state: 'MASTER',
          },
        ],
      },
      aliases: [
        {
          type: NetworkInterfaceAliasType.Inet,
          address: '10.220.38.162',
          netmask: 22,
        },
      ],
      ipv4_dhcp: false,
      ipv6_auto: false,
      description: '',
      mtu: null,
      failover_critical: true,
      failover_vhid: null,
      failover_group: 1,
      failover_aliases: [
        {
          type: NetworkInterfaceAliasType.Inet,
          address: '10.220.38.236',
          netmask: 22,
        },
      ],
      failover_virtual_aliases: [
        {
          type: NetworkInterfaceAliasType.Inet,
          address: '10.220.39.70',
          netmask: 32,
        },
      ],
    },
  ] as unknown as NetworkInterface[];

  const cloudsyncTasks: CloudSyncTask[] = [
    {
      id: 1,
      description: 'test',
      path: '/mnt/dozer',
      attributes: {
        folder: '/Folder1',
        fast_list: false,
        acknowledge_abuse: false,
      },
      pre_script: '',
      post_script: '',
      snapshot: false,
      include: [],
      exclude: [],
      args: '',
      enabled: true,
      job: null,
      direction: Direction.Pull,
      transfer_mode: TransferMode.Copy,
      bwlimit: [],
      transfers: 4,
      encryption: false,
      filename_encryption: false,
      encryption_password: '',
      encryption_salt: '',
      create_empty_src_dirs: false,
      follow_symlinks: false,
      credentials: {
        id: 2,
        name: 'Google Drive',
        provider: {
          type: CloudSyncProviderName.GoogleDrive,
          client_id: 'client_id',
          client_secret: 'secret',
          token: 'token',
          team_drive: '',
        },
      },
      schedule: {
        minute: '0',
        hour: '0',
        dom: '*',
        month: '*',
        dow: '*',
      },
      locked: false,
    },
  ];

  const createService = createServiceFactory({
    service: WidgetResourcesService,
    providers: [
      mockApi([
        mockCall('interface.query', nics),
        mockCall('replication.query', []),
        mockCall('rsynctask.query', []),
        mockCall('cloudsync.query', cloudsyncTasks),
        mockCall('webui.main.dashboard.sys_info'),
        mockCall('app.query', apps),
        mockCall('pool.query', pools),
        mockCall('update.check_available'),
        mockCall('reporting.netdata_get_data', [interfaceEth0]),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    testScheduler = getTestScheduler();
  });

  it('emits backup tasks when getBackups is called', () => {
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.getBackups()).toBe('a', {
        a: [[], [], cloudsyncTasks],
      });
    });
  });

  it('emits nics when getNetworkInterfaces is called', () => {
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.getNetworkInterfaces()).toBe('a', {
        a: {
          isLoading: false,
          value: nics,
        },
      });
    });
  });

  it('returns pools', async () => {
    expect(await firstValueFrom(spectator.service.pools$)).toEqual(pools);
  });

  it('returns apps', async () => {
    expect(await firstValueFrom(spectator.service.installedApps$)).toEqual(apps);
  });

  describe('networkInterfaceLastHourStats', () => {
    it('returns network interface stats for the last hour', async () => {
      expect(
        await firstValueFrom(spectator.service.networkInterfaceLastHourStats('eth0')),
      ).toEqual([interfaceEth0]);
    });
  });
});
