import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { TestScheduler } from 'rxjs/testing';
import { getTestScheduler } from 'app/core/testing/utils/get-test-scheduler.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Direction } from 'app/enums/direction.enum';
import {
  LinkState, NetworkInterfaceAliasType, NetworkInterfaceFlag, NetworkInterfaceType,
} from 'app/enums/network-interface.enum';
import { TransferMode } from 'app/enums/transfer-mode.enum';
import { CloudSyncTask } from 'app/interfaces/cloud-sync-task.interface';
import { NetworkInterface } from 'app/interfaces/network-interface.interface';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';

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
        provider: 'GOOGLE_DRIVE',
        attributes: {
          client_id: '332449661223-vlssrel0bhuasutipj1fg2f6in378h1i.apps.googleusercontent.com',
          client_secret: 'LIbFkoKL693tA_RvVAMLCKF_',
          token: '{"access_token": "ya29.a0AXeO80TX4NMZhEBr4ngVY2P2_MUDJ44d4Xp9Ji6pEhGYXhemyg2lFT3Trx1sicb01oudoV2i-LEnDLq9pRyaev7S0YOBKk8tV9AnGyQMWMMVTbb9T1IT5Kbc2qCgfJvkruu0U5X2avkmuYhZsBapLah3hBRPCLu58dAPNd8oaCgYKAdkSARESFQHGX2MikOZoQgFoQyQ5c07k_y2SSw0175", "token_type": "Bearer", "refresh_token": "1//01aDLaKfIzvsxCgYIARAAGAESNwF-L9Irlc7iPbMQkboB1xwRxVcI6kMneM_LXpLDmqwgKJYAenQWwqtf0U6Fx0vuzqvFuaUl54Y", "expiry": "2025-02-09T12:56:01.111180+00:00"}',
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
      mockWebSocket([
        mockCall('interface.query', nics),
        mockCall('replication.query', []),
        mockCall('rsynctask.query', []),
        mockCall('cloudsync.query', cloudsyncTasks),
        mockCall('webui.main.dashboard.sys_info'),
        mockCall('app.query'),
        mockCall('pool.query'),
        mockCall('update.check_available'),
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
});
