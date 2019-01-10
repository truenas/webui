import { ApplicationRef, Component, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';

import { RestService, UserService, WebSocketService, IscsiService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import helptext from '../../../../helptext/services/components/service-afp';

@Component({
  selector : 'afp-edit',
  template : ` <entity-form [conf]="this"></entity-form>`,
  providers : [ UserService, IscsiService ]
})

export class ServiceAFPComponent {
  protected resource_name: string = 'services/afp';
  protected route_success: string[] = [ 'services' ];

  public fieldConfig: FieldConfig[] = [
    {
      type : 'select',
      name : 'afp_srv_guest_user',
      placeholder : helptext.afp_srv_guest_user_placeholder,
      tooltip: helptext.afp_srv_guest_user_tooltip,
      options: helptext.afp_srv_guest_user_options
    },
    {
      type : 'checkbox',
      name : 'afp_srv_guest',
      placeholder : helptext.afp_srv_guest_placeholder,
      tooltip: helptext.afp_srv_guest_tooltip,
    },
    {
      type : 'input',
      name : 'afp_srv_connections_limit',
      placeholder : helptext.afp_srv_connections_limit_placeholder,
      tooltip: helptext.afp_srv_connections_limit_tooltip,
    },
    {
      type : 'explorer',
      initial: '/mnt',
      explorerType: 'directory',
      name : 'afp_srv_dbpath',
      placeholder : helptext.afp_srv_dbpath_placeholder,
      tooltip: helptext.afp_srv_dbpath_tooltip,
    },
    {
      type : 'select',
      name : 'afp_srv_chmod_request',
      placeholder : helptext.afp_srv_chmod_request_placeholder,
      tooltip: helptext.afp_srv_chmod_request_tooltip,
      options : helptext.afp_srv_chmod_request_options,
    },
    {
      type : 'select',
      name : 'afp_srv_map_acls',
      placeholder : helptext.afp_srv_map_acls_placeholder,
      tooltip: helptext.afp_srv_map_acls_tooltip,
      options : helptext.afp_srv_map_acls_options,
    },
    {
      type : 'select',
      name : 'afp_srv_bindip',
      placeholder : helptext.afp_srv_bindip_placeholder,
      tooltip: helptext.afp_srv_bindip_tooltip,
      options: [],
      multiple: true
    },
    {
      type : 'textarea',
      name : 'afp_srv_global_aux',
      placeholder : helptext.afp_srv_global_aux_placeholder,
      tooltip: helptext.afp_srv_global_aux_tooltip,
    }
  ];
  private guest_users: any;
  private afp_srv_bindip: any;
  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected userService: UserService, protected iscsiService: IscsiService,) {}

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
    this.iscsiService.getIpChoices().subscribe((res) => {
      this.afp_srv_bindip =
        _.find(this.fieldConfig, { 'name': 'afp_srv_bindip' });
      res.forEach((item) => {
        this.afp_srv_bindip.options.push({ label: item[0], value: item[0] });
      })
    });
  }
}
