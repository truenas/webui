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
      tooltip: 'If checked, clients will not be prompted to\
 authenticate before accessing AFP shares.',
      options: [
        {label : 'nobody', value : 'nobody'}
      ]
    },
    {
      type : 'checkbox',
      name : 'afp_srv_guest',
      placeholder : 'Guest account',
      tooltip: 'Select account to use for guest access; the selected\
 account must have permissions to the volume or dataset being shared.\
 The privileges given to this user are also available to any \
 client connecting to the guest service. This user must exist in the\
 password file, but does not require a\
 valid login. Note the user root cannot be used as guest account.',
    },
    {
      type : 'input',
      name : 'afp_srv_connections_limit',
      placeholder : 'Max. Connections',
      tooltip: 'Maximum number of simultaneous connections permitted\
 via AFP. The default limit is 50.',
    },
    {
      type : 'checkbox',
      name : 'afp_srv_homedir_enable',
      placeholder : 'Enable home directories',
      tooltip: 'If checked, any user home directories located under\
 <strong>Home directories</strong> will be available over the share.',
    },
    {
      type : 'explorer',
      initial: '/mnt',
      name : 'afp_srv_homedir',
      placeholder : 'Home Directories',
      tooltip: 'Select the volume or dataset which contains user\
 home directories.',
    },
    {
      type : 'input',
      name : 'afp_srv_homename',
      placeholder : 'Home share name',
      tooltip: 'Overrides the default home folder name with the\
 specified value.',
    },
    {
      type : 'explorer',
      initial: '/mnt',
      name : 'afp_srv_dbpath',
      placeholder : 'Database Path',
      tooltip: 'Sets the database information to be stored in path.\
  The path must be writable even if the volume is read only.',
    },
    {
      type : 'select',
      name : 'afp_srv_chmod_request',
      placeholder : 'Chmod Request',
      tooltip: 'Indicates how to handle Acess Control Lists(ACL); choices are\
 <b>Ignore</b> - This option is used to completely ignore requests, and to give\
 the parent directory ACL inheritance full control over new items.\
 <b>Preserve </b> - This option preserves ZFS ACEs for named users and groups or the POSIX\
 ACL group mask. <b>Simple </b>- Set to chmod() as requested\
 without any extra steps.',
      options : [
        {label : 'Ignore', value : 'ignore'},
        {label : 'Preserve', value : 'preserve'},
        {label : 'Simple', value : 'simple'},
      ],
    },
    {
      type : 'select',
      name : 'afp_srv_map_acls',
      tooltip: 'Choose mapping of effective permissions for\
 authenticated users; <b>Rights</b>\
 (default, Unix-style permissions), <b>None</b>, or\
 <b>Mode</b> (ACLs).',
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
      tooltip: 'Specify the IP addresses to listen for FTP connections.\
 If none are specified, advertise the first IP address of the\
 system, but to listen for any incoming request.',
    },
    {
      type : 'textarea',
      name : 'afp_srv_global_aux',
      placeholder : 'Global auxiliary parameters',
      tooltip: 'Additional <a href="http://netatalk.sourceforge.net/3.0/htmldocs/afp.conf.5.html" target="_blank">afp.conf(5)</a>\
 parameters not covered elsewhere in this screen.',
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
