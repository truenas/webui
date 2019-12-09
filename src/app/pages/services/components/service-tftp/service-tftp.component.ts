import { ApplicationRef, Component, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import helptext from '../../../../helptext/services/components/service-tftp';
import { RestService, UserService, WebSocketService } from '../../../../services/';

@Component({
  selector : 'tftp-edit',
  template : `<entity-form [conf]="this"></entity-form>`,
})
export class ServiceTFTPComponent {
  protected queryCall = 'tftp.config';
  protected route_success: string[] = [ 'services' ];

  protected fieldSets: FieldSet[] = [
    {
      name: helptext.tftp_fieldset_path,
      label: true,
      width: '50%',
      config: [{
        type : 'explorer',
        initial: '/mnt',
        explorerType: 'directory',
        name : 'directory',
        placeholder : helptext.tftp_directory_placeholder,
        tooltip : helptext.tftp_directory_tooltip,
      }]
    },
    {
      name: helptext.tftp_fieldset_conn,
      label: true,
      width: '50%',
      config: [
        {
          type : 'input',
          name : 'host',
          placeholder : helptext.tftp_host_placeholder,
          tooltip : helptext.tftp_host_tooltip,
        },
        {
          type : 'input',
          name : 'port',
          placeholder : helptext.tftp_port_placeholder,
          tooltip : helptext.tftp_port_tooltip,
        },
        {
          type : 'combobox',
          name : 'username',
          placeholder : helptext.tftp_username_placeholder,
          tooltip : helptext.tftp_username_tooltip,
          options : [],
          searchOptions: [],
          parent: this,
          updater: this.updateUserSearchOptions,
        }
      ]
    },
    { name: 'divider', divider: true },
    {
      name: helptext.tftp_fieldset_access,
      label: true,
      width: '50%',
      config: [
        {
          type : 'permissions',
          name : 'umask',
          noexec: true,
          placeholder : helptext.tftp_umask_placeholder,
          tooltip : helptext.tftp_umask_tooltip,
        },
        {
          type : 'checkbox',
          name : 'newfiles',
          placeholder : helptext.tftp_newfiles_placeholder,
          tooltip : helptext.tftp_newfiles_tooltip,
        }
      ]
    },
    {
      name: helptext.tftp_fieldset_other,
      label: true,
      width: '50%',
      config: [{
        type : 'textarea',
        name : 'options',
        placeholder : helptext.tftp_options_placeholder,
        tooltip : helptext.tftp_options_tooltip
      }]
    },
    { name: 'divider', divider: true }
  ];

  protected tftp_username: any;

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected userService: UserService) {}

  resourceTransformIncomingRestData(data: any) {
    return invertUMask(data);
  }

  beforeSubmit(data: any) {
    return invertUMask(data);
  }

  preInit(entityEdit: any) {
    this.userService.userQueryDSCache().subscribe(items => {
      const users = [];
      for (let i = 0; i < items.length; i++) {
        users.push({label: items[i].username, value: items[i].username});
      }
      this.tftp_username =  this.fieldSets
        .find(set => set.name === helptext.tftp_fieldset_conn)
        .config.find(config => config.name === 'username');
      this.tftp_username.options = users;
    });
  }

  afterInit(entityEdit: EntityFormComponent) {
    entityEdit.submitFunction = body => this.ws.call('tftp.update', [body]);
  }

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

/**
 * Need to invert the umask prop on the way in/out.
 * The 'permissions' FieldConfig and the MW expect opposite values.
 */
function invertUMask(data: { umask: string }): { umask: string } {
  const perm = parseInt(data['umask'], 8);
  // tslint:disable-next-line: no-bitwise
  let mask = (~perm & 0o666).toString(8);
  while (mask.length < 3) {
    mask = '0' + mask;
  }
  data['umask'] = mask;

  return data;
}
