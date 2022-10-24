interface Enclosure {
  model: string;
  disks?: any[];
  diskKeys?: any;
  poolKeys?: any;
  enclosureKey?: number;
  number: number;
}

interface VDev {
  pool: string;
  type: string;
  disks?: any; // {devname: index} Only for mirrors and RAIDZ
  diskEnclosures?: any; // {devname: index} Only for mirrors and RAIDZ
  poolIndex: number;
  vdevIndex: number;
  topology: string;
}

export class SystemProfiler {
  // public systemDisks:any[] = [];
  platform: string; // Model Unit
  profile: Enclosure[] = [];
  headIndex: number;
  rearIndex: number;

  private _diskData: any[];
  get diskData() {
    return this._diskData;
  }
  set diskData(obj) {
    this._diskData = null;
    this._diskData = obj;
    this.parseDiskData(obj);
    this.parseEnclosures(this._enclosures);
  }

  private _enclosures: any;
  get enclosures() {
    return this._enclosures;
  }
  set enclosures(obj) {
    this._enclosures = obj;
  }

  private _pools: any;
  get pools() {
    return this._pools;
  }
  set pools(obj) {
    this._pools = obj;
    this.parsePoolsData(this._pools);
  }

  private _sensorData: any;
  get sensorData() {
    return this._sensorData;
  }
  set sensorData(obj) {
    this._sensorData = obj;
    this.parseSensorData(this._sensorData);
  }

  constructor(model, enclosures) {
    this.platform = model;
    this.enclosures = enclosures;
    this.createProfile();
  }

  createProfile() {
    this.enclosures.forEach((enclosure, index: number) => {
      // Detect rear drive bays
      if (enclosure.controller == true) {
        if (enclosure.id.includes('plx_enclosure')) {
          enclosure.model = this.enclosures[this.headIndex].model + ' Rear Bays';
          this.rearIndex = index;
        } else {
          this.headIndex = index;
        }
      }

      const series = this.getSeriesFromModel(this.platform);
      const profile = {
        model: this.headIndex == index ? series : enclosure.model,
        disks: [],
        diskKeys: {},
        poolKeys: {},
        number: enclosure.number,
        enclosure,
        label: enclosure.label,
        name: enclosure.name,
      };

      this.profile.push(profile);
    });

    if (typeof this.headIndex !== 'number') {
      console.warn('No Head Unit Detected! Defaulting to enclosure 0...');
      this.headIndex = 0;
    }
  }

  getSeriesFromModel(model: string): string {
    if (model.startsWith('Z')) {
      return 'Z Series';
    } if (model.startsWith('X')) {
      return 'X Series';
    } if (model.startsWith('M')) {
      return 'M Series';
    }
    return model;
  }

  getEnclosureIndexByNumber(number: number) {
    return this.profile.findIndex((enclosure) => enclosure.number === number);
  }

  getEnclosureByNumber(number: number) {
    return this.profile.find((enclosure) => enclosure.number === number);
  }

  private parseDiskData(disks) {
    // Clean the slate before we start
    this.profile.forEach((enc) => enc.disks = []);

    const data = disks; // DEBUG
    data.forEach((item, index) => {
      if (!item.enclosure) { return; } // Ignore boot disks
      const enclosure = this.getEnclosureByNumber(item.enclosure.number);
      if (!enclosure) {
        return;
      }
      item.status = 'AVAILABLE'; // Label it as available. If it is assigned to a vdev/pool then this will be overridden later.
      enclosure.diskKeys[item.devname] = enclosure.disks.length; // index to enclosure.disks
      enclosure.disks.push(item);
    });
  }

  private parseEnclosures(obj) {
    // Provide a shortcut to the enclosures object
    this.profile.forEach((profileItem, index) => {
      profileItem.enclosureKey = Number(index); // Make sure index 0 is not treated as boolean
    });
  }

  private parseSensorData(obj) {
    const powerStatus = obj.filter((v) => v.name.startsWith('PS'));
    if (this.enclosures[this.headIndex] && this.enclosures[this.headIndex].model == 'M Series') {
      const elements = powerStatus.map((item, index) => {
        item.descriptor = item.name;
        item.status = item.value == 1 ? 'OK' : 'FAILED';
        item.value = 'NONE';
        item.data = { Descriptor: item.descriptor, Value: item.value, Status: item.status };
        item.name = 'Power Supply';
        return item;
      });
      const powerSupply = { name: 'Power Supply', elements, header: ['descriptor', 'status', 'value'] };
      this.enclosures[this.headIndex].elements.push(powerSupply);
    }
  }

  private parsePoolsData(obj) {
    obj.forEach((pool, pIndex) => {
      if (!pool.topology) {
        return;
      }

      this.parseByTopology('data', pool, pIndex);
      this.parseByTopology('spare', pool, pIndex);
      this.parseByTopology('cache', pool, pIndex);
      this.parseByTopology('log', pool, pIndex);
      this.parseByTopology('special', pool, pIndex);
      this.parseByTopology('dedup', pool, pIndex);
    });
  }

  private parseByTopology(role, pool, pIndex) {
    pool.topology[role].forEach((vdev, vIndex) => {
      const v: VDev = {
        pool: pool.name,
        type: vdev.type,
        topology: role,
        poolIndex: pIndex,
        vdevIndex: vIndex,
        disks: {},
      };

      const stats = {}; // Store stats from pool.query disk info

      if (vdev.children.length == 0 && vdev.device) {
        const spl = vdev.device.split(/p(\d+)/g);
        const name = spl[0];
        v.disks[name] = -1; // no children so we use this as placeholder
      } else if (vdev.children.length > 0) {
        vdev.children.forEach((disk, dIndex) => {
          if (disk.device && disk.status != 'REMOVED') {
            const spl = disk.disk.split(/p(\d+)/g); // was disk.device
            const name = spl[0];
            v.disks[name] = dIndex;
            stats[name] = disk.stats;
          }
        });
      }
      this.storeVdevInfo(v, stats);
    });
  }

  getVdev(alias: VDev) {
    return this.pools[alias.poolIndex].topology.data[alias.vdevIndex];
  }

  storeVdevInfo(vdev: VDev, stats: any) {
    for (const diskName in vdev.disks) {
      this.addVDevToDiskInfo(diskName, vdev, stats[diskName]);
    }
  }

  addVDevToDiskInfo(diskName: string, vdev: VDev, stats?: any): void {
    const keys = Object.keys(vdev.disks);

    const enclosureIndex = this.getEnclosureNumber(diskName);
    const enclosure = this.profile[enclosureIndex];
    if (!enclosure) {
      console.warn('Enclosure number is undefined!');
      return;
    }

    const diskKey = enclosure.diskKeys[diskName];
    enclosure.disks[diskKey].vdev = vdev;
    enclosure.disks[diskKey].stats = stats;
    enclosure.disks[diskKey].status = this.getDiskStatus(diskName, enclosure, vdev);
    if (!enclosure.poolKeys[vdev.pool]) {
      enclosure.poolKeys[vdev.pool] = vdev.poolIndex;
    }
  }

  getDiskStatus(diskName, enclosure, vdev?: VDev): string {
    if (!vdev) {
      const diskIndex = enclosure.diskKeys[diskName];
      vdev = enclosure.disks[diskIndex].vdev;
    }

    let poolDisk;
    if (vdev.disks[diskName] == -1) {
      poolDisk = this.pools[vdev.poolIndex].topology[vdev.topology][vdev.vdevIndex];
    } else {
      poolDisk = this.pools[vdev.poolIndex].topology[vdev.topology][vdev.vdevIndex].children[vdev.disks[diskName]];
    }

    return poolDisk.status;
  }

  getVdevInfo(diskName) {
    // Returns vdev with slot info
    const enclosure = this.profile[this.getEnclosureNumber(diskName)];

    const disk = enclosure.disks[enclosure.diskKeys[diskName]];

    if (!disk.vdev) {
      return {
        pool: 'None',
        type: 'None',
        poolIndex: -1,
        vdevIndex: -1,
      };
    }

    const slots: any = { ...disk.vdev.disks };

    const vdev = { ...disk.vdev };
    vdev.diskEnclosures = {};
    const keys = Object.keys(slots);
    keys.forEach((d, index) => {
      const e = this.getEnclosureNumber(d);

      // is the disk on the current enclosure?
      const diskObj = enclosure.disks[enclosure.diskKeys[d]];
      if (!diskObj) {
        delete slots[d];
      } else {
        const s = diskObj.enclosure.slot;
        slots[d] = s;
      }
      vdev.diskEnclosures[d] = e;
    });

    vdev.selectedDisk = diskName;
    vdev.slots = slots;
    return vdev;
  }

  getEnclosureNumber(diskName) {
    // To be deprecated when middleware includes enclosure number with disk info
    let result;
    this.profile.forEach((enclosure, index) => {
      if (typeof enclosure.diskKeys[diskName] !== 'undefined') {
        result = index;
      }
    });
    return typeof result == 'undefined' ? -1 : result;
  }

  getEnclosureExpanders(index: number) {
    if (this.rearIndex && index == this.rearIndex) { index = this.headIndex; }
    const raw = this.enclosures[index].elements.filter((item) => item.name == 'SAS Expander');

    if (raw.length > 0) {
      return raw[0].elements;
    }
    return raw;
  }

  rawCapacity() {
    if (!this.diskData || this.diskData.length == 0) { return; }
    let capacity = 0;
    this.diskData.forEach((disk) => {
      if (disk.vdev && disk.vdev.topology == 'data') {
        capacity += disk.size;
      }
    });
    return capacity;
  }

  getEnclosureLabel(key) {
    return this.enclosures[key].label == this.enclosures[key].name ? this.enclosures[key].label : this.enclosures[key].model;
  }

  getDiskByID(id: string) {
    return this.diskData ? this.diskData.find((disk) => disk.identifier == id) : null;
  }
}
