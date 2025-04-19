import { ActivatedRoute } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { VDevType } from 'app/enums/v-dev-type.enum';
import { VDevNestedDataNode } from 'app/interfaces/device-nested-data-node.interface';
import { Disk } from 'app/interfaces/disk.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { VDevItem } from 'app/interfaces/storage.interface';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { HardwareDiskEncryptionComponent } from 'app/pages/storage/modules/vdevs/components/hardware-disk-encryption/hardware-disk-encryption.component';
import { VDevsStore } from 'app/pages/storage/modules/vdevs/stores/vdevs-store.service';
import { VDevsComponent } from 'app/pages/storage/modules/vdevs/vdevs.component';
import { RoutePartsService } from 'app/services/route-parts/route-parts.service';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

describe('VDevsComponent', () => {
  let spectator: Spectator<VDevsComponent>;

  const pools = [
    {
      id: 2,
      name: 'test',
      guid: '9053312858708049075',
      path: '/mnt/test',
    },
  ] as Pool[];

  const selectedNode = {
    name: 'ca0f5344-267c-4be9-a40e-489535c84e9b',
    type: 'DISK',
    path: '/dev/disk/by-partuuid/ca0f5344-267c-4be9-a40e-489535c84e9b',
    guid: '2371564679938554630',
    status: 'ONLINE',
    stats: {
      timestamp: 31250199337,
      read_errors: 0,
      write_errors: 0,
      checksum_errors: 0,
      ops: [
        0,
        3,
        289,
        0,
        0,
        0,
        0,
      ],
      bytes: [
        0,
        24576,
        3153920,
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

  const unselectedNode = {
    name: '6b605763-0af8-4ada-9911-3865080e0771',
    type: 'DISK',
    path: '/dev/disk/by-partuuid/6b605763-0af8-4ada-9911-3865080e0771',
    guid: '3822690363942489518',
    status: 'ONLINE',
    stats: {
      timestamp: 31250332105,
      read_errors: 0,
      write_errors: 0,
      checksum_errors: 0,
      ops: [
        0,
        3,
        299,
        0,
        0,
        0,
        0,
      ],
      bytes: [
        0,
        24576,
        3153920,
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
  } as VDevNestedDataNode;

  const parentNode = {
    name: 'mirror-0',
    type: 'MIRROR',
    guid: '17711810230640481012',
    status: 'ONLINE',
    stats: {
      timestamp: 31250010572,
      read_errors: 0,
      write_errors: 0,
      checksum_errors: 0,
      ops: [
        0,
        6,
        588,
        0,
        0,
        0,
        0,
      ],
      bytes: [
        0,
        49152,
        6307840,
        0,
        0,
        0,
        0,
      ],
      size: 9663676416,
      allocated: 405504,
      fragmentation: 0,
      self_healed: 0,
      configured_ashift: 12,
      logical_ashift: 12,
      physical_ashift: 9,
    },
    children: [
      {
        ...selectedNode,
      },
      {
        ...unselectedNode,
      },
    ],
    unavail_disk: null,
    isRoot: true,
  } as VDevItem;

  const nodes = [
    {
      children: [
        {
          ...parentNode,
        },
      ],
      group: 'Data VDEVs',
      guid: 'data',
    },
  ];

  const selectedBranch = [
    {
      children: [
        {
          ...parentNode,
        },
      ],
      group: 'Data VDEVs',
      guid: 'data',
    },
    {
      ...parentNode,
    },
    {
      ...selectedNode,
    },
  ] as VDevNestedDataNode[];

  const createComponent = createComponentFactory({
    component: VDevsComponent,
    declarations: [
      MockComponent(PageHeaderComponent),
      MockComponent(HardwareDiskEncryptionComponent),
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('pool.query', pools),
        mockCall('system.advanced.sed_global_password_is_set', false),
        mockCall('disk.query', [{ passwd: '' } as unknown as Disk]),
      ]),
      mockProvider(RoutePartsService),
      mockProvider(ActivatedRoute, {
        snapshot: {
          paramMap: {
            get: () => 2,
          },
        },
        params: of({ poolId: 2, guid: '14429755380210151979' }),
      }),
      mockProvider(VDevsStore, {
        selectedNode$: of(selectedNode),
        selectedParentNode$: of(parentNode),
        nodes$: of(nodes),
        selectedTopologyCategory$: of(VDevType.Data),
        loadNodes: jest.fn(),
        selectedBranch$: of(selectedBranch),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectIsEnterprise,
            value: false,
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation();
    spectator = createComponent();
  });

  it('shows the devices and details', () => {
    const rows = spectator.queryAll('.cell-name');
    expect(rows.map((row) => row.textContent)).toEqual(['MIRROR', 'sdc', 'sdd']);
    expect(console.warn).toHaveBeenCalled();
    const headerContainer = spectator.query('.header-container')!;
    expect(headerContainer.textContent).toBe('Details for  sdc ');
    const zfsInfoCard = spectator.query('ix-zfs-info-card');
    expect(zfsInfoCard).toBeTruthy();
  });
});
