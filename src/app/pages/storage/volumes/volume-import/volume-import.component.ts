import { ApplicationRef, Component, Injector, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

import { RestService, WebSocketService } from '../../../../services/';
import { EntityUtils } from '../../../common/entity/utils';
import { EntityJobComponent } from '../../../common/entity/entity-job/entity-job.component';
import { MatDialog, MatDialogRef } from '@angular/material';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { ZfsPoolData } from '../volumes-list/volumes-list.component';
import { DialogService } from 'app/services/dialog.service';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { Formconfiguration } from '../../../common/entity/entity-form/entity-form.component';
import { T } from '../../../../translate-marker';

@Component({
  selector: 'volume-import',
  templateUrl: './volume-import.component.html'
})

export class VolumeImportListComponent implements Formconfiguration {
  public resource_name: string = 'storage/volume_import';
  public route_success: string[] = ['storage', 'pools'];
  public isEntity = true;
  public isNew = true;
  public fieldConfig: FieldConfig[] = [];
  public initialized = true;

  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef,
    protected dialogService: DialogService,
    protected loader: AppLoaderService) {

    this.fieldConfig = [
      {
        type: 'select',
        name: 'volume_id',
        placeholder: T('Pool/Dataset'),
        tooltip: T('Select an existing pool, dataset, or zvol.'),
        options: []
      }
    ];


  }

  ngAfterViewInit(): void {

    this.rest.get("storage/volume_import", {}).subscribe((res) => {
      res.data.forEach((volume) => {

        this.fieldConfig[0].options.push({
          label: volume.id,
          value: volume.id
        });
        this.initialized = true;

      }, (res) => {
        this.dialogService.errorReport(T("Error getting pool data"), res.message, res.stack);
        this.initialized = true;
      });


    });
  }

  customSubmit(value) {
    this.loader.open();
    console.log("VALUE", value);
    return this.rest.post(this.resource_name, { body: JSON.stringify({ volume_id: value.volume_id, is_decrypted: value.is_decrypted}) }).subscribe((restPostResp) => {
      console.log("restPostResp", restPostResp);
      this.loader.close();
      this.dialogService.Info(T("Imported Pool"), T("Successfully imported pool ") + value.volume_id);

      this.router.navigate(new Array('/').concat(
        this.route_success));
    }, (res) => {
      this.loader.close();

      
      if( res.error !== undefined ) {
        this.dialogService.errorReport(T("Error importing pool"), res.error.error_message, res.error.traceback);
      } else {
        this.dialogService.errorReport(T("Error importing pool"), res.message, res.stack);
      }
    });
  }

}
