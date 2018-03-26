import { Component } from '@angular/core';
import {
  FormGroup,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { RestService, WebSocketService, DialogService } from '../../../../../services/';
import { Formconfiguration } from '../../../../common/entity/entity-form/entity-form.component';
import { AppLoaderService } from '../../../../../services/app-loader/app-loader.service';
import { T } from '../../../../../translate-marker';
import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector: 'app-dataset-delete',
  template: '<entity-form [conf]="this"></entity-form>'
})
export class DatasetDeleteComponent implements Formconfiguration {

  public pk: any;
  public path: string;
  public sub: Subscription;
  public deleteSnapshot: boolean = true;
  public route_success: string[] = ['storage', 'volumes'];
  public isNew: boolean = true;
  public isEntity: boolean = false;

  public resource_name = 'storage/volume';

  public fieldConfig: FieldConfig[] = [
    {
      type : 'checkbox',
      name : 'areyousure',
      placeholder : T("Are you sure you want to delete?"),
      tooltip : T('Are you sure you want to delete? the data will be lost.'),
    },

    {
      type : 'checkbox',
      name : 'imaware',
      placeholder : T('Im aware that snapsots within this data set will be deleted.'),
      tooltip : T('Im aware that snapsots within this data set will be deleted.   This meas they will not be restorable.'),
    }

  ];


  constructor(protected router: Router, protected aroute: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService, protected dialogService: DialogService, protected loader: AppLoaderService) { }

  clean_name(value) {
    let start = this.path.split('/').splice(1).join('/');
    if (start != '') {
      return start + '/' + value;
    } else {
      return value;
    }
  }

  getPK(entityDelete, params) {
    this.pk = params['pk'];
    this.path = params['path'];
    entityDelete.pk = this.path.split('/').splice(1).join('/');
  }

  afterInit(entityAdd: any) {
  }

  customSubmit(body) { 
    const url = this.resource_name + "/" + this.pk + "/datasets/";
    this.loader.open();

    this.rest.delete(url, {}).subscribe((res) => {
      this.loader.close();

      if( body.areyousure === true && body.imaware === true  ) {
          this.dialogService.Info(T("Delete Dataset"), T("Deleted dataset:" + this.pk + " successfully"));
      } else {
        this.dialogService.Info(T("Action cancled: Delete Dataset"), T("Dataset delete was NOT executed:" + this.pk + " action was cancled."));
      }
    }, (error) => {
      this.loader.close();
      this.dialogService.errorReport(T("Error Detaching volume"), error.message, error.stack);
    });
  }
}
