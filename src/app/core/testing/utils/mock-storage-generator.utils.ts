import { TiB } from 'app/constants/bytes.constant';
import { EnclosureDispersalStrategy, MockDiskType, MockStorageScenario } from 'app/core/testing/enums/mock-storage.enum';
import {
  AddEnclosureOptions,
  AddTopologyOptions,
  AddUnAssignedOptions,
  DispersedData,
  MockStorage,
  MockTopology,
} from 'app/core/testing/interfaces/mock-storage-generator.interface';
import { DiskBus } from 'app/enums/disk-bus.enum';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { DiskType } from 'app/enums/disk-type.enum';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { TopologyItemType, VdevType } from 'app/enums/v-dev-type.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { Enclosure, EnclosureElement, EnclosureElementsGroup } from 'app/interfaces/enclosure.interface';
import { PoolInstance } from 'app/interfaces/pool.interface';
import {
  Disk,
  EnclosureAndSlot,
  TopologyDisk,
  TopologyItem,
  TopologyItemStats,
  VDev,
} from 'app/interfaces/storage.interface';
import { MockE16 } from './enclosure-templates/mock-e16';
import { MockE24 } from './enclosure-templates/mock-e24';
import { MockEnclosure } from './enclosure-templates/mock-enclosure-template';
import { MockEs102 } from './enclosure-templates/mock-es102';
import { MockEs12 } from './enclosure-templates/mock-es12';
import { MockEs24 } from './enclosure-templates/mock-es24';
import { MockEs60 } from './enclosure-templates/mock-es60';
import { MockF60 } from './enclosure-templates/mock-f60';
import { MockM40 } from './enclosure-templates/mock-m40';
import { MockM50 } from './enclosure-templates/mock-m50';
import { MockM50Rear } from './enclosure-templates/mock-m50-rear';
import { MockMini30Eplus } from './enclosure-templates/mock-mini-3.0-e+';
import { MockMini30X } from './enclosure-templates/mock-mini-3.0-x';
import { MockMini30Xplus } from './enclosure-templates/mock-mini-3.0-x+';
import { MockMini30Xl } from './enclosure-templates/mock-mini-3.0-xl+';
import { MockMiniR } from './enclosure-templates/mock-mini-r';
import { MockR10 } from './enclosure-templates/mock-r10';
import { MockR20 } from './enclosure-templates/mock-r20';
import { MockR30 } from './enclosure-templates/mock-r30';
import { MockR40 } from './enclosure-templates/mock-r40';
import { MockR50 } from './enclosure-templates/mock-r50';


export class MockStorageGenerator {
  poolState: PoolInstance;
  disks: Disk[];
  enclosures: Enclosure[] | null = null;
  private mockEnclosures: MockEnclosure[] = [];

  constructor(mockPool = true) {
    // Creates a pool with empty topologies
    const storage = this.generateStorage(mockPool);
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
    } as PoolInstance;

    const disks: Disk[] = [];

    return { poolState: pool, disks };
  }

  addUnassignedDisks(options: AddUnAssignedOptions): this {
    const offset = this.disks.length;
    for (let i = 0; i < options.repeats; i++) {
      this.disks.push(this.generateDisk(options.diskSize, offset + i, false));
    }
    return this;
  }

  addDataTopology(options: AddTopologyOptions = {
    scenario: MockStorageScenario.NoRedundancy,
    layout: TopologyItemType.Stripe,
    diskSize: 4,
    width: 1,
    repeats: 1,
  }): this {
    this.addRaidzCapableTopology(VdevType.Data, options);
    return this;
  }

  addSpecialTopology(options: AddTopologyOptions = {
    scenario: MockStorageScenario.NoRedundancy,
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
    scenario: MockStorageScenario.NoRedundancy,
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
    scenario: MockStorageScenario.NoRedundancy,
    layout: TopologyItemType.Stripe,
    diskSize: 4,
    width: 1,
    repeats: 1,
  }): void {
    switch (options.scenario) {
      case MockStorageScenario.NoRedundancy: {
        const noRedundancy: MockTopology = this.generateNoRedundancyTopology(4, options.diskSize, options.width);
        this.disks = this.disks.concat(noRedundancy.disks);
        this.poolState.topology[category] = this.poolState.topology[category]
          .concat(noRedundancy.topologyItems);
        break;
      }
      case MockStorageScenario.Uniform: {
        if (options.layout === TopologyItemType.Stripe || options.layout === TopologyItemType.Disk) {
          options.layout = TopologyItemType.Mirror;
        }

        const uniform = this.generateUniformTopology(options.layout, options.repeats, options.diskSize, options.width);
        this.disks = this.disks.concat(uniform.disks);
        this.poolState.topology[category] = this.poolState.topology[category].concat(uniform.topologyItems);
        break;
      }
      case MockStorageScenario.MixedDiskCapacity: {
        if (options.layout === TopologyItemType.Stripe || options.layout === TopologyItemType.Disk) {
          options.layout = TopologyItemType.Mirror;
        }

        const mixedDisk = this.generateMixedDiskCapacityTopology(options.layout,
          options.repeats,
          options.diskSize,
          options.width);

        this.disks = this.disks.concat(mixedDisk.disks);
        this.poolState.topology[category] = this.poolState.topology[category]
          .concat(mixedDisk.topologyItems);
        break;
      }
      case MockStorageScenario.MixedVdevCapacity: {
        const mixedVdevs = this.generateMixedVdevCapacityTopology(options.layout,
          options.repeats,
          options.diskSize,
          options.width);

        this.disks = this.disks.concat(mixedVdevs.disks);
        this.poolState.topology[category] = this.poolState.topology[category]
          .concat(mixedVdevs.topologyItems);
        break;
      }
      case MockStorageScenario.MixedVdevWidth: {
        const mixedWidths = this.generateMixedWidthTopology(options.layout,
          options.repeats,
          options.diskSize,
          options.width);

        this.disks = this.disks.concat(mixedWidths.disks);
        this.poolState.topology[category] = this.poolState.topology[category]
          .concat(mixedWidths.topologyItems);
        break;
      }
      case MockStorageScenario.MixedVdevLayout: {
        const mixedLayouts = this.generateMixedLayoutTopology(options.layout,
          options.repeats,
          options.diskSize,
          options.width);

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
        scenario: MockStorageScenario.Uniform,
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
  private generateUniformTopology(layout: TopologyItemType,
    repeats: number,
    diskSize: number,
    width: number,
    allDisks: Disk[] = this.disks): MockTopology {
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

  private generateNoRedundancyTopology(repeats: number,
    diskSize: number,
    width: number,
    allDisks: Disk[] = this.disks): MockTopology {
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

  private generateMixedDiskCapacityTopology(layout: TopologyItemType,
    repeats: number,
    diskSize: number,
    width: number,
    allDisks: Disk[] = this.disks): MockTopology {
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

  private generateMixedVdevCapacityTopology(layout: TopologyItemType,
    repeats: number,
    diskSize: number,
    width: number,
    allDisks: Disk[] = this.disks): MockTopology {
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

  private generateMixedWidthTopology(layout: TopologyItemType,
    repeats: number,
    diskSize: number,
    width: number,
    allDisks: Disk[] = this.disks): MockTopology {
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

  private generateMixedLayoutTopology(layout: TopologyItemType,
    repeats: number,
    diskSize: number,
    width: number,
    allDisks: Disk[] = this.disks): MockTopology {
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
      size: this.terabytesToBytes(size),
      description: '',
      duplicate_serial: [],
      multipath_member: '',
      multipath_name: '',
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
      enclosure: null,
      supports_smart: null,
      pool: isAssigned ? this.poolState.name : null,
    };
  }

  terabytesToBytes(tb: number): number {
    return tb * TiB;
  }

  // Generate Enclosures
  addEnclosures(options: AddEnclosureOptions): void {
    // First create the mock enclosures
    const mockEnclosures: MockEnclosure[] = [];
    const controller: MockEnclosure = this.generateMockEnclosure(options.controllerModel, 0);
    mockEnclosures.push(controller);

    options.expansionModels.forEach((model: string, index) => {
      const shelf: MockEnclosure = this.generateMockEnclosure(model, index + 1);
      mockEnclosures.push(shelf);
    });
    this.mockEnclosures = mockEnclosures;

    // M50/M60 have separate chassis reported for rear drives
    if (options.controllerModel === 'M50' || options.controllerModel === 'M60') {
      const rearChassis: MockEnclosure = this.generateMockEnclosure(
        options.controllerModel + '-REAR',
        options.expansionModels.length + 1,
      );
      mockEnclosures.push(rearChassis);
    }

    // Next populate enclosures based on dispersal setting
    const populated = this.populateEnclosures(mockEnclosures, options.dispersal);
    this.enclosures = populated.enclosures;
    this.disks = populated.disks;
  }

  private generateMockEnclosure(
    model = 'M40',
    enclosureNumber = 0,
  ): MockEnclosure {
    let chassis: MockEnclosure;
    switch (model) {
      case 'MINI-R':
        chassis = new MockMiniR(enclosureNumber);
        break;
      case 'MINI-3.0-E+':
        chassis = new MockMini30Eplus(enclosureNumber);
        break;
      case 'MINI-3.0-X':
        chassis = new MockMini30X(enclosureNumber);
        break;
      case 'MINI-3.0-X+':
        chassis = new MockMini30Xplus(enclosureNumber);
        break;
      case 'MINI-3.0-XL+':
        chassis = new MockMini30Xl(enclosureNumber);
        break;
      case 'M50':
        chassis = new MockM50(enclosureNumber);
        break;
      case 'M50-REAR':
        chassis = new MockM50Rear(enclosureNumber);
        break;
      case 'ES12':
        chassis = new MockEs12(enclosureNumber);
        break;
      case 'E16':
        chassis = new MockE16(enclosureNumber);
        break;
      case 'E24':
        chassis = new MockE24(enclosureNumber);
        break;
      case 'ES24':
        chassis = new MockEs24(enclosureNumber);
        break;
      case 'ES60':
        chassis = new MockEs60(enclosureNumber);
        break;
      case 'ES102':
        chassis = new MockEs102(enclosureNumber);
        break;
      case 'M40':
        chassis = new MockM40(enclosureNumber);
        break;
      case 'R10':
        chassis = new MockR10(enclosureNumber);
        break;
      case 'R20':
        chassis = new MockR20(enclosureNumber);
        break;
      case 'R30':
        chassis = new MockR30(enclosureNumber);
        break;
      case 'R40':
        chassis = new MockR40(enclosureNumber);
        break;
      case 'R50':
        chassis = new MockR50(enclosureNumber);
        break;
      case 'F60':
        chassis = new MockF60(enclosureNumber);
        break;
      default:
        console.error('Chassis ' + model + ' not found');
    }

    return chassis;
  }

  private populateEnclosures(
    mockEnclosures: MockEnclosure[],
    dispersal: EnclosureDispersalStrategy,
    disks: Disk[] = this.disks,
  ): DispersedData {
    let populated: DispersedData;

    if (!disks || disks.length === 0) {
      populated = {
        enclosures: mockEnclosures.map((mock: MockEnclosure) => mock.data),
        disks,
      };
    } else if (dispersal === EnclosureDispersalStrategy.Existing) {
      populated = this.existingDispersal(mockEnclosures, disks);
    } else if (dispersal === EnclosureDispersalStrategy.Min) {
      // TODO: Add support for minimum dispersal (keep all vdev members on same chassis)
    } else if (dispersal === EnclosureDispersalStrategy.Max) {
      // TODO: Add support for maximum dispersal (spread out all vdev members across all enclosures. eg. every disk on
      //  a different enclosure)
    } else if (dispersal === EnclosureDispersalStrategy.Default) {
      populated = this.defaultDispersal(mockEnclosures, disks);
    }

    return populated;
  }

  updateDisks(disks: Disk[], dispersal: EnclosureDispersalStrategy = EnclosureDispersalStrategy.Default): Disk[] {
    if (!this.mockEnclosures || this.mockEnclosures.length === 0) {
      console.error('No enclosures to populate. Please create enclosures using MockStorageGenerator.addEnclosures()');
    }

    if (!disks || disks.length === 0) {
      console.warn('No disks to populate. Please create enclosures using MockStorageGenerator.addEnclosures()');
      return disks;
    }

    const addedDisks = [...disks].filter((disk: Disk) => {
      const found = this.disks.filter((existingDisk: Disk) => existingDisk.name === disk.name);
      return found.length === 0;
    });

    const removedDisks = [...this.disks].filter((disk: Disk) => {
      const found = disks.filter((existingDisk: Disk) => existingDisk.name === disk.name);
      return found.length === 0;
    });

    if (this.disks.length > 0) {
      let dispersedData: DispersedData;

      if (removedDisks.length > 0) {
        const removalData = this.removeDisksFromEnclosures(removedDisks);
        dispersedData = removalData;
      }

      if (addedDisks.length > 0) {
        const addedData: Disk[] = this.attachNextAvailableSlot(Object.assign([], addedDisks)).concat(this.disks);
        dispersedData = this.existingDispersal(this.mockEnclosures, addedData);
      }

      if (dispersedData) {
        this.enclosures = dispersedData.enclosures;
        this.disks = dispersedData.disks;

        return dispersedData.disks;
      }
      return this.disks;
    }
    const populated = this.populateEnclosures(this.mockEnclosures, dispersal, disks);
    this.enclosures = populated.enclosures;
    this.disks = populated.disks;

    return populated.disks;
  }

  // Initial Dispersal Options
  private defaultDispersal(mockEnclosures: MockEnclosure[], disks: Disk[]): DispersedData {
    // Puts disks into slots in series
    let enclosureNumber = 0;
    let slotNumber = 1;
    const updatedDisks: Disk[] = [];

    disks.forEach((disk: Disk) => {
      if (enclosureNumber < mockEnclosures.length) {
        // Update the enclosure data
        // const mockEnclosure = mockEnclosures[enclosureNumber];
        mockEnclosures[enclosureNumber].addDiskToSlot(disk.name, slotNumber);

        // Update the disk data
        const updatedDisk: Disk = { ...disk }; // Object.assign({}, disk)
        const enclosureAndSlot: EnclosureAndSlot = {
          number: mockEnclosures[enclosureNumber].data.number,
          slot: slotNumber,
        };
        updatedDisk.enclosure = enclosureAndSlot;
        updatedDisks.push(updatedDisk);
      }

      // Set counters...
      if (slotNumber >= mockEnclosures[enclosureNumber]?.totalSlots) {
        enclosureNumber++;
        slotNumber = 1;
      } else {
        slotNumber++;
      }
    });

    return {
      enclosures: mockEnclosures.map((mock: MockEnclosure) => mock.data),
      disks: updatedDisks,
    };
  }

  private existingDispersal(mockEnclosures: MockEnclosure[], disks: Disk[]): DispersedData {
    // When working with disks with enclosure data already assigned
    // eg. UI is pointed at a product that already has enclosure support
    disks.forEach((disk: Disk) => {
      if (!disk.enclosure) return;

      const mockEnclosure = mockEnclosures[disk.enclosure.number];
      mockEnclosure.addDiskToSlot(disk.name, disk.enclosure.slot);
    });

    return {
      enclosures: mockEnclosures.map((mock: MockEnclosure) => mock.data),
      disks,
    };
  }

  private attachNextAvailableSlot(disks: Disk[]): Disk[] {
    const emptySlots = this.getAllEmptySlots();
    if (disks.length > emptySlots.length) return disks;

    return disks.map((disk: Disk, index: number) => {
      if (disk.enclosure === null || !disk.enclosure) {
        disk.enclosure = emptySlots[index];
      }
      return disk;
    });
  }

  getEnclosureSlots(enclosureNumber: number): EnclosureElement[] {
    const selectedEnclosure = this.enclosures.find((enclosure: Enclosure) => {
      return enclosure.number === enclosureNumber;
    });
    return (selectedEnclosure.elements[0] as EnclosureElementsGroup).elements;
  }

  getEmptySlots(enclosureNumber: number): EnclosureElement[] {
    return this.getEnclosureSlots(enclosureNumber).filter((element: EnclosureElement) => element.status !== 'OK');
  }

  getAllEmptySlots(): EnclosureAndSlot[] {
    let allEmptySlots: EnclosureAndSlot[] = [];
    this.mockEnclosures.forEach((mockEnclosure: MockEnclosure) => {
      const emptySlots: EnclosureAndSlot[] = mockEnclosure.getEmptySlots().map((element: EnclosureElement) => {
        return {
          number: mockEnclosure.data.number,
          slot: element.slot,
        };
      });
      allEmptySlots = allEmptySlots.concat(emptySlots);
    });

    return allEmptySlots;
  }

  private removeDisksFromEnclosures(removedDisks: Disk[]): DispersedData {
    let updatedDisks = [...this.disks];
    removedDisks.forEach((disk: Disk) => {
      this.removeDiskFromEnclosure(disk);
      updatedDisks = updatedDisks.filter((oldDisk: Disk) => oldDisk.name !== disk.name);
    });

    return {
      enclosures: this.mockEnclosures.map((mock: MockEnclosure) => mock.data),
      disks: updatedDisks, // this.disks,
    };
  }

  private removeDiskFromEnclosure(disk: Disk): this {
    const mockEnclosureIndex: number = this.mockEnclosures.findIndex((mockEnclosure: MockEnclosure) => {
      return mockEnclosure.data.number === disk.enclosure.number;
    });
    this.mockEnclosures[mockEnclosureIndex].removeDiskFromSlot(disk.name, disk.enclosure.slot);

    return this;
  }
}
