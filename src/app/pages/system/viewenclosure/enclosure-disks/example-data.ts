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

interface Template {
  slots: number;
  id: number;
}

export class ExampleData {

  private templates: Template[] = [];

  constructor() { 
  }

  addEnclosure(slots: number){
    const template = {
      id: this.templates.length,
      slots: slots
    }

    this.templates.push(template);
  }

  generateData(){
    let result: any[] = [];
    let tally = 0;
    this.templates.forEach((template, index) => {
      const total = template.slots;

      for(let i  = 0; i < total; i++){
        let disk = {
         "identifier": "{serial_lunid}K5H5G09A_5000cca25e4247cc", 
         "name": "da" + tally, 
         "subsystem": "da", 
         "number": tally, 
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
         "enclosure_num": index,
         "enclosure_slot": i, 
         "passwd": "", 
         "devname": "da" + tally
        } 

        result.push(disk);
        tally++

      }

    });

    return result;

  }
  

}
