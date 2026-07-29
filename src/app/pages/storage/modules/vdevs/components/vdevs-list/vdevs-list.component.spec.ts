import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ActivatedRoute } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnIconButtonHarness, TnIconComponent, TnTreeHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { settleDeferredTree } from 'app/core/testing/utils/settle-deferred-tree.utils';
import { VDevNestedDataNode } from 'app/interfaces/device-nested-data-node.interface';
import { VDevItem } from 'app/interfaces/storage.interface';
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
      TnIconComponent,
    ],
  });

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation();
  });

  it('shows the devices of the pool', async () => {
    spectator = createComponent({
      props: { poolId: 2 },
      providers: [
        mockProvider(VDevsStore, {
          selectedNode$: of(selectedNode),
          isLoading$: of(false),
          loadNodes: jest.fn(),
          nodes$: of(nodes),
          selectedBranch$: of(selectedBranch),
        }),
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ guid: '14429755380210151979' }),
          },
        },
      ],
    });
    spectator.detectChanges();
    await settleDeferredTree(spectator.fixture);
    const vdevGroup = spectator.query('ix-vdev-group-node')!;
    const text = vdevGroup.querySelector('.caption-name')!;
    expect(text.textContent).toBe('Data VDEVs');
    const treeNodes = spectator.queryAll('.cell-name');
    expect(treeNodes[0].textContent).toBe('MIRROR');
    expect(treeNodes[1].textContent).toBe('sdc');
    expect(treeNodes[2].textContent).toBe('sdd');

    // The custom group toggle collapses the auto-expanded group. Collapsed children
    // stay in the DOM (hidden via CSS) — assert the group's expansion state through
    // the harness rather than element removal.
    const loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    const groupLoader = await loader.getChildLoader('ix-vdev-group-node');
    const groupToggle = await groupLoader.getHarness(TnIconButtonHarness);
    const tree = await loader.getHarness(TnTreeHarness);
    const [groupNode] = await tree.getNodes({ level: 0 });
    expect(await groupNode.isExpanded()).toBe(true);
    await groupToggle.click();
    spectator.detectChanges();
    expect(await groupNode.isExpanded()).toBe(false);
  });

  describe('auto-expand on descendant warning', () => {
    // A minimal pool with a single mirror that contains one FAULTED disk. Without auto-expand
    // the disk row stays hidden under the collapsed mirror; with auto-expand it should be
    // rendered immediately after the store emits.
    const faultedNodes = [
      {
        children: [
          {
            name: 'mirror-1',
            type: 'MIRROR',
            guid: 'mirror-1-guid',
            status: 'DEGRADED',
            children: [
              {
                name: 'faulted-disk',
                type: 'DISK',
                guid: 'faulted-disk-guid',
                status: 'FAULTED',
                disk: 'sde',
                children: [],
              },
            ],
            isRoot: true,
          },
        ],
        group: 'Data VDEVs',
        guid: 'data',
      },
    ] as VDevNestedDataNode[];

    it('reveals a deeper FAULTED disk without requiring a click on the parent VDEV', async () => {
      spectator = createComponent({
        props: { poolId: 2 },
        providers: [
          mockProvider(VDevsStore, {
            selectedNode$: of(null),
            isLoading$: of(false),
            loadNodes: jest.fn(),
            nodes$: of(faultedNodes),
            selectedBranch$: of(null),
          }),
          {
            provide: ActivatedRoute,
            useValue: { params: of({}), snapshot: { paramMap: { get: () => null } } },
          },
        ],
      });
      spectator.detectChanges();
      await settleDeferredTree(spectator.fixture);

      const faultedRow = spectator.queryAll('.cell-name')
        .find((el) => el.textContent?.trim() === 'sde');
      expect(faultedRow).toBeTruthy();
      // The FAULTED disk's ancestors (group and mirror) are auto-expanded, so the
      // disk row is not left hidden under a collapsed parent.
      const tree = await TestbedHarnessEnvironment.loader(spectator.fixture).getHarness(TnTreeHarness);
      const [group] = await tree.getNodes({ level: 0 });
      const [mirror] = await tree.getNodes({ level: 1 });
      expect(await group.isExpanded()).toBe(true);
      expect(await mirror.isExpanded()).toBe(true);
    });
  });
});
