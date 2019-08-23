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
  admin_pw = '';
  button_disabled = true;
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
      name : helptext.add_key_invalid_button,
      disabled : this.button_disabled,
      function : () => {
        this.ws.call('auth.check_user', ['root', this.admin_pw]).subscribe((res) => {
          if (res) {
            this.encryptionService.deleteRecoveryKey(this.pk, this.admin_pw, this.poolName, this.route_return);
          } else {
            this.dialogService.Info('Error', 'The administrator password is incorrect.', '340px');
          }
        });
      }
    },
    {
      id : 'custom_cancel',
      name : helptext.add_key_custom_cancel,
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
    });
  }

  afterInit(entityForm: any) {
    entityForm.formGroup.controls['password'].valueChanges.subscribe((res) => {
      this.admin_pw = res;
      let btn = <HTMLInputElement> document.getElementById('cust_button_Invalidate Existing Key')
      this.admin_pw !== '' ? btn.disabled = false : btn.disabled = true;
    })
  }
    
  customSubmit(value) { 
    this.ws.call('auth.check_user', ['root', value.password]).subscribe((res) => {
      if (res) {
        this.encryptionService.makeRecoveryKey(this.pk, value.name, this.route_return);
      } else {
        this.dialogService.Info('Error', 'The administrator password is incorrect.', '340px');
      }
    });
  }
}
