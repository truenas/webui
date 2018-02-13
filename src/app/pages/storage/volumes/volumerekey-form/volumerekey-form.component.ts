import {
  ApplicationRef,
  Component,
  Injector,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  Validators
} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import * as _ from 'lodash';

import {RestService, WebSocketService} from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import { DialogService } from 'app/services/dialog.service';
import { Formconfiguration } from 'app/pages/common/entity/entity-form/entity-form.component';

@Component({
  selector : 'app-volumeunlock-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class VolumeRekeyFormComponent  implements Formconfiguration {

  saveSubmitText = "ReKey"; 

  resource_name = 'storage/volume';
  route_success: string[] = [ 'storage', 'volumes'];
  isNew = false;
  isEntity = true;
  entityData = {
    name: "",
    passphrase: ""
  };
  
  fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'name',
      isHidden: true
    },{
      type : 'input',
      name : 'passphrase',
      placeholder: 'passphrase',
      tooltip: 'Geli Passphrase'
    }
  ];

  resourceTransformIncomingRestData(data:any): any {
    return data;
  };


  constructor(
      protected router: Router,
      protected route: ActivatedRoute,
      protected rest: RestService,
      protected ws: WebSocketService,
      protected _injector: Injector,
      protected _appRef: ApplicationRef,
      protected dialogService: DialogService
  ) {

  }

  afterInit(entityForm: any) {
  
  }

  customSubmit(value) {
    return this.rest.post(this.resource_name + "/" + value.name + "/rekey/", { body: JSON.stringify({passphrase: value.passphrase}) }).subscribe((restPostResp) => {
      console.log("restPostResp", restPostResp);
      this.dialogService.Info("Rekeyed Volume", "Successfully Rekeyed volume " + value.name);

      this.router.navigate(new Array('/').concat(
        ["storage", "volumes"]));
    }, (res) => {
      this.dialogService.errorReport("Error re keying volume", res.message, res.stack);
    });
  }
  
}
