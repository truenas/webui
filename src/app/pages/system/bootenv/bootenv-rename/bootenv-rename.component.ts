import {Component} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';

import {RestService, WebSocketService} from '../../../../services/';

import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'app-bootenv-rename',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class BootEnvironmentRenameComponent {

  protected route_success: string[] = [ 'system', 'bootenv' ];
  protected editCall: string = 'bootenv.update';
  protected pk: any;
  protected isNew: boolean = false;
  protected isEntity: boolean = true;
  protected entityForm: any;

  protected fieldConfig: FieldConfig[];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService) {}

  preInit(entityForm: any) {
    this.route.params.subscribe(params => {
      this.pk = params['pk'];
      this.fieldConfig = [
        {
          type: 'input',
          name: 'name',
          placeholder: 'Name',
          tooltip: 'Rename the existing boot environment.',
        },
      ];
    });
    this.entityForm = entityForm;
  }
  afterInit(entityForm: any) {
    entityForm.submitFunction = this.submitFunction;
  }
  submitFunction(entityForm){
    const payload = {};
    payload['name'] = entityForm.name;
    return this.ws.call('bootenv.update', [this.pk, payload]);
  }
}