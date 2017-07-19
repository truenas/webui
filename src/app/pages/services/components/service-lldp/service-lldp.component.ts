import {ApplicationRef, Component, Injector, OnInit} from '@angular/core';
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
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'lldp-edit',
  template : `<entity-form [conf]="this"></entity-form>`
})

export class ServiceLLDPComponent {
  protected resource_name: string = 'services/lldp';
  protected route_success: string[] = [ 'services' ];

  public fieldConfig: FieldConfig[] = [
    {
      type : 'checkbox',
      name : 'lldp_intdesc',
      placeholder : 'Interface Description',
    },
    {
      type : 'input',
      name : 'lldp_country',
      placeholder : 'Country Code',
    },
    {
      type : 'input',
      name : 'lldp_location',
      placeholder : 'Location',
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected _state: GlobalState) {}

  afterInit(entityEdit: any) { }
}
