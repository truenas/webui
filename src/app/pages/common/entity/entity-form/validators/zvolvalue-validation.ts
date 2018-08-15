import {FormControl} from '@angular/forms'

export function ZvolValueValidator(zvolformgroup) {

  let thisControl: FormControl;

  return function ZvolvalidValue(control: FormControl) {

    if (!thisControl) {
      thisControl = control;
    }

    if(thisControl.value){
      const zvolpath = thisControl.value.slice(5)
      zvolformgroup.loader.open();
      zvolformgroup.ws.call('pool.dataset.query',[[["type","=","VOLUME"],["name","=",zvolpath]]]).subscribe((res)=>{
        if(res.length >0) {
          zvolformgroup.loader.close();
        }
        else {
          thisControl.setValue(null);
          zvolformgroup.loader.close();
        }
      })
    }

    return null;
  }
}
