import { TiB } from 'app/constants/bytes.constant';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { PoolTopologyCategory } from 'app/enums/pool-topology-category.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { Enclosure, EnclosureElement, EnclosureElementsGroup } from 'app/interfaces/enclosure.interface';
import { PoolInstance } from 'app/interfaces/pool.interface';
import {
  StorageDashboardDisk,
  TopologyDisk,
  TopologyItem,
  TopologyItemStats,
  VDev,
} from 'app/interfaces/storage.interface';
import { MockEnclosure } from './enclosure-templates/mock-enclosure-template';
import { MockEs24 } from './enclosure-templates/mock-es24';
import { MockM40 } from './enclosure-templates/mock-m40';
import { MockM50 } from './enclosure-templates/mock-m50';
import { MockM50Rear } from './enclosure-templates/mock-m50-rear';
import { MockMini30Xl } from './enclosure-templates/mock-mini-3.0-xl+';
import { MockMiniR } from './enclosure-templates/mock-mini-r';

export enum MockStorageScenario {
  Default = 'default',
  Uniform = 'uniform',
  Multi = 'multi', // Multiple problems
  MixedVdevLayout = 'mixedVdevLayout',
  MixedVdevCapacity = 'mixedVdevCapacity',
  MixedDiskCapacity = 'mixedDiskCapacity',
  MixedVdevWidth = 'mixedVdevWidth',
  NoRedundancy = 'noRedundancy',
}

export interface MockStorage {
  poolState: PoolInstance;
  disks: StorageDashboardDisk[];
  enclosures?: Enclosure[] | null;
}

export interface MockTopology {
  topologyItems: TopologyItem[];
  disks: StorageDashboardDisk[];
}

export interface AddTopologyOptions {
  scenario: MockStorageScenario;
  layout: TopologyItemType;
  diskSize: number;
  width: number;
  repeats: number;
}

export interface AddEnclosureOptions {
  controllerModel: string;
  expansionModels: string[];
  dispersal: EnclosureDispersalStrategy;
}

export enum EnclosureDispersalStrategy {
  Min = 'min',
  Max = 'max',
  Default = 'default',
}

export class MockStorageGenerator {
  poolState: PoolInstance;
  disks: StorageDashboardDisk[];
  enclosures: Enclosure[] | null = null;

  constructor() {
    // Creates a pool with empty topologies
    const storage = this.generateStorage();
    this.poolState = storage.poolState;
    this.disks = storage.disks;
  }

  // Generate Empty Topology & Disks
  private generateStorage(): MockStorage {
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
    } as PoolInstance;

    const disks: StorageDashboardDisk[] = [];

    return { poolState: pool, disks };
  }

  addDataTopology(options: AddTopologyOptions = {
    scenario: MockStorageScenario.NoRedundancy,
    layout: TopologyItemType.Stripe,
    diskSize: 4,
    width: 1,
    repeats: 1,
  }): MockStorageGenerator {
    this.addRaidzCapableTopology(PoolTopologyCategory.Data, options);
    return this;
  }

  addSpecialTopology(options: AddTopologyOptions = {
    scenario: MockStorageScenario.NoRedundancy,
    layout: TopologyItemType.Stripe,
    diskSize: 4,
    width: 1,
    repeats: 1,
  }): MockStorageGenerator {
    // The redundancy of this device should match the redundancy of the other normal devices in the pool
    this.addRaidzCapableTopology(PoolTopologyCategory.Special, options);
    return this;
  }

  addDedupTopology(options: AddTopologyOptions = {
    scenario: MockStorageScenario.NoRedundancy,
    layout: TopologyItemType.Stripe,
    diskSize: 4,
    width: 1,
    repeats: 1,
  }): MockStorageGenerator {
    // The redundancy of this device should match the redundancy of the other normal devices in the pool
    this.addRaidzCapableTopology(PoolTopologyCategory.Dedup, options);
    return this;
  }

  private addRaidzCapableTopology(category: PoolTopologyCategory, options: AddTopologyOptions = {
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
  addLogTopology(deviceCount: number, isMirror = false, diskSize = 4): MockStorageGenerator {
    if (isMirror) {
      this.addRaidzCapableTopology(PoolTopologyCategory.Log, {
        scenario: MockStorageScenario.Uniform,
        layout: TopologyItemType.Mirror,
        diskSize,
        width: 2,
        repeats: deviceCount,
      });
    } else {
      this.addSingleDeviceTopology(PoolTopologyCategory.Log, deviceCount, diskSize);
    }
    return this;
  }

  // Can create DISK devices. ZFS does not support RAIDZ or MIRROR for cache devices
  addCacheTopology(deviceCount: number, diskSize = 4): MockStorageGenerator {
    this.addSingleDeviceTopology(PoolTopologyCategory.Cache, deviceCount, diskSize);
    return this;
  }

  // Can create DISK devices. ZFS does not support RAIDZ or MIRROR for spares
  addSpareTopology(deviceCount: number, diskSize = 4): MockStorageGenerator {
    this.addSingleDeviceTopology(PoolTopologyCategory.Spare, deviceCount, diskSize);
    return this;
  }

  private addSingleDeviceTopology(category: PoolTopologyCategory, deviceCount: number, diskSize = 4): void {
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
    allDisks: StorageDashboardDisk[] = this.disks): MockTopology {
    const vdevs: TopologyItem[] = [];
    const disks: StorageDashboardDisk[] = [];

    for (let i = 0; i < repeats; i++) {
      const vdev: VDev = this.generateVdev(layout, width) as VDev;
      vdev.children.forEach((child: TopologyDisk) => {
        const disk = this.generateDisk(diskSize, (disks.length + allDisks.length));
        child.disk = disk.name;
        child.stats = { size: disk.size } as TopologyItemStats;
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
    allDisks: StorageDashboardDisk[] = this.disks): MockTopology {
    const vdevs: TopologyItem[] = [];
    const disks: StorageDashboardDisk[] = [];

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
    allDisks: StorageDashboardDisk[] = this.disks): MockTopology {
    const vdevs: TopologyItem[] = [];
    const disks: StorageDashboardDisk[] = [];

    for (let i = 0; i < repeats; i++) {
      const vdev: VDev = this.generateVdev(layout, width) as VDev;
      vdev.children.forEach((child: TopologyDisk, index) => {
        const childDiskSize = index === 0 ? diskSize + 1 : diskSize;
        const disk = this.generateDisk(childDiskSize, (disks.length + allDisks.length));
        child.disk = disk.name;
        child.stats = { size: disk.size } as TopologyItemStats;
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
    allDisks: StorageDashboardDisk[] = this.disks): MockTopology {
    if (repeats < 2) {
      console.error('ERROR: Minimum 2 VDEVs must be configured to generate mixed VDEV capacity scenario');
    }

    const vdevs: TopologyItem[] = [];
    const disks: StorageDashboardDisk[] = [];

    for (let i = 0; i < repeats; i++) {
      const vdev: VDev = this.generateVdev(layout, width) as VDev;
      const childDiskSize = i === 0 ? diskSize + 2 : diskSize;
      vdev.children.forEach((child: TopologyDisk) => {
        const disk = this.generateDisk(childDiskSize, (disks.length + allDisks.length));
        child.disk = disk.name;
        child.stats = { size: disk.size } as TopologyItemStats;
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
    allDisks: StorageDashboardDisk[] = this.disks): MockTopology {
    if (repeats < 2) {
      console.error('ERROR: Minimum 2 VDEVs must be configured to generate mixed VDEV width scenario');
    }

    const vdevs: TopologyItem[] = [];
    const disks: StorageDashboardDisk[] = [];

    for (let i = 0; i < repeats; i++) {
      const vdevWidth: number = i === 0 ? width + 1 : width;
      const vdev: VDev = this.generateVdev(layout, vdevWidth) as VDev;

      vdev.children.forEach((child: TopologyDisk) => {
        const disk = this.generateDisk(diskSize, (disks.length + allDisks.length));
        child.disk = disk.name;
        child.stats = { size: disk.size } as TopologyItemStats;
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
    allDisks: StorageDashboardDisk[] = this.disks): MockTopology {
    const vdevs: TopologyItem[] = [];
    const disks: StorageDashboardDisk[] = [];

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
      const vdev: VDev = this.generateVdev(targetLayout, targetWidth) as VDev;

      vdev.children.forEach((child: TopologyDisk) => {
        const disk = this.generateDisk(diskSize, (disks.length + allDisks.length));
        child.disk = disk.name;
        child.stats = { size: disk.size } as TopologyItemStats;
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
  private generateVdev(layout: TopologyItemType, width = 1): TopologyDisk | VDev {
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

        return {
          type: layout,
          children: vdevDisks,
          guid: Number(12345).toString(),
          unavail_disk: null,
          stats: { size: null } as TopologyItemStats,
          status: TopologyItemStatus.Online,
        } as VDev;
      }
      default:
        throw new Error('Invalid TopologyItemType. Please use STRIPE, MIRROR, RAIDZ etc');
    }
  }

  private generateTopologyDisk(): TopologyDisk {
    return {
      type: TopologyItemType.Disk,
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

  private generateDiskName(diskCount: number, startIndex = 0): string[] {
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
      const name = generateName(i);
      diskNames.push('sd' + name);
    }

    return diskNames;
  }

  private generateDisk(size: number, offset: number): StorageDashboardDisk {
    const name = this.generateDiskName(2 + offset, offset)[0];

    return {
      name,
      devname: name,
      size: this.terabytesToBytes(size),
      enclosure: null,
    } as StorageDashboardDisk;
  }

  terabytesToBytes(tb: number): number {
    return tb * TiB;
  }

  // Generate Enclosures
  addEnclosures(options: AddEnclosureOptions): void {
    // First create the enclosures
    const mockEnclosures: MockEnclosure[] = [];
    const controller: MockEnclosure = this.generateMockEnclosure(options.controllerModel, 0);
    mockEnclosures.push(controller);

    options.expansionModels.forEach((model: string, index) => {
      const shelf: MockEnclosure = this.generateMockEnclosure(model, index + 1);
      mockEnclosures.push(shelf);
    });

    // M50/M60 have separate chassis reported for rear drives
    if (options.controllerModel === 'M50' || options.controllerModel === 'M60') {
      const rearChassis: MockEnclosure = this.generateMockEnclosure(
        options.controllerModel + '-REAR',
        options.expansionModels.length + 1,
      );
      mockEnclosures.push(rearChassis);
    }

    // Next populate enclosures based on dispersal setting
    this.enclosures = this.populateEnclosures(mockEnclosures, options.dispersal);
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
      case 'MINI-3.0-XL+':
        chassis = new MockMini30Xl(enclosureNumber);
        break;
      case 'M50':
        chassis = new MockM50(enclosureNumber);
        break;
      case 'M50-REAR':
        chassis = new MockM50Rear(enclosureNumber);
        break;
      case 'ES24':
        chassis = new MockEs24(enclosureNumber);
        break;
      case 'M40':
        chassis = new MockM40(enclosureNumber);
        break;
      default:
        console.error('Chassis ' + model + ' not found');
    }

    return chassis;
  }

  private populateEnclosures(mockEnclosures: MockEnclosure[], dispersal: EnclosureDispersalStrategy): Enclosure[] {
    let populated: Enclosure[] = [];

    if (dispersal === EnclosureDispersalStrategy.Min) {
      //
    } else if (dispersal === EnclosureDispersalStrategy.Max) {
      //
    } else if (dispersal === EnclosureDispersalStrategy.Default) {
      populated = this.defaultDispersal(mockEnclosures);
    }
    return populated;
  }

  private defaultDispersal(mockEnclosures: MockEnclosure[]): Enclosure[] {
    let enclosureNumber = 0;
    let slotNumber = 1;

    this.disks.forEach((disk: StorageDashboardDisk, index: number) => {
      if (enclosureNumber < mockEnclosures.length) {
        // Update the enclosure data
        const mockEnclosure = mockEnclosures[enclosureNumber];
        mockEnclosure.addDiskToSlot(disk.name, slotNumber);

        // Update the disk data
        this.disks[index].enclosure = {
          number: mockEnclosure.data.number,
          slot: slotNumber,
        };
      }

      // Set counters...
      if (slotNumber >= mockEnclosures[enclosureNumber]?.totalSlots) {
        enclosureNumber++;
        slotNumber = 1;
      } else {
        slotNumber++;
      }
    });

    return mockEnclosures.map((mock: MockEnclosure) => mock.data);
  }

  getEnclosureSlots(enclosureNumber: number): EnclosureElement[] {
    const selectedEnclosure = this.enclosures.find((enclosure: Enclosure) => {
      return enclosure.number === enclosureNumber;
    });
    return (selectedEnclosure.elements[0] as EnclosureElementsGroup).elements;
  }
}
