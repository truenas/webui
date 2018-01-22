import {Component} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';

import {RestService, WebSocketService} from '../../../../services/';

import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'app-bootenv-add',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class BootEnvironmentCloneComponent {

  protected route_success: string[] = [ 'system', 'bootenv' ];
  protected resource_name: string = 'system/bootenv';
  protected pk: any;
  protected isNew: boolean = true;
  protected isEntity: boolean = true;

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
          tooltip: 'Enter a name for the clone of this boot environment.', 
        },
        {
          type: 'input',
          name: 'source',
          placeholder : 'Source',
          tooltip: 'This is the boot environment that will be cloned.',
          value: this.pk,
          readonly: true
        },
      ];
    });
  }
}