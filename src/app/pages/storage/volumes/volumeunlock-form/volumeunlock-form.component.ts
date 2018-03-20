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
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { T } from '../../../../translate-marker';

@Component({
  selector : 'app-volumeunlock-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class VolumeUnlockFormComponent  implements Formconfiguration {

  saveSubmitText = T("Unlock");

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
      name : 'name',
      placeholder: T('passphrase'),
      isHidden: true
    },{
      type : 'input',
      name : 'passphrase',
      placeholder: T('passphrase'),
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
      protected dialogService: DialogService,
      protected loader: AppLoaderService
  ) {

  }

  afterInit(entityForm: any) {
  
  }

  customSubmit(value) {
    this.loader.open();
    return this.rest.post(this.resource_name + "/" + value.name + "/unlock/", { body: JSON.stringify({passphrase: value.passphrase}) }).subscribe((restPostResp) => {
      console.log("restPostResp", restPostResp);
      this.loader.close();
      this.dialogService.Info(T("Unlocked Volume"), T("Successfully un-locked volume ") + value.name);
      
      this.router.navigate(new Array('/').concat(
        ["storage", "volumes"]));

    }, (res) => {
      this.loader.close();
      this.dialogService.errorReport(T("Error Unlocking"), res.message, res.stack);
    });
  }
  
}
