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

import {RestService, WebSocketService} from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../translate-marker';

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
      placeholder : T('Interface Description'),
      tooltip: T('When checked, receive mode is enabled and received peer\
       information is saved in interface descriptions.'),
    },
    {
      type : 'input',
      name : 'lldp_country',
      placeholder : T('Country Code'),
      tooltip: T('Required for LLDP location support. Enter a two-letter\
       ISO 3166 country code.'),
    },
    {
      type : 'input',
      name : 'lldp_location',
      placeholder : T('Location'),
      tooltip: T('Optional. Specify the physical location of the host.'),
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              ) {}

  afterInit(entityEdit: any) { }
}
