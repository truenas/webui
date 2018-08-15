import {FormControl} from '@angular/forms'

export function ZvolValueValidator(zvolstring) {

  let thisControl: FormControl;

  return function ZvolvalidValue(control: FormControl) {

    if (!thisControl) {
      thisControl = control;
    }

    if(thisControl.value){
      const zvolpath = thisControl.value.slice(5)
      zvolstring.loader.open();
      zvolstring.ws.call('pool.dataset.query',[[["type","=","VOLUME"],["name","=",zvolpath]]]).subscribe((res)=>{
        if(res.length >0) {
          zvolstring.loader.close();
        }
        else {
          thisControl.setValue(null);
          zvolstring.loader.close();
        }
      })
    }

    return null;
  }
}
