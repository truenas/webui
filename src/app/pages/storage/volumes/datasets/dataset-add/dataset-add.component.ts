import { ApplicationRef, Component, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup, } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel } from '@ng2-dynamic-forms/core';
import { GlobalState } from '../../../../../global.state';
import { RestService, WebSocketService } from '../../../../../services/';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dataset-add',
  template: `<entity-add [conf]="this"></entity-add>`
})
export class DatasetAddComponent {

  protected pk: any;
  protected path: string;
  public sub: Subscription;
  protected route_success: string[] = ['storage', 'volumes'];
  get resource_name(): string {
    return 'storage/volume/' + this.pk + '/datasets/';
  }

  public formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
      id: 'name',
      label: 'Name',
    }),
  ];

  constructor(protected router: Router, protected aroute: ActivatedRoute, protected rest: RestService, protected ws: WebSocketService, protected formService: DynamicFormService) {

  }

  clean_name(value) {
    let start = this.path.split('/').splice(1).join('/');
    if(start != '') {
      return start + '/' + value;
    } else {
      return value;
    }
  }

  afterInit(entityAdd: any) {
    this.sub = this.aroute.params.subscribe(params => {
      this.pk = params['pk'];
      this.path = params['path'];
    });
  }

}
