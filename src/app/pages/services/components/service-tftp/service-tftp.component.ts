import { ApplicationRef, Component, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';

import { RestService, WebSocketService, UserService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import helptext from '../../../../helptext/services/components/service-tftp';

@Component({
  selector : 'tftp-edit',
  template : `<entity-form [conf]="this"></entity-form>`,
})

export class ServiceTFTPComponent {

  protected resource_name: string = 'services/tftp';
  protected route_success: string[] = [ 'services' ];

  public fieldConfig: FieldConfig[] = [
    {
      type : 'explorer',
      initial: '/mnt',
      explorerType: 'directory',
      name : 'tftp_directory',
      placeholder : helptext.tftp_directory_placeholder,
      tooltip : helptext.tftp_directory_tooltip,
    },
    {
      type : 'checkbox',
      name : 'tftp_newfiles',
      placeholder : helptext.tftp_newfiles_placeholder,
      tooltip : helptext.tftp_newfiles_tooltip,
    },
    {
      type : 'input',
      name : 'tftp_host',
      placeholder : helptext.tftp_host_placeholder,
      tooltip : helptext.tftp_host_tooltip,
    },
    {
      type : 'input',
      name : 'tftp_port',
      placeholder : helptext.tftp_port_placeholder,
      tooltip : helptext.tftp_port_tooltip,
    },
    {
      type : 'combobox',
      name : 'tftp_username',
      placeholder : helptext.tftp_username_placeholder,
      tooltip : helptext.tftp_username_tooltip,
      options : [],
      searchOptions: [],
      parent: this,
      updater: this.updateUserSearchOptions,
    },
    {
      type : 'permissions',
      name : 'tftp_umask',
      noexec: true,
      placeholder : helptext.tftp_umask_placeholder,
      tooltip : helptext.tftp_umask_tooltip,
    },
    {
      type : 'textarea',
      name : 'tftp_options',
      placeholder : helptext.tftp_options_placeholder,
      tooltip : helptext.tftp_options_tooltip
    },
  ];

  protected tftp_username: any;

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected userService: UserService) {}

  resourceTransformIncomingRestData(data: any) {
    let perm = parseInt(data['tftp_umask'], 8);
    let mask = (~perm & 0o666).toString(8);
    while (mask.length < 3) {
      mask = '0' + mask;
    }
    data['tftp_umask'] = mask;

    return data;
  }

  preInit(entityEdit: any) {
    this.userService.userQueryDSCache().subscribe(items => {
      const users = [];
      for (let i = 0; i < items.length; i++) {
        users.push({label: items[i].username, value: items[i].username});
      }
      this.tftp_username = _.find(this.fieldConfig, {'name' : 'tftp_username'});
      this.tftp_username.options = users;
    });
  }

  afterInit(entityEdit: any) { }

  updateUserSearchOptions(value = "", parent) {
    parent.userService.userQueryDSCache(value).subscribe(items => {
      const users = [];
      for (let i = 0; i < items.length; i++) {
        users.push({label: items[i].username, value: items[i].username});
      }
      parent.tftp_username.searchOptions = users;
    });
  }
}
