import { PoolTopologyCategory } from 'app/enums/pool-topology-category.enum';
import {
  Enclosure,
  EnclosureElement,
  EnclosureElementData,
  EnclosureElementsGroup,
} from 'app/interfaces/enclosure.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { Sensor } from 'app/interfaces/sensor.interface';
import {
  Disk, isTopologyDisk, TopologyItemStats,
} from 'app/interfaces/storage.interface';

export enum EnclosureRelation {
  Controller = 'controller',
  RearSlots = 'rearSlots',
  FrontSlots = 'frontSlots',
  Shelf = 'shelf',
}

export interface EnclosureDisk extends Disk {
  vdev: VDevMetadata;
  stats: TopologyItemStats;
  status: string;
}

export interface EnclosureMetadata {
  model: string;
  disks?: EnclosureDisk[];
  diskKeys?: { [diskName: string]: number };
  poolKeys?: { [pool: string]: number };
  enclosureKey?: number;
  relationship: EnclosureRelation;
  siblings?: number[];
}

export interface VDevMetadata {
  pool: string;
  type: string;
  poolIndex: number;
  vdevIndex: number;
  name: string;
  disks?: { [devName: string]: number }; // {devname: index} Only for mirrors and RAIDZ
  diskEnclosures?: { [devName: string]: number }; // {devname: index} Only for mirrors and RAIDZ
  topology?: PoolTopologyCategory;
  selectedDisk?: string;
  slots?: { [devName: string]: number };
}

export class SystemProfiler {
  platform: string; // Model Unit
  profile: EnclosureMetadata[] = [];
  headIndex: number;
  rearIndex: number;

  private _diskData: (Disk & { vdev?: VDevMetadata })[];
  get diskData(): (Disk & { vdev?: VDevMetadata })[] {
    return this._diskData;
  }
  set diskData(obj) {
    this._diskData = null;
    this._diskData = obj;
    this.parseDiskData(obj);
    this.parseEnclosures();
  }

  private _enclosures: Enclosure[];
  get enclosures(): Enclosure[] {
    return this._enclosures;
  }
  set enclosures(obj) {
    this._enclosures = obj;
  }

  private _pools: Pool[];
  get pools(): Pool[] {
    return this._pools;
  }
  set pools(obj) {
    this._pools = obj;
    this.parsePoolsData(this._pools);
  }

  private _sensorData: Sensor[];
  get sensorData(): Sensor[] {
    return this._sensorData;
  }
  set sensorData(obj) {
    this._sensorData = obj;
    this.parseSensorData(this._sensorData);
  }

  get isRackmount(): boolean {
    switch (this.platform) {
      case 'mini':
      case 'mini-x':
      case 'mini-xl':
      case 'mini-xl-plus':
      case 'FREENAS-MINI-3.0':
      case 'TRUENAS-MINI-3.0':
      case 'FREENAS-MINI-3.0-E':
      case 'TRUENAS-MINI-3.0-E':
      case 'FREENAS-MINI-3.0-E+':
      case 'TRUENAS-MINI-3.0-E+':
      case 'FREENAS-MINI-3.0-X':
      case 'TRUENAS-MINI-3.0-X':
      case 'FREENAS-MINI-3.0-X+':
      case 'TRUENAS-MINI-3.0-X+':
      case 'FREENAS-MINI-3.0-XL+':
      case 'TRUENAS-MINI-3.0-XL+':
        return false;
      default:
        return true;
    }
  }

  constructor(model: string, enclosures: Enclosure[]) {
    this.platform = model;
    this.enclosures = enclosures;
    this.createProfile();
  }

  createProfile(): void {
    // with the enclosure info we set up basic data structure
    const controllers: number[] = [];
    for (let i = 0; i < this.enclosures.length; i++) {
      let relationship = EnclosureRelation.Shelf;
      // Detect rear drive bays
      if (this.enclosures[i].controller) {
        if (this.enclosures[i].id.includes('plx_enclosure')) {
          this.enclosures[i].model = this.enclosures[this.headIndex].model + ' Rear Bays';
          this.rearIndex = i;
          relationship = EnclosureRelation.RearSlots;
        } else if (!controllers.length) {
          this.headIndex = i;
          controllers.push(i);
          relationship = EnclosureRelation.Controller;
        } else {
          relationship = EnclosureRelation.FrontSlots;
          controllers.push(i);
          const head = this.profile[this.headIndex];
          head.siblings = head.siblings.concat(controllers.filter((ctl: number) => ctl !== this.headIndex));
        }
      }

      const series = this.getSeriesFromModel(this.platform);
      const enclosure: EnclosureMetadata = {
        model: this.headIndex === i ? series : this.enclosures[i].model,
        disks: [],
        diskKeys: {},
        poolKeys: {},
        relationship,
        siblings: [],
      };

      this.profile.push(enclosure);
    }

    if (typeof this.headIndex !== 'number') {
      console.warn('No Head Unit Detected! Defaulting to enclosure 0...');
      this.headIndex = 0;
    }
  }

  getSeriesFromModel(model: string): string {
    if (model.startsWith('Z')) {
      return 'Z Series';
    }
    if (model.startsWith('X')) {
      return 'X Series';
    }
    if (model.startsWith('M')) {
      return 'M Series';
    }
    return model;
  }

  private parseDiskData(disks: Disk[]): void {
    // Clean the slate before we start
    this.profile.forEach((enc) => enc.disks = []);

    disks.forEach((item: EnclosureDisk) => {
      if (!item.enclosure) { return; } // Ignore boot disks

      const enclosure = this.profile[item.enclosure.number];
      if (!enclosure) { return; }
      item.status = 'AVAILABLE'; // Label it as available. If it is assigned to a vdev/pool then this will be overridden later.
      enclosure.diskKeys[item.devname] = enclosure.disks.length; // index to enclosure.disks
      enclosure.disks.push(item);
    });
  }

  private parseEnclosures(): void {
    // Provide a shortcut to the enclosures object
    this.profile.forEach((profileItem, index) => {
      profileItem.enclosureKey = Number(index); // Make sure index 0 is not treated as boolean
    });
  }

  private parseSensorData(sensors: Sensor[]): void {
    const powerStatus = sensors.filter((sensor) => sensor.name.startsWith('PS'));
    if (this.enclosures[this.headIndex] && this.enclosures[this.headIndex].model === 'M Series') {
      const elements = powerStatus.map((item) => {
        const status = item.value === 1 ? 'OK' : 'FAILED';
        return {
          descriptor: item.name,
          status,
          value: 'NONE',
          data: { Descriptor: item.name, Value: String(item.value), Status: status } as EnclosureElementData,
          name: 'Power Supply',
        };
      }) as EnclosureElement[];
      const powerSupply = { name: 'Power Supply', elements, header: ['Descriptor', 'Status', 'Value'] } as EnclosureElementsGroup;
      (this.enclosures[this.headIndex].elements as EnclosureElementsGroup[]).push(powerSupply);
    }
  }

  private parsePoolsData(pools: Pool[]): void {
    pools.forEach((pool, pIndex) => {
      if (!pool.topology) {
        return;
      }

      this.parseByTopology(PoolTopologyCategory.Data, pool, pIndex);
      this.parseByTopology(PoolTopologyCategory.Spare, pool, pIndex);
      this.parseByTopology(PoolTopologyCategory.Cache, pool, pIndex);
      this.parseByTopology(PoolTopologyCategory.Log, pool, pIndex);
      this.parseByTopology(PoolTopologyCategory.Special, pool, pIndex);
      this.parseByTopology(PoolTopologyCategory.Dedup, pool, pIndex);
    });
  }

  private parseByTopology(role: PoolTopologyCategory, pool: Pool, pIndex: number): void {
    pool.topology[role].forEach((vdev, vIndex) => {
      const metadata: VDevMetadata = {
        pool: pool.name,
        name: vdev.name,
        type: vdev.type,
        topology: role,
        poolIndex: pIndex,
        vdevIndex: vIndex,
        disks: {},
      };

      const stats: { [name: string]: TopologyItemStats } = {}; // Store stats from pool.query disk info

      if (vdev.children.length === 0 && isTopologyDisk(vdev)) {
        const name = vdev.disk;
        metadata.disks[name] = -1; // no children so we use this as placeholder
      } else if (vdev.children.length > 0) {
        vdev.children.forEach((disk, dIndex) => {
          if (disk.device && disk.status !== 'REMOVED') {
            const name = disk.disk;
            metadata.disks[name] = dIndex;
            stats[name] = disk.stats;
          }
        });
      }
      this.storeVdevInfo(metadata, stats);
    });
  }

  storeVdevInfo(vdev: VDevMetadata, stats: { [name: string]: TopologyItemStats }): void {
    Object.keys(vdev.disks).forEach((diskName) => {
      this.addVdevToDiskInfo(diskName, vdev, stats[diskName]);
    });
  }

  addVdevToDiskInfo(diskName: string, vdev: VDevMetadata, stats?: TopologyItemStats): void {
    const enclosureIndex = this.getEnclosureNumber(diskName);
    const enclosure: EnclosureMetadata = this.profile[enclosureIndex];
    if (!enclosure) {
      console.warn('Enclosure number is undefined!');
      return;
    }

    const diskKey: number = enclosure.diskKeys[diskName];
    enclosure.disks[diskKey].vdev = vdev;
    enclosure.disks[diskKey].stats = stats;
    enclosure.disks[diskKey].status = this.getDiskStatus(diskName, enclosure, vdev);
    if (!enclosure.poolKeys[vdev.pool]) {
      enclosure.poolKeys[vdev.pool] = vdev.poolIndex;
    }
  }

  getDiskStatus(diskName: string, enclosure: EnclosureMetadata, vdev?: VDevMetadata): string {
    if (!vdev) {
      const diskIndex = enclosure.diskKeys[diskName];
      vdev = enclosure.disks[diskIndex].vdev;
    }

    let poolDisk;
    if (vdev.disks[diskName] === -1) {
      poolDisk = this.pools[vdev.poolIndex].topology[vdev.topology][vdev.vdevIndex];
    } else {
      poolDisk = this.pools[vdev.poolIndex].topology[vdev.topology][vdev.vdevIndex].children[vdev.disks[diskName]];
    }

    return poolDisk.status;
  }

  getVdevInfo(diskName: string): VDevMetadata {
    // Returns vdev with slot info
    const enclosure = this.profile[this.getEnclosureNumber(diskName)];

    const disk = enclosure.disks[enclosure.diskKeys[diskName]];

    if (!disk.vdev) {
      return {
        pool: 'None',
        type: 'None',
        poolIndex: -1,
        vdevIndex: -1,
        name: '',
      };
    }

    const slots = { ...disk.vdev.disks };

    const vdev = { ...disk.vdev };
    vdev.diskEnclosures = {};
    const keys = Object.keys(slots);
    keys.forEach((diskKey) => {
      const enclosureNumber = this.getEnclosureNumber(diskKey);

      // is the disk on the current enclosure?
      const diskObj = enclosure.disks[enclosure.diskKeys[diskKey]];
      if (!diskObj) {
        delete slots[diskKey];
      } else {
        slots[diskKey] = diskObj.enclosure.slot;
      }
      vdev.diskEnclosures[diskKey] = enclosureNumber;
    });

    vdev.selectedDisk = diskName;
    vdev.slots = slots;
    return vdev;
  }

  getEnclosureNumber(diskName: string): number {
    // To be deprecated when middleware includes enclosure number with disk info
    let result: number;
    this.profile.forEach((enclosure, index) => {
      if (typeof enclosure.diskKeys[diskName] !== 'undefined') {
        result = index;
      }
    });
    return typeof result === 'undefined' ? -1 : result;
  }

  getEnclosureExpanders(index: number): EnclosureElement[] | EnclosureElementsGroup[] {
    if (this.rearIndex && index === this.rearIndex) { index = this.headIndex; }
    const raw = (this.enclosures[index].elements as EnclosureElementsGroup[]).filter((item) => {
      return item.name === 'SAS Expander';
    });

    if (raw.length > 0) {
      return raw[0].elements;
    }
    return raw;
  }

  rawCapacity(): number {
    if (!this.diskData || this.diskData.length === 0) {
      return undefined;
    }
    let capacity = 0;
    this.diskData.forEach((disk) => {
      if (disk.vdev && disk.vdev.topology === 'data') {
        capacity += disk.size;
      }
    });
    return capacity;
  }

  getShelfCount(): number {
    const shelves = this.profile.filter((metadata: EnclosureMetadata) => {
      return metadata.relationship === EnclosureRelation.Shelf;
    });
    return shelves.length;
  }

  getSiblingSlots(enclosure: EnclosureMetadata): EnclosureElement[] {
    const elements = this.enclosures[enclosure.enclosureKey].elements[0] as EnclosureElementsGroup;
    return elements.elements;
  }

  // Returns the slot number the chassis view should use
  getSiblingSlotAlias(diskName: string, chassisSlotCount: number, offset = 5): number {
    const disk: EnclosureDisk = this.getDiskByName(diskName);
    const slot = disk.enclosure.slot;
    return slot + offset;
  }

  getController(): EnclosureMetadata {
    return this.profile.find((metadata: EnclosureMetadata) => {
      return metadata.relationship === EnclosureRelation.Controller;
    });
  }

  isDiskOnController(diskName: string): boolean {
    const enclosureKey = this.profile.find((metadata: EnclosureMetadata) => {
      return metadata.disks.find((disk: EnclosureDisk) => disk.name === diskName);
    }).enclosureKey;

    return enclosureKey === this.getController().enclosureKey;
  }

  getDiskByName(diskName: string): EnclosureDisk {
    const enclosure: EnclosureMetadata = this.profile.find((metadata: EnclosureMetadata) => {
      return metadata.disks.find((disk: EnclosureDisk) => disk.name === diskName);
    });
    const enclosureDisk: EnclosureDisk = enclosure.disks.find((disk: EnclosureDisk) => disk.name === diskName);
    return enclosureDisk;
  }
}
