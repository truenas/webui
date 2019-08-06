import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatDialog } from '@angular/material';

import * as _ from 'lodash';
import { WebSocketService, AppLoaderService, DialogService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { Formconfiguration } from 'app/pages/common/entity/entity-form/entity-form.component';
import { DownloadKeyModalDialog } from '../../../../components/common/dialog/downloadkey/downloadkey-dialog.component';
import { T } from '../../../../translate-marker';
import helptext from '../../../../helptext/storage/volumes/volume-key';

@Component({
  selector: 'app-volumeunlock-form',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class VolumeRekeyFormComponent implements Formconfiguration {

  saveSubmitText = T("Re-key Pool");

  resource_name = 'storage/volume';
  route_success: string[] = ['storage', 'pools'];
  isNew = false;
  isEntity = true;
  entityData = {
    name: "",
    passphrase: ""
  };

  fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'name',
      isHidden: true
    }, {
      type: 'paragraph',
      name: 'rekey-instructions',
      paraText: helptext.rekey_instructions
    }, {
      type: 'input',
      inputType: 'password',
      name: 'passphrase',
      label: helptext.rekey_password_label,
      placeholder: helptext.rekey_password_placeholder,
      tooltip: helptext.rekey_password_tooltip,
      validation: helptext.rekey_password_validation,
      required: true
    }
  ];

  resourceTransformIncomingRestData(data: any): any {
    return data;
  };

  pk: any;
  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected ws: WebSocketService,
    protected dialogService: DialogService,
    protected loader: AppLoaderService,
    protected snackBar: MatSnackBar,
    protected mdDialog: MatDialog
  ) { }

  preInit(entityForm: any) {
    this.route.params.subscribe(params => {
      this.pk = params['pk'];
    });
  }

  customSubmit(value) {
    this.loader.open();
    this.ws.call('pool.rekey', [parseInt(this.pk), { 'admin_password': value.passphrase }])
      .subscribe(
        (res) => {
          this.loader.close();
          this.snackBar.open(T('Successfully re-keyed pool ') + value.name, T("Close"), {
            duration: 5000,
          });
          let dialogRef = this.mdDialog.open(DownloadKeyModalDialog, { disableClose: true });
          dialogRef.componentInstance.volumeId = this.pk;
          dialogRef.afterClosed().subscribe(result => {
            this.router.navigate(new Array('/').concat(
              this.route_success));
          });
        },
        (err) => {
          this.loader.close();
          this.dialogService.errorReport(T("Error re-keying pool"), err.error, err.trace.formatted);
        });
  }
}
