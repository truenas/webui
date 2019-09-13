interface Enclosure {
  model: string;
  disks?: any[];
  diskKeys?: any;
  poolKeys?: any;
  enclosureKey?: number;
}

interface VDev {
  pool: string;
  type: string;
  disks?: any; // {devname: index} Only for mirrors and RAIDZ
  poolIndex: number;
  vdevIndex: number;
  topology: string;
}

export class SystemProfiler {

  public systemDisks:any[] = [];
  public platform: string; // Model Unit
  public profile: Enclosure[] = [];
  public headIndex: number;

  private _diskData: any[];
  get diskData(){
    return this._diskData;
  }
  set diskData(obj){
    this._diskData = this.filterSystemDisk(obj);
    this.parseDiskData(this._diskData);
    this.parseEnclosures(this._enclosures);
  }


  private _enclosures: any;
  get enclosures(){
    return this._enclosures;
  }
  set enclosures(obj){
    this._enclosures = obj;
  }

  private _pools: any;
  get pools(){
    return this._pools;
  }
  set pools(obj){
    this._pools = obj;
    this.parsePoolsData(this._pools);
  }

  constructor(model, data) {
    this.platform = model;
    this.enclosures = data;
    this.createProfile();
  }

  createProfile(){
    // with the enclosure info we set up basic data structure
    for(let i = 0; i < this.enclosures.length; i++){

      if(this.enclosures[i].controller == true){ 
        this.headIndex = i;
      }

      const series = this.getSeriesFromModel(this.platform);
      let enclosure = {
        model: this.headIndex == i ? series : this.enclosures[i].model, 
        disks: [], 
        diskKeys: {}, 
        poolKeys: {} 
      };

      this.profile.push(enclosure);
    }

    if(typeof this.headIndex !== 'number'){
      console.warn("No Head Unit Detected! Defaulting to enclosure 0...");
      this.headIndex = 0;
    } 
    
  }

  getSeriesFromModel(model: string): string{
    if(model.startsWith('Z')){
      return 'Z Series';
    } else if(model.startsWith('X')){
      return 'X Series';
    } else if(model.startsWith('M')){
      return 'M Series';
    } else {
      return model;
    }
  }

  private parseDiskData(disks){
    let data = disks; // DEBUG
    data.forEach((item, index) => {
      if(!item.enclosure){return};
      let enclosure = this.profile[item.enclosure.number];
      item.status = 'AVAILABLE'; // Label it as available. If it is assigned to a vdev/pool then this will be overridden later.
      enclosure.diskKeys[item.devname] = enclosure.disks.length; // index to enclosure.disks
      enclosure.disks.push(item);
    });

  }

  filterSystemDisk(disks){
    let sd = [];
    
    let data = disks.filter((item, index) => {
      if(!item.enclosure){
        this.systemDisks.push(item);
        sd.push(index);
      } 
      return item.enclosure;
      
    });
    return data;
  }
  
  private parseEnclosures(obj){
    // Provide a shortcut to the enclosures object
    this.profile.forEach((profileItem, index) => {
      profileItem.enclosureKey = Number(index); // Make sure index 0 is not treated as boolean
    });
  }
  
  private parsePoolsData(obj){
    obj.forEach((pool, pIndex) => {     
      if(!pool.topology){
        return;
      }

      this.parseByTopology('data', pool, pIndex);
      this.parseByTopology('spare', pool, pIndex);
      this.parseByTopology('cache', pool, pIndex);
      this.parseByTopology('log', pool, pIndex);

    });
    
  }

  private parseByTopology(role, pool, pIndex){
    pool.topology[role].forEach((vdev, vIndex) => {

      let v:VDev = {
        pool: pool.name,
        type: vdev.type,
        topology: role,
        poolIndex: pIndex,
        vdevIndex: vIndex,
        disks: {}
      }

      if(vdev.children.length == 0 && vdev.device){
          
          let spl = vdev.device.split('p');
          let name = spl[0]
          v.disks[name] = -1; // no children so we use this as placeholder
      } else if(vdev.children.length > 0) {
        vdev.children.forEach((disk, dIndex) => {
          let spl = disk.device.split('p');
          let name = spl[0]
          v.disks[name] = dIndex;
        });
      } 
      
      this.storeVdevInfo(v);
    });
  }

  getVdev(alias:VDev){
    return this.pools[alias.poolIndex].topology.data[alias.vdevIndex]
  }

  storeVdevInfo(vdev:VDev){
    for(let diskName in vdev.disks){
      this.addVDevToDiskInfo(diskName, vdev);
    }
  }

  addVDevToDiskInfo(diskName:string, vdev:VDev):void{
    let keys = Object.keys(vdev.disks);

    let enclosureIndex = this.getEnclosureNumber(diskName);
    let enclosure = this.profile[enclosureIndex];
    if(!enclosure){
      console.warn("Enclosure number is undefined!");
      return;
    }

    let diskKey = enclosure.diskKeys[diskName];
    enclosure.disks[diskKey].vdev = vdev;
    enclosure.disks[diskKey].status = this.getDiskStatus(diskName, enclosure, vdev);
    if(!enclosure.poolKeys[vdev.pool]){
      enclosure.poolKeys[vdev.pool] = vdev.poolIndex;
    }

  }

  getDiskStatus(diskName, enclosure, vdev?:VDev): string{
        if(!vdev){
          let diskIndex = enclosure.diskKeys[diskName];
          vdev = enclosure.disks[diskIndex].vdev;
        }

        let poolDisk;
        if(vdev.disks[diskName] == -1){
          poolDisk = this.pools[vdev.poolIndex].topology.data[vdev.vdevIndex];
        } else {
          poolDisk = this.pools[vdev.poolIndex].topology.data[vdev.vdevIndex].children[vdev.disks[diskName]];
        }
        
        return poolDisk.status;
  }

  getVdevInfo(diskName){
    // Returns vdev with slot info
    let enclosure = this.profile[this.getEnclosureNumber(diskName)];
    let disk = enclosure.disks[enclosure.diskKeys[diskName]];    
    
    if(!disk.vdev){
      return {
        pool: 'None',
        type: 'None',
        poolIndex: -1,
        vdevIndex: -1
      }
    }

    let slots = Object.assign({}, disk.vdev.disks);
    
    let vdev = Object.assign({}, disk.vdev);
    let keys = Object.keys(slots);
    keys.forEach((d, index) => {
      let s = enclosure.disks[enclosure.diskKeys[d]].enclosure.slot;
      slots[d] = s; //enclosure.disks[enclosure.diskKeys[d]].enclosure.slot;
    });

    vdev.selectedDisk = diskName;
    vdev.slots = slots;
    return vdev;
  }

  getEnclosureNumber(diskName){
    // To be deprecated when middleware includes enclosure number with disk info
    let result;
    this.profile.forEach((enclosure, index) => {
      if(typeof enclosure.diskKeys[diskName] !== 'undefined'){
        result = index;
      }
    });
    return typeof result == 'undefined' ? -1 : result;
  }

  getEnclosureExpanders(index: number){
    let raw = this.enclosures[index].elements.filter((item) => {return item.name == "SAS Expander"})
    return raw[0].elements;
  }
    
}
