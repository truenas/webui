import {Component} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {RestService, WebSocketService, BootEnvService} from '../../../../services/';
import { T } from '../../../../translate-marker';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import { regexValidator } from '../../../common/entity/entity-form/validators/regex-validation';

@Component({
  selector : 'app-bootenv-create',
  template : `<entity-form [conf]="this"></entity-form>`,
  providers: [BootEnvService]
})
export class BootEnvironmentCreateComponent {

  protected route_success: string[] = [ 'system', 'bootenv' ];
  protected addCall = 'bootenv.create';
  protected pk: any;
  protected isNew = false;
  protected isEntity = true;
  protected entityForm: any;

  protected fieldConfig: FieldConfig[];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService, protected bootEnvService: BootEnvService) {}

  preInit(entityForm: any) {
    this.route.params.subscribe(params => {
      this.pk = params['pk'];
      this.fieldConfig = [
        {
          type: 'input',
          name: 'name',
          placeholder: T('Name'),
          tooltip: T('Enter the name of the boot entry.'),
          validation : [ regexValidator(this.bootEnvService.bootenv_name_regex)],
          required: true
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
