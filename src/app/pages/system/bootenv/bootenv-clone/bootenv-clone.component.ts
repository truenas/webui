import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { helptext_system_bootenv as helptext } from 'app/helptext/system/bootenv';
import { regexValidator } from 'app/pages/common/entity/entity-form/validators/regex-validation';
import { BootEnvService, RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'app-bootenv-add',
  template : `<entity-form [conf]="this"></entity-form>`,
  providers: [BootEnvService]
})
export class BootEnvironmentCloneComponent {

  protected route_success: string[] = [ 'system', 'bootenv' ];
  protected resource_name  = 'system/bootenv';
  protected pk: any;
  protected isNew = true;
  protected isEntity = true;

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
          placeholder: helptext.clone_name_placeholder,
          tooltip: helptext.clone_name_tooltip,
          /* Cannot be moved to helptext file unless bootenv_name_regex is converted to static member */
          validation : [ regexValidator(this.bootEnvService.bootenv_name_regex)],
          required: true
        },
        {
          type: 'input',
          name: 'source',
          placeholder : helptext.clone_source_placeholder,
          tooltip: helptext.clone_source_tooltip,
          value: this.pk,
          readonly: true
        },
      ];
    });
  }
}
