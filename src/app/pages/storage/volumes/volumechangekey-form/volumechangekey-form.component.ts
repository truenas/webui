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
import { MatSnackBar, MatDialog } from '@angular/material';
import { Formconfiguration } from 'app/pages/common/entity/entity-form/entity-form.component';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { DownloadKeyModalDialog } from '../../../../components/common/dialog/downloadkey/downloadkey-dialog.component';
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
  poolName: string;
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
      disabled: false
    },{
      type : 'input',
      inputType: 'password',
      name : 'passphrase2',
      placeholder: helptext.changekey_passphrase2_placeholder,
      tooltip: helptext.changekey_passphrase2_tooltip,
      validation: helptext.changekey_passphrase2_validation,
      required: true,
      disabled: false
    },
    {
      type: 'checkbox',
      name: 'remove_passphrase',
      placeholder: helptext.changekey_remove_passphrase_placeholder,
      tooltip: helptext.changekey_remove_passphrase_tooltip
    }
  ];

  resourceTransformIncomingRestData(data:any): any {
    this.poolName = data.name;
    _.find(this.fieldConfig, {name : "encrypt-headline"}).paraText += this.poolName;
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
      public snackBar: MatSnackBar
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

    this.loader.open();
    this.ws.call('pool.passphrase', params).subscribe(() => {
      this.loader.close();
      this.snackBar.open(T('Passphrase changed for pool ' + value.name), T("Close"), {
        duration: 5000,
      });
        let dialogRef = this.mdDialog.open(DownloadKeyModalDialog, {disableClose:true});
        dialogRef.componentInstance.volumeId = this.pk;
        dialogRef.afterClosed().subscribe(result => {
          this.router.navigate(new Array('/').concat(
            this.route_success));
        });
    },(err) => {
      this.loader.close();
      this.dialogService.errorReport(T("Error changing passphrase for pool ") + value.name, err.reason, err.trace.formatted);
    })
  }
}
