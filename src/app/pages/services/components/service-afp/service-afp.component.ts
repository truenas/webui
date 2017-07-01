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
import {
  RestService,
  UserService,
  WebSocketService
} from '../../../../services/';
import {EntityConfigComponent} from '../../../common/entity/entity-config/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'afp-edit',
  template : ` <entity-form [conf]="this"></entity-form>`,
  providers : [ UserService ]
})

export class ServiceAFPComponent {
  protected resource_name: string = 'services/afp';
  protected route_success: string[] = [ 'services' ];

  private entityEdit: EntityConfigComponent;

  public fieldConfig: FieldConfig[] = [
    {
      type : 'checkbox',
      name : 'afp_srv_guest',
      placeholder : 'Guest Access',
    },
    {
      type : 'select',
      name : 'afp_srv_guest',
      placeholder : 'Guest Access',
      options : []
    },
    {
      type : 'input',
      name : 'afp_srv_connections_limit',
      placeholder : 'Max. Connections',
    },
    {
      type : 'checkbox',
      name : 'afp_srv_homedir_enable',
      placeholder : 'Enable home directories',
    },
    {
      type : 'input',
      name : 'afp_srv_homedir',
      placeholder : 'Home Directories',
    },
    {
      type : 'input',
      name : 'afp_srv_homename',
      placeholder : 'Home share name',
    },
    {
      type : 'input',
      name : 'afp_srv_dbpath',
      placeholder : 'Database Path',
    },
    {
      type : 'select',
      name : 'afp_srv_chmod_request',
      placeholder : 'Chmod Request',
      options : [
        {label : 'Ignore', value : 'ignore'},
        {label : 'Preserve', value : 'preserve'},
        {label : 'Simple', value : 'simple'},
      ],
    },
    {
      type : 'select',
      name : 'afp_srv_map_acls',
      options : [
        {label : 'Rights', value : 'rights'},
        {label : 'None', value : 'none'},
        {label : 'Mode', value : 'mode'},
      ],
    },
    {
      type : 'input',
      name : 'afp_srv_bindip',
      placeholder : 'Bind Interfaces',
    },
    {
      type : 'textarea',
      name : 'afp_srv_global_aux',
      placeholder : 'Global auxiliary parameters'
    }
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected _state: GlobalState,
              protected userService: UserService) {}

  afterInit(entityEdit: any) { this.entityEdit = entityEdit; }
}
