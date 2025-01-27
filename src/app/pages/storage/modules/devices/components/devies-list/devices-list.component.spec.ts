import { ActivatedRoute } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { Choices } from 'app/interfaces/choices.interface';
import { DeviceNestedDataNode } from 'app/interfaces/device-nested-data-node.interface';
import { Disk } from 'app/interfaces/disk.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { NestedTreeNodeComponent } from 'app/modules/ix-tree/components/nested-tree-node/nested-tree-node.component';
import { TreeNodeComponent } from 'app/modules/ix-tree/components/tree-node/tree-node.component';
import { TreeViewComponent } from 'app/modules/ix-tree/components/tree-view/tree-view.component';
import { DevicesListComponent } from 'app/pages/storage/modules/devices/components/devies-list/devices-list.component';
import { TopologyItemNodeComponent } from 'app/pages/storage/modules/devices/components/topology-item-node/topology-item-node.component';
import { VDevGroupNodeComponent } from 'app/pages/storage/modules/devices/components/vdev-group-node/vdev-group-node.component';
import { DevicesStore } from 'app/pages/storage/modules/devices/stores/devices-store.service';

describe('DevicesListComponent', () => {
  let spectator: Spectator<DevicesListComponent>;

  const selectedNode = {
    name: '1fd55f60-2b6d-468c-aa24-ff1dc950eeba',
    type: 'DISK',
    path: '/dev/disk/by-partuuid/1fd55f60-2b6d-468c-aa24-ff1dc950eeba',
    guid: '14429755380210151979',
    status: 'ONLINE',
    stats: {
      timestamp: 184841853784,
      read_errors: 0,
      write_errors: 0,
      checksum_errors: 0,
      ops: [
        0,
        3,
        294,
        0,
        0,
        0,
        0,
      ],
      bytes: [
        0,
        24576,
        3178496,
        0,
        0,
        0,
        0,
      ],
      size: 0,
      allocated: 0,
      fragmentation: 0,
      self_healed: 0,
      configured_ashift: 12,
      logical_ashift: 9,
      physical_ashift: 9,
    },
    children: [],
    device: 'sdc1',
    disk: 'sdc',
    unavail_disk: null,
  } as DeviceNestedDataNode;

  const selectedBranch = [
    {
      children: [
        {
          name: 'mirror-0',
          type: 'MIRROR',
          path: null,
          guid: '6132369047780976350',
          status: 'ONLINE',
          stats: {
            timestamp: 15973008667777,
            read_errors: 0,
            write_errors: 0,
            checksum_errors: 0,
            ops: [
              0,
              6,
              589,
              0,
              0,
              0,
              0,
            ],
            bytes: [
              0,
              49152,
              6356992,
              0,
              0,
              0,
              0,
            ],
            size: 9663676416,
            allocated: 417792,
            fragmentation: 0,
            self_healed: 0,
            configured_ashift: 12,
            logical_ashift: 12,
            physical_ashift: 9,
          },
          children: [
            {
              name: '1fd55f60-2b6d-468c-aa24-ff1dc950eeba',
              type: 'DISK',
              path: '/dev/disk/by-partuuid/1fd55f60-2b6d-468c-aa24-ff1dc950eeba',
              guid: '14429755380210151979',
              status: 'ONLINE',
              stats: {
                timestamp: 15973008867522,
                read_errors: 0,
                write_errors: 0,
                checksum_errors: 0,
                ops: [
                  0,
                  3,
                  294,
                  0,
                  0,
                  0,
                  0,
                ],
                bytes: [
                  0,
                  24576,
                  3178496,
                  0,
                  0,
                  0,
                  0,
                ],
                size: 0,
                allocated: 0,
                fragmentation: 0,
                self_healed: 0,
                configured_ashift: 12,
                logical_ashift: 9,
                physical_ashift: 9,
              },
              children: [],
              device: 'sdc1',
              disk: 'sdc',
              unavail_disk: null,
            },
            {
              name: '8da43bd0-8452-469e-9253-52eaa7328000',
              type: 'DISK',
              path: '/dev/disk/by-partuuid/8da43bd0-8452-469e-9253-52eaa7328000',
              guid: '5850372793036506488',
              status: 'ONLINE',
              stats: {
                timestamp: 15973009010229,
                read_errors: 0,
                write_errors: 0,
                checksum_errors: 0,
                ops: [
                  0,
                  3,
                  295,
                  0,
                  0,
                  0,
                  0,
                ],
                bytes: [
                  0,
                  24576,
                  3178496,
                  0,
                  0,
                  0,
                  0,
                ],
                size: 0,
                allocated: 0,
                fragmentation: 0,
                self_healed: 0,
                configured_ashift: 12,
                logical_ashift: 9,
                physical_ashift: 9,
              },
              children: [],
              device: 'sdd1',
              disk: 'sdd',
              unavail_disk: null,
            },
          ],
          unavail_disk: null,
          isRoot: true,
        },
      ],
      group: 'Data VDEVs',
      guid: 'data',
    },
    {
      name: 'mirror-0',
      type: 'MIRROR',
      path: null,
      guid: '6132369047780976350',
      status: 'ONLINE',
      stats: {
        timestamp: 15973008667777,
        read_errors: 0,
        write_errors: 0,
        checksum_errors: 0,
        ops: [
          0,
          6,
          589,
          0,
          0,
          0,
          0,
        ],
        bytes: [
          0,
          49152,
          6356992,
          0,
          0,
          0,
          0,
        ],
        size: 9663676416,
        allocated: 417792,
        fragmentation: 0,
        self_healed: 0,
        configured_ashift: 12,
        logical_ashift: 12,
        physical_ashift: 9,
      },
      children: [
        {
          name: '1fd55f60-2b6d-468c-aa24-ff1dc950eeba',
          type: 'DISK',
          path: '/dev/disk/by-partuuid/1fd55f60-2b6d-468c-aa24-ff1dc950eeba',
          guid: '14429755380210151979',
          status: 'ONLINE',
          stats: {
            timestamp: 15973008867522,
            read_errors: 0,
            write_errors: 0,
            checksum_errors: 0,
            ops: [
              0,
              3,
              294,
              0,
              0,
              0,
              0,
            ],
            bytes: [
              0,
              24576,
              3178496,
              0,
              0,
              0,
              0,
            ],
            size: 0,
            allocated: 0,
            fragmentation: 0,
            self_healed: 0,
            configured_ashift: 12,
            logical_ashift: 9,
            physical_ashift: 9,
          },
          children: [],
          device: 'sdc1',
          disk: 'sdc',
          unavail_disk: null,
        },
        {
          name: '8da43bd0-8452-469e-9253-52eaa7328000',
          type: 'DISK',
          path: '/dev/disk/by-partuuid/8da43bd0-8452-469e-9253-52eaa7328000',
          guid: '5850372793036506488',
          status: 'ONLINE',
          stats: {
            timestamp: 15973009010229,
            read_errors: 0,
            write_errors: 0,
            checksum_errors: 0,
            ops: [
              0,
              3,
              295,
              0,
              0,
              0,
              0,
            ],
            bytes: [
              0,
              24576,
              3178496,
              0,
              0,
              0,
              0,
            ],
            size: 0,
            allocated: 0,
            fragmentation: 0,
            self_healed: 0,
            configured_ashift: 12,
            logical_ashift: 9,
            physical_ashift: 9,
          },
          children: [],
          device: 'sdd1',
          disk: 'sdd',
          unavail_disk: null,
        },
      ],
      unavail_disk: null,
      isRoot: true,
    },
    {
      name: '1fd55f60-2b6d-468c-aa24-ff1dc950eeba',
      type: 'DISK',
      path: '/dev/disk/by-partuuid/1fd55f60-2b6d-468c-aa24-ff1dc950eeba',
      guid: '14429755380210151979',
      status: 'ONLINE',
      stats: {
        timestamp: 15973008867522,
        read_errors: 0,
        write_errors: 0,
        checksum_errors: 0,
        ops: [
          0,
          3,
          294,
          0,
          0,
          0,
          0,
        ],
        bytes: [
          0,
          24576,
          3178496,
          0,
          0,
          0,
          0,
        ],
        size: 0,
        allocated: 0,
        fragmentation: 0,
        self_healed: 0,
        configured_ashift: 12,
        logical_ashift: 9,
        physical_ashift: 9,
      },
      children: [],
      device: 'sdc1',
      disk: 'sdc',
      unavail_disk: null,
    },
  ] as DeviceNestedDataNode[];

  const nodes = [
    {
      children: [
        {
          name: 'mirror-0',
          type: 'MIRROR',
          path: null,
          guid: '6132369047780976350',
          status: 'ONLINE',
          stats: {
            timestamp: 15669890402152,
            read_errors: 0,
            write_errors: 0,
            checksum_errors: 0,
            ops: [
              0,
              6,
              589,
              0,
              0,
              0,
              0,
            ],
            bytes: [
              0,
              49152,
              6356992,
              0,
              0,
              0,
              0,
            ],
            size: 9663676416,
            allocated: 417792,
            fragmentation: 0,
            self_healed: 0,
            configured_ashift: 12,
            logical_ashift: 12,
            physical_ashift: 9,
          },
          children: [
            selectedNode,
            {
              name: '8da43bd0-8452-469e-9253-52eaa7328000',
              type: 'DISK',
              path: '/dev/disk/by-partuuid/8da43bd0-8452-469e-9253-52eaa7328000',
              guid: '5850372793036506488',
              status: 'ONLINE',
              stats: {
                timestamp: 15669890733814,
                read_errors: 0,
                write_errors: 0,
                checksum_errors: 0,
                ops: [
                  0,
                  3,
                  295,
                  0,
                  0,
                  0,
                  0,
                ],
                bytes: [
                  0,
                  24576,
                  3178496,
                  0,
                  0,
                  0,
                  0,
                ],
                size: 0,
                allocated: 0,
                fragmentation: 0,
                self_healed: 0,
                configured_ashift: 12,
                logical_ashift: 9,
                physical_ashift: 9,
              },
              children: [],
              device: 'sdd1',
              disk: 'sdd',
              unavail_disk: null,
            },
          ],
          unavail_disk: null,
          isRoot: true,
        },
      ],
      group: 'Data VDEVs',
      guid: 'data',
    },
  ] as DeviceNestedDataNode[];

  const pools = [
    {
      id: 2,
      name: 'test',
      guid: '9053312858708049075',
      path: '/mnt/test',
      status: 'ONLINE',
      scan: {
        function: null,
        state: null,
        start_time: null,
        end_time: null,
        percentage: null,
        bytes_to_process: null,
        bytes_processed: null,
        bytes_issued: null,
        pause: null,
        errors: null,
        total_secs_left: null,
      },
      topology: {
        data: [
          {
            name: 'mirror-0',
            type: 'MIRROR',
            path: null,
            guid: '6132369047780976350',
            status: 'ONLINE',
            stats: {
              timestamp: 184841655072,
              read_errors: 0,
              write_errors: 0,
              checksum_errors: 0,
              ops: [
                0,
                6,
                589,
                0,
                0,
                0,
                0,
              ],
              bytes: [
                0,
                49152,
                6356992,
                0,
                0,
                0,
                0,
              ],
              size: 9663676416,
              allocated: 417792,
              fragmentation: 0,
              self_healed: 0,
              configured_ashift: 12,
              logical_ashift: 12,
              physical_ashift: 9,
            },
            children: [
              selectedNode,
              {
                name: '8da43bd0-8452-469e-9253-52eaa7328000',
                type: 'DISK',
                path: '/dev/disk/by-partuuid/8da43bd0-8452-469e-9253-52eaa7328000',
                guid: '5850372793036506488',
                status: 'ONLINE',
                stats: {
                  timestamp: 184841988958,
                  read_errors: 0,
                  write_errors: 0,
                  checksum_errors: 0,
                  ops: [
                    0,
                    3,
                    295,
                    0,
                    0,
                    0,
                    0,
                  ],
                  bytes: [
                    0,
                    24576,
                    3178496,
                    0,
                    0,
                    0,
                    0,
                  ],
                  size: 0,
                  allocated: 0,
                  fragmentation: 0,
                  self_healed: 0,
                  configured_ashift: 12,
                  logical_ashift: 9,
                  physical_ashift: 9,
                },
                children: [],
                device: 'sdd1',
                disk: 'sdd',
                unavail_disk: null,
              },
            ],
            unavail_disk: null,
          },
        ],
        log: [],
        cache: [],
        spare: [],
        special: [],
        dedup: [],
      },
      healthy: true,
      status_detail: null,
      size: 9663676416,
      dedup_table_quota: 'auto',
      dedup_table_size: 0,
      autotrim: {
        value: 'off',
        rawvalue: 'off',
        parsed: 'off',
        source: 'DEFAULT',
      },
    },
  ] as Pool[];

  const disks = [
    {
      identifier: '{serial_lunid}0e1ec745-8430-4cc1-aa71-762ea691c40b_60014050e1ec7458',
      name: 'sdc',
      subsystem: 'scsi',
      number: 2080,
      serial: '0e1ec745-8430-4cc1-aa71-762ea691c40b',
      lunid: '60014050e1ec7458',
      size: 10000000000,
      description: '',
      transfermode: 'Auto',
      hddstandby: 'ALWAYS ON',
      advpowermgmt: 'DISABLED',
      togglesmart: true,
      smartoptions: '',
      expiretime: null,
      critical: null,
      difference: null,
      informational: null,
      model: 'ha003_d002',
      rotationrate: null,
      type: 'HDD',
      zfs_guid: '14429755380210151979',
      bus: 'SCSI',
      devname: 'sdc',
      supports_smart: null,
      pool: 'test',
    },
    {
      identifier: '{serial_lunid}64fc1911-f1ac-4c05-86bb-14fa48d4dd3a_600140564fc1911f',
      name: 'sdd',
      subsystem: 'scsi',
      number: 2096,
      serial: '64fc1911-f1ac-4c05-86bb-14fa48d4dd3a',
      lunid: '600140564fc1911f',
      size: 10000000000,
      description: '',
      transfermode: 'Auto',
      hddstandby: 'ALWAYS ON',
      advpowermgmt: 'DISABLED',
      togglesmart: true,
      smartoptions: '',
      expiretime: null,
      critical: null,
      difference: null,
      informational: null,
      model: 'ha003_d003',
      rotationrate: null,
      type: 'HDD',
      zfs_guid: '5850372793036506488',
      bus: 'SCSI',
      devname: 'sdd',
      supports_smart: null,
      pool: 'test',
    },
  ] as unknown as Disk[];

  const smartDiskChoices = {
    '{serial}ha003_c1_os00': 'sda',
    '{serial_lunid}d75bce60-2506-4e90-8f29-d4b7fef5f45f_6001405d75bce602': 'sdb',
    '{serial_lunid}1c0a6b41-76b9-4d98-97cd-bd55644ff73e_60014051c0a6b417': 'sdg',
    '{serial_lunid}0e1ec745-8430-4cc1-aa71-762ea691c40b_60014050e1ec7458': 'sdc',
    '{serial_lunid}64fc1911-f1ac-4c05-86bb-14fa48d4dd3a_600140564fc1911f': 'sdd',
    '{serial_lunid}cdda069c-ccdf-4ad9-987f-6b013070f0af_6001405cdda069cc': 'sde',
    '{serial_lunid}37566b29-90a7-43c3-a842-5c42e546eb2e_600140537566b299': 'sdf',
    '{serial_lunid}dfe5bc5b-59d2-4e42-98e2-483c645ed8ef_6001405dfe5bc5b5': 'sdh',
    '{serial_lunid}907b5237-6ee3-4f24-88b7-3a95d16b392f_6001405907b52376': 'sdj',
    '{serial_lunid}a46310c9-5411-4100-a663-e58b47379926_6001405a46310c95': 'sdi',
    '{serial_lunid}48d281d9-f516-450e-a3cf-4caeeb7cf561_600140548d281d9f': 'sdk',
  } as Choices;

  const createComponent = createComponentFactory({
    component: DevicesListComponent,
    imports: [
      TopologyItemNodeComponent,
      VDevGroupNodeComponent,
      TreeViewComponent,
      TreeNodeComponent,
      NestedTreeNodeComponent,
      IxIconComponent,
    ],

    providers: [
      mockProvider(DevicesStore, {
        selectedNode$: of(selectedNode),
        loadDisksWithSmartTestSupport: jest.fn(),
        isLoading$: of(false),
        loadNodes: jest.fn(),
        nodes$: of(nodes),
        selectedBranch$: of(selectedBranch),
      }),
      mockApi([
        mockCall('pool.query', pools),
        mockCall('disk.query', disks),
        mockCall('smart.test.disk_choices', smartDiskChoices),
      ]),
    ],
  });

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation();
    spectator = createComponent({
      props: {
        poolId: 2,
        isMobileView: false,
      },
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ guid: '14429755380210151979' }),
          },
        },
      ],
    });
  });

  it('shows the devices of the pool', () => {
    spectator.detectChanges();
    const vdevGroup = spectator.query('ix-vdev-group-node');
    const text = vdevGroup.querySelector('.caption-name');
    expect(text.textContent).toBe('Data VDEVs');
    const nestedTreeNode = spectator.query('ix-nested-tree-node > ix-nested-tree-node');
    const topologyItem = nestedTreeNode.querySelector('ix-topology-item-node');
    const nameCell = topologyItem.querySelector('.cell-name');
    expect(nameCell.textContent).toBe('MIRROR');
    const button = spectator.query('.mat-mdc-button-touch-target');
    button.dispatchEvent(new Event('click'));
    expect(console.warn).toHaveBeenCalledWith('Tree is using conflicting node types which can cause unexpected behavior. Please use tree nodes of the same type (e.g. only flat or only nested). Current node type: "nested", new node type "flat".');
    spectator.detectChanges();
    const treeNodes = spectator.queryAll('.cell-name');
    expect(treeNodes[0].textContent).toBe('MIRROR');
    expect(treeNodes[1].textContent).toBe('sdc');
    expect(treeNodes[2].textContent).toBe('sdd');
  });
});
