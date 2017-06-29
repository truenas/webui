import {
  ApplicationRef,
  Component,
  Injector,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  Validators
} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';

import {GlobalState} from '../../../../global.state';
import {RestService, WebSocketService} from '../../../../services/';
import {EntityConfigComponent} from '../../../common/entity/entity-config/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'system-tunable-edit',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class TunableFormComponent {

  protected resource_name: string = 'system/tunable';
  protected route_success: string[] = [ 'system', 'tunable' ];
  protected isEntity: boolean = true;

  protected fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'tun_var',
      placeholder : 'Variable',
    },
    {
      type : 'textarea',
      name : 'tun_value',
      placeholder : 'Value',
    },
    {
      type : 'select',
      name : 'tun_type',
      placeholder : 'Type',
      options : [
        {label : 'Loader', value : 'loader'},
        {label : 'rc.conf', value : 'rc'},
        {label : 'Sysctl', value : 'sysctl'},
      ]
    },
    {
      type : 'input',
      name : 'tun_comment',
      placeholder : 'Comment',
    },
    {
      type : 'checkbox',
      name : 'tun_enabled',
      placeholder : 'Enable',
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected _state: GlobalState) {}

  afterInit(entityForm: any) {}
}
