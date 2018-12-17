import {
  ApplicationRef,
  Component,
  Injector
} from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';

import { RestService, WebSocketService } from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import { DialogService } from 'app/services/dialog.service';
import { Formconfiguration } from 'app/pages/common/entity/entity-form/entity-form.component';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { T } from '../../../../translate-marker';
import helptext from '../../../../helptext/storage/volumes/volume-key';

@Component({
  selector : 'app-createpassphrase-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class VolumeChangekeyFormComponent implements Formconfiguration {

  saveSubmitText = T("Change Passphrase");

  resource_name = 'storage/volume';
  route_success: string[] = [ 'storage', 'pools'];
  isNew = false;
  isEntity = true;
  entityData = {
    name: "",
    passphrase: "",
    passphrase2: ""
  };

  fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'name',
      isHidden: true
    },{
      type : 'input',
      inputType: 'password',
      togglePw : true,
      name : 'adminpw',
      placeholder: helptext.changekey_adminpw_placeholder,
      tooltip: helptext.changekey_adminpw_tooltip,
      validation: helptext.changekey_adminpw_validation,
      required: true
    },{
      type : 'input',
      inputType: 'password',
      name : 'passphrase',
      placeholder: helptext.changekey_passphrase_placeholder,
      tooltip: helptext.changekey_passphrase_tooltip,
      validation: helptext.changekey_passphrase_validation,
      required: true,
    },{
      type : 'input',
      inputType: 'password',
      name : 'passphrase2',
      placeholder: helptext.changekey_passphrase2_placeholder,
      tooltip: helptext.changekey_passphrase2_tooltip,
      validation: helptext.changekey_passphrase2_validation,
      required: true
    }
  ];

  resourceTransformIncomingRestData(data:any): any {
    return data;
  };

  pk: any;
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

  preInit(entityForm: any) {
    this.route.params.subscribe(params => {
      this.pk = params['pk'];
    });
  }

  afterInit(entityForm: any) {

  }

  customSubmit(value) {
    this.loader.open();
    return this.rest.put(this.resource_name + "/" + this.pk + "/keypassphrase/", { body: JSON.stringify({adminpw: value.adminpw, passphrase: value.passphrase, passphrase2: value.passphrase2}) }).subscribe((restPostResp) => {
      this.loader.close();
      this.dialogService.Info(T("Change Pool Passphrase"), T("Passphrase changed for pool ") + value.name);

      this.router.navigate(new Array('/').concat(
        this.route_success));
    }, (res) => {
      this.loader.close();
      this.dialogService.errorReport(T("Error changing passphrase for pool ") + value.name, res.error.message, res.error.traceback);
    });
  }

}
