interface Enclosure {
  model: string;
  disks?: any[];
  diskKeys?: any;
  poolKeys?: any;
}

interface VDev {
  pool: string;
  type: string;
  disks?: any; // {devname: index} Only for mirrors and RAIDZ
  poolIndex: number;
  vdevIndex: number;
}

export class SystemProfiler {

  public systemDisks:any[] = [];
  public platform: string; // Model Unit
  public profile: Enclosure[] = [];

  private diskData: any[];
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
    //this.diskData = data;
    this.parseDiskData(data);
  }

  private parseDiskData(disks){
    let data = this.filterSystemDisk(disks);
    let enclosureID = 0;
    let enclosure = {model: this.platform, disks: [], diskKeys: {}, poolKeys: {} };
    const last = data.length - 1;
    data.forEach((item, index) => {

      item.status = 'AVAILABLE'; // Label it as available. If it is assigned to a vdev/pool then this will be overridden later.
      enclosure.disks.push(item);
      enclosure.diskKeys[item.devname] = index;

      let next = data[index + 1];

      // SIMLATE ENCLOSURE SLOT WHEN 
      // TESTING ON NON TRUENAS HARDWARE
      // REMOVE THIS FOR PRODUCTION!!!
      //data[index].enclosure.slot = index;

      if( !next || next.enclosure_num > enclosureID ){ 
        enclosure.model = enclosureID > 0 ? "ES" +  enclosure.disks.length : this.platform;
        this.profile.push(enclosure);

        enclosure = {model: this.platform, disks: [], diskKeys: {}, poolKeys: {} };
        enclosureID++ 

      }

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
    /*for(let index = data.length; index >= 0; index--){
      if(sd.indexOf(index) !== -1){ 
        data.splice(index, 1);
      }
    };*/
    this.diskData = data;
    return data;
  }
  
  private parsePoolsData(obj){
    obj.forEach((pool, pIndex) => {     
      console.log(pool);
      if(!pool.topology){
        return;
      }

      pool.topology.data.forEach((vdev, vIndex) => {

        let v:VDev = {
          pool: pool.name,
          type: vdev.type,
          poolIndex: pIndex,
          vdevIndex: vIndex,
          disks: {}
        }

        if(vdev.children.length == 0){
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

    for(let enclosure of this.profile){
      let diskKey = enclosure.diskKeys[diskName];
      let test = typeof diskKey;

      if(test == "undefined") { 
        continue;
      } else {
        
        enclosure.disks[diskKey].vdev = vdev;
        enclosure.disks[diskKey].status = this.getDiskStatus(diskName, enclosure, vdev);
        if(!enclosure.poolKeys[vdev.pool]){
          enclosure.poolKeys[vdev.pool] = vdev.poolIndex;
        }

        break;
      }
      
    }
  }

  getDiskStatus(diskName, enclosure, vdev?:VDev): string{
        if(!vdev){
          let diskIndex = enclosure.diskKeys[diskName];
          vdev = enclosure.disks[diskIndex].vdev;
        }

        let poolDisk;
        if(vdev.disks[diskName] == -1){
          //enclosure.disks[diskKey].status = this.pools[vdev.poolIndex].topology.data[vdev.vdevIndex].status;
          poolDisk = this.pools[vdev.poolIndex].topology.data[vdev.vdevIndex];
        } else {
          //enclosure.disks[diskKey].status = this.pools[vdev.poolIndex].topology.data[vdev.vdevIndex][vdev.disks[diskName]].status;
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
    
}
