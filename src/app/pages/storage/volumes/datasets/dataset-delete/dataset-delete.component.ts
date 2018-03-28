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
  public route_success: string[] = ['storage', 'volumes'];
  public isNew: boolean = true;
  public isEntity: boolean = true;
  private title: string;

  public resource_name = 'storage/dataset';

  public fieldConfig: FieldConfig[] = [
    {
      type: 'checkbox',
      name: 'areyousure',
      placeholder: T("Are you sure you want to delete?"),
      tooltip: T('Are you sure you want to delete? The data will be lost.'),
      required: true
    },

    {
      type: 'checkbox',
      name: 'imaware',
      placeholder: T('I am aware that snapsots within this data set will be deleted.'),
      tooltip: T('I am aware that snapsots within this data set will be deleted.   This means they will not be restorable.'),
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
  }

  afterInit(entityAdd: any) {
  }

  customSubmit(body) {

    const url = this.resource_name + "/" + this.path

    this.loader.open();

    this.rest.delete(url, {}).subscribe((res) => {
      this.loader.close();

      this.router.navigate(new Array('/').concat(
        ["storage", "volumes"]));
        
    }, (error) => {
      this.loader.close();
      this.router.navigate(new Array('/').concat(
        ["storage", "volumes"]));
      this.dialogService.errorReport(T("Error Deleting Dataset"), error.message, error.stack);
    });
   
  }
}
