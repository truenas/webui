import { TiB } from 'app/constants/bytes.constant';
import { MockDiskType, MockStorageScenarioOld } from 'app/core/testing/mock-enclosure/enums/mock-storage.enum';
import {
  AddTopologyOptions,
  MockStorage,
  MockTopology,
} from 'app/core/testing/mock-enclosure/interfaces/mock-storage-generator.interface';
import { DiskBus } from 'app/enums/disk-bus.enum';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { DiskType } from 'app/enums/disk-type.enum';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { TopologyItemType, VdevType } from 'app/enums/v-dev-type.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { Pool } from 'app/interfaces/pool.interface';
import {
  TopologyDisk,
  TopologyItem,
  TopologyItemStats,
  VDev,
} from 'app/interfaces/storage.interface';

/**
 * @deprecated Do not use in new code.
 * TODO: Being able to generate storage mocks may be useful. Refactor.
 */
export class MockStorageGeneratorOld {
  poolState: Pool;
  disks: Disk[];

  constructor() {
    // Creates a pool with empty topologies
    const storage = this.generateStorage();
    this.poolState = storage.poolState;
    this.disks = storage.disks;
  }

  // Generate Empty Topology & Disks
  private generateStorage(mockPool = true): MockStorage {
    if (!mockPool) return { poolState: null, disks: [] };

    const pool = {
      id: 1,
      name: 'MOCK_POOL',
      healthy: true,
      status: PoolStatus.Online,
      topology: {
        data: [],
        special: [],
        log: [],
        spare: [],
        cache: [],
        dedup: [],
      },
      autotrim: {
        value: 'off',
      },
    } as Pool;

    const disks: Disk[] = [];

    return { poolState: pool, disks };
  }

  addDataTopology(options: AddTopologyOptions = {
    scenario: MockStorageScenarioOld.NoRedundancy,
    layout: TopologyItemType.Stripe,
    diskSize: 4,
    width: 1,
    repeats: 1,
  }): this {
    this.addRaidzCapableTopology(VdevType.Data, options);
    return this;
  }

  addSpecialTopology(options: AddTopologyOptions = {
    scenario: MockStorageScenarioOld.NoRedundancy,
    layout: TopologyItemType.Stripe,
    diskSize: 4,
    width: 1,
    repeats: 1,
  }): this {
    // The redundancy of this device should match the redundancy of the other normal devices in the pool
    this.addRaidzCapableTopology(VdevType.Special, options);
    return this;
  }

  addDedupTopology(options: AddTopologyOptions = {
    scenario: MockStorageScenarioOld.NoRedundancy,
    layout: TopologyItemType.Stripe,
    diskSize: 4,
    width: 1,
    repeats: 1,
  }): this {
    // The redundancy of this device should match the redundancy of the other normal devices in the pool
    this.addRaidzCapableTopology(VdevType.Dedup, options);
    return this;
  }

  private addRaidzCapableTopology(category: VdevType, options: AddTopologyOptions = {
    scenario: MockStorageScenarioOld.NoRedundancy,
    layout: TopologyItemType.Stripe,
    diskSize: 4,
    width: 1,
    repeats: 1,
  }): void {
    switch (options.scenario) {
      case MockStorageScenarioOld.NoRedundancy: {
        const noRedundancy: MockTopology = this.generateNoRedundancyTopology(4, options.diskSize, options.width);
        this.disks = this.disks.concat(noRedundancy.disks);
        this.poolState.topology[category] = this.poolState.topology[category]
          .concat(noRedundancy.topologyItems);
        break;
      }
      case MockStorageScenarioOld.Uniform: {
        if (options.layout === TopologyItemType.Stripe || options.layout === TopologyItemType.Disk) {
          options.layout = TopologyItemType.Mirror;
        }

        const uniform = this.generateUniformTopology(options.layout, options.repeats, options.diskSize, options.width);
        this.disks = this.disks.concat(uniform.disks);
        this.poolState.topology[category] = this.poolState.topology[category].concat(uniform.topologyItems);
        break;
      }
      case MockStorageScenarioOld.MixedDiskCapacity: {
        if (options.layout === TopologyItemType.Stripe || options.layout === TopologyItemType.Disk) {
          options.layout = TopologyItemType.Mirror;
        }

        const mixedDisk = this.generateMixedDiskCapacityTopology(
          options.layout,
          options.repeats,
          options.diskSize,
          options.width,
        );

        this.disks = this.disks.concat(mixedDisk.disks);
        this.poolState.topology[category] = this.poolState.topology[category]
          .concat(mixedDisk.topologyItems);
        break;
      }
      case MockStorageScenarioOld.MixedVdevCapacity: {
        const mixedVdevs = this.generateMixedVdevCapacityTopology(
          options.layout,
          options.repeats,
          options.diskSize,
          options.width,
        );

        this.disks = this.disks.concat(mixedVdevs.disks);
        this.poolState.topology[category] = this.poolState.topology[category]
          .concat(mixedVdevs.topologyItems);
        break;
      }
      case MockStorageScenarioOld.MixedVdevWidth: {
        const mixedWidths = this.generateMixedWidthTopology(
          options.layout,
          options.repeats,
          options.diskSize,
          options.width,
        );

        this.disks = this.disks.concat(mixedWidths.disks);
        this.poolState.topology[category] = this.poolState.topology[category]
          .concat(mixedWidths.topologyItems);
        break;
      }
      case MockStorageScenarioOld.MixedVdevLayout: {
        const mixedLayouts = this.generateMixedLayoutTopology(
          options.layout,
          options.repeats,
          options.diskSize,
          options.width,
        );

        this.disks = this.disks.concat(mixedLayouts.disks);
        this.poolState.topology[category] = this.poolState.topology[category]
          .concat(mixedLayouts.topologyItems);
        break;
      }
      default:
        console.error('ERROR: Unsupported scenario ' + options.scenario + '. Scenario is either invalid or has not been added yet to storage generator.');
        break;
    }
  }

  // Can create DISK or MIRROR devices. ZFS does not support RAIDZ for log devices
  addLogTopology(deviceCount: number, isMirror = false, diskSize = 4): this {
    if (isMirror) {
      this.addRaidzCapableTopology(VdevType.Log, {
        scenario: MockStorageScenarioOld.Uniform,
        layout: TopologyItemType.Mirror,
        diskSize,
        width: 2,
        repeats: deviceCount,
      });
    } else {
      this.addSingleDeviceTopology(VdevType.Log, deviceCount, diskSize);
    }
    return this;
  }

  // Can create DISK devices. ZFS does not support RAIDZ or MIRROR for cache devices
  addCacheTopology(deviceCount: number, diskSize = 4): this {
    this.addSingleDeviceTopology(VdevType.Cache, deviceCount, diskSize);
    return this;
  }

  // Can create DISK devices. ZFS does not support RAIDZ or MIRROR for spares
  addSpareTopology(deviceCount: number, diskSize = 4): this {
    this.addSingleDeviceTopology(VdevType.Spare, deviceCount, diskSize);
    return this;
  }

  private addSingleDeviceTopology(category: VdevType, deviceCount: number, diskSize = 4): void {
    // Only DISK devices allowed. ZFS does not support MIRROR or RAIDZ
    const topology: MockTopology = this.generateNoRedundancyTopology(deviceCount, diskSize, deviceCount);
    this.disks = this.disks.concat(topology.disks);
    this.poolState.topology[category] = this.poolState.topology[category].concat(topology.topologyItems);
  }

  // Generate Topology from Scenario
  private generateUniformTopology(
    layout: TopologyItemType,
    repeats: number,
    diskSize: number,
    width: number,
    allDisks: Disk[] = this.disks,
  ): MockTopology {
    const vdevs: TopologyItem[] = [];
    const disks: Disk[] = [];

    for (let i = 0; i < repeats; i++) {
      const vdev: VDev = this.generateVdev(layout, width, layout + '-' + i.toString()) as VDev;
      vdev.children.forEach((child: TopologyDisk) => {
        const disk = this.generateDisk(diskSize, (disks.length + allDisks.length));
        child.disk = disk.name;
        child.device = disk.name + '2';
        child.stats = {
          size: disk.size,
          timestamp: 164848882662718,
          read_errors: 0,
          write_errors: 0,
          checksum_errors: 0,
        } as TopologyItemStats;
        disks.push(disk);
      });

      vdev.stats.size = this.calculateVdevCapacity(vdev);
      vdevs.push(vdev);
    }

    return {
      topologyItems: vdevs,
      disks,
    };
  }

  private generateNoRedundancyTopology(
    repeats: number,
    diskSize: number,
    width: number,
    allDisks: Disk[] = this.disks,
  ): MockTopology {
    const vdevs: TopologyItem[] = [];
    const disks: Disk[] = [];

    for (let i = 0; i < repeats; i++) {
      const vdev: TopologyDisk = this.generateVdev(TopologyItemType.Disk, width) as TopologyDisk;
      const disk = this.generateDisk(diskSize, (disks.length + allDisks.length));
      vdev.disk = disk.name;
      vdevs.push(vdev);
      disks.push(disk);
    }

    return {
      topologyItems: vdevs,
      disks,
    };
  }

  private generateMixedDiskCapacityTopology(
    layout: TopologyItemType,
    repeats: number,
    diskSize: number,
    width: number,
    allDisks: Disk[] = this.disks,
  ): MockTopology {
    const vdevs: TopologyItem[] = [];
    const disks: Disk[] = [];

    for (let i = 0; i < repeats; i++) {
      const vdev: VDev = this.generateVdev(layout, width, layout + '-' + i.toString()) as VDev;
      vdev.children.forEach((child: TopologyDisk, index) => {
        const childDiskSize = index === 0 ? diskSize + 1 : diskSize;
        const disk = this.generateDisk(childDiskSize, (disks.length + allDisks.length));
        child.disk = disk.name;
        child.device = disk.name + '2';
        child.stats = {
          size: disk.size,
          timestamp: 164848882662718,
          read_errors: 0,
          write_errors: 0,
          checksum_errors: 0,
        } as TopologyItemStats;
        disks.push(disk);
      });

      vdev.stats.size = this.calculateVdevCapacity(vdev);
      vdevs.push(vdev);
    }

    return {
      topologyItems: vdevs,
      disks,
    };
  }

  private generateMixedVdevCapacityTopology(
    layout: TopologyItemType,
    repeats: number,
    diskSize: number,
    width: number,
    allDisks: Disk[] = this.disks,
  ): MockTopology {
    if (repeats < 2) {
      console.error('ERROR: Minimum 2 VDEVs must be configured to generate mixed VDEV capacity scenario');
    }

    const vdevs: TopologyItem[] = [];
    const disks: Disk[] = [];

    for (let i = 0; i < repeats; i++) {
      const vdev: VDev = this.generateVdev(layout, width, layout + '-' + i.toString()) as VDev;
      const childDiskSize = i === 0 ? diskSize + 2 : diskSize;
      vdev.children.forEach((child: TopologyDisk) => {
        const disk = this.generateDisk(childDiskSize, (disks.length + allDisks.length));
        child.disk = disk.name;
        child.device = disk.name + '2';
        child.stats = {
          size: disk.size,
          timestamp: 164848882662718,
          read_errors: 0,
          write_errors: 0,
          checksum_errors: 0,
        } as TopologyItemStats;
        disks.push(disk);
      });

      vdev.stats.size = this.calculateVdevCapacity(vdev);
      vdevs.push(vdev);
    }

    return {
      topologyItems: vdevs,
      disks,
    };
  }

  private generateMixedWidthTopology(
    layout: TopologyItemType,
    repeats: number,
    diskSize: number,
    width: number,
    allDisks: Disk[] = this.disks,
  ): MockTopology {
    if (repeats < 2) {
      console.error('ERROR: Minimum 2 VDEVs must be configured to generate mixed VDEV width scenario');
    }

    const vdevs: TopologyItem[] = [];
    const disks: Disk[] = [];

    for (let i = 0; i < repeats; i++) {
      const vdevWidth: number = i === 0 ? width + 1 : width;
      const vdev: VDev = this.generateVdev(layout, vdevWidth, layout + '-' + i.toString()) as VDev;

      vdev.children.forEach((child: TopologyDisk) => {
        const disk = this.generateDisk(diskSize, (disks.length + allDisks.length));
        child.disk = disk.name;
        child.device = disk.name + '2';
        child.stats = {
          size: disk.size,
          timestamp: 164848882662718,
          read_errors: 0,
          write_errors: 0,
          checksum_errors: 0,
        } as TopologyItemStats;
        disks.push(disk);
      });

      vdev.stats.size = this.calculateVdevCapacity(vdev);
      vdevs.push(vdev);
    }

    return {
      topologyItems: vdevs,
      disks,
    };
  }

  private generateMixedLayoutTopology(
    layout: TopologyItemType,
    repeats: number,
    diskSize: number,
    width: number,
    allDisks: Disk[] = this.disks,
  ): MockTopology {
    const vdevs: TopologyItem[] = [];
    const disks: Disk[] = [];

    let altLayout: TopologyItemType;
    let altWidth: number;
    if (layout === TopologyItemType.Mirror) {
      altLayout = TopologyItemType.Raidz1;
      altWidth = 4;
    } else {
      altWidth = 2;
      altLayout = TopologyItemType.Mirror;
    }

    const vdevCount = repeats === 1 ? repeats + 1 : repeats;
    for (let i = 0; i < vdevCount; i++) {
      const targetLayout = i === 0 ? altLayout : layout;
      const targetWidth = i === 0 ? altWidth : width;
      const vdev: VDev = this.generateVdev(targetLayout, targetWidth, targetLayout + '-' + i.toString()) as VDev;

      vdev.children.forEach((child: TopologyDisk) => {
        const disk = this.generateDisk(diskSize, (disks.length + allDisks.length));
        child.disk = disk.name;
        child.device = disk.name + '2';
        child.stats = {
          size: disk.size,
          timestamp: 164848882662718,
          read_errors: 0,
          write_errors: 0,
          checksum_errors: 0,
        } as TopologyItemStats;
        disks.push(disk);
      });

      vdev.stats.size = this.calculateVdevCapacity(vdev);
      vdevs.push(vdev);
    }

    return {
      topologyItems: vdevs,
      disks,
    };
  }

  // Generate VDEV
  private generateVdev(layout: TopologyItemType, width = 1, vdevName?: string): TopologyDisk | VDev {
    const minWidth = this.getMinLayoutWidth(layout);
    if (width < minWidth) {
      width = minWidth;
    }

    if (layout === TopologyItemType.Disk || layout === TopologyItemType.Stripe) {
      return this.generateTopologyDisk();
    }

    switch (layout) {
      case TopologyItemType.Raidz3:
      case TopologyItemType.Raidz2:
      case TopologyItemType.Raidz1:
      case TopologyItemType.Raidz:
      case TopologyItemType.Mirror: {
        const vdevDisks: TopologyDisk[] = [];
        for (let i = 0; i < width; i++) {
          const topologyDisk: TopologyDisk = this.generateTopologyDisk();
          vdevDisks.push(topologyDisk);
        }

        const vdev = {
          type: layout,
          children: vdevDisks,
          guid: Number(12345).toString(),
          unavail_disk: null,
          stats: { size: null } as TopologyItemStats,
          status: TopologyItemStatus.Online,
        } as VDev;

        if (vdevName) vdev.name = vdevName;

        return vdev;
      }
      default:
        throw new Error('Invalid TopologyItemType. Please use STRIPE, MIRROR, RAIDZ etc');
    }
  }

  private generateTopologyDisk(): TopologyDisk {
    return {
      type: TopologyItemType.Disk,
      status: TopologyItemStatus.Online,
      children: [],
      disk: null,
      stats: { size: null } as TopologyItemStats,
      device: null,
      guid: Number(12345).toString(),
      unavail_disk: null,
    } as TopologyDisk;
  }

  private calculateVdevCapacity(vdev: VDev): number {
    const sizes: number[] = vdev.children.map((child) => child.stats.size);
    const uniqueDiskSizes = new Set(sizes);
    const smallestSize: number = Math.min.apply(this, [...uniqueDiskSizes]);

    switch (vdev.type) {
      case TopologyItemType.Mirror:
        return vdev.children[0].stats.size;
      case TopologyItemType.Raidz:
      case TopologyItemType.Raidz1:
        return smallestSize * (sizes.length - 1);
      case TopologyItemType.Raidz2:
        return smallestSize * (sizes.length - 2);
      case TopologyItemType.Raidz3:
        return smallestSize * (sizes.length - 3);
      default:
        return undefined;
    }
  }

  // Generate Disks
  private getMinLayoutWidth(layout: TopologyItemType): number {
    let width = 0;

    switch (layout) {
      case TopologyItemType.Stripe:
        width = 1;
        break;
      case TopologyItemType.Mirror:
        width = 2;
        break;
      case TopologyItemType.Raidz1:
        width = 3;
        break;
      case TopologyItemType.Raidz2:
        width = 4;
        break;
      case TopologyItemType.Raidz3:
        width = 5;
        break;
      default:
        width = 0;
        break;
    }

    return width;
  }

  private generateDiskName(diskCount: number, startIndex = 0, diskType: MockDiskType = MockDiskType.Hdd): string[] {
    const diskNames: string[] = [];

    const generateName = (index: number): string => {
      let result = '';
      do {
        result = (index % 26 + 10).toString(36) + result;
        index = Math.floor(index / 26) - 1;
      } while (index >= 0);
      return result;
    };

    for (let i = startIndex; i < diskCount; i++) {
      const name = diskType === MockDiskType.Nvme ? `nvme${i}n1` : generateName(i);
      diskNames.push('sd' + name);
    }

    return diskNames;
  }

  private generateDisk(size: number, offset: number, isAssigned = true): Disk {
    const name = this.generateDiskName(2 + offset, offset)[0];

    return {
      identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f' + offset.toString(),
      name,
      subsystem: 'scsi',
      number: 2080,
      serial: '1234567890abcd' + offset.toString(),
      lunid: null,
      size: size * TiB,
      description: '',
      duplicate_serial: [],
      transfermode: 'Auto',
      hddstandby: DiskStandby.AlwaysOn,
      advpowermgmt: DiskPowerLevel.Disabled,
      togglesmart: true,
      smartoptions: '',
      expiretime: null,
      critical: null,
      difference: null,
      informational: null,
      model: 'HARDDISK',
      rotationrate: null,
      type: DiskType.Hdd,
      zfs_guid: '594160193876939323',
      bus: DiskBus.Spi,
      devname: name,
      supports_smart: null,
      pool: isAssigned ? this.poolState.name : null,
    };
  }
}
