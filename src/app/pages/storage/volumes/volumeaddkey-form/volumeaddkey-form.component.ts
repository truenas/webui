import {
  ApplicationRef,
  Component,
  Injector
} from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';

import { WebSocketService, StorageService } from '../../../../services/';
import { EncryptionService } from '../../../../../app/services/encryption.service';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import { DialogService } from 'app/services/dialog.service';
import { MatSnackBar, MatDialog } from '@angular/material';
import { Formconfiguration } from 'app/pages/common/entity/entity-form/entity-form.component';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { T } from '../../../../translate-marker';
import helptext from '../../../../helptext/storage/volumes/volume-key';

@Component({
  selector : 'app-addkey-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class VolumeAddkeyFormComponent implements Formconfiguration {

  saveSubmitText = T("Add Recovery Key");

  resource_name = 'storage/volume';
  route_return: string[] = [ 'storage', 'pools'];
  isNew = false;
  isEntity = true;
  poolName: string;
  entityData = {
    name: "",
    passphrase: ""
  };

  fieldConfig: FieldConfig[] = [
    {
      type: 'paragraph',
      name: 'encrypt-headline',
      paraText: '<i class="material-icons">lock</i>' + helptext.add_key_headline
    },{
      type: 'paragraph',
      name: 'addkey-instructions',
      paraText: helptext.add_key_instructions,
    },
    {
      type : 'input',
      name : 'name',
      isHidden: true,
      validation: helptext.add_key_name_validation,
      required: true
    },{
      type : 'input',
      inputType: 'password',
      name : 'password',
      placeholder: helptext.add_key_password_placeholder,
      tooltip: helptext.add_key_password_tooltip,
      validation: helptext.add_key_password_validation,
      required: true
    }
  ];

  public custActions: Array<any> = [
    {
      id : 'delete_recovery_key',
      name : T('Delete Recovery Key'),
      function : () => {
        this.encryptionService.openEncryptDialog(this.pk, this.route_return);
      }
    },
    {
      id : 'custom_cancel',
      name : 'Cancel',
      function : () => {
        this.router.navigate(new Array('/').concat(
          this.route_return));
    }
  }];

  resourceTransformIncomingRestData(data:any): any {
    this.poolName = data.name;
    _.find(this.fieldConfig, {name : "encrypt-headline"}).paraText += ` <em>${this.poolName}</em>`;
    return data;
  };

  pk: any;
  constructor(
      protected router: Router,
      protected route: ActivatedRoute,
      protected ws: WebSocketService,
      protected _injector: Injector,
      protected _appRef: ApplicationRef,
      protected dialogService: DialogService,
      protected loader: AppLoaderService,
      protected storage: StorageService,
      protected snackBar: MatSnackBar,
      protected mdDialog: MatDialog,
      protected encryptionService: EncryptionService
  ) {}

  preInit(entityForm: any) {
    this.route.params.subscribe(params => {
      this.pk = params['pk'];
      this.ws.call('pool.query', 
        [
          ["id", "=", this.pk]
        ]).subscribe((res => {
        console.log(res)
      }))
    });
  }

  customSubmit(value) { 
    this.encryptionService.makeRecoveryKey(this.pk, value.name, this.route_return, false);
  }
}
