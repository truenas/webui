import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DiskBus } from 'app/enums/disk-bus.enum';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { DiskType } from 'app/enums/disk-type.enum';
import { TopologyItemType, VdevType } from 'app/enums/v-dev-type.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { TopologyItem } from 'app/interfaces/storage.interface';
import { DiskDetailsPanelComponent } from 'app/pages/storage/modules/devices/components/disk-details-panel/disk-details-panel.component';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

describe('DiskDetailsPanel', () => {
  let spectator: Spectator<DiskDetailsPanelComponent>;

  const sdc: TopologyItem = {
    name: '68c5fde3-eed6-4d12-b987-6b5611362be5',
    type: TopologyItemType.Disk,
    path: '/dev/disk/by-partuuid/68c5fde3-eed6-4d12-b987-6b5611362be5',
    guid: '7184309631055131820',
    status: TopologyItemStatus.Online,
    stats: {
      timestamp: 777434868788,
      read_errors: 0,
      write_errors: 0,
      checksum_errors: 0,
      ops: [0, 3, 286, 0, 0, 0, 0],
      bytes: [0, 24576, 3178496, 0, 0, 0, 0],
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
  };
  const mirror = {
    name: 'mirror-0',
    type: TopologyItemType.Mirror,
    guid: '15201895154961148781',
    status: TopologyItemStatus.Online,
    stats: {
      timestamp: 777434673942,
      read_errors: 0,
      write_errors: 0,
      checksum_errors: 0,
      ops: [0, 6, 572, 0, 0, 0, 0],
      bytes: [0, 49152, 6356992, 0, 0, 0, 0],
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
        ...sdc,
      },
      {
        name: '56521e5b-6aa2-4a0b-80fe-08085d2c1236',
        type: TopologyItemType.Disk,
        path: '/dev/disk/by-partuuid/56521e5b-6aa2-4a0b-80fe-08085d2c1236',
        guid: '1999776720419816950',
        status: TopologyItemStatus.Online,
        stats: {
          timestamp: 777435028788,
          read_errors: 0,
          write_errors: 0,
          checksum_errors: 0,
          ops: [0, 3, 286, 0, 0, 0, 0],
          bytes: [0, 24576, 3178496, 0, 0, 0, 0],
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
  } as TopologyItem;
  const disksWithSmartTestSupport = [
    'sda',
    'sdb',
    'sdc',
    'sdd',
    'sde',
    'sdf',
    'sdg',
    'sdh',
    'sdi',
    'sdj',
    'sdk',
  ] as string[];
  const props = {
    topologyItem: { ...sdc } as TopologyItem,
    topologyParentItem: { ...mirror } as TopologyItem,
    disk: {
      identifier: '{serial_lunid}169f2823-3d33-448d-baaf-1769a7c3d906_6001405169f28233',
      name: 'sdc',
      subsystem: 'scsi',
      number: 2080,
      serial: '169f2823-3d33-448d-baaf-1769a7c3d906',
      lunid: '6001405169f28233',
      size: 10000000000,
      description: '',
      transfermode: 'Auto',
      hddstandby: 'ALWAYS ON',
      advpowermgmt: 'DISABLED',
      togglesmart: true,
      model: 'ha001_d001',
      type: 'HDD',
      zfs_guid: '7184309631055131820',
      bus: DiskBus.Spi,
      devname: 'sdc',
      pool: 'pool',
    } as Disk,
    poolId: 2,
    topologyCategory: VdevType.Data,
    hasTopLevelRaidz: false,
    disksWithSmartTestSupport,
  };

  const createComponent = createComponentFactory({
    component: DiskDetailsPanelComponent,
    providers: [
      mockApi([
        mockCall('system.advanced.sed_global_password_is_set', false),
        mockCall('smart.test.results', []),
        mockCall('smart.test.query_for_disk', []),
        mockCall('disk.query', [{ passwd: '' } as unknown as Disk]),
      ]),
      mockAuth(),
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

  it('shows detail cards', () => {
    spectator = createComponent({
      props,
    });
    const zfsInfoCard = spectator.query('ix-zfs-info-card');
    expect(zfsInfoCard).toBeTruthy();
    const hardwareDiskEncryptionCard = spectator.query('ix-hardware-disk-encryption');
    expect(hardwareDiskEncryptionCard).toBeTruthy();

    const smartInfoCard = spectator.query('ix-smart-info-card');
    expect(smartInfoCard).toBeTruthy();

    const diskInfo = spectator.query('ix-disk-info-card');
    expect(diskInfo).toBeTruthy();
  });

  it('hides some cards if not applicable', () => {
    spectator = createComponent({
      props: {
        topologyItem: {
          name: 'mirror-0',
          type: TopologyItemType.Mirror,
          guid: '15201895154961148781',
          status: TopologyItemStatus.Online,
          stats: {
            timestamp: 777434673942,
            read_errors: 0,
            write_errors: 0,
            checksum_errors: 0,
            ops: [0, 6, 572, 0, 0, 0, 0],
            bytes: [0, 49152, 6356992, 0, 0, 0, 0],
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
              name: '68c5fde3-eed6-4d12-b987-6b5611362be5',
              type: TopologyItemType.Disk,
              path: '/dev/disk/by-partuuid/68c5fde3-eed6-4d12-b987-6b5611362be5',
              guid: '7184309631055131820',
              status: TopologyItemStatus.Online,
              stats: {
                timestamp: 777434868788,
                read_errors: 0,
                write_errors: 0,
                checksum_errors: 0,
                ops: [0, 3, 286, 0, 0, 0, 0],
                bytes: [0, 24576, 3178496, 0, 0, 0, 0],
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
              name: '56521e5b-6aa2-4a0b-80fe-08085d2c1236',
              type: TopologyItemType.Disk,
              path: '/dev/disk/by-partuuid/56521e5b-6aa2-4a0b-80fe-08085d2c1236',
              guid: '1999776720419816950',
              status: TopologyItemStatus.Online,
              stats: {
                timestamp: 777435028788,
                read_errors: 0,
                write_errors: 0,
                checksum_errors: 0,
                ops: [0, 3, 286, 0, 0, 0, 0],
                bytes: [0, 24576, 3178496, 0, 0, 0, 0],
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
          ] as TopologyItem[],
          unavail_disk: null,
        } as TopologyItem,
        topologyParentItem: { } as TopologyItem,
        disk: {
          identifier: '{serial_lunid}169f2823-3d33-448d-baaf-1769a7c3d906_6001405169f28233',
          name: 'sdc',
          subsystem: 'scsi',
          number: 2080,
          serial: '169f2823-3d33-448d-baaf-1769a7c3d906',
          lunid: '6001405169f28233',
          size: 10000000000,
          description: '',
          transfermode: 'Auto',
          hddstandby: DiskStandby.AlwaysOn,
          advpowermgmt: DiskPowerLevel.Disabled,
          togglesmart: true,
          model: 'ha001_d001',
          type: DiskType.Hdd,
          zfs_guid: '7184309631055131820',
          bus: DiskBus.Spi,
          devname: 'sdc',
          pool: 'pool',
        } as Disk,
        poolId: 2,
        topologyCategory: VdevType.Data,
        hasTopLevelRaidz: false,
        disksWithSmartTestSupport,
      },
    });

    const zfsInfoCard = spectator.query('ix-zfs-info-card');
    expect(zfsInfoCard).toBeTruthy();
    const hardwareDiskEncryptionCard = spectator.query('ix-hardware-disk-encryption');
    expect(hardwareDiskEncryptionCard).toBeFalsy();

    const smartInfoCard = spectator.query('ix-smart-info-card');
    expect(smartInfoCard).toBeFalsy();

    const diskInfo = spectator.query('ix-disk-info-card');
    expect(diskInfo).toBeFalsy();
  });
});
