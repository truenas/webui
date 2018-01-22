import {Component} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';

import {RestService, WebSocketService} from '../../../../services/';

import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'app-bootenv-create',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class BootEnvironmentCreateComponent {

  protected route_success: string[] = [ 'system', 'bootenv' ];
  protected addCall: string = 'bootenv.create';
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
          tooltip: 'Enter the name of the boot entry as it will appear\
 in the boot menu.',
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
    return this.ws.call('bootenv.create', [payload]);
  }
}