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
import { EntityFormComponent } from '../../../../common/entity/entity-form';

@Component({
  selector: 'app-dataset-delete',
  template: '<entity-form [conf]="this"></entity-form>'
})
export class DatasetDeleteComponent implements Formconfiguration {

  public pk: any;
  public path: string;
  public sub: Subscription;
  public deleteSnapshot: boolean = true;
  public route_success: string[] = ['storage', 'pools'];
  public isNew: boolean = true;
  public isEntity: boolean = true;
  public saveSubmitText = "Delete";

  public resource_name = 'storage/dataset';

  public fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'name',
      readonly: true
    },
    {
      type: 'checkbox',
      name: 'areyousure',
      placeholder: T("Are you sure you want to delete?"),
      tooltip: T('Are you sure you want to delete? The data will be lost.'),
      required: true
    }

  ];


  constructor(protected router: Router, protected aroute: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService, protected dialogService: DialogService, protected loader: AppLoaderService) { }


  preInit(entityForm: EntityFormComponent) {
    let paramMap: any = (<any>this.aroute.params).getValue();

    if (paramMap['pk'] !== undefined) {
      this.pk = paramMap['pk'];
    }

    if (paramMap['path'] !== undefined) {
      this.path = paramMap['path'];
    }

    this.fieldConfig[0].value = this.path;

  }

  afterInit(entityAdd: any) {
  }

  customSubmit(body) {


    this.dialogService.confirm(T("Delete"), T("This action is irreversible and will delete any existing snapshots of this dataset (" + this.path + ").  Please confirm."), false).subscribe((res) => {
      if (res) {

        const url = this.resource_name + "/" + this.path

        this.loader.open();

        this.rest.delete(url, {}).subscribe((res) => {
          this.loader.close();

          this.router.navigate(new Array('/').concat(
            this.route_success));

        }, (error) => {
          this.loader.close();
          this.router.navigate(new Array('/').concat(
            this.route_success));
          this.dialogService.errorReport(T("Error deleting dataset"), error.message, error.stack);
        });

      }
    })




  }
}
