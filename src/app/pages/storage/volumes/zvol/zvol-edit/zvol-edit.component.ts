import { ApplicationRef, Component, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup, } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel, DynamicSelectModel, DynamicRadioGroupModel } from '@ng2-dynamic-forms/core';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService } from '../../../../../services/';

import { Subscription } from 'rxjs';
import { EntityUtils } from '../../../../common/entity/utils.ts';

import * as _ from 'lodash';

@Component({
  selector: 'app-zvol-edit',
  template: `<entity-edit [conf]="this"></entity-edit>`
})
export class ZvolEditComponent {

  protected pk: any;
  protected path: string;
  protected zvol: string;
  private sub: Subscription;
  protected formGroup: FormGroup;
  public data: Object = {};
  public error: string;
  private busy: Subscription;
  protected route_success: string[] = ['storage', 'volumes'];
  get resource_name(): string {
    return 'storage/volume/' + this.pk + '/zvols/';
  }
  get custom_get_query() : string {
    return this.resource_name + this.zvol + '/';
  }
  get custom_edit_query(): string {
    return this.resource_name + this.zvol + '/';
  }
  protected formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
      id: 'name',
      label: 'zvol name:',
      readOnly: true,
    }),
    new DynamicInputModel({
      id: 'volsize',
      label: 'Size for this zvol:',
    }),
  ];


  constructor(protected router: Router, protected route: ActivatedRoute, protected aroute: ActivatedRoute, protected rest: RestService, protected ws: WebSocketService, protected formService: DynamicFormService) {
    
  }

  preInit(entityEdit: any) {
    this.sub = this.aroute.params.subscribe(params => {
      this.pk = params['pk'];
      this.path = params['path'];
      this.zvol = this.path.slice(this.pk.length + 1, this.path.length);
    });
  }

}
