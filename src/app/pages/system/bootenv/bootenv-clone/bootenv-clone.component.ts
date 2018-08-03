import {Component} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {RestService, WebSocketService, BootEnvService} from '../../../../services/';
import { T } from '../../../../translate-marker';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import { regexValidator } from '../../../common/entity/entity-form/validators/regex-validation';

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
          placeholder: T('Name'),
          tooltip: T('Enter a name for the clone of this boot\
                      environment.'),
          validation : [ regexValidator(this.bootEnvService.bootenv_name_regex)],
          required: true
        },
        {
          type: 'input',
          name: 'source',
          placeholder : T('Source'),
          tooltip: T('This is the boot environment to be cloned.'),
          value: this.pk,
          readonly: true
        },
      ];
    });
  }
}
