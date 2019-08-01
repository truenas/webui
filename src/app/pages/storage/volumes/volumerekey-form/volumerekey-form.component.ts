import {
  ApplicationRef,
  Component,
  Injector
} from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';

import { WebSocketService } from '../../../../services/';
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
  selector : 'app-volumeunlock-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class VolumeRekeyFormComponent  implements Formconfiguration {

  saveSubmitText = T("Reset Encryption");

  resource_name = 'storage/volume';
  route_success: string[] = [ 'storage', 'pools'];
  isNew = false;
  isEntity = true;
  poolName: string;
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
      type: 'paragraph',
      name: 'rekey-headline',
      paraText: '<i class="material-icons">lock</i>' + helptext.rekey_headline
    },{
      type: 'paragraph',
      name: 'rekey-instructions',
      paraText: helptext.rekey_instructions
    },{
      type : 'input',
      inputType: 'password',
      name : 'passphrase',
      label : helptext.rekey_password_label,
      placeholder: helptext.rekey_password_placeholder,
      tooltip: helptext.rekey_password_tooltip,
      validation: helptext.rekey_password_validation,
      required: true,
      togglePw : true
    },{
      type: 'paragraph',
      name: 'encryptionkey-passphrase-instructions',
      paraText: helptext.encryptionkey_passphrase_instructions
    },{
      type : 'input',
      inputType: 'password',
      name : 'encryptionkey-passphrase',
      placeholder: helptext.encryptionkey_passphrase_placeholder,
      tooltip: helptext.encryptionkey_passphrase_tooltip,
      togglePw : true
    },{
      type: 'paragraph',
      name: 'set_recoverykey-instructions',
      paraText: helptext.set_recoverykey_instructions
    },{
      type : 'checkbox',
      name : 'set_recoverykey',
      placeholder: helptext.set_recoverykey_checkbox_placeholder,
      tooltip: helptext.set_recoverykey_checkbox_tooltip,
    }
  ];

  resourceTransformIncomingRestData(data:any): any {
    this.poolName = data.name;
    _.find(this.fieldConfig, {name : "rekey-headline"}).paraText += this.poolName;
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
      protected snackBar: MatSnackBar,
      protected mdDialog: MatDialog
  ) {}

  preInit(entityForm: any) {
    this.route.params.subscribe(params => {
      this.pk = params['pk'];
    });
  }

  afterInit(entityForm: any) {
    console.log(entityForm)
    
  }

  customSubmit(value) {
    this.loader.open();
    this.ws.call('pool.rekey', [parseInt(this.pk), {'admin_password': value.passphrase}])
      .subscribe((res) => {
        this.loader.close();
        this.snackBar.open(T('Successfully reset encryption for pool: ') + value.name, T("Close"), {
          duration: 5000,
        });
        let dialogRef = this.mdDialog.open(DownloadKeyModalDialog, {disableClose:true});
        dialogRef.componentInstance.volumeId = this.pk;
        dialogRef.afterClosed().subscribe(result => {
          this.router.navigate(new Array('/').concat(
            this.route_success));
        });
        (err) => {
          this.loader.close();
          this.dialogService.errorReport(T("Error resetting encryption for pool: " + value.name), res.error, res.trace.formatted);
        };
      });


  }

}
