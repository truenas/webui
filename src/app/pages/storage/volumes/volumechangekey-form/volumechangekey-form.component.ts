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
import { EncryptionService } from '../../../../../app/services/encryption.service';
import { MatSnackBar, MatDialog } from '@angular/material';
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
  route_return: string[] = [ 'storage', 'pools'];
  isNew = false;
  isEntity = true;
  poolName: string;
  admin_pw = '';
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
      type: 'paragraph',
      name: 'encrypt-headline',
      paraText: '<i class="material-icons">lock</i>' + helptext.changekey2_headline
    },{
      type: 'paragraph',
      name: 'changekey-instructions',
      paraText: helptext.changekey_instructions2
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
      disabled: false,
      togglePw: true
    },
    {
      type: 'checkbox',
      name: 'remove_passphrase',
      placeholder: helptext.changekey_remove_passphrase_placeholder,
      tooltip: helptext.changekey_remove_passphrase_tooltip
    }
  ];

  public custActions: Array<any> = [
    {
      id : 'download_encrypt_key',
      name : 'Download Encryption Key',
      disabled: true,
      function : () => {
        this.ws.call('auth.check_user', ['root', this.admin_pw]).subscribe((res) => {
          if (res) {
            this.encryptionService.openEncryptDialog(this.pk, this.route_return, this.poolName);
          } else {
            this.dialogService.Info('Error', 'The administrator password is incorrect.', '340px');
          }
        });
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
      protected rest: RestService,
      protected ws: WebSocketService,
      protected _injector: Injector,
      protected _appRef: ApplicationRef,
      protected dialogService: DialogService,
      protected loader: AppLoaderService,
      public mdDialog: MatDialog,
      public snackBar: MatSnackBar,
      protected encryptionService: EncryptionService
  ) {

  }

  preInit(entityForm: any) {
    this.route.params.subscribe(params => {
      this.pk = params['pk'];
    });
  }

  afterInit(entityForm: any) {
    entityForm.formGroup.controls['remove_passphrase'].valueChanges.subscribe((res) => {
      if (res) {
        entityForm.setDisabled('passphrase', true);
        entityForm.setDisabled('passphrase2', true);
      } else {
        entityForm.setDisabled('passphrase', false);
        entityForm.setDisabled('passphrase2', false);
      }
    });
    entityForm.formGroup.controls['adminpw'].valueChanges.subscribe((res) => {
      this.admin_pw = res;
      let btn = <HTMLInputElement> document.getElementById('cust_button_Download Encryption Key')
      this.admin_pw !== '' ? btn.disabled = false : btn.disabled = true;
    })
  }

  customSubmit(value) {
    let success_msg;
    if (value.remove_passphrase) {
      value.passphrase = null;
      value.passphrase2 = null;
      success_msg = 'removed from'
    } else {
      success_msg = 'changed for'
    }

    let params = [this.pk];
    let payload = {
      'passphrase': value.passphrase,
      'admin_password': value.adminpw
    };
    params.push(payload);

    this.encryptionService.setPassphrase(this.pk, value.passphrase, value.adminpw,
      value.name, this.route_return, false, true, success_msg);
  }
}
