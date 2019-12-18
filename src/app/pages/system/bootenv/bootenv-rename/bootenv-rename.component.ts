import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { helptext_system_bootenv } from 'app/helptext/system/bootenv';
import { BootEnvService, RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { regexValidator } from '../../../common/entity/entity-form/validators/regex-validation';

@Component({
  selector : 'app-bootenv-rename',
  template : `<entity-form [conf]="this"></entity-form>`,
  providers: [BootEnvService]
})
export class BootEnvironmentRenameComponent {

  protected route_success: string[] = [ 'system', 'boot' ];
  protected editCall = 'bootenv.update';
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
          placeholder: helptext_system_bootenv.rename_name_placeholder,
          tooltip: helptext_system_bootenv.create_name_tooltip,
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
    return this.ws.call('bootenv.update', [this.pk, payload]);
  }
}