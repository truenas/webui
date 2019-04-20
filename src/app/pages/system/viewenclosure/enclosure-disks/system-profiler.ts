/*
 DISKQUERY RESPONSE...

{
  "identifier": "{serial_lunid}K5H5G09A_5000cca25e4247cc", 
 "name": "da3", 
 "subsystem": "da", 
 "number": 3, 
 "serial": "K5H5G09A", 
 "size": "2000398934016", 
 "multipath_name": "", 
 "multipath_member": "", 
 "description": "", 
 "transfermode": "Auto", 
 "hddstandby": "ALWAYS ON", 
 "advpowermgmt": "DISABLED", 
 "acousticlevel": "DISABLED", 
 "togglesmart": true, 
 "smartoptions": "", 
 "expiretime": null, 
 "enclosure_num": 0,
 "enclosure_slot": 11, 
 "passwd": "", 
 "devname": "da3"
} 

 */

interface Enclosure {
  model: string;
  disks: any[];
  diskKeys: any;
}

interface VDev {
  pool: string;
  type: string;
  disks?: any; // {devname: index} Only for mirrors and RAIDZ
  poolIndex: number;
  vdevIndex: number;
}

export class SystemProfiler {

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
    this.diskData = data;
    this.parseDiskData(data);
  }

  private parseDiskData(data){
    let enclosureID = 0;
    let enclosure = {model: this.platform, disks: [], diskKeys: {} };
    const last = data.length - 1;
    data.forEach((item, index) => {

      enclosure.disks.push(item);
      enclosure.diskKeys[item.devname] = index;

      let next = data[index + 1];

      if( !next || next.enclosure_num > enclosureID ){ 
        enclosure.model = enclosureID > 0 ? "ES" +  enclosure.disks.length : this.platform;
        this.profile.push(enclosure);

        enclosure = {model: this.platform, disks: [], diskKeys: {} };
        enclosureID++ 

      }

    });

  }
  
  private parsePoolsData(obj){

    obj.forEach((pool, pIndex) => {     

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
    for(let x in vdev.disks){
      this.addVDevToDiskInfo(x, vdev);
    }
  }

  addVDevToDiskInfo(diskName:string, vdev:VDev):void{
    
    let keys = Object.keys(vdev.disks);
    //this.profile.forEach((enclosure, index) => {
    for(let enclosure of this.profile){
      let diskKey = enclosure.diskKeys[diskName];

      if(!diskKey) { 
        continue; 
      } else {
        enclosure.disks[diskKey].vdev = vdev;
        enclosure.disks[diskKey].status = this.getDiskStatus(diskName, enclosure, vdev);

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
    
}
