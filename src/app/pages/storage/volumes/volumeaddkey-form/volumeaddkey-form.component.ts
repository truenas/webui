import {
  ApplicationRef,
  Component,
  Injector
} from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';

import { RestService, WebSocketService, StorageService } from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import { DialogService } from 'app/services/dialog.service';
import { MatSnackBar, MatDialog } from '@angular/material';
import { Formconfiguration } from 'app/pages/common/entity/entity-form/entity-form.component';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { T } from '../../../../translate-marker';
import { DownloadKeyModalDialog } from '../../../../components/common/dialog/downloadkey/downloadkey-dialog.component';
import helptext from '../../../../helptext/storage/volumes/volume-key';

@Component({
  selector : 'app-addkey-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class VolumeAddkeyFormComponent implements Formconfiguration {

  saveSubmitText = T("Add Recovery Key");

  resource_name = 'storage/volume';
  route_success: string[] = [ 'storage', 'pools'];
  isNew = false;
  isEntity = true;
  entityData = {
    name: "",
    passphrase: ""
  };

  fieldConfig: FieldConfig[] = [
    {
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
      protected loader: AppLoaderService,
      protected storage: StorageService,
      protected snackBar: MatSnackBar,
      protected mdDialog: MatDialog
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
    console.log(this.pk, typeof(this.pk), value.password);
    let fileName = 'me_geli';
    this.loader.open();
    this.ws.call('auth.check_user', ['root', value.password]).subscribe(res => {
      if (res) {
        this.ws.call('core.download', ['pool.recoverykey_add', [parseInt(this.pk)], fileName]).subscribe((res) => {
        // this.ws.call('pool.recoverykey_add', [parseInt(this.pk), {'admin_password' : value.password}]).subscribe((res) => {
          console.log(res)
          window.open(res[1]);
          this.loader.close();
          this.snackBar.open(T("Recovery key added to pool ") + value.name, 'close', { duration: 5000 });
          // let dialogRef = this.mdDialog.open(DownloadKeyModalDialog, {disableClose:true});
          // dialogRef.componentInstance.volumeId = this.pk;
          // dialogRef.afterClosed().subscribe(result => {
            this.router.navigate(new Array('/').concat(
              this.route_success));
          // })
        }, (res) => {
          this.loader.close();
          this.dialogService.errorReport(T("Error adding recovery key to pool."), res.reason, res.trace.formatted);
        });
      }
      else {
        this.loader.close();
        this.dialogService.Info(T("Invalid password"), T("Please enter the correct password."));
      }
    }, (res) => {
      this.loader.close();
      this.dialogService.errorReport(res.error, res.reason, res.trace.formatted);
    });
  }

}
