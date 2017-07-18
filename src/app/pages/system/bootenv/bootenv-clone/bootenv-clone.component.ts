import {Component} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';

import {GlobalState} from '../../../../global.state';
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
              protected rest: RestService, protected ws: WebSocketService,
              protected _state: GlobalState) {}

  preInit(entityForm: any) {
    this.route.params.subscribe(params => {
      this.pk = params['pk'];
      this.fieldConfig = [
        {
          type: 'input',
          name: 'name',
          placeholder: 'Name',
        },
        {
          type: 'input',
          name: 'source',
          placeholder : 'Source',
          value: this.pk,
          readonly: true
        },
      ];
    });
  }
}