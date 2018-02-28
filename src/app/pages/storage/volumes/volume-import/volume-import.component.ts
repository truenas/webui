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

@Component({
  selector: 'volume-import',
  templateUrl: './volume-import.component.html'
})

export class VolumeImportListComponent {
  protected resource_name: string = 'storage/volume_import';
  protected route_success: string[] = ['storage', 'volumes'];
  protected isEntity = true;
  protected isNew = true;
  protected fieldConfig: FieldConfig[] = [];
  public initialized = true;

  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef,
    protected dialogService: DialogService,
    protected loader: AppLoaderService) {

    this.fieldConfig = [
      {
        type: 'input',
        name: 'volume_id',
        placeholder: 'Volume/Dataset',
        tooltip: 'Select an existing ZFS volume, dataset, or zvol.'
      },
      {
        type: 'checkbox',
        name: 'encryptedVolume',
        placeholder: 'Un-Encrypt Volume',
        tooltip: 'Check this to un encryptd volume before importing.',
      }
    ];


  }

  ngAfterViewInit(): void {

    /*
    this.rest.get("storage/volume", {}).subscribe((res) => {
      res.data.forEach((volume: ZfsPoolData) => {

        this.fieldConfig[0].options.push({
          label: volume.name,
          value: volume.name
        });
        this.initialized = true;

      }, (res) => {
        this.dialogService.errorReport("Error getting volume data", res.message, res.stack);
        this.initialized = true;
      });


    });
    */
  }

  customSubmit(value) {
    this.loader.open();
    console.log("VALUE", value);
    return this.rest.post(this.resource_name, { body: JSON.stringify({ volume_id: value.volume_id}) }).subscribe((restPostResp) => {
      console.log("restPostResp", restPostResp);
      this.loader.close();
      this.dialogService.Info("Imported Volume", "Successfully Created Key to volume " + value.volume_id);

      this.router.navigate(new Array('/').concat(
        ["storage", "volumes"]));
    }, (res) => {
      this.loader.close();
      this.dialogService.errorReport("Error Importing volume", res.message, res.stack);
    });
  }

}
