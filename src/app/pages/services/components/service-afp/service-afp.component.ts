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

import {
  RestService,
  UserService,
  WebSocketService
} from '../../../../services/';
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

  public fieldConfig: FieldConfig[] = [
    {
      type : 'select',
      name : 'afp_srv_guest_user',
      placeholder : 'Guest Access',
      options: [
        {label : 'nobody', value : 'nobody'}
      ]
    },
    {
      type : 'checkbox',
      name : 'afp_srv_guest',
      placeholder : 'Guest account',
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
      type : 'explorer',
      initial: '/mnt',
      name : 'afp_srv_homedir',
      placeholder : 'Home Directories',
    },
    {
      type : 'input',
      name : 'afp_srv_homename',
      placeholder : 'Home share name',
    },
    {
      type : 'explorer',
      initial: '/mnt',
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
  private guest_users: any;
  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected userService: UserService) {}

  afterInit(entityEdit: any) {
    let self = this;
    this.userService.listUsers().subscribe((res) => {
      self.guest_users = _.find(this.fieldConfig, {name : 'afp_srv_guest_user'});
      for (let i = 0; i < res.data.length; i++) {
        this.guest_users.options.push(
          { label : res.data[i].bsdusr_username, value : res.data[i].bsdusr_username }
          );
      }
    });
  }
}
