import { ActivatedRoute } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { VDevNestedDataNode } from 'app/interfaces/device-nested-data-node.interface';
import { VDevItem } from 'app/interfaces/storage.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { NestedTreeNodeComponent } from 'app/modules/ix-tree/components/nested-tree-node/nested-tree-node.component';
import { TreeNodeComponent } from 'app/modules/ix-tree/components/tree-node/tree-node.component';
import { TreeViewComponent } from 'app/modules/ix-tree/components/tree-view/tree-view.component';
import { TopologyItemNodeComponent } from 'app/pages/storage/modules/vdevs/components/topology-item-node/topology-item-node.component';
import { VDevGroupNodeComponent } from 'app/pages/storage/modules/vdevs/components/vdev-group-node/vdev-group-node.component';
import { VDevsListComponent } from 'app/pages/storage/modules/vdevs/components/vdevs-list/vdevs-list.component';
import { VDevsStore } from 'app/pages/storage/modules/vdevs/stores/vdevs-store.service';

describe('VDevsListComponent', () => {
  let spectator: Spectator<VDevsListComponent>;

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
  } as VDevNestedDataNode;

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
  ] as VDevNestedDataNode[];

  const nodes = [
    {
      children: [
        {
          name: 'mirror-0',
          type: 'MIRROR',
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
        } as VDevItem,
      ],
      group: 'Data VDEVs',
      guid: 'data',
    },
  ] as VDevNestedDataNode[];

  const createComponent = createComponentFactory({
    component: VDevsListComponent,
    imports: [
      TopologyItemNodeComponent,
      VDevGroupNodeComponent,
      TreeViewComponent,
      TreeNodeComponent,
      NestedTreeNodeComponent,
      IxIconComponent,
    ],

    providers: [
      mockProvider(VDevsStore, {
        selectedNode$: of(selectedNode),
        isLoading$: of(false),
        loadNodes: jest.fn(),
        nodes$: of(nodes),
        selectedBranch$: of(selectedBranch),
      }),
    ],
  });

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation();
    spectator = createComponent({
      props: {
        poolId: 2,
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
    const vdevGroup = spectator.query('ix-vdev-group-node')!;
    const text = vdevGroup.querySelector('.caption-name')!;
    expect(text.textContent).toBe('Data VDEVs');
    const button = spectator.query('.mat-mdc-button-touch-target')!;
    button.dispatchEvent(new Event('click'));
    expect(console.warn).toHaveBeenCalledWith('Tree is using conflicting node types which can cause unexpected behavior. Please use tree nodes of the same type (e.g. only flat or only nested). Current node type: "nested", new node type "flat".');
    spectator.detectChanges();
    const treeNodes = spectator.queryAll('.cell-name');
    expect(treeNodes[0].textContent).toBe('MIRROR');
    expect(treeNodes[1].textContent).toBe('sdc');
    expect(treeNodes[2].textContent).toBe('sdd');
  });
});
