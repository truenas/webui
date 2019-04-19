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
}

export class SystemProfiler {

  public headUnit: string; // Model Unit
  public profile: Enclosure[] = [];

  constructor(model, data) {
    this.headUnit = model;
    this.parseData(data);
  }

  parseData(data){
    let enclosureID = 0;
    let enclosure = {model: this.headUnit, disks: []};
    const last = data.length - 1;
    data.forEach((item, index) => {

      enclosure.disks.push(item);

      let next = data[index + 1];

      if(/*index == last*/ !next || next.enclosure_num > enclosureID ){ 
        enclosure.model = enclosureID > 0 ? "ES" +  enclosure.disks.length : this.headUnit;
        this.profile.push(enclosure);

        enclosure = {model: this.headUnit, disks: []};
        enclosureID++ 

      }

    });

  }
  

}
